"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { 
  Camera, 
  Mic, 
  MicOff, 
  Cpu, 
  Loader2, 
  AlertCircle, 
  ShieldCheck,
  Activity,
  Zap,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeImage } from "@/ai/flows/analyze-image-flow";
import { Badge } from "@/components/ui/badge";
import { Waveform } from "@/components/assistant/Waveform";
import { cn } from "@/lib/utils";

export function AIControlPanel() {
  const [isControlActive, setIsControlActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<{trigger: string, action: string} | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Handle Permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        setHasMicPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        console.error('Permission error:', error);
        setHasCameraPermission(false);
        setHasMicPermission(false);
      }
    };
    checkPermissions();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // AI Sensing Loop
  useEffect(() => {
    let intervalId: any;

    if (isControlActive && hasCameraPermission) {
      intervalId = setInterval(async () => {
        if (isProcessing) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        setIsProcessing(true);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUri = canvas.toDataURL('image/jpeg');

          try {
            const result = await analyzeImage({ 
              photoDataUri: dataUri,
              prompt: "Identify if the user is making a gesture (thumbs up, hand wave) or holding a common object (phone, coffee mug). Map them to app actions."
            });

            if (result.suggestedActions.length > 0) {
              const detectedTrigger = result.identifiedObjects[0] || "Scene change";
              const mappedAction = result.suggestedActions[0];
              
              setLastAction({ trigger: detectedTrigger, action: mappedAction });
              toast({
                title: "AI Action Triggered",
                description: `Detected ${detectedTrigger} -> Executing: ${mappedAction}`,
              });
            }
          } catch (e) {
            console.error("AI sensing error:", e);
          } finally {
            setIsProcessing(false);
          }
        }
      }, 5000); // Sensing every 5 seconds for prototype stability
    }

    return () => clearInterval(intervalId);
  }, [isControlActive, hasCameraPermission, isProcessing, toast]);

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-accent">
            <Cpu className="h-6 w-6" />
            AI Command & Control
          </h2>
          <p className="text-sm text-muted-foreground">Unified vision and voice sensing for hands-free automation.</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/20 rounded-full border border-muted/30">
          <span className="text-xs font-medium text-muted-foreground">Master Control</span>
          <Switch 
            checked={isControlActive} 
            onCheckedChange={setIsControlActive}
            disabled={!hasCameraPermission || !hasMicPermission}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Feed */}
        <Card className="lg:col-span-2 relative overflow-hidden bg-black aspect-video rounded-2xl border-2 border-primary/20 group">
          <video 
            ref={videoRef} 
            className={cn(
              "w-full h-full object-cover transition-opacity duration-1000",
              isControlActive ? "opacity-100" : "opacity-40 grayscale"
            )} 
            autoPlay 
            muted 
            playsInline
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge variant="secondary" className="bg-black/60 backdrop-blur-md border-white/10 text-[10px] flex gap-1.5 items-center">
              <div className={cn("h-1.5 w-1.5 rounded-full", isControlActive ? "bg-green-500 animate-pulse" : "bg-red-500")} />
              {isControlActive ? "LIVE FEED" : "STANDBY"}
            </Badge>
            {isProcessing && (
              <Badge variant="secondary" className="bg-accent/20 backdrop-blur-md border-accent/40 text-accent text-[10px] animate-pulse">
                SENSING SCENE...
              </Badge>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
          
          {!isControlActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <ShieldCheck className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Control System Inactive</p>
              </div>
            </div>
          )}
        </Card>

        {/* Sensing Status & Commands */}
        <div className="space-y-6">
          <Card className="p-5 bg-muted/10 border-muted/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-3 w-3" /> Voice Activity
              </h3>
              {hasMicPermission ? (
                <Mic className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <MicOff className="h-3.5 w-3.5 text-red-500" />
              )}
            </div>
            <div className="py-2">
              <Waveform isActive={isControlActive} />
            </div>
            <p className="text-[10px] text-muted-foreground text-center italic">
              "Continuous voice monitoring is {isControlActive ? 'active' : 'paused'}"
            </p>
          </Card>

          <Card className="p-5 bg-primary/5 border-primary/20 space-y-4 flex-1">
            <h3 className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-2">
              <Zap className="h-3 w-3" /> Last Trigger
            </h3>
            {lastAction ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                  <p className="text-[10px] text-accent/70 font-bold uppercase mb-1">Detected Trigger</p>
                  <p className="text-sm font-semibold">{lastAction.trigger}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <p className="text-[10px] text-primary/70 font-bold uppercase mb-1">Executed Action</p>
                  <p className="text-sm font-semibold">{lastAction.action}</p>
                </div>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center text-center">
                <p className="text-xs text-muted-foreground italic">Waiting for visual or voice trigger...</p>
              </div>
            )}
          </Card>

          <Card className="p-4 border-dashed border-muted-foreground/20 bg-muted/5">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase mb-3">Active Mappings</h4>
            <div className="space-y-2">
              {[
                { t: "Thumbs Up", a: "Confirm Task" },
                { t: "Hand Wave", a: "Cancel/Dismiss" },
                { t: "Coffee Mug", a: "Start Morning Workflow" }
              ].map((m, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] px-2 py-1 rounded hover:bg-muted/20 transition-colors">
                  <span className="text-muted-foreground">{m.t}</span>
                  <Sparkles className="h-2.5 w-2.5 text-accent opacity-40" />
                  <span className="font-medium text-foreground">{m.a}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
