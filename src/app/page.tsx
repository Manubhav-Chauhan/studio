"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/AppSidebar";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { HistoryPanel } from "@/components/history/HistoryPanel";
import { SmartHomePanel } from "@/components/smarthome/SmartHomePanel";
import { AutomationPanel } from "@/components/automation/AutomationPanel";
import { VisionPanel } from "@/components/vision/VisionPanel";
import { AIControlPanel } from "@/components/aicontrol/AIControlPanel";
import { useAssistant } from "@/hooks/use-assistant";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  HelpCircle, 
  Bell, 
  ChevronRight,
  Monitor,
  Volume2,
  Sun,
  Wifi,
  Zap,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [activeTab, setActiveTab] = useState("assistant");
  const assistant = useAssistant();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <SidebarInset className="flex flex-col flex-1 bg-background">
          <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2 px-3 py-1 bg-muted/20 rounded-full border border-muted/30">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Command search (Ctrl + K)</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-3 pl-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40">
                  <span className="text-xs font-bold text-primary">
                    {user?.email?.substring(0, 2).toUpperCase() || 'AI'}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-hidden flex">
            <div className="flex-1 relative overflow-y-auto">
              {activeTab === 'assistant' && (
                <AssistantPanel 
                  status={assistant.status}
                  transcription={assistant.transcription}
                  lastResponse={assistant.lastResponse}
                  onToggleListening={assistant.toggleListening}
                />
              )}
              {activeTab === 'aicontrol' && <AIControlPanel />}
              {activeTab === 'history' && <HistoryPanel history={assistant.history} />}
              {activeTab === 'devices' && <SmartHomePanel />}
              {activeTab === 'automations' && <AutomationPanel />}
              {activeTab === 'vision' && <VisionPanel />}

              {(activeTab === 'assistant' || activeTab === 'aicontrol') && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-3 bg-muted/20 backdrop-blur-xl border border-muted/30 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">assistAI OS v1.0</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                  <div className="flex items-center gap-4">
                    <Volume2 className="h-3.5 w-3.5 text-accent" />
                    <Sun className="h-3.5 w-3.5 text-orange-400" />
                    <Wifi className="h-3.5 w-3.5 text-green-400" />
                  </div>
                </div>
              )}
            </div>

            <aside className="w-80 border-l border-border bg-muted/5 flex flex-col hidden xl:flex">
              <div className="p-6 space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Common Requests</h3>
                  <div className="space-y-2">
                    {["Open Chrome", "Mute volume", "System restart", "Good morning workflow"].map((text) => (
                      <button 
                        key={text}
                        onClick={() => assistant.processCommand(text)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/10 border border-muted/20 hover:border-accent/40 hover:bg-muted/20 transition-all text-sm group"
                      >
                        <span className="text-muted-foreground group-hover:text-foreground">{text}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="opacity-20" />

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Active Workflow</h3>
                  <Card className="p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="h-4 w-4 text-accent" />
                      <span className="text-sm font-semibold">Work Mode</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">Automatic desktop setup for your deep work sessions.</p>
                    <Button variant="outline" size="sm" className="w-full text-xs border-primary/40 text-primary hover:bg-primary/10">
                      Configure Workflow
                    </Button>
                  </Card>
                </div>
              </div>

              <div className="mt-auto p-6">
                <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/10 border-accent/20">
                  <p className="text-xs font-medium mb-1">Memory Usage</p>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-accent w-[34%]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Contextual window: 14/100 tokens</p>
                </Card>
              </div>
            </aside>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
