"use client";

import { Card } from "@/components/ui/card";
import { Waveform } from "./Waveform";
import { Mic, MicOff, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssistantStatus } from "@/hooks/use-assistant";
import { cn } from "@/lib/utils";

interface AssistantPanelProps {
  status: AssistantStatus;
  transcription: string;
  lastResponse: string;
  onToggleListening: () => void;
}

export function AssistantPanel({ status, transcription, lastResponse, onToggleListening }: AssistantPanelProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto p-6 space-y-12">
      <div className="relative group">
        <div className={cn(
          "absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200",
          status === "listening" && "animate-pulse opacity-100"
        )} />
        <Button
          size="icon"
          variant="secondary"
          className={cn(
            "relative h-24 w-24 rounded-full bg-card border-2 transition-all duration-500",
            status === "listening" ? "border-accent scale-110" : "border-primary/20",
            status === "processing" && "animate-pulse"
          )}
          onClick={onToggleListening}
        >
          {status === "listening" ? (
            <MicOff className="h-10 w-10 text-accent" />
          ) : status === "processing" ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          ) : (
            <Mic className="h-10 w-10 text-primary" />
          )}
        </Button>
      </div>

      <div className="flex flex-col items-center space-y-4 w-full">
        <Waveform isActive={status === "listening"} />
        <div className="text-center h-8">
          <p className={cn(
            "text-lg font-medium tracking-tight transition-all duration-300",
            status === "listening" ? "text-accent" : "text-muted-foreground"
          )}>
            {status === "listening" ? "Listening..." : 
             status === "processing" ? "Understanding..." :
             status === "responding" ? "Responding..." : "Tap to speak"}
          </p>
        </div>
      </div>

      <div className="w-full space-y-6">
        {transcription && (
          <Card className="p-4 bg-muted/30 border-none shadow-none text-right ml-12 rounded-tr-none">
            <p className="text-sm italic opacity-80">"{transcription}"</p>
          </Card>
        )}

        {lastResponse && (
          <Card className="p-6 bg-primary/10 border-primary/20 mr-12 rounded-tl-none animate-in slide-in-from-left-2 duration-500">
            <div className="flex gap-3">
              <div className="mt-1">
                <MessageSquare className="h-5 w-5 text-accent" />
              </div>
              <p className="text-lg leading-relaxed">{lastResponse}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
