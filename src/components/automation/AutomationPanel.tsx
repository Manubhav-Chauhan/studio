"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Coffee, Briefcase, Moon, Zap, ArrowRight } from "lucide-react";

export function AutomationPanel() {
  const workflows = [
    {
      title: "Good Morning",
      icon: <Coffee className="h-4 w-4" />,
      trigger: '"Hey assistAI, good morning"',
      actions: ["Open Calendar", "Turn on coffee maker", "Play news briefing"],
      active: true
    },
    {
      title: "Deep Work",
      icon: <Briefcase className="h-4 w-4" />,
      trigger: '"Start work mode"',
      actions: ["Open Slack & Email", "Turn on focus music", "Close Chrome tabs"],
      active: false
    },
    {
      title: "Sleep Mode",
      icon: <Moon className="h-4 w-4" />,
      trigger: '"I\'m going to bed"',
      actions: ["Turn off all lights", "Set alarm for 7 AM", "Mute phone"],
      active: true
    }
  ];

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Automations</h2>
        <Badge variant="outline" className="border-accent/30 text-accent bg-accent/5">
          Pro Mode
        </Badge>
      </div>

      <div className="space-y-4">
        {workflows.map((flow, i) => (
          <Card key={i} className="group p-5 bg-muted/10 border-muted/20 hover:border-accent/40 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  {flow.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{flow.title}</h3>
                  <p className="text-xs text-muted-foreground italic">{flow.trigger}</p>
                </div>
              </div>
              <button className="p-2 rounded-full opacity-0 group-hover:opacity-100 bg-accent text-accent-foreground transition-all">
                <Play className="h-3 w-3 fill-current" />
              </button>
            </div>
            
            <div className="space-y-2 border-t border-muted/20 pt-4">
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">
                <Zap className="h-3 w-3" /> Actions
              </div>
              {flow.actions.map((action, j) => (
                <div key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ArrowRight className="h-3 w-3 text-accent" />
                  {action}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
