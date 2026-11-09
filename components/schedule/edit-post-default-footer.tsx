"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ButtonGroup } from "@/components/ui/button-group";
import { ScheduleDatePicker } from "./schedule-date-picker";
import { toast } from "sonner";

interface EditPostDefaultFooterProps {
  onSaveDraft: () => void;
  onSchedulePost: () => void;
  date: Date | undefined;
  setDate: (d: Date | undefined) => void;
  time: string;
  setTime: (t: string) => void;
  isSavingDraft?: boolean;
  isScheduling?: boolean;
}

export function EditPostDefaultFooter({
  onSaveDraft,
  onSchedulePost,
  date,
  setDate,
  time,
  setTime,
  isSavingDraft = false,
  isScheduling = false,
}: EditPostDefaultFooterProps) {
  return (
    <div className="w-full flex items-center justify-between gap-2">
      <Button
        variant="ghost"
        size="lg"
        onClick={onSaveDraft}
        disabled={isSavingDraft || isScheduling}
      >
        {isSavingDraft && <Spinner />}
        Save Draft
      </Button>
      <ButtonGroup className="p-0!">
        <ScheduleDatePicker
          date={date}
          setDate={setDate}
          time={time}
          setTime={setTime}
          renderButton={(isDatePassed, isTimeNotAvailable) => (
            <Button
              size="lg"
              className="border py-4.5 px-4"
              onClick={() => {
                if (isDatePassed || isTimeNotAvailable) {
                  toast.error("Please select a valid time");
                  return;
                }
                onSchedulePost();
              }}
              disabled={
                isSavingDraft ||
                isScheduling ||
                !date ||
                !time ||
                isTimeNotAvailable ||
                isDatePassed
              }
            >
              {isScheduling && <Spinner />}
              Schedule Post
            </Button>
          )}
        />
      </ButtonGroup>
    </div>
  );
}
