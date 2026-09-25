"use client";

import { Suspense, useState } from "react";
import { useQueryState } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CalendarIcon, LayoutList, Plus } from "lucide-react";
import ListView from "@/components/schedule/list-view";
import CalendarView from "@/components/schedule/calendar-view";
import CreatePostDialog from "@/components/schedule/create-post-dialog";

type ViewType = "calendar" | "list";

const SchedulePageContent = () => {
  const [activeView, setActiveView] = useQueryState("view", {
    defaultValue: "calendar",
  });
  const [_, setStatus] = useQueryState("status", {
    defaultValue: "",
  });
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      {/* Vercel/Supabase Data-Dense Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              Pipeline
            </span>
            <span className="text-muted-foreground/40 font-mono text-xs">/</span>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              Schedule & Content Calendar
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
              Multi-Channel Dispatch
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Cross-platform synced
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={activeView}
            onValueChange={(value) => {
              if (!value) return;
              setStatus(null);
              setActiveView(value as ViewType);
            }}
            className="border border-border/80 rounded-md p-0.5 bg-muted/30 h-8"
          >
            <ToggleGroupItem
              value="calendar"
              className="gap-1.5 h-7 px-2.5 text-xs font-mono data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-2xs cursor-pointer"
            >
              <CalendarIcon className="size-3.5" />
              <span>Calendar</span>
            </ToggleGroupItem>
            <ToggleGroupItem
              value="list"
              className="gap-1.5 h-7 px-2.5 text-xs font-mono data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-2xs cursor-pointer"
            >
              <LayoutList className="size-3.5" />
              <span>List</span>
            </ToggleGroupItem>
          </ToggleGroup>

          <Button
            size="sm"
            onClick={() => setCreatePostModalOpen(true)}
            className="h-8 gap-1.5 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add Post</span>
          </Button>
        </div>
      </header>

      {/* Main Content View */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeView === "list" ? (
          <ListView setCreatePostModalOpen={setCreatePostModalOpen} />
        ) : (
          <CalendarView />
        )}
      </div>

      <CreatePostDialog
        open={createPostModalOpen}
        onOpenChange={setCreatePostModalOpen}
      />
    </div>
  );
};

const SchedulePage = () => {
  return (
    <Suspense fallback={<div className="p-4 text-xs font-mono text-muted-foreground">Loading schedule...</div>}>
      <NuqsAdapter>
        <SchedulePageContent />
      </NuqsAdapter>
    </Suspense>
  );
};

export default SchedulePage;