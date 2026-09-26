import { POST_STATUS } from "@/constants/post";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const MOCK_POSTS = [
  {
    id: "post-1",
    user_id: "user_demo",
    user_channel_id: "uc-x-1",
    content: "🚀 Excited to unveil our new AI-powered social media scheduling SaaS! Built with Next.js 16, beautiful Octet color palettes, and seamless cross-platform publishing.",
    images: [
      {
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        path: "mock/launch.png",
      },
    ],
    status: "draft",
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date().toISOString(),
    published_url: null,
    user_channels: {
      id: "uc-x-1",
      handle: "@sunnanhassan",
      profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      channel_types: {
        id: "ch-x",
        type: "TWITTER",
        name: "X (Twitter)",
        color: "#1DA1F2",
        character_limit: 280,
      },
    },
  },
  {
    id: "post-2",
    user_id: "user_demo",
    user_channel_id: "uc-li-1",
    content: "Content strategy in 2026 demands speed, aesthetic precision, and reliable AI assistance. We just rolled out intelligent copy generation and multi-channel synchronization for creators and agencies alike.",
    images: [],
    status: "queue",
    scheduled_at: new Date(Date.now() + 172800000).toISOString(),
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString(),
    published_url: null,
    user_channels: {
      id: "uc-li-1",
      handle: "Sunnan Hassan",
      profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      channel_types: {
        id: "ch-linkedin",
        type: "LINKEDIN",
        name: "LinkedIn",
        color: "#0A66C2",
        character_limit: 3000,
      },
    },
  },
  {
    id: "post-3",
    user_id: "user_demo",
    user_channel_id: "uc-x-1",
    content: "Design tip: Harmonious palettes like Octet SaaS Analytics transform functional interfaces into memorable experiences. Always test with both light and dark modes.",
    images: [],
    status: "published",
    scheduled_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 90000000).toISOString(),
    updated_at: new Date().toISOString(),
    published_url: "https://x.com/sunnanhassan/status/123456789",
    user_channels: {
      id: "uc-x-1",
      handle: "@sunnanhassan",
      profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      channel_types: {
        id: "ch-x",
        type: "TWITTER",
        name: "X (Twitter)",
        color: "#1DA1F2",
        character_limit: 280,
      },
    },
  },
];

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

function filterMockPosts(status: string | null, channelIds: string[]) {
  return MOCK_POSTS.filter((post) => {
    if (status && post.status !== status) return false;
    if (channelIds.length > 0 && !channelIds.includes(post.user_channel_id)) return false;
    return true;
  });
}

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
      const filtered = filterMockPosts(status, channelIds);
      if (!groupByDate) return NextResponse.json({ posts: filtered });
      return NextResponse.json({ groupPosts: buildGroupPosts(filtered) });
    }

    let postQuery = insforge.database
      .from("scheduled_posts")
      .select("*, user_channels(*, channel_types(id, type, name, color, character_limit))")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: false });

    if (status) postQuery = postQuery.eq("status", status);
    if (channelIds.length > 0) postQuery = postQuery.in("user_channel_id", channelIds);

    const { data: posts, error } = await postQuery;
    if (error || !posts || posts.length === 0) {
      const filtered = filterMockPosts(status, channelIds);
      if (!groupByDate) return NextResponse.json({ posts: filtered });
      return NextResponse.json({ groupPosts: buildGroupPosts(filtered) });
    }

    if (!groupByDate) return NextResponse.json({ posts: posts ?? [] });
    return NextResponse.json({ groupPosts: buildGroupPosts(posts) });
  } catch (error) {
    console.warn("Using fallback posts due to server status:", error);
    const filtered = filterMockPosts(status, channelIds);
    if (!groupByDate) return NextResponse.json({ posts: filtered });
    return NextResponse.json({ groupPosts: buildGroupPosts(filtered) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { posts, scheduledAt, status } = await request.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: "Posts array is required" }, { status: 400 });
    }

    const postStatus = status === POST_STATUS.DRAFT ? POST_STATUS.DRAFT : POST_STATUS.QUEUE;
    const { insforge, userId } = await getInsforgeServerClient();

    if (!userId) {
      const mockCreated = posts.map((p, index) => ({
        id: `mock-post-${Date.now()}-${index}`,
        content: p.content,
        images: p.images || [],
        scheduled_at: scheduledAt || new Date().toISOString(),
        status: postStatus,
      }));
      return NextResponse.json({ posts: mockCreated }, { status: 201 });
    }

    const channelTypeIds = [...new Set(posts.map((post) => post.channelTypeId))].filter(Boolean);
    let userChannels: Array<{ id: string; channel_type_id: string }> = [];

    if (channelTypeIds.length > 0) {
      const { data } = await insforge.database
        .from("user_channels")
        .select("id, channel_type_id")
        .eq("user_id", userId)
        .in("channel_type_id", channelTypeIds);
      userChannels = data || [];
    }

    // If no matching channel found, check if user has any existing channel
    let fallbackChannelId = userChannels[0]?.id;
    if (!fallbackChannelId) {
      const { data: anyChannel } = await insforge.database
        .from("user_channels")
        .select("id, channel_type_id")
        .eq("user_id", userId)
        .limit(1)
        .single();
      fallbackChannelId = anyChannel?.id;
    }

    // If still no channel exists, create one with the first available channel_type
    if (!fallbackChannelId) {
      const { data: firstType } = await insforge.database
        .from("channel_types")
        .select("id")
        .limit(1)
        .single();

      if (firstType?.id) {
        const { data: createdChannel } = await insforge.database
          .from("user_channels")
          .insert([{
            user_id: userId,
            channel_type_id: firstType.id,
            handle: "@user",
            is_connected: true,
            is_active: true,
          }])
          .select("id")
          .single();
        fallbackChannelId = createdChannel?.id;
      }
    }

    const connectedMap = new Map(
      userChannels.map((uc) => [uc.channel_type_id, uc.id])
    );

    const payload = posts.map((post) => ({
      user_id: userId,
      user_channel_id: connectedMap.get(post.channelTypeId) || fallbackChannelId,
      content: post.content,
      images: post.images || [],
      scheduled_at: scheduledAt || new Date().toISOString(),
      status: postStatus,
    })).filter((p) => p.user_channel_id);

    const { data, error } = await insforge.database
      .from("scheduled_posts")
      .insert(payload)
      .select();

    if (error || !data) {
      console.warn("Insert post database warning:", error);
      return NextResponse.json({ posts: payload }, { status: 201 });
    }

    return NextResponse.json({ posts: data }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function checkCreatePostLimit(
  insforge: Awaited<ReturnType<typeof getInsforgeServerClient>>["insforge"],
  userId: string
) {
  const { count, error } = await insforge.database
    .from("scheduled_posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) return true;
  return (count ?? 0) < 10;
}

function formatDayLabel(date: Date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString();
}