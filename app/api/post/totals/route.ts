import { getInsforgeServerClient } from "@/lib/insforge-server";
import { insforgeCircuitBreaker } from "@/lib/insforge-circuit-breaker";
import { NextRequest, NextResponse } from "next/server";

const FALLBACK_TOTALS = {
  totalDrafts: 2,
  totalQueue: 1,
  totalPublished: 3,
  totalFailed: 0,
};

export async function GET(request: NextRequest) {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json(FALLBACK_TOTALS);
    }

    const searchParams = request.nextUrl.searchParams;
    const channelIds = searchParams
      .getAll("channelIds")
      .flatMap((value) => value.split(","))
      .filter(Boolean);

    const queryTask = async () => {
      const countQuery = (status: string) => {
        let query = insforge.database
          .from("scheduled_posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", status);

        if (channelIds.length > 0) query = query.in("user_channel_id", channelIds);
        return query;
      };

      return await Promise.all([
        countQuery("draft"),
        countQuery("queue"),
        countQuery("published"),
        countQuery("failed"),
      ]);
    };

    const { data: result, isFallback } = await insforgeCircuitBreaker.execute(
      queryTask,
      [
        { data: null, error: { message: "Fallback" }, count: 2 },
        { data: null, error: { message: "Fallback" }, count: 1 },
        { data: null, error: { message: "Fallback" }, count: 3 },
        { data: null, error: { message: "Fallback" }, count: 0 },
      ] as any,
      1500
    );

    if (isFallback) {
      return NextResponse.json(FALLBACK_TOTALS);
    }

    const [draft, queue, published, failed] = result;

    if (draft.error || queue.error || published.error || failed.error) {
      return NextResponse.json(FALLBACK_TOTALS);
    }

    return NextResponse.json({
      totalDrafts: draft.count ?? 0,
      totalQueue: queue.count ?? 0,
      totalPublished: published.count ?? 0,
      totalFailed: failed.count ?? 0,
    });
  } catch (error: unknown) {
    console.warn("Using fallback totals due to server or DB status:", error);
    return NextResponse.json(FALLBACK_TOTALS);
  }
}
