import { NextRequest, NextResponse } from "next/server";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { insforgeCircuitBreaker } from "@/lib/insforge-circuit-breaker";
import {
  DEFAULT_MOCK_CHANNELS,
  applyChannelFilter,
} from "@/constants/mock-channels";

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get("filter");

  const fallbackPayload = {
    channels: applyChannelFilter(DEFAULT_MOCK_CHANNELS, filter),
    totalChannels: DEFAULT_MOCK_CHANNELS.length,
    connectedCount: DEFAULT_MOCK_CHANNELS.filter((c) => c.connected).length,
    isFallback: true,
  };

  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId || !insforgeCircuitBreaker.isAvailable()) {
      return NextResponse.json(fallbackPayload);
    }

    const queryTask = async () => {
      const [typesRes, userChannelsRes] = await Promise.all([
        insforge.database
          .from("channel_types")
          .select("*")
          .order("created_at", { ascending: true }),
        insforge.database.from("user_channels").select("*").eq("user_id", userId),
      ]);
      return { typesRes, userChannelsRes };
    };

    const { data: result, isFallback } = await insforgeCircuitBreaker.execute(
      queryTask,
      {
        typesRes: { data: null, error: { message: "Fallback" } },
        userChannelsRes: { data: null, error: null },
      } as any,
      600 // aggressive 600ms timeout for snappy sidebar rendering
    );

    const { typesRes, userChannelsRes } = result;
    if (isFallback || typesRes.error || userChannelsRes.error || !typesRes.data?.length) {
      return NextResponse.json(fallbackPayload);
    }

    const userChannelMap = new Map(
      (userChannelsRes.data || []).map((channel: any) => [channel.channel_type_id, channel])
    );

    let channels = (typesRes.data || []).map((channel_type: any) => {
      const userChannel = userChannelMap.get(channel_type.id) as any;
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
    const connectedCount = channels.filter((channel: any) => channel.connected).length;

    if (filter === "connected") {
      channels = channels.filter((channel: any) => channel.connected);
    } else if (filter === "unconnected") {
      channels = channels.filter((channel: any) => !channel.connected);
    }

    return NextResponse.json({
      channels,
      totalChannels,
      connectedCount,
    });
  } catch (error) {
    console.warn("Using fallback channels data due to server error or unconfigured env:", error);
    return NextResponse.json(fallbackPayload);
  }
}
