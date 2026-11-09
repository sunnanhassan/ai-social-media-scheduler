"use client";

import * as React from "react";
import { parse, set } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Wand2, ScanEye, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChannelType } from "@/types/channel.type";
import { ImageObject } from "@/types/post.type";
import { POST_STATUS, PostStatus } from "@/constants/post";
import { getChannelIcon } from "@/constants/channels";
import ContentTextarea from "../content-textarea";
import { ActionTabType, PostSideDrawer } from "./post-side-drawer";
import { EditPostPublishedFooter } from "./edit-post-published-footer";
import { EditPostPublishedBanner } from "./edit-post-published-banner";
import { EditPostDefaultFooter } from "./edit-post-default-footer";

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: string;
    content: string;
    images: ImageObject[];
    userChannelId: string;
    scheduledDate: string;
    status?: PostStatus | string;
    publishedUrl?: string | null;
    channel?: ChannelType | null;
  } | null;
  onDelete?: (postId: string) => void;
  onRevertToDraft?: (postId: string) => void;
  onDuplicate?: (post: any) => void;
}

const rightTabs = [
  { id: "ideas" as ActionTabType, label: "Ideas", icon: Lightbulb },
  { id: "ai" as ActionTabType, label: "AI Assistant", icon: Wand2 },
  { id: "preview" as ActionTabType, label: "Preview", icon: ScanEye },
];

export function EditPostDialog({
  open,
  onOpenChange,
  post,
  onDelete,
  onRevertToDraft,
  onDuplicate,
}: EditPostDialogProps) {
  const queryClient = useQueryClient();
  const isPublished = post?.status === "published" || post?.status === POST_STATUS.PUBLISHED;

  const updatePostMutation = useMutation({
    mutationFn: async (payload: { postId: string; content: string; images: ImageObject[]; scheduledAt: string; status?: PostStatus; userChannelId: string }) => {
      const res = await fetch(`/api/posts/${payload.postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: payload.content, images: payload.images, scheduledAt: payload.scheduledAt, status: payload.status }),
      });
      if (!res.ok) throw new Error("Failed to update post");
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === POST_STATUS.DRAFT
          ? "Post saved to drafts successfully!"
          : variables.status === POST_STATUS.PUBLISHED
          ? "Published post updated successfully!"
          : "Post rescheduled successfully!"
      );
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      onOpenChange(false);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const [content, setContent] = React.useState("");
  const [images, setImages] = React.useState<ImageObject[]>([]);
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [time, setTime] = React.useState<string>("");
  const [selectedRightTab, setSelectedRightTab] = React.useState<ActionTabType | null>(null);

  React.useEffect(() => {
    if (post) {
      setContent(post.content);
      setImages(post.images ?? []);
      const parsedDate = new Date(post.scheduledDate);
      setDate(parsedDate);
      const hours = parsedDate.getHours();
      const minutes = parsedDate.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const h = hours % 12 || 12;
      const m = minutes.toString().padStart(2, "0");
      setTime(`${h}:${m} ${ampm}`);
    }
  }, [post]);

  const channel = post?.channel;
  const icon = channel ? getChannelIcon(channel.type) : null;

  const handleUpdate = (status?: PostStatus) => {
    if (!post) return;
    const parsedTime = parse(time, "h:mm a", new Date());
    const finalDate = set(date || new Date(), {
      hours: parsedTime.getHours(),
      minutes: parsedTime.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    });

    updatePostMutation.mutate({
      postId: post.id,
      content,
      images,
      scheduledAt: finalDate.toISOString(),
      status,
      userChannelId: post.userChannelId,
    });
  };

  const handleSelectRightTab = (tab: ActionTabType) => {
    setSelectedRightTab((prev) => (prev === tab ? null : tab));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:w-full sm:min-w-[700px] gap-0 px-0 pt-0 pb-0!",
          selectedRightTab && "sm:max-w-[950px]"
        )}
      >
        <div>
          <DialogHeader className="px-8 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">Edit Post</DialogTitle>
              <div className="flex items-center gap-1">
                {rightTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={selectedRightTab === tab.id ? "default" : "ghost"}
                    className={cn(!selectedRightTab && "size-8")}
                    onClick={() => handleSelectRightTab(tab.id)}
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className={cn(!selectedRightTab && "hidden")}>{tab.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </DialogHeader>
          <DialogDescription className="sr-only">Edit scheduled post details</DialogDescription>

          {isPublished && (
            <EditPostPublishedBanner
              scheduledDate={post?.scheduledDate}
              publishedUrl={post?.publishedUrl}
            />
          )}

          <div className="w-full flex flex-1 h-full min-h-[550px] max-h-[570px]">
            <div className="flex flex-1 flex-col min-w-0 w-[300px] pb-5">
              <section className="channel--composer relative flex flex-col px-8 mt-5 min-h-[300px] h-auto">
                <div className="bg-background rounded-2xl border shadow-sm overflow-hidden min-h-[400px] flex flex-col p-4">
                  <div className="flex-1 relative">
                    {icon && (
                      <div className="absolute top-0 left-0">
                        <HugeiconsIcon
                          icon={icon}
                          style={{ background: channel?.color }}
                          className="size-5 text-white! p-1 rounded-sm"
                        />
                      </div>
                    )}
                    <div className={cn(icon && "pl-8")}>
                      <ContentTextarea
                        value={content}
                        images={images}
                        placeholder="Start writing or get inspired by AI..."
                        minHeight={350}
                        contentClass="text-[15px] placeholder:opacity-50 pt-0!"
                        showAIAssistant={true}
                        onAIAssistantClick={() => handleSelectRightTab("ai")}
                        onChange={setContent}
                        onImagesChange={setImages}
                        renderToolbarRight={
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                                channel &&
                                  content.length >= Number(channel.character_limit) * 0.9
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : "bg-muted text-muted-foreground border-border/50"
                              )}
                            >
                              {content.length} / {channel?.character_limit || 280}
                            </span>
                          </div>
                        }
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <PostSideDrawer
              selectedRightTab={selectedRightTab}
              activeAccordion={post?.channel?.id || ""}
              channelContentText={content}
              previewChannel={channel || null}
              previewContent={{ text: content, images }}
              onAIGenerate={(generatedText) => setContent(generatedText)}
              onIdeaSelect={(idea) => {
                setContent(idea.description || "");
                setImages(idea.images || []);
              }}
            />
          </div>
        </div>

        <DialogFooter className="px-8 pt-4 pb-4 m-0!">
          {isPublished ? (
            <EditPostPublishedFooter
              onDelete={() => {
                if (onDelete && post) {
                  onDelete(post.id);
                  onOpenChange(false);
                }
              }}
              onRevertToDraft={() => {
                if (onRevertToDraft && post) {
                  onRevertToDraft(post.id);
                  onOpenChange(false);
                } else {
                  handleUpdate(POST_STATUS.DRAFT);
                }
              }}
              onDuplicate={() => {
                if (onDuplicate && post) {
                  onDuplicate({
                    content,
                    images,
                    userChannelId: post.userChannelId,
                    channel: post.channel,
                  });
                  onOpenChange(false);
                }
              }}
              onSaveChanges={() => handleUpdate(POST_STATUS.PUBLISHED)}
              isSaving={updatePostMutation.isPending}
            />
          ) : (
            <EditPostDefaultFooter
              onSaveDraft={() => handleUpdate(POST_STATUS.DRAFT)}
              onSchedulePost={() => handleUpdate()}
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
              isSavingDraft={
                updatePostMutation.isPending &&
                updatePostMutation.variables?.status === POST_STATUS.DRAFT
              }
              isScheduling={
                updatePostMutation.isPending &&
                updatePostMutation.variables?.status === undefined
              }
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
