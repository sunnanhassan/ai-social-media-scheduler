"use client";

import React from "react";
import { PostType } from "@/types/post.type";
import { format, formatDistanceToNow, isPast, parseISO } from "date-fns";
import { Card, CardContent, CardFooter } from "../ui/card";
import ChannelAvatar from "../channel-avatar";
import { Button } from "../ui/button";
import { AlarmClockCheck, ExternalLink, Pin, Send } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { cn } from "@/lib/utils";

interface ListViewItemProps {
  post: PostType;
  onEdit: (post: PostType) => void;
  onPublishNow: (post: PostType) => void;
  isPublishing: boolean;
}

export function ListViewItem({
  post,
  onEdit,
  onPublishNow,
  isPublishing,
}: ListViewItemProps) {
  const scheduleDate = parseISO(post.scheduled_at);
  const channel = post.user_channels?.channel_types;
  const previewImage = post.images?.[0]?.url;
  const isOverdue =
    isPast(scheduleDate) && (post.status === "queue" || post.status === "draft");

  return (
    <div className="grid gap-2 lg:grid-cols-[120px_minmax(0,1fr)]">
      <div>
        <h5 className="font-medium text-foreground">
          {format(scheduleDate, "h:mm a")}
        </h5>
        <div
          className={cn(
            "flex items-center gap-2 text-xs mt-1",
            isOverdue ? "text-destructive font-semibold" : "text-muted-foreground"
          )}
        >
          <Pin className="size-3.5" />
          <span className="capitalize">
            {isOverdue
              ? "Overdue"
              : post.status === "draft"
              ? "Draft"
              : "Custom"}
          </span>
        </div>
      </div>

      <Card className="py-0 gap-0 border-border bg-card">
        <CardContent className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_250px]">
          <div className="space-y-4">
            {channel ? (
              <ChannelAvatar
                type={channel.type}
                color={channel.color}
                profileImage={post.user_channels?.profile_image}
                name={post.user_channels?.handle || channel.name}
              />
            ) : null}

            <p className="whitespace-pre-wrap text-sm leading-6 line-clamp-4 text-foreground/90">
              {post.content}
            </p>
          </div>

          <div className="max-h-[165px] min-h-[120px] overflow-hidden rounded-xl border border-border/60 bg-muted/30 flex items-center justify-center">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Post media"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-xs text-muted-foreground">No media</div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-border px-6 py-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-muted-foreground">
            {post.status === "published" ? (
              <>
                Published via{" "}
                <span className="font-medium text-foreground">
                  {channel?.name || "Channel"}
                </span>
              </>
            ) : (
              <>
                Created{" "}
                <span className="font-medium text-foreground">
                  {formatDistanceToNow(parseISO(post.created_at))}
                </span>{" "}
                ago
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            {post.published_url && post.status === "published" ? (
              <Button asChild variant="outline" size="sm">
                <a href={post.published_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  View Post
                </a>
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => onEdit(post)}>
                  <AlarmClockCheck className="size-3.5 mr-1" />
                  Reschedule
                </Button>

                {post.status === "draft" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPublishing}
                    onClick={() => onPublishNow(post)}
                  >
                    {isPublishing ? (
                      <Spinner className="size-3 mr-1" />
                    ) : (
                      <Send className="size-3.5 mr-1" />
                    )}
                    Publish Now
                  </Button>
                )}
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
