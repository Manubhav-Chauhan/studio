"use client";

import { CommandHistoryItem } from "@/hooks/use-assistant";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useState } from "react";

interface HistoryPanelProps {
  history: CommandHistoryItem[];
}

export function HistoryPanel({ history }: HistoryPanelProps) {
  const [search, setSearch] = useState("");

  const filteredHistory = history.filter(item => 
    item.command.toLowerCase().includes(search.toLowerCase()) ||
    item.response.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      <div className="flex items-center gap-2 px-2">
        <h2 className="text-xl font-semibold">Activity Log</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search commands..." 
          className="pl-9 bg-muted/20 border-muted/30 focus-visible:ring-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ScrollArea className="flex-1 pr-4">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-sm">No activity found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <Card key={item.id} className="p-4 bg-muted/10 hover:bg-muted/20 transition-colors border-muted/20">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {item.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      {item.intent.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {format(item.timestamp, "h:mm a")}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">"{item.command}"</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.response}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
