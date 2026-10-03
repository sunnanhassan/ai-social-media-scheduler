"use client";

import React from "react";
import { Draggable } from "@hello-pangea/dnd";
import { PostType } from "@/types/post.type";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, AlertCircle, Edit2, Send, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { format, isPast } from "date-fns";
import { ChannelTypeEnum } from "@/constants/channels";

interface ScheduleKanbanCardProps {
  post: PostType;
  index: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: (post: PostType) => void;
  onPublishNow?: (post: PostType) => void;
}

export function ScheduleKanbanCard({
  post,
  index,
  isSelected = false,
  onSelect,
  onEdit,
  onPublishNow,
}: ScheduleKanbanCardProps) {
  const channelType = post.user_channels?.channel_types?.type?.toLowerCase() || "twitter";
  const handle = post.user_channels?.handle || "creator";
  const profileImage = post.user_channels?.profile_image || "";
  const images = post.images || [];

  const isOverdue =
    post.status === "queue" && post.scheduled_at && isPast(new Date(post.scheduled_at));

  const formatScheduleTime = (dateStr?: string | null) => {
    if (!dateStr) return "Unscheduled";
    try {
      const date = new Date(dateStr);
      return format(date, "MMM d, h:mm a");
    } catch {
      return "Scheduled";
    }
  };

  const getPlatformBadge = () => {
    switch (channelType) {
      case ChannelTypeEnum.TWITTER:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/80 text-white border border-white/10">
            X
          </span>
        );
      case ChannelTypeEnum.LINKEDIN:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#0A66C2]/20 text-[#0A66C2] border border-[#0A66C2]/30">
            in
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
            {channelType.slice(0, 2).toUpperCase()}
          </span>
        );
    }
  };

  return (
    <Draggable draggableId={post.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onSelect}
          className={`group relative rounded-xl p-3.5 mb-2.5 cursor-pointer transition-all duration-200 border text-card-foreground select-none ${
            isSelected
              ? "bg-card/95 border-primary/60 ring-2 ring-primary/30 shadow-md shadow-primary/5"
              : "bg-card/70 hover:bg-card border-border/70 hover:border-border hover:shadow-sm"
          } ${snapshot.isDragging ? "shadow-2xl ring-2 ring-primary bg-card/95 rotate-1 scale-[1.02] z-50" : ""}`}
        >
          {/* Card Top: Channel Badge + Handle + Actions */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {getPlatformBadge()}
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar className="size-5 shrink-0">
                  <AvatarImage src={profileImage} />
                  <AvatarFallback className="text-[9px]">
                    {handle.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-muted-foreground truncate">
                  @{handle}
                </span>
              </div>
            </div>

            {/* Quick Hover Action Buttons */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(post);
                }}
              >
                <Edit2 className="size-3" />
              </Button>
              {post.status !== "published" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPublishNow?.(post);
                  }}
                >
                  <Send className="size-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Post Content Snippet */}
          <p className="text-xs font-normal text-foreground/90 line-clamp-3 leading-relaxed mb-2.5 whitespace-pre-line break-words">
            {post.content || <span className="text-muted-foreground italic">No content</span>}
          </p>

          {/* Media Attachment Indicator */}
          {images.length > 0 && (
            <div className="mb-2.5 relative rounded-lg overflow-hidden border border-border/60 bg-muted/30 h-20 w-full flex items-center justify-center">
              <img
                src={images[0].url}
                alt="Post media"
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-white flex items-center gap-1">
                  <ImageIcon className="size-2.5" />
                  +{images.length - 1}
                </span>
              )}
            </div>
          )}

          {/* Card Footer: Status Pill / Schedule Timestamp */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40">
            {post.status === "draft" && (
              <span className="inline-flex items-center gap-1 text-muted-foreground font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                Draft
              </span>
            )}

            {(post.status === "queue" || post.status === "processing") && (
              <span
                className={`inline-flex items-center gap-1.5 font-mono px-2 py-0.5 rounded-md ${
                  isOverdue
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                }`}
              >
                {post.status === "processing" ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Publishing...
                  </>
                ) : isOverdue ? (
                  <>
                    <AlertCircle className="size-3" />
                    Overdue • {formatScheduleTime(post.scheduled_at)}
                  </>
                ) : (
                  <>
                    <Clock className="size-3" />
                    {formatScheduleTime(post.scheduled_at)}
                  </>
                )}
              </span>
            )}

            {post.status === "published" && (
              <div className="flex items-center justify-between w-full">
                <span className="inline-flex items-center gap-1 font-mono text-emerald-500">
                  <CheckCircle2 className="size-3" />
                  Published
                </span>
                {post.published_url && (
                  <a
                    href={post.published_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[10px]"
                  >
                    View <ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
            )}

            {post.status === "failed" && (
              <span className="inline-flex items-center gap-1 font-mono text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                <AlertCircle className="size-3" />
                Failed
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
