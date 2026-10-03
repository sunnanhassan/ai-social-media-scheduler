"use client";

import React, { useMemo } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { PostType } from "@/types/post.type";
import { ScheduleKanbanColumn } from "./schedule-kanban-column";
import { toast } from "sonner";
import { POST_STATUS } from "@/constants/post";

interface ScheduleKanbanProps {
  posts: PostType[];
  selectedPostId?: string | null;
  onSelectPost?: (post: PostType) => void;
  onEditPost?: (post: PostType) => void;
  onPublishNow?: (post: PostType) => void;
  onAddNew?: (status?: string) => void;
  onUpdatePostStatus?: (postId: string, newStatus: string, scheduledAt?: string | null) => Promise<void>;
  className?: string;
}

export function ScheduleKanban({
  posts,
  selectedPostId,
  onSelectPost,
  onEditPost,
  onPublishNow,
  onAddNew,
  onUpdatePostStatus,
  className = "",
}: ScheduleKanbanProps) {
  // Categorize posts into 3 columns
  const { drafts, queue, published } = useMemo(() => {
    const draftsList: PostType[] = [];
    const queueList: PostType[] = [];
    const publishedList: PostType[] = [];

    posts.forEach((post) => {
      if (post.status === POST_STATUS.DRAFT) {
        draftsList.push(post);
      } else if (post.status === POST_STATUS.QUEUE || post.status === POST_STATUS.PROCESSING) {
        queueList.push(post);
      } else if (post.status === POST_STATUS.PUBLISHED || post.status === POST_STATUS.FAILED) {
        publishedList.push(post);
      } else {
        draftsList.push(post);
      }
    });

    // Sort queue by scheduled_at ascending
    queueList.sort((a, b) => {
      const timeA = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const timeB = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return timeA - timeB;
    });

    // Sort published by updated_at / created_at descending
    publishedList.sort((a, b) => {
      const timeA = new Date(a.scheduled_at || 0).getTime();
      const timeB = new Date(b.scheduled_at || 0).getTime();
      return timeB - timeA;
    });

    return { drafts: draftsList, queue: queueList, published: publishedList };
  }, [posts]);

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const draggedPost = posts.find((p) => p.id === draggableId);
    if (!draggedPost) return;

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    if (sourceCol === destCol) return;

    try {
      if (destCol === "drafts") {
        toast.success("Moved post to Drafts");
        await onUpdatePostStatus?.(
          draggedPost.id,
          POST_STATUS.DRAFT,
          draggedPost.scheduled_at || new Date().toISOString()
        );
      } else if (destCol === "queue") {
        // If moving from draft to queue, default to tomorrow at 10 AM if not set
        let scheduledAt = draggedPost.scheduled_at;
        if (!scheduledAt || new Date(scheduledAt) <= new Date()) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(10, 0, 0, 0);
          scheduledAt = tomorrow.toISOString();
        }
        toast.success("Post queued for publication!");
        await onUpdatePostStatus?.(draggedPost.id, POST_STATUS.QUEUE, scheduledAt);
      } else if (destCol === "published") {
        toast.info("Triggering instant publish...");
        onPublishNow?.(draggedPost);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to move post");
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={`flex items-start gap-4 h-full overflow-x-auto pb-2 scrollbar-none ${className}`}>
        <ScheduleKanbanColumn
          columnId="drafts"
          title="Drafts & Ideas"
          count={drafts.length}
          posts={drafts}
          selectedPostId={selectedPostId}
          onSelectPost={onSelectPost}
          onEditPost={onEditPost}
          onPublishNow={onPublishNow}
          onAddNew={() => onAddNew?.(POST_STATUS.DRAFT)}
        />

        <ScheduleKanbanColumn
          columnId="queue"
          title="Scheduled Queue"
          count={queue.length}
          posts={queue}
          selectedPostId={selectedPostId}
          onSelectPost={onSelectPost}
          onEditPost={onEditPost}
          onPublishNow={onPublishNow}
          onAddNew={() => onAddNew?.(POST_STATUS.QUEUE)}
        />

        <ScheduleKanbanColumn
          columnId="published"
          title="Published & Sent"
          count={published.length}
          posts={published}
          selectedPostId={selectedPostId}
          onSelectPost={onSelectPost}
          onEditPost={onEditPost}
          onPublishNow={onPublishNow}
        />
      </div>
    </DragDropContext>
  );
}
