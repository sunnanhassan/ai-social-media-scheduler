"use client";

import { Suspense, useState, useMemo } from "react";
import { useQueryState } from "nuqs";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ListView from "@/components/schedule/list-view";
import CalendarView from "@/components/schedule/calendar-view";
import BoardView from "@/components/schedule/board-view";
import CreatePostDialog from "@/components/schedule/create-post-dialog";
import { ScheduleViewSwitcher, ScheduleViewType } from "@/components/schedule/schedule-view-switcher";
import ScheduleToolbar from "@/components/schedule/schedule-toolbar";

const SchedulePageContent = () => {
  const [activeView, setActiveView] = useQueryState("view", {
    defaultValue: "board",
  });
  const [selectedStatus, setSelectedStatus] = useQueryState("status", {
    defaultValue: "all",
  });
  const [rawChannelIds, setRawChannelIds] = useQueryState("channel_id", {
    defaultValue: "",
  });
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);

  // Parse comma-separated channels
  const channelIds = useMemo(() => {
    return rawChannelIds ? rawChannelIds.split(",").filter(Boolean) : [];
  }, [rawChannelIds]);

  const toggleChannel = (id: string) => {
    if (channelIds.includes(id)) {
      const next = channelIds.filter((c) => c !== id);
      setRawChannelIds(next.length ? next.join(",") : null);
    } else {
      const next = [...channelIds, id];
      setRawChannelIds(next.join(","));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      {/* Top Header: Breadcrumb + Toolbar Filters + View Switcher + CTA */}
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

        <div className="flex items-center gap-2.5">
          {/* Channel Multi-Select & Status Filter */}
          <ScheduleToolbar
            viewType={activeView as ScheduleViewType}
            channelIds={channelIds}
            toggleChannel={toggleChannel}
            selectedStatus={selectedStatus || "all"}
            setSelectedStatus={setSelectedStatus}
          />

          {/* Segmented View Switcher: Board | Calendar | List */}
          <ScheduleViewSwitcher
            activeView={(activeView as ScheduleViewType) || "board"}
            onViewChange={(view) => setActiveView(view)}
          />

          {/* Add Post Button */}
          <Button
            size="sm"
            onClick={() => setCreatePostModalOpen(true)}
            className="h-8 gap-1.5 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add Post</span>
          </Button>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeView === "list" ? (
          <ListView setCreatePostModalOpen={setCreatePostModalOpen} />
        ) : activeView === "calendar" ? (
          <CalendarView />
        ) : (
          <BoardView
            channelIds={channelIds}
            selectedStatus={selectedStatus || "all"}
            setCreatePostModalOpen={setCreatePostModalOpen}
          />
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
    <Suspense fallback={<div className="p-4 text-xs font-mono text-muted-foreground">Loading pipeline...</div>}>
      <NuqsAdapter>
        <SchedulePageContent />
      </NuqsAdapter>
    </Suspense>
  );
};

export default SchedulePage;