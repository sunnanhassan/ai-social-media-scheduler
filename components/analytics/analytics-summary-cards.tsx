"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AnalyticsSummary } from "@/lib/analytics/types";
import { Eye, Heart, MessageSquare, TrendingUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AnalyticsSummaryCardsProps {
  summary: AnalyticsSummary;
}

export function AnalyticsSummaryCards({ summary }: AnalyticsSummaryCardsProps) {
  const cards = [
    {
      title: "Total Reach",
      value: summary.totalImpressions.toLocaleString(),
      subtitle: "Organic Views & Impressions",
      icon: Eye,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 border-blue-500/20",
      badge: "+18.4% vs last period",
      badgeColor: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
    },
    {
      title: "Total Engagements",
      value: summary.totalEngagements.toLocaleString(),
      subtitle: `${summary.totalLikes.toLocaleString()} likes • ${summary.totalComments.toLocaleString()} comments`,
      icon: Heart,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10 border-rose-500/20",
      badge: `${summary.totalShares.toLocaleString()} shares`,
      badgeColor: "text-rose-500 border-rose-500/20 bg-rose-500/10",
    },
    {
      title: "Avg Engagement Rate",
      value: `${summary.averageEngagementRate}%`,
      subtitle: "Industry benchmark is ~2.5%",
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
      badge: summary.averageEngagementRate >= 3.0 ? "High Performance" : "Normal",
      badgeColor: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10",
    },
    {
      title: "Top Channel",
      value: summary.topChannel,
      subtitle: `${summary.postsAnalyzed} total posts analyzed`,
      icon: Sparkles,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10 border-purple-500/20",
      badge: "Highest Reach",
      badgeColor: "text-purple-500 border-purple-500/20 bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <Card key={i} className="border border-border/80 bg-card/80 backdrop-blur-xs shadow-2xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{c.title}</span>
              <div className={`p-1.5 rounded-lg border ${c.bgColor}`}>
                <c.icon className={`size-4 ${c.color}`} />
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold tracking-tight text-foreground font-mono">{c.value}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{c.subtitle}</p>
            </div>

            <div className="pt-2 border-t border-border/40 flex items-center justify-between">
              <Badge variant="outline" className={`text-[10px] font-mono px-2 py-0.5 ${c.badgeColor}`}>
                {c.badge}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
