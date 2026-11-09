import { NextRequest, NextResponse } from "next/server";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { insforgeCircuitBreaker } from "@/lib/insforge-circuit-breaker";
import { getActiveChannels } from "@/lib/channels/channel-store";
import { applyChannelFilter } from "@/constants/mock-channels";
import { getChannelProfileUrl, formatChannelHandle } from "@/constants/channels";

export async function GET(request: NextRequest) {
  const filter = request.nextUrl.searchParams.get("filter");
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");

  const activeFallbackChannels = getActiveChannels(filter, workspaceId);
  const fallbackPayload = {
    channels: activeFallbackChannels,
    totalChannels: activeFallbackChannels.length,
    connectedCount: activeFallbackChannels.filter((c) => c.connected).length,
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
    const allUserChannels = (userChannelsRes.data || []).filter((uc: any) => uc.is_connected);
    let userChannels = allUserChannels;

    if (workspaceId) {
      try {
        const { data: wsMappings } = await insforge.database
          .from("workspace_channels")
          .select("user_channel_id")
          .eq("workspace_id", workspaceId);
        if (wsMappings && wsMappings.length > 0) {
          const allowedIds = new Set(wsMappings.map((m: any) => m.user_channel_id));
          userChannels = allUserChannels.filter((uc: any) => allowedIds.has(uc.id));
        }
      } catch {
        // Fallback gracefully to all channels if table not yet seeded
      }
    }

    const typeMap = new Map<string, any>(channelTypes.map((t: any) => [t.id, t]));
    const channels: any[] = [];

    // 1. Add all individual connected accounts
    for (const uc of userChannels) {
      const parentType = typeMap.get(uc.channel_type_id);
      if (parentType) {
        const cleanHandle = formatChannelHandle(parentType.type, uc.handle);
        const cleanProfileUrl = getChannelProfileUrl({
          type: parentType.type,
          handle: cleanHandle,
          profile_url: uc.profile_url,
          id: uc.id,
          user_channel_id: uc.id,
        });

        channels.push({
          id: uc.id,
          channel_type_id: parentType.id,
          type: parentType.type,
          name: parentType.name,
          color: parentType.color,
          character_limit: parentType.character_limit,
          user_channel_id: uc.id,
          handle: cleanHandle || null,
          profile_image: uc.profile_image ?? null,
          profile_url: cleanProfileUrl,
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
