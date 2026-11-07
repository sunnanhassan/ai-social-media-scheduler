"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PostAnalyticsItem } from "@/lib/analytics/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Heart, MessageSquare, ExternalLink, RefreshCw, Sparkles, Share2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TopPostsTableProps {
  posts?: PostAnalyticsItem[];
}

export function TopPostsTable({ posts = [] }: TopPostsTableProps) {
  const queryClient = useQueryClient();
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const safePosts = Array.isArray(posts) ? posts : [];

  const handleRefreshPost = async (postId: string) => {
    setRefreshingId(postId);
    try {
      const res = await fetch(`/api/analytics/refresh/${postId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to refresh post metrics");
      }

      toast.success("Live metrics refreshed from platform!");
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to refresh metrics");
    } finally {
      setRefreshingId(null);
    }
  };

  const getChannelBadge = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes("twitter") || lower === "x") {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/80 text-white border border-white/10">
          X / Twitter
        </span>
      );
    }
    if (lower.includes("linkedin")) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#0A66C2]/20 text-[#0A66C2] border border-[#0A66C2]/30">
          LinkedIn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-muted text-muted-foreground border">
        {type}
      </span>
    );
  };

  return (
    <Card className="border border-border/80 bg-card/80 backdrop-blur-xs shadow-2xs">
      <CardHeader className="p-4 pb-2 border-b border-border/50 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Individual Post Performance & Engagement
          </CardTitle>
          <CardDescription className="text-xs">
            Live impressions, interactions, and engagement rates for every published post
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40 font-mono text-[11px] text-muted-foreground uppercase">
                <th className="py-2.5 px-4 font-medium">Post Content</th>
                <th className="py-2.5 px-3 font-medium">Channel</th>
                <th className="py-2.5 px-3 font-medium text-right">Views</th>
                <th className="py-2.5 px-3 font-medium text-right">Likes</th>
                <th className="py-2.5 px-3 font-medium text-right">Comments</th>
                <th className="py-2.5 px-3 font-medium text-right">Eng. Rate</th>
                <th className="py-2.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-normal">
              {safePosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground font-mono text-xs">
                    No individual post performance data available yet.
                  </td>
                </tr>
              ) : (
                safePosts.map((post) => {
                const isRefreshing = refreshingId === post.postId;
                let formattedDate = "Published";
                try {
                  formattedDate = format(new Date(post.scheduledAt), "MMM d, h:mm a");
                } catch {}

                return (
                  <tr key={post.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="py-3 px-4 max-w-[280px]">
                      <p className="line-clamp-2 text-foreground/90 leading-snug">{post.content}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">{formattedDate}</span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      {getChannelBadge(post.channelType)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-foreground font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="size-3 text-muted-foreground/70" />
                        {post.impressions.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="size-3 text-rose-500/70" />
                        {post.likes.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="size-3 text-blue-500/70" />
                        {post.comments.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <Badge
                        variant="outline"
                        className={`font-mono text-[10px] px-1.5 py-0.5 ${
                          post.engagementRate >= 5.0
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                            : post.engagementRate >= 3.0
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {post.engagementRate}%
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Refresh live metrics"
                          disabled={isRefreshing}
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleRefreshPost(post.postId)}
                        >
                          <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
                        </Button>

                        {post.publishedUrl && (
                          <Button size="icon" variant="ghost" asChild className="size-7 text-muted-foreground hover:text-foreground">
                            <a href={post.publishedUrl} target="_blank" rel="noreferrer" title="View live post">
                              <ExternalLink className="size-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

