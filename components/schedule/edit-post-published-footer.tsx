"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Trash2, RotateCcw, Copy, Check } from "lucide-react";

interface EditPostPublishedFooterProps {
  onDelete: () => void;
  onRevertToDraft: () => void;
  onDuplicate: () => void;
  onSaveChanges: () => void;
  isDeleting?: boolean;
  isReverting?: boolean;
  isDuplicating?: boolean;
  isSaving?: boolean;
}

export function EditPostPublishedFooter({
  onDelete,
  onRevertToDraft,
  onDuplicate,
  onSaveChanges,
  isDeleting = false,
  isReverting = false,
  isDuplicating = false,
  isSaving = false,
}: EditPostPublishedFooterProps) {
  const isPending = isDeleting || isReverting || isDuplicating || isSaving;

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Left Action Buttons: Delete & Revert to Draft */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 gap-1.5 px-3 text-xs"
          disabled={isPending}
          onClick={onDelete}
          title="Delete this post from scheduler"
        >
          {isDeleting ? <Spinner className="size-3.5" /> : <Trash2 className="size-3.5" />}
          <span>Delete</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground border-border/70"
          disabled={isPending}
          onClick={onRevertToDraft}
          title="Move this published post back to drafts"
        >
          {isReverting ? <Spinner className="size-3.5" /> : <RotateCcw className="size-3.5" />}
          <span>Revert to Draft</span>
        </Button>
      </div>

      {/* Right Action Buttons: Duplicate as Draft & Save Content Changes */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 px-3.5 text-xs font-medium border-border/80 hover:bg-muted/50"
          disabled={isPending}
          onClick={onDuplicate}
          title="Create a new draft with this content to schedule again"
        >
          {isDuplicating ? <Spinner className="size-3.5" /> : <Copy className="size-3.5" />}
          <span>Duplicate as Draft</span>
        </Button>

        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-9 gap-1.5 px-4 text-xs font-medium shadow-xs"
          disabled={isPending}
          onClick={onSaveChanges}
          title="Save text edits to this published post record"
        >
          {isSaving ? <Spinner className="size-3.5" /> : <Check className="size-3.5" />}
          <span>Save Changes</span>
        </Button>
      </div>
    </div>
  );
}
