"use client";

import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { IdeaType } from "@/types/idea.type";
import { IdeaCard } from "./idea-card";

export type KanbanColumn = {
  id: string;
  title: string;
  ideas: IdeaType[];
};

interface IdeaColumnProps {
  column: KanbanColumn;
  onAddIdea: (columnId: string) => void;
  onEditIdea: (idea: IdeaType, columnId: string) => void;
  onDeleteIdea: (columnId: string, ideaId: string) => void;
  isDeleting: boolean;
}

const getStatusDotColor = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("backlog")) return "bg-muted-foreground/60";
  if (lower.includes("progress")) return "bg-primary ring-2 ring-primary/30 animate-pulse";
  if (lower.includes("ready")) return "bg-amber-500 ring-2 ring-amber-500/25";
  if (lower.includes("published") || lower.includes("done"))
    return "bg-primary ring-2 ring-primary/30";
  return "bg-muted-foreground";
};

export function IdeaColumn({
  column,
  onAddIdea,
  onEditIdea,
  onDeleteIdea,
  isDeleting,
}: IdeaColumnProps) {
  const dotColor = getStatusDotColor(column.title);

  return (
    <div className="shrink-0 w-[300px] flex flex-col h-full min-h-0 rounded-lg border border-border/80 bg-muted/30">
      {/* Sleek column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60 bg-muted/10">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full shrink-0", dotColor)} />
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            {column.title}
          </h3>
          <span className="px-1.5 py-0.5 text-[11px] font-mono rounded bg-background border border-border/70 text-muted-foreground font-medium">
            {column.ideas.length}
          </span>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="size-6 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded cursor-pointer"
          onClick={() => onAddIdea(column.id)}
          title={`Add idea to ${column.title}`}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Droppable list */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto kanban-scroll p-2 space-y-2 transition-colors min-h-0",
              snapshot.isDraggingOver
                ? "bg-primary/5 ring-1 ring-inset ring-primary/30"
                : "bg-transparent"
            )}
          >
            {column.ideas.map((idea, index) => (
              <IdeaCard
                key={idea.id || `idea-${index}`}
                idea={idea}
                index={index}
                columnId={column.id}
                onEdit={onEditIdea}
                onDelete={onDeleteIdea}
                isDeleting={isDeleting}
              />
            ))}

            <Button
              variant="ghost"
              onClick={() => onAddIdea(column.id)}
              className="w-full border border-dashed border-border/70 text-muted-foreground hover:text-foreground hover:bg-background/60 hover:border-primary/40 h-8 mt-1 text-xs rounded-md font-mono cursor-pointer transition-colors"
            >
              <Plus className="h-3 w-3 mr-1.5" />
              Add idea
            </Button>

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
