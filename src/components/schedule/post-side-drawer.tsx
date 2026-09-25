"use client";

import React from "react";
import { ChannelType } from "@/types/channel.type";
import { ImageObject } from "@/types/post.type";
import { AIAssistant } from "./ai-assitant";
import IdeasList from "./ideas-list";
import PreviewPanel from "./preview";

export type ActionTabType = "ideas" | "ai" | "preview";

interface PostSideDrawerProps {
  selectedRightTab: ActionTabType | null;
  activeAccordion: string;
  channelContentText: string;
  globalContentText?: string;
  previewChannel: ChannelType | null;
  previewContent: { text: string; images: ImageObject[] };
  onAIGenerate: (content: string) => void;
  onIdeaSelect: (idea: any) => void;
}

export function PostSideDrawer({
  selectedRightTab,
  activeAccordion,
  channelContentText,
  globalContentText = "",
  previewChannel,
  previewContent,
  onAIGenerate,
  onIdeaSelect,
}: PostSideDrawerProps) {
  if (!selectedRightTab) return null;

  return (
    <div className="w-[350px] flex flex-col shrink-0 border-l border-border bg-muted/20 h-full">
      <div className="py-4 flex-1 flex flex-col h-full overflow-hidden">
        {selectedRightTab === "ai" && (
          <div className="px-6 h-full overflow-y-auto">
            <AIAssistant
              content={channelContentText || globalContentText}
              channelId={activeAccordion}
              onGenerate={onAIGenerate}
            />
          </div>
        )}

        {selectedRightTab === "ideas" && (
          <div className="h-full overflow-y-auto">
            <IdeasList onSelect={onIdeaSelect} />
          </div>
        )}

        {selectedRightTab === "preview" && (
          <div className="h-full overflow-y-auto">
            <PreviewPanel channel={previewChannel} content={previewContent} />
          </div>
        )}
      </div>
    </div>
  );
}
