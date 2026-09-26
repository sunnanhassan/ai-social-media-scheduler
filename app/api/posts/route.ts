import { POST_STATUS } from "@/constants/post";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const channelIds = searchParams
    .getAll("channelIds")
    .flatMap((ch) => ch.split(","))
    .filter(Boolean);
  const groupByDate = searchParams.get("group_by_date") === "true";

  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let postQuery = insforge.database
      .from("scheduled_posts")
      .select("*, user_channels(*, channel_types(id, type, name, color, character_limit))")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: false });

    if (status && status !== "all") postQuery = postQuery.eq("status", status);
    if (channelIds.length > 0) postQuery = postQuery.in("user_channel_id", channelIds);

    const { data: posts, error } = await postQuery;
    if (error) {
      console.error("[GET /api/posts]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const postList = posts ?? [];

    if (!groupByDate) {
      return NextResponse.json({ posts: postList });
    }

    return NextResponse.json({ groupPosts: buildGroupPosts(postList) });
  } catch (error: any) {
    console.error("[GET /api/posts]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, channelIds, images, media, scheduledAt, status, posts } = body;
    const postStatus = status || POST_STATUS.QUEUE;
    const targetScheduledAt = scheduledAt || new Date().toISOString();

    // Past date check for queued items
    if (postStatus === POST_STATUS.QUEUE) {
      const scheduledTime = new Date(targetScheduledAt).getTime();
      if (isNaN(scheduledTime)) {
        return NextResponse.json({ error: "Invalid scheduled date" }, { status: 400 });
      }
      if (scheduledTime < Date.now() - 30000) {
        return NextResponse.json({ error: "Scheduled time must be in the future" }, { status: 400 });
      }
    }

    // Normalized items to insert
    let normalizedItems: { user_channel_id?: string; channelTypeId?: string; content: string; images: any[] }[] = [];

    // Support Format 1: { posts: [{ channelTypeId, content, images }] }
    if (Array.isArray(posts) && posts.length > 0) {
      normalizedItems = posts.map((p) => ({
        channelTypeId: p.channelTypeId,
        user_channel_id: p.userChannelId,
        content: p.content?.trim(),
        images: p.images || [],
      }));
    }
    // Support Format 2: { content, channelIds, images/media }
    else if (content && typeof content === "string") {
      const postImages = images || media || [];
      const channels = Array.isArray(channelIds) && channelIds.length > 0 ? channelIds : [];

      if (channels.length === 0) {
        // Fetch user's first connected channel if none specified
        const { data: defaultChannel } = await insforge.database
          .from("user_channels")
          .select("id")
          .eq("user_id", userId)
          .eq("is_connected", true)
          .limit(1)
          .single();

        if (defaultChannel?.id) {
          channels.push(defaultChannel.id);
        }
      }

      normalizedItems = channels.map((chId) => ({
        user_channel_id: chId,
        content: content.trim(),
        images: postImages,
      }));
    }

    if (normalizedItems.length === 0 || normalizedItems.some((item) => !item.content)) {
      return NextResponse.json({ error: "Post content and channel are required" }, { status: 400 });
    }

    // Resolve user channels
    const { data: userChannels, error: ucError } = await insforge.database
      .from("user_channels")
      .select("id, channel_type_id")
      .eq("user_id", userId);

    if (ucError) {
      return NextResponse.json({ error: "Failed to verify channels" }, { status: 500 });
    }

    const userChannelMap = new Map((userChannels || []).map((uc) => [uc.id, uc.id]));
    const channelTypeToUserChannelMap = new Map((userChannels || []).map((uc) => [uc.channel_type_id, uc.id]));
    const fallbackChannelId = userChannels?.[0]?.id;

    const payload = normalizedItems.map((item) => {
      let resolvedChannelId = item.user_channel_id && userChannelMap.has(item.user_channel_id)
        ? item.user_channel_id
        : item.channelTypeId && channelTypeToUserChannelMap.has(item.channelTypeId)
        ? channelTypeToUserChannelMap.get(item.channelTypeId)
        : fallbackChannelId;

      return {
        user_id: userId,
        user_channel_id: resolvedChannelId,
        content: item.content,
        images: Array.isArray(item.images) ? item.images : [],
        scheduled_at: targetScheduledAt,
        status: postStatus,
      };
    }).filter((p) => p.user_channel_id);

    if (payload.length === 0) {
      return NextResponse.json({ error: "No connected channel found to schedule post" }, { status: 400 });
    }

    const { data: insertedPosts, error: insertError } = await insforge.database
      .from("scheduled_posts")
      .insert(payload)
      .select("*, user_channels(*, channel_types(id, type, name, color, character_limit))");

    if (insertError) {
      console.error("[POST /api/posts]", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const isQueue = postStatus === POST_STATUS.QUEUE;
    return NextResponse.json(
      {
        success: true,
        message: isQueue ? "Post queued successfully for scheduling" : "Post saved to drafts",
        posts: insertedPosts || payload,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[POST /api/posts]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, content, images, scheduledAt, status, userChannelId } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }

    // Verify ownership
    const { data: existingPost, error: checkError } = await insforge.database
      .from("scheduled_posts")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (checkError || !existingPost) {
      return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 403 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (content !== undefined) updates.content = content.trim();
    if (images !== undefined) updates.images = Array.isArray(images) ? images : [];
    if (scheduledAt !== undefined) updates.scheduled_at = scheduledAt;
    if (status !== undefined) updates.status = status;
    if (userChannelId !== undefined) updates.user_channel_id = userChannelId;

    const { data, error } = await insforge.database
      .from("scheduled_posts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select("*, user_channels(*, channel_types(id, type, name, color, character_limit))")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, post: data });
  } catch (error: any) {
    console.error("[PATCH /api/posts]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const id = body.id || request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }

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
    console.error("[DELETE /api/posts]", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

function buildGroupPosts(posts: any[]) {
  const groupMap = new Map<string, { label: string; posts: any[] }>();

  posts.forEach((post) => {
    const date = new Date(post.scheduled_at);
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    if (!groupMap.has(key)) {
      groupMap.set(key, { label: formatDayLabel(date), posts: [] });
    }
    groupMap.get(key)!.posts.push(post);
  });

  return Array.from(groupMap.entries()).map(([key, value]) => ({
    key,
    ...value,
  }));
}

function formatDayLabel(date: Date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString();
}
