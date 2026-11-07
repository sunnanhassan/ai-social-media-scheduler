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
        insforge.database
          .from("user_channels")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true),
      ]);
      return { typesRes, userChannelsRes };
    };

    const { data: result, isFallback } = await insforgeCircuitBreaker.execute(
      queryTask,
      {
        typesRes: { data: null, error: { message: "Fallback" } },
        userChannelsRes: { data: null, error: null },
      } as any,
      600
    );

    const { typesRes, userChannelsRes } = result;
    if (isFallback || typesRes.error || userChannelsRes.error || !typesRes.data?.length) {
      return NextResponse.json(fallbackPayload);
    }

    const channelTypes = typesRes.data || [];
    const userChannels = (userChannelsRes.data || []).filter((uc: any) => uc.is_connected);

    const typeMap = new Map<string, any>(channelTypes.map((t: any) => [t.id, t]));
    const channels: any[] = [];

    // 1. Add all individual connected accounts
    for (const uc of userChannels) {
      const parentType = typeMap.get(uc.channel_type_id);
      if (parentType) {
        channels.push({
          id: uc.id,
          channel_type_id: parentType.id,
          type: parentType.type,
          name: parentType.name,
          color: parentType.color,
          character_limit: parentType.character_limit,
          user_channel_id: uc.id,
          handle: uc.handle ?? null,
          profile_image: uc.profile_image ?? null,
          profile_url: uc.profile_url ?? null,
          connected: true,
        });
      }
    }

    // 2. Identify platforms with 0 connected accounts and add unconnected placeholders
    const connectedTypeIds = new Set(userChannels.map((uc: any) => uc.channel_type_id));
    for (const ct of channelTypes) {
      if (!connectedTypeIds.has(ct.id)) {
        channels.push({
          id: ct.id,
          channel_type_id: ct.id,
          type: ct.type,
          name: ct.name,
          color: ct.color,
          character_limit: ct.character_limit,
          user_channel_id: null,
          handle: null,
          profile_image: null,
          profile_url: null,
          connected: false,
        });
      }
    }

    const totalChannels = channels.length;
    const connectedCount = channels.filter((c) => c.connected).length;

    const filteredChannels = applyChannelFilter(channels, filter);

    return NextResponse.json({
      channels: filteredChannels,
      totalChannels,
      connectedCount,
    });
  } catch (error) {
    console.warn("Using fallback channels data due to server error or unconfigured env:", error);
    return NextResponse.json(fallbackPayload);
  }
}
