"use client";

import React from "react";
import { Wifi, BatteryMedium, Signal } from "lucide-react";

interface IPhoneFrameProps {
  children: React.ReactNode;
  platformName?: string;
  className?: string;
}

export function IPhoneFrame({
  children,
  platformName = "X / Twitter",
  className = "",
}: IPhoneFrameProps) {
  return (
    <div
      className={`relative mx-auto w-[340px] h-[640px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-[6px] border-slate-800 ring-1 ring-white/10 flex flex-col overflow-hidden select-none ${className}`}
    >
      {/* Outer Titanium Bezel Accent */}
      <div className="absolute inset-0 rounded-[42px] border border-white/5 pointer-events-none" />

      {/* Screen Container */}
      <div className="relative flex-1 w-full bg-background rounded-[38px] overflow-hidden flex flex-col border border-border/40">
        {/* Status Bar */}
        <div className="h-10 pt-2 px-6 flex items-center justify-between z-20 text-[12px] font-semibold tracking-tight text-foreground/80 shrink-0">
          <span>9:41</span>

          {/* Dynamic Island */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full flex items-center justify-between px-2.5 shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
          </div>

          <div className="flex items-center gap-1.5 text-foreground/70">
            <Signal className="size-3" />
            <Wifi className="size-3" />
            <BatteryMedium className="size-3.5" />
          </div>
        </div>

        {/* In-App Simulated Header */}
        <div className="px-4 py-2 border-b border-border/50 flex items-center justify-between text-xs font-medium text-muted-foreground shrink-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <span className="font-semibold text-foreground text-[11px] tracking-wide">
              {platformName}
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            Live Feed
          </span>
        </div>

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
          {children}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="h-5 flex items-center justify-center shrink-0 bg-background">
          <div className="w-28 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
      </div>
    </div>
  );
}
