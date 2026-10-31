"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

interface AdaptChannelsButtonProps {
  masterContent: string;
  channelIds: string[];
  onAdaptSuccess: (results: Array<{ userChannelId: string; content: string }>) => void;
  className?: string;
}

export function AdaptChannelsButton({
  masterContent,
  channelIds,
  onAdaptSuccess,
  className,
}: AdaptChannelsButtonProps) {
  const [isAdapting, setIsAdapting] = useState(false);

  const handleAdapt = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const trimmed = masterContent.trim();
    if (!trimmed) {
      toast.error("Please enter some text in the composer before adapting.");
      return;
    }

    if (!channelIds || channelIds.length === 0) {
      toast.error("Please select at least one channel to adapt your post for.");
      return;
    }

    setIsAdapting(true);
    const toastId = toast.loading("AI is adapting copy for your selected channels...");

    try {
      const res = await fetch("/api/posts/adapt-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          masterContent: trimmed,
          channelIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to adapt post");
      }

      const results = (data.results || []).map((r: any) => ({
        userChannelId: r.userChannelId,
        content: r.content,
      }));

      onAdaptSuccess(results);
      toast.success(
        `Successfully adapted to ${results.length} channel${results.length > 1 ? "s" : ""}!`,
        { id: toastId }
      );
    } catch (err: any) {
      console.error("[AdaptChannelsButton]", err);
      toast.error(err?.message || "Failed to adapt content for channels", { id: toastId });
    } finally {
      setIsAdapting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isAdapting || !masterContent?.trim() || channelIds.length === 0}
      onClick={handleAdapt}
      className={`h-7 px-2.5 text-xs font-medium gap-1.5 border-primary/40 text-primary hover:bg-primary/10 transition-colors shadow-2xs ${className || ""}`}
    >
      {isAdapting ? <Spinner className="size-3" /> : <Sparkles className="size-3 text-primary animate-pulse" />}
      <span>Adapt to Channels</span>
    </Button>
  );
}

