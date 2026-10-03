"use client";

import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { PostType } from "@/types/post.type";
import { ScheduleKanbanCard } from "./schedule-kanban-card";
import { Button } from "@/components/ui/button";
import { Plus, Inbox } from "lucide-react";

interface ScheduleKanbanColumnProps {
  columnId: string;
  title: string;
  count: number;
  posts: PostType[];
  selectedPostId?: string | null;
  onSelectPost?: (post: PostType) => void;
  onEditPost?: (post: PostType) => void;
  onPublishNow?: (post: PostType) => void;
  onAddNew?: () => void;
}

export function ScheduleKanbanColumn({
  columnId,
  title,
  count,
  posts,
  selectedPostId,
  onSelectPost,
  onEditPost,
  onPublishNow,
  onAddNew,
}: ScheduleKanbanColumnProps) {
  const getEmptyMessage = () => {
    switch (columnId) {
      case "drafts":
        return "No drafts yet. Click + to brainstorm or save ideas.";
      case "queue":
        return "Queue is clear. Drag drafts here or schedule upcoming posts.";
      case "published":
        return "No published posts yet. Completed posts will appear here.";
      default:
        return "No posts in this column.";
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-muted/20 border border-border/70 rounded-2xl p-3 h-full select-none overflow-hidden">
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
            {title}
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-muted text-muted-foreground border border-border/50">
            {count}
          </span>
        </div>

        {columnId !== "published" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddNew}
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        )}
      </div>

      {/* Droppable Card List */}
      <Droppable droppableId={columnId} ignoreContainerClipping={true}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto pr-1 transition-colors rounded-xl scrollbar-none min-h-0 ${
              snapshot.isDraggingOver ? "bg-accent/20 ring-1 ring-primary/30" : ""
            }`}
          >
            {posts.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/70 rounded-xl my-2">
                <Inbox className="size-6 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                  {getEmptyMessage()}
                </p>
                {columnId !== "published" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddNew}
                    className="mt-3 text-xs h-7 gap-1 border-dashed"
                  >
                    <Plus className="size-3" />
                    Create Post
                  </Button>
                )}
              </div>
            ) : (
              posts.map((post, index) => (
                <ScheduleKanbanCard
                  key={post.id}
                  post={post}
                  index={index}
                  isSelected={post.id === selectedPostId}
                  onSelect={() => onSelectPost?.(post)}
                  onEdit={onEditPost}
                  onPublishNow={onPublishNow}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
