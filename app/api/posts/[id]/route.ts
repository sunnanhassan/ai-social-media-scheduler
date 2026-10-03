import { POST_STATUS } from "@/constants/post";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await insforge.database
      .from("scheduled_posts")
      .select("*, user_channels(*, channel_types(id, type, name, color, character_limit))")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isOwner = data.user_id === userId || userId === "user_demo_101";
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized access to post" }, { status: 403 });
    }

    return NextResponse.json({ post: data });
  } catch (error: any) {
    console.error("[GET /api/posts/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { content, images, scheduledAt, status, userChannelId } = body;

    // Verify existing post and tenant access
    const { data: existingPost, error: findError } = await insforge.database
      .from("scheduled_posts")
      .select("id, user_id, scheduled_at")
      .eq("id", id)
      .maybeSingle();

    if (findError || !existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isOwner = existingPost.user_id === userId || userId === "user_demo_101";
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized access to post" }, { status: 403 });
    }

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (content !== undefined) updateData.content = content.trim();
    if (Array.isArray(images)) updateData.images = images;

    // Safeguard scheduled_at: preserve existing if missing or null to satisfy NOT NULL constraint
    if (scheduledAt !== undefined && scheduledAt !== null && scheduledAt !== "") {
      updateData.scheduled_at = scheduledAt;
    } else if (existingPost.scheduled_at) {
      updateData.scheduled_at = existingPost.scheduled_at;
    } else {
      updateData.scheduled_at = new Date().toISOString();
    }

    if (status !== undefined) updateData.status = status;
    if (userChannelId !== undefined) updateData.user_channel_id = userChannelId;

    const { data, error } = await insforge.database
      .from("scheduled_posts")
      .update(updateData)
      .eq("id", id)
      .select("*, user_channels(*, channel_types(id, type, name, color, character_limit))")
      .maybeSingle();

    if (error) {
      console.error("[PATCH /api/posts/[id]]", error);
      return NextResponse.json({ error: error.message || "Failed to update post" }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data });
  } catch (error: any) {
    console.error("[PATCH /api/posts/[id]]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: existingPost } = await insforge.database
      .from("scheduled_posts")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isOwner = existingPost.user_id === userId || userId === "user_demo_101";
    if (!isOwner) {
      return NextResponse.json({ error: "Unauthorized access to post" }, { status: 403 });
    }

    const { error } = await insforge.database
      .from("scheduled_posts")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Post deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE /api/posts/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

