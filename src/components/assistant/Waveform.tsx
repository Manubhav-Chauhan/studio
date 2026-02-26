"use client";

import { cn } from "@/lib/utils";

interface WaveformProps {
  isActive: boolean;
  intensity?: number;
}

export function Waveform({ isActive, intensity = 5 }: WaveformProps) {
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
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.5 + Math.random()}s`,
          }}
        />
      ))}
    </div>
  );
}
