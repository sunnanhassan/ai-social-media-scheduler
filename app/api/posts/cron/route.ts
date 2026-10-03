import { NextResponse } from "next/server";
import { getInsforgeAdminClient } from "@/lib/insforge-server";
import { executeDirectPublish } from "@/lib/publish-handlers/direct-publisher";

/**
 * Scheduled Post Dispatcher & Cron Trigger
 * Can be invoked by:
 * 1. Vercel Cron / External HTTP Scheduler (e.g. every 5-10 minutes)
 * 2. Developer manual test to process due posts instantly
 */
export async function GET(request: Request) {
  return handleCronCheck();
}

export async function POST(request: Request) {
  return handleCronCheck();
}

async function handleCronCheck() {
  try {
    const insforge = getInsforgeAdminClient();
    const now = new Date().toISOString();

    // Query due posts
    const { data: duePosts, error } = await insforge.database
      .from("scheduled_posts")
      .select("id, content, scheduled_at, status, user_channel_id")
      .in("status", ["queue", "queued"])
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("[CRON /api/posts/cron] Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No due scheduled posts found at this time",
        processed: 0,
        timestamp: now,
      });
    }

    const results = [];
    for (const post of duePosts) {
      try {
        const result = await executeDirectPublish(post.id);
        results.push({
          postId: post.id,
          success: result.success,
          publishedUrl: result.publishedUrl,
          error: result.error,
        });
      } catch (err: any) {
        results.push({
          postId: post.id,
          success: false,
          error: err?.message || "Execution failed",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} due scheduled posts`,
      processed: results.length,
      results,
      timestamp: now,
    });
  } catch (err: any) {
    console.error("[CRON /api/posts/cron] Fatal error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
