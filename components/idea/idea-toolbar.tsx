"use client";

import React from "react";
import { Plus, Search, Sparkles, SlidersHorizontal, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GenerateIdeasPopover } from "./generate-ideas-popover";

interface IdeaToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalIdeas: number;
  totalColumns: number;
  onNewIdea: () => void;
  onGenerated: (title: string, description: string) => void;
}

export function IdeaToolbar({
  searchQuery,
  onSearchChange,
  totalIdeas,
  totalColumns,
  onNewIdea,
  onGenerated,
}: IdeaToolbarProps) {
  return (
    <div className="flex flex-col gap-3 pb-3 border-b border-border/70">
      {/* Top row: Title, breadcrumb metadata, and primary CTAs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Pipeline
              </span>
              <span className="text-muted-foreground/40 font-mono text-xs">/</span>
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                Ideas & Concepts
              </h1>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-primary/25" />
                Live Sync
              </span>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-[11px] font-mono text-muted-foreground">
                <strong className="text-foreground font-medium">{totalIdeas}</strong> ideas
              </span>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-[11px] font-mono text-muted-foreground">
                <strong className="text-foreground font-medium">{totalColumns}</strong> stages
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GenerateIdeasPopover onGenerated={onGenerated} />

          <Button
            size="sm"
            onClick={onNewIdea}
            className="h-8 gap-1.5 px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Idea</span>
          </Button>
        </div>
      </div>

      {/* Second row: Data-dense search & quick filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 pr-12 text-xs bg-muted/30 focus-visible:bg-background border-border/80 rounded-md font-sans"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-muted/60 px-1 font-mono text-[9px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/40 border border-border/50 text-[11px] font-mono text-muted-foreground">
            <Layers className="w-3 h-3 text-muted-foreground" />
            <span>Density: Compact</span>
          </div>
        </div>
      </div>
    </div>
  );
}
