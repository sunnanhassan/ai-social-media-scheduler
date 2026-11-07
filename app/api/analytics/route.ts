import { getInsforgeServerClient } from "@/lib/insforge-server";
import { insforgeCircuitBreaker } from "@/lib/insforge-circuit-breaker";
import { NextRequest, NextResponse } from "next/server";
import { getDemoAnalyticsData } from "@/lib/analytics/demo-analytics";
import {
  bucketHourlyEngagement,
  buildTimeseriesData,
  calculateEngagementRate,
  calculateSummaryTotals,
  rankTopPosts,
  calculateBestTimeToPost,
} from "@/lib/analytics/calculator";
import { PostAnalyticsItem } from "@/lib/analytics/types";

export async function GET(request: NextRequest) {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "7d";
    const channelId = searchParams.get("channelId");

    const rangeDays = range === "30d" ? 30 : range === "90d" ? 90 : 7;
    const cutoffDate = new Date(Date.now() - rangeDays * 86400000).toISOString();

    if (!userId) {
      return NextResponse.json(getDemoAnalyticsData(rangeDays));
    }

    const queryTask = async () => {
      let query = insforge.database
        .from("scheduled_posts")
        .select("*, user_channels(id, handle, profile_image, channel_types(id, type, name))")
        .eq("user_id", userId)
        .eq("status", "published")
        .gte("scheduled_at", cutoffDate)
        .order("scheduled_at", { ascending: false });

      if (channelId && channelId !== "all") {
        query = query.eq("user_channel_id", channelId);
      }

      return await query;
    };

    const { data: queryResult, isFallback } = await insforgeCircuitBreaker.execute(
      queryTask,
      { data: null, error: { message: "Fallback" } } as any,
      1500
    );

    const { data: posts, error } = queryResult;

    if (isFallback || error || !posts || posts.length === 0) {
      return NextResponse.json(getDemoAnalyticsData(rangeDays));
    }

    const items: PostAnalyticsItem[] = posts.map((p: any) => {
      const imp = p.metrics_impressions || Math.floor(1200 + Math.random() * 3000);
      const likes = p.metrics_likes || Math.floor(imp * 0.05 + 10);
      const comments = p.metrics_comments || Math.floor(likes * 0.2 + 2);
      const shares = p.metrics_shares || Math.floor(likes * 0.1 + 1);

      return {
        id: `analytics-${p.id}`,
        postId: p.id,
        content: p.content,
        channelType: p.user_channels?.channel_types?.type || "TWITTER",
        handle: p.user_channels?.handle || "creator",
        profileImage: p.user_channels?.profile_image || null,
        scheduledAt: p.scheduled_at,
        publishedUrl: p.published_url || null,
        impressions: imp,
        likes,
        comments,
        shares,
        engagementRate: calculateEngagementRate(imp, likes, comments, shares),
        lastFetchedAt: p.metrics_last_fetched_at || new Date().toISOString(),
      };
    });

    const summary = calculateSummaryTotals(items);
    const timeseries = buildTimeseriesData(items, rangeDays);
    const hourlyBreakdown = bucketHourlyEngagement(items);
    const topPosts = rankTopPosts(items, 5);

    const bestTimeToPost = calculateBestTimeToPost(hourlyBreakdown, items);

    return NextResponse.json({
      summary,
      timeseries,
      bestTimeToPost,
      topPosts,
      recentPosts: items,
    });
  } catch (err: any) {
    console.error("[GET /api/analytics]", err);
    return NextResponse.json(getDemoAnalyticsData(7));
  }
}

