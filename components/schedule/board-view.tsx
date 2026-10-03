"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PostType } from "@/types/post.type";
import { ScheduleKanban } from "./schedule-kanban";
import { LiveMobilePreview } from "./live-mobile-preview";
import { EditPostDialog } from "./edit-post-dialog";
import CreatePostDialog from "./create-post-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Smartphone, Sparkles, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

interface BoardViewProps {
  channelIds?: string[];
  selectedStatus?: string;
  setCreatePostModalOpen?: (open: boolean) => void;
}

export default function BoardView({
  channelIds = [],
  selectedStatus = "all",
}: BoardViewProps) {
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<PostType | null>(null);
  const [editingPost, setEditingPost] = useState<PostType | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Fetch posts filtered by active channels & status
  const { data: posts = [], isLoading, isRefetching, refetch } = useQuery<PostType[]>({
    queryKey: ["posts", channelIds, selectedStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (channelIds.length > 0) {
        params.set("channel_id", channelIds.join(","));
      }
      if (selectedStatus && selectedStatus !== "all") {
        params.set("status", selectedStatus);
      }
      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load posts");
      const json = await res.json();
      return json.posts || [];
    },
  });

  // Automatically select the first post once data loads if none selected
  useEffect(() => {
    if (posts.length > 0) {
      if (!selectedPost || !posts.some((p) => p.id === selectedPost.id)) {
        setSelectedPost(posts[0]);
      } else {
        const fresh = posts.find((p) => p.id === selectedPost.id);
        if (fresh) setSelectedPost(fresh);
      }
    } else {
      setSelectedPost(null);
    }
  }, [posts]);

  // Update status on drag-and-drop
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      postId,
      newStatus,
      scheduledAt,
    }: {
      postId: string;
      newStatus: string;
      scheduledAt?: string | null;
    }) => {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          scheduledAt: scheduledAt || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to update post");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to move post. Reverting state.");
      refetch();
    },
  });

  // Instant Publish Now
  const publishNowMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/posts/${postId}/publish`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to trigger publishing");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      const msg =
        data?.mode === "direct_published"
          ? "Post published live to connected channel!"
          : data?.message || "Post dispatched for publishing!";
      toast.success(msg);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to publish post");
    },
  });

  const handleEditPost = (post: PostType) => {
    setEditingPost(post);
    setEditDialogOpen(true);
  };

  const handlePublishNow = (post: PostType) => {
    publishNowMutation.mutate(post.id);
  };

  const handleAIPolish = (post: PostType) => {
    setEditingPost(post);
    setEditDialogOpen(true);
  };

  const editPostPayload = editingPost
    ? {
        id: editingPost.id,
        content: editingPost.content,
        images: editingPost.images || [],
        userChannelId: editingPost.user_channel_id || editingPost.user_channels?.id || "",
        scheduledDate: editingPost.scheduled_at,
        channel: editingPost.user_channels as any,
      }
    : null;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-3">
        <Spinner className="size-6 text-primary" />
        <span className="text-xs font-mono text-muted-foreground">Loading pipeline board...</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-start gap-4 h-full w-full overflow-hidden pt-1">
      {/* 3-Column Kanban Workflow (Left Canvas) */}
      <div className="flex-1 h-full min-w-0 pr-1">
        <ScheduleKanban
          posts={posts}
          selectedPostId={selectedPost?.id}
          onSelectPost={(post) => setSelectedPost(post)}
          onEditPost={handleEditPost}
          onPublishNow={handlePublishNow}
          onAddNew={() => setCreatePostOpen(true)}
          onUpdatePostStatus={async (postId, newStatus, scheduledAt) => {
            try {
              await updateStatusMutation.mutateAsync({ postId, newStatus, scheduledAt });
            } catch {
              // Handled by mutation onError and toast
            }
          }}
        />
      </div>

      {/* Live Smartphone Preview Pane (Desktop Sticky 380px) */}
      <div className="hidden xl:flex w-[360px] shrink-0 border-l border-border/60 pl-4 h-full overflow-y-auto scrollbar-none flex-col items-center">
        <LiveMobilePreview
          post={selectedPost}
          onEditPost={handleEditPost}
          onPublishNow={handlePublishNow}
          onAIPolish={handleAIPolish}
        />
      </div>

      {/* Floating Trigger for Tablet & Mobile Preview Drawer */}
      <div className="xl:hidden fixed bottom-6 right-6 z-40">
        <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="gap-2 px-3.5 h-10 rounded-full shadow-2xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 ring-4 ring-primary/20"
            >
              <Smartphone className="size-4" />
              <span>Preview</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[360px] sm:w-[400px] p-4 overflow-y-auto">
            <SheetHeader className="mb-3">
              <SheetTitle className="text-sm font-semibold">Live Mobile Preview</SheetTitle>
            </SheetHeader>
            <LiveMobilePreview
              post={selectedPost}
              onEditPost={handleEditPost}
              onPublishNow={handlePublishNow}
              onAIPolish={handleAIPolish}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Modals */}
      <EditPostDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        post={editPostPayload}
      />

      <CreatePostDialog
        open={createPostOpen}
        onOpenChange={setCreatePostOpen}
      />
    </div>
  );
}
