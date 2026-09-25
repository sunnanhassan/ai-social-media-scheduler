"use client";

import React from "react";
import { ChannelType } from "@/types/channel.type";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import ChannelAvatar from "../channel-avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PostChannelSelectorProps {
  channels: ChannelType[];
  selectedChannels: string[];
  connectedChannels: ChannelType[];
  isPending: boolean;
  onSelectAll: () => void;
  onToggleChannel: (channelId: string, characterLimit: number) => void;
}

export function PostChannelSelector({
  channels,
  selectedChannels,
  connectedChannels,
  isPending,
  onSelectAll,
  onToggleChannel,
}: PostChannelSelectorProps) {
  return (
    <div className="channel--selector py-5 px-8">
      {channels?.length > 0 && !isPending && (
        <button
          type="button"
          className="mb-4 text-[13px] font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
          onClick={onSelectAll}
        >
          {selectedChannels.length === connectedChannels.length
            ? "Unselect all"
            : "Select all"}
        </button>
      )}
      <div className="flex flex-wrap gap-4">
        {isPending ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="size-[50px] rounded-xl" />
          ))
        ) : (
          channels?.map((channel) => {
            const selected = selectedChannels.includes(channel.id);
            const isConnected = channel.connected;
            return (
              <Tooltip key={channel.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    style={{ "--channel-color": channel.color } as React.CSSProperties}
                    className={cn(
                      "relative shrink-0 rounded-xl p-0 transition-all focus:outline-none",
                      !isConnected ? "cursor-not-allowed" : "cursor-pointer",
                      selected
                        ? "ring-2 ring-(--channel-color) ring-offset-2 ring-offset-background"
                        : "grayscale hover:grayscale-0 opacity-80 hover:opacity-100"
                    )}
                    onClick={() => {
                      if (!isConnected) {
                        toast.error("Please connect the channel first in Settings");
                        return;
                      }
                      onToggleChannel(channel.id, Number(channel.character_limit));
                    }}
                  >
                    <ChannelAvatar
                      type={channel.type}
                      color={channel.color}
                      profileImage={channel.profile_image}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Preview {channel.name}</span>
                  {!isConnected && (
                    <span className="text-primary font-medium ml-1">
                      → Connect Channel
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })
        )}
      </div>
    </div>
  );
}
