"use client";

import { useState, useCallback, useRef } from "react";
import { processVoiceCommandIntent, type ProcessVoiceCommandIntentOutput } from "@/ai/flows/process-voice-command-intent-flow";
import { handleConversationalFollowUp } from "@/ai/flows/handle-conversational-follow-up-flow";
import { useToast } from "@/hooks/use-toast";

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

  const processCommand = useCallback(async (text: string) => {
    if (!text.trim()) return;

    setStatus("processing");
    try {
      // Resolve context first
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

      // Process intent
      const result = await processVoiceCommandIntent({ command: resolvedCommand });
      
      const responseText = generateResponseText(result);
      setLastResponse(responseText);
      setPreviousContext(resolvedCommand);

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
      
      // Simulate speech finished
      setTimeout(() => setStatus("idle"), 3000);

    } catch (error) {
      console.error("Failed to process command:", error);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: "Something went wrong while understanding your command.",
      });
      setStatus("idle");
    }
  }, [previousContext, history, toast]);

  const toggleListening = useCallback(() => {
    if (status === "listening") {
      setStatus("idle");
      // Simulate receiving command after stopping
      if (transcription) {
        processCommand(transcription);
      }
    } else {
      setStatus("listening");
      setTranscription("");
      // Mock transcription logic
      const mockPhrases = [
        "Open Chrome",
        "Set volume to 50",
        "Turn off the lights",
        "Search for resume",
        "Schedule a meeting for tomorrow at 5pm",
        "Actually make it 6pm"
      ];
      const randomPhrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
      
      let i = 0;
      const interval = setInterval(() => {
        setTranscription(randomPhrase.substring(0, i + 1));
        i++;
        if (i === randomPhrase.length) {
          clearInterval(interval);
          setTimeout(() => {
            setStatus("idle");
            processCommand(randomPhrase);
          }, 1000);
        }
      }, 50);
    }
  }, [status, transcription, processCommand]);

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
