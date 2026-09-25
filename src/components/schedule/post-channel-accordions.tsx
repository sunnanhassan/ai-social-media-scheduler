"use client";

import React from "react";
import { ChannelType } from "@/types/channel.type";
import { ImageObject } from "@/types/post.type";
import { getChannelIcon } from "@/constants/channels";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertTriangle } from "lucide-react";
import ContentTextarea from "../content-textarea";
import { cn } from "@/lib/utils";

export type ChannelContentMap = Record<string, { text: string; images: ImageObject[] }>;

interface PostChannelAccordionsProps {
  selectedChannels: string[];
  selectedChannelsList: ChannelType[];
  channelContent: ChannelContentMap;
  globalContent: { text: string; images: ImageObject[] };
  hasConnectedChannel: boolean;
  activeAccordion: string;
  onAccordionChange: (val: string) => void;
  onGlobalContentChange: (text: string, images?: ImageObject[]) => void;
  onTextChange: (channelId: string, text: string, charLimit: number) => void;
  onImagesChange: (channelId: string, images: ImageObject[]) => void;
  onOpenAIAssistant: () => void;
}

export function PostChannelAccordions({
  selectedChannels,
  selectedChannelsList,
  channelContent,
  globalContent,
  hasConnectedChannel,
  activeAccordion,
  onAccordionChange,
  onGlobalContentChange,
  onTextChange,
  onImagesChange,
  onOpenAIAssistant,
}: PostChannelAccordionsProps) {
  return (
    <div className="channel--content relative flex flex-col px-8 min-h-[300px] h-full overflow-y-auto">
      {selectedChannels.length === 0 ? (
        <div className="border border-border/80 rounded-xl p-4 bg-card/60 backdrop-blur-xs">
          <ContentTextarea
            value={globalContent?.text || ""}
            images={globalContent?.images || []}
            placeholder="Write your main content here... It will be copied to channels when you select them."
            minHeight={270}
            showAIAssistant={true}
            disabled={!hasConnectedChannel}
            contentClass="text-sm placeholder:opacity-50 pt-0!"
            onChange={(text) => onGlobalContentChange(text)}
            onImagesChange={(images) =>
              onGlobalContentChange(globalContent.text, images)
            }
          />
        </div>
      ) : (
        <Accordion
          type="single"
          collapsible
          value={activeAccordion}
          className="w-full space-y-3"
          onValueChange={onAccordionChange}
        >
          {selectedChannelsList?.map((channel) => {
            const content = channelContent[channel.id] || { text: "", images: [] };
            const isExpanded = activeAccordion === channel.id;
            const icon = getChannelIcon(channel.type);

            return (
              <AccordionItem
                key={channel.id}
                value={channel.id}
                className="border border-border rounded-xl overflow-hidden bg-card/70"
              >
                {!isExpanded && (
                  <AccordionTrigger className="w-full px-3 py-3 cursor-pointer [&>svg]:hidden! hover:bg-muted/40 hover:no-underline! justify-start gap-3">
                    <span>
                      <HugeiconsIcon
                        icon={icon}
                        className="shrink-0 text-white! size-5! p-[3px] rounded-sm"
                        style={{ background: channel.color }}
                      />
                    </span>
                    {content.text ? (
                      <p className="text-sm text-muted-foreground/80 truncate flex-1 text-left max-w-[400px]">
                        {content.text}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        What would you like to share?
                      </p>
                    )}
                  </AccordionTrigger>
                )}

                <AccordionContent className="overflow-visible pb-4">
                  <div className="flex pt-3 px-3 gap-3">
                    {isExpanded && (
                      <span>
                        <HugeiconsIcon
                          icon={icon}
                          className="shrink-0 text-white! size-5! p-[3px] rounded-sm"
                          style={{ background: channel.color }}
                        />
                      </span>
                    )}

                    <div className="flex-1 space-y-2">
                      {!content?.text && (
                        <div className="w-full flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                          <p>Please include at least some text or an attachment.</p>
                        </div>
                      )}

                      <ContentTextarea
                        value={content?.text || ""}
                        images={content?.images || []}
                        placeholder="Start writing or get inspired by AI"
                        minHeight={260}
                        contentClass="text-sm placeholder:opacity-50 pt-0"
                        showAIAssistant={true}
                        disabled={!channel.connected}
                        onAIAssistantClick={onOpenAIAssistant}
                        onChange={(text) =>
                          onTextChange(channel.id, text, Number(channel.character_limit))
                        }
                        onImagesChange={(images) => onImagesChange(channel.id, images)}
                        renderToolbarRight={
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                                (content?.text?.length || 0) >=
                                  Number(channel.character_limit) * 0.9
                                  ? "bg-primary/10 text-primary border-primary/20"
                                  : "bg-muted text-muted-foreground border-border/50"
                              )}
                            >
                              {content?.text?.length || 0} / {channel.character_limit}
                            </span>
                          </div>
                        }
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
