"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { IdeaType } from "@/types/idea.type";

interface IdeaCardProps {
  idea: IdeaType;
  index: number;
  columnId: string;
  onEdit: (idea: IdeaType, columnId: string) => void;
  onDelete: (columnId: string, ideaId: string) => void;
  isDeleting: boolean;
}

export function IdeaCard({
  idea,
  index,
  columnId,
  onEdit,
  onDelete,
  isDeleting,
}: IdeaCardProps) {
  const ideaId = idea.id || `idea-${index}`;

  return (
    <Draggable draggableId={ideaId} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group cursor-pointer! shadow-xs rounded-xl border-border bg-card hover:border-primary/40 active:cursor-grabbing transform transition-all",
            snapshot.isDragging && "scale-95 rotate-1 shadow-lg ring-2 ring-primary/30"
          )}
          onClick={() => onEdit(idea, columnId)}
        >
          <CardContent className="p-3">
            {idea.images && idea.images.length > 0 && (
              <div className="grid grid-cols-4 gap-1 mb-2">
                {idea.images.slice(0, 4).map((image, imgIdx) => (
                  <img
                    key={imgIdx}
                    src={image.url}
                    alt={idea.title}
                    className="w-full h-12 rounded object-cover border border-border/50"
                  />
                ))}
              </div>
            )}
            <CardHeader className="mb-1 p-0">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-sm text-foreground line-clamp-2">
                  {idea.title}
                </h4>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(idea, columnId);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      disabled={isDeleting}
                      onSelect={(e) => {
                        e.stopPropagation();
                        onDelete(columnId, idea.id || "");
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            {idea.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                {idea.description}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
}
