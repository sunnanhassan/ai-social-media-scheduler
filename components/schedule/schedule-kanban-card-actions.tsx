"use client";

import React from "react";
import { PostType } from "@/types/post.type";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Edit2,
  Send,
  MoreHorizontal,
  Copy,
  RotateCcw,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface ScheduleKanbanCardActionsProps {
  post: PostType;
  onEdit?: (post: PostType) => void;
  onPublishNow?: (post: PostType) => void;
  onDelete?: (postId: string) => void;
  onRevertToDraft?: (postId: string) => void;
  onDuplicate?: (post: any) => void;
}

export function ScheduleKanbanCardActions({
  post,
  onEdit,
  onPublishNow,
  onDelete,
  onRevertToDraft,
  onDuplicate,
}: ScheduleKanbanCardActionsProps) {
  const isPublished = post.status === "published";

  return (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-6 text-muted-foreground hover:text-foreground"
        title="Edit post details"
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.(post);
        }}
      >
        <Edit2 className="size-3" />
      </Button>

      {!isPublished && (
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-primary"
          title="Publish now"
          onClick={(e) => {
            e.stopPropagation();
            onPublishNow?.(post);
          }}
        >
          <Send className="size-3" />
        </Button>
      )}

      {isPublished && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              title="More post options"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 text-xs">
            {onDuplicate && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(post);
                }}
              >
                <Copy className="size-3.5 mr-2" />
                Duplicate as Draft
              </DropdownMenuItem>
            )}
            {onRevertToDraft && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRevertToDraft(post.id);
                }}
              >
                <RotateCcw className="size-3.5 mr-2" />
                Revert to Draft
              </DropdownMenuItem>
            )}
            {post.published_url && (
              <DropdownMenuItem asChild>
                <a
                  href={post.published_url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="size-3.5 mr-2" />
                  View Live Post
                </a>
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(post.id);
                  }}
                >
                  <Trash2 className="size-3.5 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
