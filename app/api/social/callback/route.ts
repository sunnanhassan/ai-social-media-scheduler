import { ChannelTypeEnum } from "@/constants/channels";
import { encrypt } from "@/lib/encryption";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { getOAuthProvider, getProviderConfig } from "@/lib/social-oauth";
import {
  exchangeForLongLivedToken,
  fetchMetaAccounts,
  extractPrimaryFacebookPage,
  extractPrimaryInstagramAccount,
} from "@/lib/social-oauth/meta";
import { handleMockOAuthCallback } from "@/lib/social-oauth/mock-callback";
import { getPkceCookieName } from "@/lib/social-oauth/pkce";
import { buildRedirectUrl } from "@/lib/social-oauth/redirect";
import { verifyOAuthState, type OAuthStatePayload } from "@/lib/social-oauth/state";
import { NextRequest } from "next/server";

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

  // Edge Case 4: Simulated local development mock OAuth callback
  const isMock = searchParams.get("mock") === "true";
  if (isMock && process.env.NODE_ENV !== "production" && process.env.ALLOW_MOCK_OAUTH === "true") {
    return handleMockOAuthCallback({
      state,
      appUrl,
      redirectTo,
      pkceCookieName,
    });
  }

  // Edge Case 5: Missing authorization code
  if (!code) {
    const response = buildRedirectUrl(appUrl, redirectTo, {
      connected: "false",
      error: "missing_code",
    });
    response.cookies.delete(pkceCookieName);
    return response;
  }

  try {
    // Edge Case 6: Verify authenticated user matches state payload to prevent session fixation
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId || userId !== state.userId) {
      const response = buildRedirectUrl(appUrl, redirectTo, {
        connected: "false",
        error: "user_mismatch",
      });
      response.cookies.delete(pkceCookieName);
      return response;
    }

    // Edge Case 7: Twitter PKCE code verifier validation
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

    // Step 8: Exchange authorization code for tokens
    const token = await provider.exchangeCodeForToken({
      code,
      redirectUri,
      codeVerifier,
    });

    let activeAccessToken = token.accessToken;
    let activeRefreshToken = token.refreshToken;
    let activeExpiresAt = token.expiresAt;
    let providerAccountId: string | null = null;
    let handle: string | null = null;
    let profileImage: string | null = null;
    let profileUrl: string | null = null;

    // Step 9: Resolve channel-specific identity (Meta Pages/IG Business vs Twitter/LinkedIn)
    if (state.channelType === ChannelTypeEnum.FACEBOOK || state.channelType === ChannelTypeEnum.INSTAGRAM) {
      const config = getProviderConfig(state.channelType);
      const longLived = await exchangeForLongLivedToken({
        userToken: token.accessToken,
        clientId: config.clientId,
        clientSecret: config.clientSecret,
      }).catch(() => ({ accessToken: token.accessToken, expiresIn: undefined }));

      const accounts = await fetchMetaAccounts(longLived.accessToken);

      if (state.channelType === ChannelTypeEnum.FACEBOOK) {
        const page = extractPrimaryFacebookPage(accounts);
        activeAccessToken = page.pageAccessToken;
        providerAccountId = page.pageId;
        handle = page.pageName;
        profileImage = page.pagePictureUrl;
        profileUrl = `https://facebook.com/${page.pageId}`;
      } else {
        const ig = extractPrimaryInstagramAccount(accounts);
        activeAccessToken = ig.pageAccessToken;
        providerAccountId = ig.instagramAccountId;
        handle = ig.username;
        profileImage = ig.profilePictureUrl;
        profileUrl = `https://instagram.com/${ig.username}`;
      }
    } else {
      const profile = await provider.getProfile({ accessToken: token.accessToken });
      providerAccountId = profile.providerAccountId ?? null;
      handle = profile.handle ?? null;
      profileImage = profile.profileImage ?? null;
      profileUrl = handle
        ? state.channelType === ChannelTypeEnum.TWITTER
          ? `https://x.com/${handle.replace(/^@/, "")}`
          : state.channelType === ChannelTypeEnum.LINKEDIN
          ? `https://linkedin.com/in/${handle}`
          : null
        : null;
    }

    // Step 10: Encrypt sensitive tokens via AES-256-GCM before DB insertion
    const encryptedAccessToken = encrypt(activeAccessToken);
    let encryptedRefreshToken = activeRefreshToken ? encrypt(activeRefreshToken) : null;

    // Edge Case 11: If provider omitted refresh token on re-auth, preserve existing refresh token
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

    // Step 12: Upsert into user_channels table
    const payload = {
      user_id: state.userId,
      channel_type_id: state.channelTypeId,
      provider_account_id: providerAccountId,
      handle,
      profile_image: profileImage,
      profile_url: profileUrl,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expires_at: activeExpiresAt ?? null,
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

    // Step 13: Clean up PKCE cookies and redirect with success
    const response = buildRedirectUrl(appUrl, redirectTo, {
      connected: "true",
      platform: state.channelType,
      handle: handle || "",
    });
    response.cookies.delete(pkceCookieName);
    return response;
  } catch (error: any) {
    console.error("Unexpected OAuth callback error:", error);
    const isMissingFb = error?.message === "no_facebook_pages_found";
    const isMissingIg = error?.message === "no_instagram_business_linked";
    const errorCode = isMissingFb
      ? "no_facebook_pages_found"
      : isMissingIg
      ? "no_instagram_business_linked"
      : "oauth_callback_failed";
    const description = isMissingFb
      ? "No Facebook Page found. Please create a Facebook Page first."
      : isMissingIg
      ? "No Instagram Business account linked to your Facebook Page."
      : error?.message || "Internal token exchange error";

    const response = buildRedirectUrl(appUrl, redirectTo, {
      connected: "false",
      error: errorCode,
      description,
    });
    response.cookies.delete(pkceCookieName);
    return response;
  }
}
