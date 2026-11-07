"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AnalyticsTimeseriesPoint, HourlyPeakPoint } from "@/lib/analytics/types";
import { Clock, TrendingUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalyticsChartsProps {
  timeseries?: AnalyticsTimeseriesPoint[];
  bestTimeToPost?: {
    peakDay?: string;
    peakHour?: number;
    peakLabel?: string;
    hourlyBreakdown?: HourlyPeakPoint[];
  };
}

export function AnalyticsCharts({
  timeseries = [],
  bestTimeToPost,
}: AnalyticsChartsProps) {
  const safeTimeseries = Array.isArray(timeseries) ? timeseries : [];
  const safeHourly = Array.isArray(bestTimeToPost?.hourlyBreakdown)
    ? bestTimeToPost.hourlyBreakdown
    : [];

  const maxImp = Math.max(
    ...safeTimeseries.map((t) => Number(t.impressions) || 0),
    100
  );
  const maxHourlyEng = Math.max(
    ...safeHourly.map((h) => Number(h.avgEngagements) || 0),
    10
  );

  const peakHour = bestTimeToPost?.peakHour ?? 10;
  const peakDay = bestTimeToPost?.peakDay || "Wednesday";
  const peakLabel = bestTimeToPost?.peakLabel || "10:00 AM – 11:00 AM";

  // Focus peak hourly window: 8 AM to 8 PM (hours 8 to 20)
  const primeHours = safeHourly.filter((h) => h.hour >= 8 && h.hour <= 20);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Reach & Engagement Over Time */}
      <Card className="lg:col-span-2 border border-border/80 bg-card/80 backdrop-blur-xs shadow-2xs">
        <CardHeader className="p-4 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <TrendingUp className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Reach & Engagement Trends</CardTitle>
                <CardDescription className="text-xs">Daily impressions and total interactions</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-blue-500">
                <span className="size-2 rounded-full bg-blue-500" /> Impressions
              </span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="size-2 rounded-full bg-emerald-500" /> Engagements
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          {safeTimeseries.length === 0 ? (
            <div className="h-44 w-full flex items-center justify-center text-xs text-muted-foreground font-mono">
              No performance trend data recorded for this period
            </div>
          ) : (
            <div className="h-44 w-full flex items-end gap-2 sm:gap-4 justify-between border-b border-border/60 pb-2">
              {safeTimeseries.map((pt, idx) => {
                const impHeight = Math.max(Math.round((pt.impressions / maxImp) * 100), 8);
                const engHeight = Math.max(Math.round((pt.engagements / (maxImp * 0.15)) * 100), 6);
                const label = pt.date.slice(5); // MM-DD

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    {/* Tooltip Hover Pill */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground border text-[10px] font-mono p-1 rounded shadow-md pointer-events-none whitespace-nowrap z-20">
                      {pt.impressions.toLocaleString()} views • {pt.engagements} eng
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-36">
                      <div
                        style={{ height: `${impHeight}%` }}
                        className="w-full max-w-[14px] bg-blue-500/80 group-hover:bg-blue-500 rounded-t-sm transition-all"
                      />
                      <div
                        style={{ height: `${Math.min(engHeight, 100)}%` }}
                        className="w-full max-w-[14px] bg-emerald-500/80 group-hover:bg-emerald-500 rounded-t-sm transition-all"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Best Time to Post */}
      <Card className="border border-border/80 bg-card/80 backdrop-blur-xs shadow-2xs flex flex-col justify-between">
        <CardHeader className="p-4 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Clock className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Best Time to Post</CardTitle>
                <CardDescription className="text-xs">Peak engagement windows</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30 text-amber-500 bg-amber-500/10">
              Peak: {peakHour}:00
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div className="rounded-lg p-2.5 bg-muted/40 border border-border/60 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[11px] text-muted-foreground font-mono">Recommended Slot</p>
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="size-3 text-amber-500" />
                {peakDay}s at {peakLabel}
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              +42% Reach
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <p className="text-[11px] font-mono text-muted-foreground">Hourly Engagement Index (8 AM – 8 PM):</p>
            <div className="space-y-1">
              {primeHours.length === 0 ? (
                <p className="text-[11px] text-muted-foreground font-mono py-2 text-center">
                  No hourly engagement data recorded yet
                </p>
              ) : (
                primeHours.slice(0, 6).map((h, i) => {
                  const widthPct = Math.max(Math.round((h.avgEngagements / maxHourlyEng) * 100), 12);
                  const isPeak = h.hour === peakHour;

                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-12 text-[10px] font-mono text-muted-foreground text-right">{h.label}</span>
                      <div className="flex-1 bg-muted/60 h-3 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${widthPct}%` }}
                          className={`h-full rounded-full transition-all ${
                            isPeak ? "bg-amber-500" : "bg-primary/50"
                          }`}
                        />
                      </div>
                      <span className="w-8 text-[10px] font-mono text-muted-foreground text-right">
                        {h.avgEngagements}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

