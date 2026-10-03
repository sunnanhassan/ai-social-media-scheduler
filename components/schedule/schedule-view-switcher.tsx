"use client";

import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, Calendar as CalendarIcon, LayoutList } from "lucide-react";

export type ScheduleViewType = "board" | "calendar" | "list";

interface ScheduleViewSwitcherProps {
  activeView: ScheduleViewType;
  onViewChange: (view: ScheduleViewType) => void;
  className?: string;
}

export function ScheduleViewSwitcher({
  activeView,
  onViewChange,
  className = "",
}: ScheduleViewSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      value={activeView}
      onValueChange={(val) => {
        if (!val) return;
        onViewChange(val as ScheduleViewType);
      }}
      className={`border border-border/80 rounded-lg p-0.5 bg-muted/40 h-8 shadow-sm ${className}`}
    >
      <ToggleGroupItem
        value="board"
        className="gap-1.5 px-2.5 text-xs font-medium rounded-md data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm transition-all"
      >
        <LayoutGrid className="size-3.5" />
        <span className="hidden sm:inline">Board</span>
      </ToggleGroupItem>

      <ToggleGroupItem
        value="calendar"
        className="gap-1.5 px-2.5 text-xs font-medium rounded-md data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm transition-all"
      >
        <CalendarIcon className="size-3.5" />
        <span className="hidden sm:inline">Calendar</span>
      </ToggleGroupItem>

      <ToggleGroupItem
        value="list"
        className="gap-1.5 px-2.5 text-xs font-medium rounded-md data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm transition-all"
      >
        <LayoutList className="size-3.5" />
        <span className="hidden sm:inline">List</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
