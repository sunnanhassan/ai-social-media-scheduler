"use client";

import React from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { cn } from "@/lib/utils";
import { Lightbulb, ScanEye, Wand2 } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { ButtonGroup } from "../ui/button-group";
import { POST_STATUS } from "@/constants/post";
import { ScheduleDatePicker } from "./schedule-date-picker";
import Link from "next/link";
import { Spinner } from "../ui/spinner";
import { PostChannelSelector } from "./post-channel-selector";
import { PostChannelAccordions } from "./post-channel-accordions";
import { ActionTabType, PostSideDrawer } from "./post-side-drawer";
import { useCreatePostState } from "./use-create-post-state";

type PropsType = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date | null;
};

const rightTabs = [
  { id: "ideas" as ActionTabType, label: "Ideas", icon: Lightbulb },
  { id: "ai" as ActionTabType, label: "AI Assistant", icon: Wand2 },
  { id: "preview" as ActionTabType, label: "Preview", icon: ScanEye },
];

const CreatePostDialog = ({ open, onOpenChange, selectedDate }: PropsType) => {
  const {
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
  } = useCreatePostState(selectedDate, onOpenChange);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "sm:w-full sm:min-w-[700px] gap-0 px-0 pt-0 pb-0",
          selectedRightTab && "sm:max-w-[950px]"
        )}
      >
        <div>
          <DialogHeader className="px-8 py-3 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-semibold">Create Post</DialogTitle>
              <div className="flex items-center gap-1">
                {rightTabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={selectedRightTab === tab.id ? "default" : "ghost"}
                    className={cn(!selectedRightTab && "size-8")}
                    onClick={() => handleSelectRightTab(tab.id)}
                  >
                    <tab.icon className="size-4" />
                    <span className={cn(!selectedRightTab && "hidden")}>{tab.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </DialogHeader>

          <div className="w-full flex flex-1 min-w-0 overflow-hidden h-[580px]">
            <div className="flex flex-1 flex-col min-w-0 w-[300px] pb-5">
              <PostChannelSelector
                channels={channels}
                selectedChannels={selectedChannels}
                connectedChannels={connectedChannels}
                isPending={isPending}
                onSelectAll={handleSelectAll}
                onToggleChannel={toggleChannel}
              />

              <PostChannelAccordions
                selectedChannels={selectedChannels}
                selectedChannelsList={selectedChannelsList}
                channelContent={channelContent}
                globalContent={globalContent}
                hasConnectedChannel={hasConnectedChannel}
                activeAccordion={activeAccordion}
                onAccordionChange={(val) => {
                  setActiveAccordion(val);
                  setActivePreview(val);
                }}
                onGlobalContentChange={handleGlobalContentChange}
                onTextChange={handleTextChange}
                onImagesChange={handleImagesChange}
                onOpenAIAssistant={() => handleSelectRightTab("ai")}
              />
            </div>

            <PostSideDrawer
              selectedRightTab={selectedRightTab}
              activeAccordion={activeAccordion}
              channelContentText={channelContent[activeAccordion]?.text || ""}
              globalContentText={globalContent?.text || ""}
              previewChannel={previewChannel}
              previewContent={previewContent}
              onIdeaSelect={handleIdeaSelect}
              onAIGenerate={(content) => {
                if (globalContent?.text) {
                  setGlobalContent((prev) => ({ ...prev, text: content }));
                }
                setChannelContent((prev) => ({
                  ...prev,
                  [activeAccordion]: { ...prev[activeAccordion], text: content },
                }));
              }}
            />
          </div>
        </div>

        <DialogFooter className="px-8 pt-5 pb-4 m-0!">
          {hasConnectedChannel ? (
            <div className="w-full flex items-center justify-between gap-2">
              <Button
                size="lg"
                variant="ghost"
                disabled={createPostMutation.isPending}
                onClick={() => handleCreatePost(POST_STATUS.DRAFT)}
              >
                {createPostMutation.isPending &&
                  createPostMutation.variables?.status === POST_STATUS.DRAFT && <Spinner />}
                Save Draft
              </Button>
              <ButtonGroup className="p-0!">
                <ScheduleDatePicker
                  date={date}
                  setDate={setDate}
                  time={timeSlot}
                  setTime={setTimeSlot}
                  renderButton={(isDatePassed, isTimeNotAvailable) => (
                    <Button
                      size="lg"
                      className="border py-4.5 px-4"
                      disabled={
                        createPostMutation.isPending ||
                        !date ||
                        !timeSlot ||
                        isDatePassed ||
                        isTimeNotAvailable
                      }
                      onClick={() => {
                        if (isDatePassed || isTimeNotAvailable) {
                          toast.error("Please select a valid date and time");
                          return;
                        }
                        handleCreatePost();
                      }}
                    >
                      {createPostMutation.isPending &&
                        createPostMutation.variables?.status === undefined && <Spinner />}
                      Schedule Post
                    </Button>
                  )}
                />
              </ButtonGroup>
            </div>
          ) : (
            <Button size="lg" asChild>
              <Link href="/settings">Connect Channel to Post</Link>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
