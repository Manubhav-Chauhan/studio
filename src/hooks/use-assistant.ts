"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { processVoiceCommandIntent, type ProcessVoiceCommandIntentOutput } from "@/ai/flows/process-voice-command-intent-flow";
import { handleConversationalFollowUp } from "@/ai/flows/handle-conversational-follow-up-flow";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, where, getDocs, doc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export type AssistantStatus = "idle" | "listening" | "processing" | "responding";

export interface CommandHistoryItem {
  id: string;
  command: string;
  response: string;
  intent: string;
  timestamp: Date;
  status: "success" | "error";
}

export function useAssistant() {
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const [transcription, setTranscription] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [history, setHistory] = useState<CommandHistoryItem[]>([]);
  const [previousContext, setPreviousContext] = useState<string>("");
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const recognitionRef = useRef<any>(null);
  const transcriptionRef = useRef("");

  const processCommand = useCallback(async (text: string) => {
    if (!text.trim() || !user || !db) return;

    setStatus("processing");
    try {
      const followUp = await handleConversationalFollowUp({
        currentCommand: text,
        previousContext: previousContext,
      });

      const resolvedCommand = followUp.nextInstruction;

      if (followUp.isUserClarificationNeeded) {
        setLastResponse(resolvedCommand);
        setStatus("responding");
        return;
      }

      const result = await processVoiceCommandIntent({ command: resolvedCommand });
      const responseText = generateResponseText(result);
      
      setLastResponse(responseText);
      setPreviousContext(resolvedCommand);

      // Execute the actual task
      await executeIntent(result);

      // Log the command
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'command_logs'), {
        userId: user.uid,
        commandText: text,
        interpretedIntent: result.intent,
        actionPerformed: responseText,
        timestamp: new Date().toISOString(),
        status: "Success",
        responseGiven: responseText
      });

      const newItem: CommandHistoryItem = {
        id: Math.random().toString(36).substring(7),
        command: text,
        response: responseText,
        intent: result.intent,
        timestamp: new Date(),
        status: "success",
      };

      setHistory((prev) => [newItem, ...prev]);
      setStatus("responding");
      setTimeout(() => setStatus("idle"), 3000);

    } catch (error: any) {
      console.error("Assistant processing error:", error);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: error.message || "Something went wrong while understanding your command.",
      });
      setStatus("idle");
    }
  }, [previousContext, user, db, toast]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        transcriptionRef.current = transcript;
        setTranscription(transcript);
      };

      recognitionRef.current.onend = () => {
        if (status === "listening") {
          const finalTranscription = transcriptionRef.current;
          setStatus("idle");
          if (finalTranscription) {
            processCommand(finalTranscription);
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setStatus("idle");
      };
    }
  }, [status, processCommand]);

  const executeIntent = useCallback(async (result: ProcessVoiceCommandIntentOutput) => {
    if (!user || !db) return;

    const { intent, entities } = result;
    
    try {
      switch (intent) {
        case 'control_smart_bulb': {
          const devicesRef = collection(db, 'users', user.uid, 'smart_devices');
          const q = query(devicesRef, where('name', '==', entities?.deviceName || 'Living Room Lamp'));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const deviceDoc = snapshot.docs[0];
            updateDocumentNonBlocking(doc(db, deviceDoc.ref.path), {
              status: entities?.state ? 'Online' : 'Offline',
              lastKnownState: JSON.stringify({ 
                power: entities?.state ? 'on' : 'off',
                brightness: entities?.brightness || 80
              }),
              updatedAt: new Date().toISOString()
            });
          }
          break;
        }
      }
    } catch (e) {
      console.error("Failed to execute intent", e);
    }
  }, [user, db]);

  const toggleListening = useCallback(() => {
    if (status === "listening") {
      recognitionRef.current?.stop();
    } else {
      setTranscription("");
      transcriptionRef.current = "";
      setStatus("listening");
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Failed to start recognition", e);
        setStatus("idle");
      }
    }
  }, [status]);

  return {
    status,
    transcription,
    lastResponse,
    history,
    toggleListening,
    processCommand
  };
}

function generateResponseText(result: ProcessVoiceCommandIntentOutput): string {
  const { intent, entities } = result;
  switch (intent) {
    case 'open_app':
      return `Opening ${entities?.appName || 'the app'} for you.`;
    case 'close_app':
      return `Closing ${entities?.appName || 'the app'}.`;
    case 'set_volume':
      return `System volume set to ${entities?.level}%.`;
    case 'adjust_brightness':
      return `Brightness adjusted to ${entities?.level}%.`;
    case 'toggle_wifi':
      return `Wi-Fi has been turned ${entities?.state ? 'on' : 'off'}.`;
    case 'control_smart_bulb':
      return `Okay, the ${entities?.deviceName || 'light'} is now ${entities?.state ? 'on' : 'off'}.`;
    case 'send_message':
      return `Sending message to ${entities?.recipient}: "${entities?.message}".`;
    case 'schedule_meeting':
      return `Meeting scheduled for ${entities?.date} at ${entities?.time}. Subject: ${entities?.subject || 'Meeting'}.`;
    case 'general_conversation':
      return "I'm here to help with your desktop and smart home.";
    default:
      return "I've processed your command, but I'm not sure what action to take.";
  }
}
