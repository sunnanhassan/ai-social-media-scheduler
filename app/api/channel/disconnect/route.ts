import { getInsforgeServerClient } from "@/lib/insforge-server";
import { disconnectActiveChannel } from "@/lib/channels/channel-store";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const { userChannelId } = await request.json();

    if (!userChannelId) {
      return NextResponse.json({ error: "User channel ID is required" }, { status: 400 });
    }

    // Try disconnecting from DB if available
    try {
      const { data: userChannelData } = await insforge.database
        .from("user_channels")
        .select("id, user_id")
        .eq("id", userChannelId)
        .eq("user_id", userId)
        .maybeSingle();

      if (userChannelData) {
        await insforge.database
          .from("user_channels")
          .update({
            access_token: null,
            refresh_token: null,
            token_expires_at: null,
            is_connected: false,
            is_active: false,
          })
          .eq("id", userChannelId)
          .eq("user_id", userId);
      }
    } catch (dbErr) {
      console.warn("[Channel Disconnect] Database offline or timed out, updating active store");
    }

    // Always update active in-memory channel store
    disconnectActiveChannel(userChannelId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting channel:", error);
    return NextResponse.json({ error: "Failed to disconnect channel" }, { status: 500 });
  }
}
