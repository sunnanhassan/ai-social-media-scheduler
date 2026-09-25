"use client";

import { useEffect, useMemo, useState } from "react";
import { parse, set } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getChannelIcon } from "@/constants/channels";
import { ChannelType } from "@/types/channel.type";
import { ImageObject } from "@/types/post.type";
import { POST_STATUS, PostStatus } from "@/constants/post";
import { ChannelContentMap } from "./post-channel-accordions";
import { ActionTabType } from "./post-side-drawer";

type ChannelContent = {
  text: string;
  images: ImageObject[];
};

export function useCreatePostState(
  selectedDate: Date | null | undefined,
  onOpenChange: (open: boolean) => void
) {
  const queryClient = useQueryClient();
  const [globalContent, setGlobalContent] = useState<ChannelContent>({ text: "", images: [] });
  const [channelContent, setChannelContent] = useState<ChannelContentMap>({});
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [selectedRightTab, setSelectedRightTab] = useState<ActionTabType | null>(null);
  const [activePreview, setActivePreview] = useState<string>("");
  const [activeAccordion, setActiveAccordion] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeSlot, setTimeSlot] = useState<string>("");

  const { data, isPending } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const res = await fetch("/api/channel");
      const json = await res.json();
      return json;
    },
  });

  const channelsData = data?.channels;
  const hasConnectedChannel = (data?.connectedCount || 0) > 0;

  const channels = useMemo(() => {
    if (isPending) return [];
    return (channelsData || []).map((channel: any) => ({
      ...channel,
      icon: getChannelIcon(channel.type),
    })) as ChannelType[];
  }, [isPending, channelsData]);

  useEffect(() => {
    if (selectedDate) setDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (channels.length > 0 && Object.keys(channelContent).length === 0) {
      const initialContent: ChannelContentMap = {};
      channels.forEach((channel) => {
        initialContent[channel.id] = { text: "", images: [] };
      });
      setChannelContent(initialContent);
    }
  }, [channels]);

  const connectedChannels = channels.filter((channel) => channel.connected);
  const selectedChannelsList = channels.filter((channel) => selectedChannels.includes(channel.id));
  const previewChannel = channels.find((c) => c.id === activePreview) ?? null;
  const previewContent = channelContent?.[activePreview] ?? { text: "", images: [] };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    setGlobalContent({ text: "", images: [] });
    setChannelContent({});
    setActiveAccordion("");
    setActivePreview("");
    setSelectedRightTab(null);
    setDate(new Date());
    setTimeSlot("");
    setSelectedChannels([]);
  };

  const createPostMutation = useMutation({
    mutationFn: async ({
      posts,
      scheduledAt,
      status,
    }: {
      posts: any[];
      scheduledAt: string;
      status?: PostStatus;
    }) => {
      const response = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts, scheduledAt, status }),
      });
      if (!response.ok) throw new Error("Failed to create posts");
      return response.json();
    },
    onSuccess: (resData, variables) => {
      toast.success(
        `${resData.posts.length} post(s) ${
          variables.status === POST_STATUS.DRAFT ? "saved to draft" : "scheduled"
        } successfully`
      );
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "posts",
      });
      handleOpenChange(false);
    },
    onError: (error: any) => {
      console.error("failed to create post", error);
      toast.error("Failed to save post");
    },
  });

  const handleSelectRightTab = (tab: ActionTabType) => {
    setSelectedRightTab((prev) => (prev === tab ? null : tab));
  };

  const handleSelectAll = () => {
    setSelectedChannels((prev) => {
      if (prev.length === connectedChannels.length) {
        setActivePreview("");
        return [];
      }
      setChannelContent((curr) => {
        const update = { ...curr };
        connectedChannels.forEach((channel) => {
          if (!update[channel.id]?.text && globalContent.text) {
            const limit = Number(channel.character_limit);
            update[channel.id] = {
              text: globalContent.text.slice(0, limit),
              images: [...globalContent.images],
            };
          } else if (!update[channel.id]) {
            update[channel.id] = { text: "", images: [] };
          }
        });
        return update;
      });
      return connectedChannels.map((channel) => channel.id);
    });
  };

  const handleGlobalContentChange = (text: string, images?: ImageObject[]) => {
    setGlobalContent((prev) => ({
      ...prev,
      text,
      images: images || prev.images,
    }));
  };

  const handleTextChange = (channelId: string, text: string, character_limit: number) => {
    const limit = Number(character_limit);
    if (text.length <= limit) {
      setChannelContent((prev) => ({
        ...prev,
        [channelId]: { ...prev[channelId], text },
      }));
    }
  };

  const handleImagesChange = (channelId: string, images: ImageObject[]) => {
    setChannelContent((prev) => ({
      ...prev,
      [channelId]: { ...prev[channelId], images },
    }));
  };

  const toggleChannel = (channelId: string, character_limit: number) => {
    setSelectedChannels((prev) => {
      if (prev.includes(channelId) && activePreview === channelId) setActivePreview("");
      const isSelected = prev.includes(channelId);
      const newChannels = isSelected ? prev.filter((id) => id !== channelId) : [...prev, channelId];

      if (!isSelected) {
        if (globalContent.text && !channelContent[channelId]?.text) {
          const limit = Number(character_limit);
          setChannelContent((curr) => ({
            ...curr,
            [channelId]: {
              text: globalContent.text.slice(0, limit),
              images: [...globalContent.images],
            },
          }));
        }
      } else {
        setChannelContent((curr) => ({
          ...curr,
          [channelId]: { text: "", images: [] },
        }));
      }
      return newChannels;
    });

    if (!selectedChannels.includes(channelId)) {
      setActiveAccordion(channelId);
      setActivePreview(channelId);
    }
  };

  const handleIdeaSelect = (idea: any) => {
    if (!hasConnectedChannel) {
      toast.error("Connect at least one channel to add idea");
      return;
    }
    if (selectedChannels.length === 0) {
      setGlobalContent({
        text: idea.title + "\n\n" + idea.description,
        images: idea.images || [],
      });
      return;
    }
    setChannelContent((prev) => ({
      ...prev,
      [activeAccordion]: {
        text: idea.title + "\n\n" + idea.description,
        images: idea.images || [],
      },
    }));
  };

  const handleCreatePost = (status?: PostStatus) => {
    if (selectedChannels.length === 0) {
      toast.error("Select at least one channel");
      return;
    }
    const postToCreate = selectedChannelsList.map((channel) => {
      const content = channelContent[channel.id] ?? { text: "", images: [] };
      return {
        channelTypeId: channel.id,
        content: content.text,
        images: content.images,
      };
    });
    if (postToCreate.some((post) => !post.content)) {
      toast.error("Each selected channel must have content");
      return;
    }

    const parsedTime = parse(timeSlot, "h:mm a", new Date());
    const scheduleAt = set(date || new Date(), {
      hours: parsedTime.getHours(),
      minutes: parsedTime.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    });

    createPostMutation.mutate({
      posts: postToCreate,
      scheduledAt: scheduleAt.toISOString(),
      status,
    });
  };

  return {
    channels,
    isPending,
    hasConnectedChannel,
    connectedChannels,
    selectedChannels,
    selectedChannelsList,
    channelContent,
    globalContent,
    selectedRightTab,
    activeAccordion,
    activePreview,
    previewChannel,
    previewContent,
    date,
    setDate,
    timeSlot,
    setTimeSlot,
    createPostMutation,
    handleOpenChange,
    handleSelectRightTab,
    handleSelectAll,
    handleGlobalContentChange,
    handleTextChange,
    handleImagesChange,
    toggleChannel,
    handleIdeaSelect,
    handleCreatePost,
    setActiveAccordion,
    setActivePreview,
    setGlobalContent,
    setChannelContent,
  };
}
