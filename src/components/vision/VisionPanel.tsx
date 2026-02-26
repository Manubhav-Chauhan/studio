"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, RefreshCw, Eye, Loader2, X, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeImage, type AnalyzeImageOutput } from "@/ai/flows/analyze-image-flow";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export function VisionPanel() {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeImageOutput | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use visual recognition.',
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUri = canvas.toDataURL('image/jpeg');

      try {
        const result = await analyzeImage({ photoDataUri: dataUri });
        setAnalysisResult(result);
      } catch (error) {
        console.error("Analysis failed:", error);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'Could not recognize the objects in the image. Please try again.',
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6 text-accent" />
            Visual Recognition
          </h2>
          <p className="text-sm text-muted-foreground">Analyze your surroundings in real-time</p>
        </div>
        {analysisResult && (
          <Button variant="ghost" size="sm" onClick={() => setAnalysisResult(null)}>
            <X className="h-4 w-4 mr-2" /> Clear Analysis
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Camera Feed Section */}
        <div className="space-y-4">
          <Card className="relative overflow-hidden bg-black aspect-video rounded-2xl border-2 border-primary/20 shadow-2xl">
            <video 
              ref={videoRef} 
              className="w-full h-full object-cover" 
              autoPlay 
              muted 
              playsInline
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                <Loader2 className="h-12 w-12 animate-spin text-accent mb-4" />
                <p className="text-accent font-medium animate-pulse tracking-widest uppercase text-xs">Processing Visuals...</p>
              </div>
            )}
            {!hasCameraPermission && hasCameraPermission !== null && (
              <div className="absolute inset-0 bg-muted/20 flex items-center justify-center p-6 text-center">
                <Alert variant="destructive" className="max-w-sm">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>
                    Please allow camera access in your browser settings to use this feature.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </Card>
          
          <Button 
            className="w-full py-8 text-lg font-bold shadow-xl shadow-primary/10 rounded-2xl"
            disabled={!hasCameraPermission || isAnalyzing}
            onClick={captureAndAnalyze}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Analyzing Scene...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-6 w-6" />
                Capture & Recognize
              </>
            )}
          </Button>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {!analysisResult && !isAnalyzing ? (
            <Card className="h-full flex flex-col items-center justify-center p-8 border-dashed border-muted-foreground/30 bg-muted/5 text-center space-y-4">
              <div className="p-4 bg-muted/10 rounded-full">
                <Sparkles className="h-12 w-12 text-muted-foreground/40" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-muted-foreground">Ready for Recognition</h3>
                <p className="text-sm text-muted-foreground/70">Capture an image to start AI visual analysis</p>
              </div>
            </Card>
          ) : analysisResult ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="p-6 bg-primary/5 border-primary/20 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-accent uppercase tracking-widest mb-3">Analysis</h3>
                  <p className="text-lg leading-relaxed font-medium">
                    {analysisResult.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Identified Entities</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.identifiedObjects.map((obj, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1 bg-muted/30 border-muted/50">
                        {obj}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-muted/20">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Contextual Actions</h3>
                  <div className="space-y-2">
                    {analysisResult.suggestedActions.map((action, i) => (
                      <button 
                        key={i}
                        className="w-full text-left p-3 rounded-xl bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-colors text-sm flex justify-between items-center group"
                      >
                        <span className="font-medium">{action}</span>
                        <Sparkles className="h-4 w-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="h-full animate-pulse bg-muted/10 border-muted/20" />
          )}
        </div>
      </div>
    </div>
  );
}
