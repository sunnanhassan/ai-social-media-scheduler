"use client";

import React, { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { MoreHorizontal, GripVertical, Image as ImageIcon, Calendar, Sparkles, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { IdeaType } from "@/types/idea.type";
import { useRouter } from "next/navigation";
import { IdeaAnglesDialog } from "./idea-angles-dialog";

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
  const router = useRouter();
  const [anglesDialogOpen, setAnglesDialogOpen] = useState(false);
  const ideaId = idea.id || `idea-${index}`;
  const hasImages = Boolean(idea.images && idea.images.length > 0);

  const handleConvertToPost = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const fullText = idea.description
      ? `${idea.title}\n\n${idea.description}`
      : idea.title;
    const query = new URLSearchParams({
      create: "true",
      content: fullText,
    });
    router.push(`/schedule?${query.toString()}`);
  };

  return (
    <>
      <Draggable draggableId={ideaId} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "group relative rounded-lg border border-border/80 bg-card p-3 shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing",
              snapshot.isDragging &&
                "scale-[0.98] rotate-0.5 shadow-md border-primary ring-1 ring-primary/40 bg-card z-50 opacity-95"
            )}
            onClick={() => onEdit(idea, columnId)}
          >
            {/* Top row: Drag affordance, Title, and Actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 flex-1 min-w-0">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                <h4 className="text-[13px] font-medium leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {idea.title}
                </h4>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  title="Convert to Scheduled Post"
                  className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={handleConvertToPost}
                >
                  <Send className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  title="Expand into 5 Angles"
                  className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnglesDialogOpen(true);
                  }}
                >
                  <Sparkles className="h-3 w-3" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 text-xs">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(idea, columnId);
                      }}
                      className="cursor-pointer"
                    >
                      Edit Idea
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleConvertToPost} className="cursor-pointer text-primary">
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Convert to Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnglesDialogOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                      Expand 5 Angles
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      disabled={isDeleting}
                      onSelect={(e) => {
                        e.stopPropagation();
                        onDelete(columnId, idea.id || "");
                      }}
                    >
                      Delete Idea
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Optional image preview */}
            {hasImages && (
              <div className="mt-2.5 overflow-hidden rounded-md border border-border/60 bg-muted/20">
                <div className="relative aspect-video w-full overflow-hidden">
                  <img
                    src={idea.images![0].url}
                    alt={idea.title}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-102"
                  />
                  {idea.images!.length > 1 && (
                    <span className="absolute bottom-1 right-1 flex items-center gap-1 rounded bg-night-black/80 px-1.5 py-0.5 font-mono text-[10px] text-white backdrop-blur-xs">
                      <ImageIcon className="h-2.5 w-2.5" />+{idea.images!.length - 1}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {idea.description && (
              <p className="mt-2 text-[12px] text-muted-foreground line-clamp-2 leading-relaxed font-normal">
                {idea.description}
              </p>
            )}

            {/* Footer Metadata */}
            <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground/70">
              <span className="truncate max-w-[140px]">
                #{idea.id ? idea.id.slice(-6) : `idx-${index}`}
              </span>
              <span className="flex items-center gap-1 text-[10px]">
                <Calendar className="w-3 h-3 text-muted-foreground/50" />
                Idea
              </span>
            </div>
          </div>
        )}
      </Draggable>

      <IdeaAnglesDialog
        idea={idea}
        open={anglesDialogOpen}
        onOpenChange={setAnglesDialogOpen}
      />
    </>
  );
}
