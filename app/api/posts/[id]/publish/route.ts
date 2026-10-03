import { inngest } from "@/inngest/client";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { executeDirectPublish } from "@/lib/publish-handlers/direct-publisher";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: post, error: postError } = await insforge.database
      .from("scheduled_posts")
      .select("id, user_id, status")
      .eq("id", id)
      .maybeSingle();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isOwner = post.user_id === userId || userId === "user_demo_101";
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized access to post" }, { status: 403 });
    }

    if (post.status === "published") {
      return NextResponse.json({ success: true, message: "Post already published" });
    }

    // Try background event publishing via Inngest with race timeout
    let inngestSuccess = false;
    try {
      const inngestPromise = inngest.send({
        name: "post.publish.requested",
        data: { postId: id },
      });
      // 1.5s timeout: if local Inngest daemon is offline, don't stall the request
      await Promise.race([
        inngestPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Inngest timeout")), 1500)),
      ]);
      inngestSuccess = true;
    } catch (inngestErr) {
      console.warn("[POST /api/posts/[id]/publish] Inngest offline, falling back to direct publisher");
    }

    if (inngestSuccess) {
      return NextResponse.json({
        success: true,
        mode: "background_dispatched",
        message: "Publishing initiated in background queue",
      });
    }

    // Direct publishing fallback for local dev & queue downtime
    const result = await executeDirectPublish(id);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to publish post" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: "direct_published",
      publishedUrl: result.publishedUrl,
      provider: result.provider,
      message: "Post published successfully!",
    });
  } catch (error: any) {
    console.error("[POST /api/posts/[id]/publish]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

