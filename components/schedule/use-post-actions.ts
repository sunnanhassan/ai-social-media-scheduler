"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PostType, ImageObject } from "@/types/post.type";

export interface DuplicatePostInput {
  content: string;
  images?: ImageObject[];
  user_channel_id?: string;
  userChannelId?: string;
}

export function usePostActions() {
  const queryClient = useQueryClient();

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete post");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete post");
    },
  });

  const revertToDraftMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to revert post to draft");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Post moved back to drafts");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to revert post to draft");
    },
  });

  const duplicatePostMutation = useMutation({
    mutationFn: async (post: DuplicatePostInput) => {
      const channelId = post.userChannelId || post.user_channel_id;
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: post.content,
          images: post.images || [],
          status: "draft",
          user_channel_id: channelId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to duplicate post");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Post duplicated as new draft");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to duplicate post");
    },
  });

  const publishNowMutation = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/posts/${postId}/publish`, { method: "POST" });
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

  const handlePublishNow = (post: PostType) => {
    const userChannel = post.user_channels;
    const providerType = userChannel?.channel_types?.type;
    const isConnected = userChannel?.is_connected;

    if (!userChannel || !isConnected) {
      toast.error("Cannot publish: Channel is not connected. Connect in Channels settings.");
      return;
    }

    if (
      providerType !== "TWITTER" &&
      providerType !== "LINKEDIN" &&
      providerType !== "FACEBOOK"
    ) {
      toast.error(
        `Cannot publish: Live publishing for ${userChannel.channel_types?.name || providerType || "this channel"} is not supported yet.`
      );
      return;
    }

    publishNowMutation.mutate(post.id);
  };

  return {
    deletePost: deletePostMutation.mutate,
    isDeleting: deletePostMutation.isPending,
    revertToDraft: revertToDraftMutation.mutate,
    isReverting: revertToDraftMutation.isPending,
    duplicatePost: duplicatePostMutation.mutate,
    isDuplicating: duplicatePostMutation.isPending,
    publishNow: handlePublishNow,
    isPublishing: publishNowMutation.isPending,
  };
}
