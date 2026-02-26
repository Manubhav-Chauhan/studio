"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Lightbulb, Thermometer, Tv, Fan, Plus } from "lucide-react";
import { useState } from "react";

export function SmartHomePanel() {
  const [devices, setDevices] = useState([
    { id: 1, name: "Living Room Lamp", type: "light", state: true, brightness: 80 },
    { id: 2, name: "Master Bedroom AC", type: "temp", state: false, value: 24 },
    { id: 3, name: "Smart TV", type: "tv", state: true },
    { id: 4, name: "Kitchen Fan", type: "fan", state: true, speed: 50 },
  ]);

  const toggleDevice = (id: number) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, state: !d.state } : d));
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Smart Ecosystem</h2>
        <button className="p-1 hover:bg-muted rounded-full transition-colors">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {devices.map((device) => (
          <Card key={device.id} className="p-4 bg-muted/10 border-muted/20">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${device.state ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                  {device.type === 'light' && <Lightbulb className="h-5 w-5" />}
                  {device.type === 'temp' && <Thermometer className="h-5 w-5" />}
                  {device.type === 'tv' && <Tv className="h-5 w-5" />}
                  {device.type === 'fan' && <Fan className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-medium">{device.name}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                    {device.state ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <Switch checked={device.state} onCheckedChange={() => toggleDevice(device.id)} />
            </div>

            {device.state && (device.type === 'light' || device.type === 'fan') && (
              <div className="space-y-2 px-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Level</span>
                  <span>{device.brightness || device.speed}%</span>
                </div>
                <Slider defaultValue={[device.brightness || device.speed || 0]} max={100} step={1} className="h-1.5" />
              </div>
            )}

            {device.state && device.type === 'temp' && (
              <div className="space-y-2 px-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Temperature</span>
                  <span>{device.value}°C</span>
                </div>
                <Slider defaultValue={[device.value || 0]} min={16} max={30} step={1} className="h-1.5" />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
