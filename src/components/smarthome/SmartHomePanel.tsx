
"use client";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Lightbulb, Thermometer, Tv, Fan, Plus, Loader2 } from "lucide-react";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export function SmartHomePanel() {
  const db = useFirestore();
  const { user } = useUser();

  const devicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "smart_devices");
  }, [db, user]);

  const { data: devices, isLoading } = useCollection(devicesQuery);

  const toggleDevice = (deviceId: string, currentState: boolean) => {
    if (!db || !user) return;
    const deviceRef = doc(db, "users", user.uid, "smart_devices", deviceId);
    updateDocumentNonBlocking(deviceRef, {
      status: !currentState ? "Online" : "Offline",
      updatedAt: new Date().toISOString()
    });
  };

  const updateState = (deviceId: string, key: string, value: any) => {
    if (!db || !user) return;
    const deviceRef = doc(db, "users", user.uid, "smart_devices", deviceId);
    const device = devices?.find(d => d.id === deviceId);
    let lastState = {};
    try {
      lastState = JSON.parse(device?.lastKnownState || "{}");
    } catch (e) {}
    
    updateDocumentNonBlocking(deviceRef, {
      lastKnownState: JSON.stringify({ ...lastState, [key]: value }),
      updatedAt: new Date().toISOString()
    });
  };

  const seedDevices = () => {
    if (!db || !user) return;
    const initialDevices = [
      { name: "Living Room Lamp", type: "light", status: "Online", protocol: "MQTT", connectionDetails: "{}", lastKnownState: '{"brightness": 80, "power": "on"}' },
      { name: "Bedroom AC", type: "temp", status: "Offline", protocol: "Google Home", connectionDetails: "{}", lastKnownState: '{"value": 24}' },
      { name: "Smart TV", type: "tv", status: "Online", protocol: "Alexa", connectionDetails: "{}", lastKnownState: '{"power": "on"}' },
    ];

    initialDevices.forEach(d => {
      const ref = doc(collection(db, "users", user.uid, "smart_devices"));
      setDoc(ref, {
        ...d,
        id: ref.id,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Smart Ecosystem</h2>
        {(!devices || devices.length === 0) && (
          <button 
            onClick={seedDevices}
            className="text-xs text-accent hover:underline flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Initialize Devices
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {devices?.map((device) => {
          const isOnline = device.status === "Online";
          let state: any = {};
          try {
            state = JSON.parse(device.lastKnownState || "{}");
          } catch (e) {}

          return (
            <Card key={device.id} className="p-4 bg-muted/10 border-muted/20">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isOnline ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>
                    {device.type === 'light' && <Lightbulb className="h-5 w-5" />}
                    {device.type === 'temp' && <Thermometer className="h-5 w-5" />}
                    {device.type === 'tv' && <Tv className="h-5 w-5" />}
                    {device.type === 'fan' && <Fan className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">{device.name}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                      {device.status}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={isOnline} 
                  onCheckedChange={() => toggleDevice(device.id, isOnline)} 
                />
              </div>

              {isOnline && (device.type === 'light' || device.type === 'fan') && (
                <div className="space-y-2 px-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Level</span>
                    <span>{state.brightness || state.speed || 0}%</span>
                  </div>
                  <Slider 
                    value={[state.brightness || state.speed || 0]} 
                    max={100} 
                    step={1} 
                    className="h-1.5"
                    onValueChange={([val]) => updateState(device.id, device.type === 'light' ? 'brightness' : 'speed', val)}
                  />
                </div>
              )}

              {isOnline && device.type === 'temp' && (
                <div className="space-y-2 px-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Temperature</span>
                    <span>{state.value}°C</span>
                  </div>
                  <Slider 
                    value={[state.value || 0]} 
                    min={16} 
                    max={30} 
                    step={1} 
                    className="h-1.5"
                    onValueChange={([val]) => updateState(device.id, 'value', val)}
                  />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
