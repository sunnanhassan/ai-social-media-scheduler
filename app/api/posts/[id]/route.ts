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
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
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

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (content !== undefined) updateData.content = content.trim();
    if (Array.isArray(images)) updateData.images = images;
    if (scheduledAt !== undefined) updateData.scheduled_at = scheduledAt;
    if (status !== undefined) updateData.status = status;
    if (userChannelId !== undefined) updateData.user_channel_id = userChannelId;

    const { data, error } = await insforge.database
      .from("scheduled_posts")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*, user_channels(*, channel_types(id, type, name, color, character_limit))")
      .single();

    if (error) {
      console.error("[PATCH /api/posts/[id]]", error);
      return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data });
  } catch (error: any) {
    console.error("[PATCH /api/posts/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const { error } = await insforge.database
      .from("scheduled_posts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Post deleted successfully" });
  } catch (error: any) {
    console.error("[DELETE /api/posts/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
