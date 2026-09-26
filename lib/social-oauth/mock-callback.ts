import { ChannelTypeEnum } from "@/constants/channels";
import { encrypt } from "@/lib/encryption";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { OAuthStatePayload } from "./state";
import { buildRedirectUrl } from "./redirect";
import { NextResponse } from "next/server";

export async function handleMockOAuthCallback({
  state,
  appUrl,
  redirectTo,
  pkceCookieName,
}: {
  state: OAuthStatePayload;
  appUrl: string;
  redirectTo: string;
  pkceCookieName: string;
}): Promise<NextResponse> {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    const effectiveUserId = userId || state.userId;

    let mockHandle = "demo_user";
    let mockUrl = "https://example.com";

    if (state.channelType === ChannelTypeEnum.TWITTER) {
      mockHandle = "demo_twitter_user";
      mockUrl = "https://x.com/demo_twitter_user";
    } else if (state.channelType === ChannelTypeEnum.LINKEDIN) {
      mockHandle = "Demo LinkedIn User";
      mockUrl = "https://linkedin.com/in/demo-user";
    } else if (state.channelType === ChannelTypeEnum.FACEBOOK) {
      mockHandle = "Demo Brand Page";
      mockUrl = "https://facebook.com/demo-brand-page";
    } else if (state.channelType === ChannelTypeEnum.INSTAGRAM) {
      mockHandle = "demo_instagram_biz";
      mockUrl = "https://instagram.com/demo_instagram_biz";
    }

    const mockImage =
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop";

    const payload = {
      user_id: effectiveUserId,
      channel_type_id: state.channelTypeId,
      provider_account_id: `mock-${state.channelType.toLowerCase()}-${Date.now()}`,
      handle: mockHandle,
      profile_image: mockImage,
      profile_url: mockUrl,
      access_token: encrypt(`mock_token_${Date.now()}`),
      refresh_token: null,
      token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_connected: true,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    await insforge.database
      .from("user_channels")
      .upsert(payload, { onConflict: "user_id,channel_type_id" });

    const response = buildRedirectUrl(appUrl, redirectTo, {
      connected: "true",
      platform: state.channelType,
      handle: mockHandle,
    });
    response.cookies.delete(pkceCookieName);
    return response;
  } catch (mockErr: any) {
    console.error("Mock OAuth callback error:", mockErr);
    const response = buildRedirectUrl(appUrl, redirectTo, {
      connected: "false",
      error: "mock_connect_failed",
    });
    response.cookies.delete(pkceCookieName);
    return response;
  }
}
