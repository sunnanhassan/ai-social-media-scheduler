"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsDashboardData } from "@/lib/analytics/types";
import { AnalyticsSummaryCards } from "@/components/analytics/analytics-summary-cards";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { TopPostsTable } from "@/components/analytics/top-posts-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, RefreshCw, Sparkles, Filter, Info } from "lucide-react";
import { toast } from "sonner";

export default function AnalyticsPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("7d");
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const { data, isPending, refetch, isFetching } = useQuery<AnalyticsDashboardData>({
    queryKey: ["analytics", range, channelFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        range,
        ...(channelFilter !== "all" ? { channelId: channelFilter } : {}),
      });
      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
  });

  const handleManualRefresh = async () => {
    await refetch();
    toast.success("Analytics metrics updated!");
  };

  return (
    <div className="flex-1 space-y-5 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            Post Performance & Engagement Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track views, organic reach, likes, and discover optimal publishing windows
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg border border-border/70 p-0.5 bg-muted/40 text-xs font-mono">
            {(["7d", "30d", "90d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1 rounded-md transition-all ${
                  range === r
                    ? "bg-background text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={isFetching}
            onClick={handleManualRefresh}
            className="h-8 gap-1.5 text-xs border-border/70"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* Fallback / Offline Notice */}
      {data?.isFallback && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 flex items-center gap-2.5 text-xs text-blue-600 dark:text-blue-400">
          <Info className="size-4 shrink-0 text-blue-500" />
          <p>
            <strong className="font-semibold">Demo Analytics Feed:</strong> Displaying realistic organic reach, likes, comments, and engagement distributions.
          </p>
        </div>
      )}

      {/* Main Content */}
      {isPending ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : data ? (
        <div className="space-y-5">
          <AnalyticsSummaryCards summary={data.summary} />
          <AnalyticsCharts timeseries={data.timeseries} bestTimeToPost={data.bestTimeToPost} />
          <TopPostsTable posts={data.recentPosts} />
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
          <p className="text-xs">No analytics data available for this range.</p>
        </div>
      )}
    </div>
  );
}

