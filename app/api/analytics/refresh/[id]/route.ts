import { getInsforgeServerClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";
import { calculateEngagementRate } from "@/lib/analytics/calculator";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { insforge, userId } = await getInsforgeServerClient();

    if (!id) {
      return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
    }

    // Refresh simulation: produce slightly updated organic engagement
    const impressions = Math.floor(2500 + Math.random() * 3000);
    const likes = Math.floor(impressions * 0.05 + Math.random() * 25);
    const comments = Math.floor(likes * 0.2 + Math.random() * 8);
    const shares = Math.floor(likes * 0.12 + Math.random() * 5);
    const rate = calculateEngagementRate(impressions, likes, comments, shares);
    const lastFetchedAt = new Date().toISOString();

    if (userId) {
      try {
        await insforge.database
          .from("scheduled_posts")
          .update({
            metrics_impressions: impressions,
            metrics_likes: likes,
            metrics_comments: comments,
            metrics_shares: shares,
            metrics_last_fetched_at: lastFetchedAt,
          })
          .eq("id", id);
      } catch (dbErr) {
        console.warn("[analytics:refresh] Database update notice:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      metrics: {
        postId: id,
        impressions,
        likes,
        comments,
        shares,
        engagementRate: rate,
        lastFetchedAt,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/analytics/refresh/[id]]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to refresh post metrics" },
      { status: 500 }
    );
  }
}

