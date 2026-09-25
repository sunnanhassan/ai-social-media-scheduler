import { getInsforgeServerClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_MOCK_CHANNELS = [
  {
    id: "ch-x",
    type: "TWITTER",
    name: "X (Twitter)",
    color: "#1DA1F2",
    character_limit: 280,
    user_channel_id: "uc-x-1",
    handle: "@sunnanhassan",
    profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    profile_url: "https://x.com/sunnanhassan",
    connected: true,
  },
  {
    id: "ch-linkedin",
    type: "LINKEDIN",
    name: "LinkedIn",
    color: "#0A66C2",
    character_limit: 3000,
    user_channel_id: "uc-li-1",
    handle: "Sunnan Hassan",
    profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    profile_url: "https://linkedin.com/in/sunnanhassan",
    connected: true,
  },
  {
    id: "ch-instagram",
    type: "INSTAGRAM",
    name: "Instagram",
    color: "#E1306C",
    character_limit: 2200,
    user_channel_id: null,
    handle: null,
    profile_image: null,
    profile_url: null,
    connected: false,
  },
  {
    id: "ch-facebook",
    type: "FACEBOOK",
    name: "Facebook",
    color: "#1877F2",
    character_limit: 63206,
    user_channel_id: null,
    handle: null,
    profile_image: null,
    profile_url: null,
    connected: false,
  },
  {
    id: "ch-threads",
    type: "THREADS",
    name: "Threads",
    color: "#000000",
    character_limit: 500,
    user_channel_id: null,
    handle: null,
    profile_image: null,
    profile_url: null,
    connected: false,
  },
  {
    id: "ch-youtube",
    type: "YOUTUBE",
    name: "YouTube",
    color: "#FF0000",
    character_limit: 5000,
    user_channel_id: null,
    handle: null,
    profile_image: null,
    profile_url: null,
    connected: false,
  },
  {
    id: "ch-bluesky",
    type: "BLUESKY",
    name: "Bluesky",
    color: "#0285FF",
    character_limit: 300,
    user_channel_id: null,
    handle: null,
    profile_image: null,
    profile_url: null,
    connected: false,
  },
  {
    id: "ch-tiktok",
    type: "TIKTOK",
    name: "TikTok",
    color: "#000000",
    character_limit: 2200,
    user_channel_id: null,
    handle: null,
    profile_image: null,
    profile_url: null,
    connected: false,
  },
];

function applyFilter(channels: typeof DEFAULT_MOCK_CHANNELS, filter: string | null) {
  if (filter === "connected") return channels.filter((c) => c.connected);
  if (filter === "unconnected") return channels.filter((c) => !c.connected);
  return channels;
}

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get("filter");

  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json({
        channels: applyFilter(DEFAULT_MOCK_CHANNELS, filter),
        totalChannels: DEFAULT_MOCK_CHANNELS.length,
        connectedCount: DEFAULT_MOCK_CHANNELS.filter((c) => c.connected).length,
      });
    }

    const [typesRes, userChannelsRes] = await Promise.all([
      insforge.database
        .from("channel_types")
        .select("*")
        .order("created_at", { ascending: true }),
      insforge.database.from("user_channels").select("*").eq("user_id", userId),
    ]);

    if (typesRes.error || userChannelsRes.error || !typesRes.data?.length) {
      return NextResponse.json({
        channels: applyFilter(DEFAULT_MOCK_CHANNELS, filter),
        totalChannels: DEFAULT_MOCK_CHANNELS.length,
        connectedCount: DEFAULT_MOCK_CHANNELS.filter((c) => c.connected).length,
      });
    }

    const userChannelMap = new Map(
      (userChannelsRes.data || []).map((channel) => [channel.channel_type_id, channel])
    );

    let channels = (typesRes.data || []).map((channel_type) => {
      const userChannel = userChannelMap.get(channel_type.id);
      return {
        id: channel_type.id,
        type: channel_type.type,
        name: channel_type.name,
        color: channel_type.color,
        character_limit: channel_type.character_limit,
        user_channel_id: userChannel?.id ?? null,
        handle: userChannel?.handle ?? null,
        profile_image: userChannel?.profile_image ?? null,
        profile_url: userChannel?.profile_url ?? null,
        connected: userChannel?.is_connected ?? false,
      };
    });

    const totalChannels = typesRes.data?.length || 0;
    const connectedCount = channels.filter((channel) => channel.connected).length;

    if (filter === "connected") {
      channels = channels.filter((channel) => channel.connected);
    } else if (filter === "unconnected") {
      channels = channels.filter((channel) => !channel.connected);
    }

    return NextResponse.json({
      channels,
      totalChannels,
      connectedCount,
    });
  } catch (error) {
    console.warn("Using fallback channels data due to server error or unconfigured env:", error);
    return NextResponse.json({
      channels: applyFilter(DEFAULT_MOCK_CHANNELS, filter),
      totalChannels: DEFAULT_MOCK_CHANNELS.length,
      connectedCount: DEFAULT_MOCK_CHANNELS.filter((c) => c.connected).length,
    });
  }
}
