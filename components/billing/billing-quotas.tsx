"use client";

import React from "react";
import { Sparkles, Radio, Clock, Users } from "lucide-react";

export function BillingQuotas() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* AI Generation Quota */}
      <div className="p-3.5 rounded-lg border border-border/80 bg-card shadow-2xs">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">AI Generation</span>
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xl font-semibold font-mono tracking-tight text-foreground">14,250</span>
          <span className="text-[11px] font-mono text-muted-foreground">/ 25,000 cr</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="bg-primary h-full rounded-full" style={{ width: "57%" }} />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground mt-1.5 block">57% utilized</span>
      </div>

      {/* Connected Channels */}
      <div className="p-3.5 rounded-lg border border-border/80 bg-card shadow-2xs">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Channels</span>
          <Radio className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xl font-semibold font-mono tracking-tight text-foreground">4</span>
          <span className="text-[11px] font-mono text-muted-foreground">/ 8 active</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="bg-primary h-full rounded-full" style={{ width: "50%" }} />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground mt-1.5 block">4 platforms synced</span>
      </div>

      {/* Scheduled Queue */}
      <div className="p-3.5 rounded-lg border border-border/80 bg-card shadow-2xs">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Post Queue</span>
          <Clock className="w-3.5 h-3.5 text-secondary" />
        </div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xl font-semibold font-mono tracking-tight text-foreground">18</span>
          <span className="text-[11px] font-mono text-muted-foreground">/ Unlimited</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="bg-secondary h-full rounded-full" style={{ width: "24%" }} />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground mt-1.5 block">18 posts scheduled</span>
      </div>

      {/* Team Seats */}
      <div className="p-3.5 rounded-lg border border-border/80 bg-card shadow-2xs">
        <div className="flex items-center justify-between text-muted-foreground mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Team Seats</span>
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-xl font-semibold font-mono tracking-tight text-foreground">1</span>
          <span className="text-[11px] font-mono text-muted-foreground">/ 3 assigned</span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="bg-muted-foreground/60 h-full rounded-full" style={{ width: "33%" }} />
        </div>
        <span className="text-[10px] font-mono text-muted-foreground mt-1.5 block">Admin seat active</span>
      </div>
    </div>
  );
}
