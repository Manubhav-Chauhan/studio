"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface WaveformProps {
  isActive: boolean;
  intensity?: number;
}

export function Waveform({ isActive, intensity = 5 }: WaveformProps) {
  // Use state to store random values to avoid hydration mismatch
  const [durations, setDurations] = useState<number[]>([]);

  useEffect(() => {
    // Generate the durations only after mounting on the client
    const bars = 12;
    const generated = Array.from({ length: bars }).map(() => 0.5 + Math.random());
    setDurations(generated);
  }, []);

  return (
    <div className="flex items-end justify-center gap-1 h-12 w-full max-w-[200px]">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 rounded-full bg-accent transition-all duration-300",
            isActive ? "waveform-bar" : "h-[10%]"
          )}
          style={{
            // Use fixed precision to avoid floating point mismatch between server and client
            animationDelay: `${(i * 0.1).toFixed(1)}s`,
            // Use a stable value during SSR and initial hydration, then switch to dynamic on mount
            animationDuration: durations[i] ? `${durations[i].toFixed(4)}s` : "1.0s",
          }}
        />
      ))}
    </div>
  );
}
