"use client";

import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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

export function IdeaColumn({
  column,
  onAddIdea,
  onEditIdea,
  onDeleteIdea,
  isDeleting,
}: IdeaColumnProps) {
  return (
    <div className="shrink-0 w-[280px] flex flex-col h-full min-h-0 rounded-2xl bg-card/60 dark:bg-card/40 border border-border p-3 backdrop-blur-xs">
      <div className="flex items-center justify-between px-2 pt-2 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground">{column.title}</h3>
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {column.ideas.length}
          </Badge>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-muted-foreground hover:text-foreground"
          onClick={() => onAddIdea(column.id)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-1 overflow-y-auto overflow-x-hidden p-1 transition-colors min-h-0 rounded-xl",
              snapshot.isDraggingOver
                ? "bg-primary/10 border-2 border-dashed border-primary/50"
                : "bg-transparent"
            )}
          >
            <div className="space-y-2">
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
            </div>

            <Button
              variant="ghost"
              onClick={() => onAddIdea(column.id)}
              className="w-full border-dashed border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/50 h-10 mt-3 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Idea
            </Button>

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
