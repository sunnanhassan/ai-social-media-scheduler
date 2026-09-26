import { ChannelTypeEnum } from "@/constants/channels";
import { encrypt } from "@/lib/encryption";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { getOAuthProvider } from "@/lib/social-oauth";
import { getPkceCookieName } from "@/lib/social-oauth/pkce";
import { verifyOAuthState, type OAuthStatePayload } from "@/lib/social-oauth/state";
import { NextRequest, NextResponse } from "next/server";

function buildRedirectUrl(appUrl: string, redirectTo: string, params: Record<string, string>) {
  try {
    const url = new URL(redirectTo, appUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return NextResponse.redirect(url);
  } catch {
    const fallback = new URL("/settings", appUrl);
    Object.entries(params).forEach(([key, value]) => {
      fallback.searchParams.set(key, value);
    });
    return NextResponse.redirect(fallback);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const providerError = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin ||
    "http://localhost:3000";

  // Edge Case 1: Missing OAuth state
  if (!stateParam) {
    return buildRedirectUrl(appUrl, "/settings", {
      connected: "false",
      error: "missing_state",
    });
  }

  const pkceCookieName = getPkceCookieName(stateParam);

  // Edge Case 2: Cryptographic State Verification & Expiration
  let state: OAuthStatePayload;
  try {
    state = verifyOAuthState(stateParam);
  } catch (err: any) {
    const errorCode = err?.message === "OAuth state expired" ? "state_expired" : "invalid_state";
    const response = buildRedirectUrl(appUrl, "/settings", {
      connected: "false",
      error: errorCode,
    });
    response.cookies.delete(pkceCookieName);
    return response;
  }

  const redirectTo = state.redirectTo || `${appUrl}/settings`;

  // Edge Case 3: Provider-level error / User cancelled consent
  if (providerError) {
    const isCancelled = providerError === "access_denied" || providerError === "consent_required";
    const response = buildRedirectUrl(appUrl, redirectTo, {
      connected: "false",
      error: isCancelled ? "cancelled" : providerError,
      description: errorDescription || "Provider authorization was declined",
    });
    response.cookies.delete(pkceCookieName);
    return response;
  }

  const isMock = searchParams.get("mock") === "true";
  if (isMock && process.env.NODE_ENV !== "production" && process.env.ALLOW_MOCK_OAUTH === "true") {
    try {
      const { insforge, userId } = await getInsforgeServerClient();
      const effectiveUserId = userId || state.userId;
      const mockHandle = state.channelType === ChannelTypeEnum.TWITTER ? "demo_twitter_user" : "demo_linkedin_user";
      const mockImage = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop";

      const payload = {
        user_id: effectiveUserId,
        channel_type_id: state.channelTypeId,
        provider_account_id: `mock-${state.channelType.toLowerCase()}-${Date.now()}`,
        handle: mockHandle,
        profile_image: mockImage,
        profile_url: state.channelType === ChannelTypeEnum.TWITTER ? `https://x.com/${mockHandle}` : `https://linkedin.com/in/${mockHandle}`,
        access_token: encrypt(`mock_token_${Date.now()}`),
        refresh_token: null,
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        is_connected: true,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      await insforge.database.from("user_channels").upsert(payload, { onConflict: "user_id,channel_type_id" });

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

  // Edge Case 4: Missing authorization code
  if (!code) {
    const response = buildRedirectUrl(appUrl, redirectTo, {
      connected: "false",
      error: "missing_code",
    });
    response.cookies.delete(pkceCookieName);
    return response;
  }


  try {
    // Edge Case 5: Verify authenticated user matches state payload to prevent session fixation
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId || userId !== state.userId) {
      const response = buildRedirectUrl(appUrl, redirectTo, {
        connected: "false",
        error: "user_mismatch",
      });
      response.cookies.delete(pkceCookieName);
      return response;
    }

    // Edge Case 6: Twitter PKCE code verifier validation
    const codeVerifier =
      state.channelType === ChannelTypeEnum.TWITTER
        ? request.cookies.get(pkceCookieName)?.value
        : undefined;

    if (state.channelType === ChannelTypeEnum.TWITTER && !codeVerifier) {
      const response = buildRedirectUrl(appUrl, redirectTo, {
        connected: "false",
        error: "missing_pkce_verifier",
      });
      response.cookies.delete(pkceCookieName);
      return response;
    }

    const provider = getOAuthProvider(state.channelType);
    const redirectUri = `${appUrl}/api/social/callback`;

    // Step 7: Exchange authorization code for Access & Refresh Tokens
    const token = await provider.exchangeCodeForToken({
      code,
      redirectUri,
      codeVerifier,
    });

    // Step 8: Fetch user profile from social network
    const profile = await provider.getProfile({
      accessToken: token.accessToken,
    });

    // Step 9: Encrypt sensitive tokens via AES-256-GCM before DB insertion
    const encryptedAccessToken = encrypt(token.accessToken);
    let encryptedRefreshToken = token.refreshToken ? encrypt(token.refreshToken) : null;

    // Edge Case 10: If provider omitted refresh token on re-auth, preserve existing refresh token
    if (!encryptedRefreshToken) {
      const { data: existingChannel } = await insforge.database
        .from("user_channels")
        .select("refresh_token")
        .eq("user_id", state.userId)
        .eq("channel_type_id", state.channelTypeId)
        .maybeSingle();

      if (existingChannel?.refresh_token) {
        encryptedRefreshToken = existingChannel.refresh_token;
      }
    }

    const profileUrl = profile.handle
      ? state.channelType === ChannelTypeEnum.TWITTER
        ? `https://x.com/${profile.handle.replace(/^@/, "")}`
        : state.channelType === ChannelTypeEnum.LINKEDIN
        ? `https://linkedin.com/in/${profile.handle}`
        : null
      : null;

    // Step 11: Upsert into database table
    const payload = {
      user_id: state.userId,
      channel_type_id: state.channelTypeId,
      provider_account_id: profile.providerAccountId ?? null,
      handle: profile.handle ?? null,
      profile_image: profile.profileImage ?? null,
      profile_url: profileUrl,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expires_at: token.expiresAt ?? null,
      is_connected: true,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await insforge.database
      .from("user_channels")
      .upsert(payload, {
        onConflict: "user_id,channel_type_id",
      });

    if (upsertError) {
      console.error("Database upsert error in OAuth callback:", upsertError);
      const response = buildRedirectUrl(appUrl, redirectTo, {
        connected: "false",
        error: "failed_to_save_channel",
      });
      response.cookies.delete(pkceCookieName);
      return response;
    }

    // Step 12: Clean up PKCE cookies and redirect with success
    const response = buildRedirectUrl(appUrl, redirectTo, {
      connected: "true",
      platform: state.channelType,
      handle: profile.handle || "",
    });
    response.cookies.delete(pkceCookieName);
    return response;
  } catch (error: any) {
    console.error("Unexpected OAuth callback error:", error);
    const response = buildRedirectUrl(appUrl, redirectTo, {
      connected: "false",
      error: "oauth_callback_failed",
      description: error?.message || "Internal token exchange error",
    });
    response.cookies.delete(pkceCookieName);
    return response;
  }
}
