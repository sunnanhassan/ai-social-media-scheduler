"use client";

import React from "react";
import { format } from "date-fns";
import { CheckCircle2, ExternalLink } from "lucide-react";

interface EditPostPublishedBannerProps {
  scheduledDate?: string | null;
  publishedUrl?: string | null;
}

export function EditPostPublishedBanner({
  scheduledDate,
  publishedUrl,
}: EditPostPublishedBannerProps) {
  let dateText = "to social channel";
  if (scheduledDate) {
    try {
      dateText = `on ${format(new Date(scheduledDate), "MMM d, yyyy 'at' h:mm a")}`;
    } catch {
      dateText = "to social channel";
    }
  }

  return (
    <div className="mx-8 mt-3 px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400">
      <div className="flex items-center gap-2 min-w-0">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
        <span className="font-medium truncate">Published {dateText}</span>
      </div>
      {publishedUrl && (
        <a
          href={publishedUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium hover:underline text-emerald-700 dark:text-emerald-300 shrink-0 ml-2"
        >
          View Live Post <ExternalLink className="size-3" />
        </a>
      )}
    </div>
  );
}
