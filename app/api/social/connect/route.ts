import { ChannelTypeEnum } from "@/constants/channels";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { getOAuthProvider, isProviderConfigured } from "@/lib/social-oauth";
import { createPkcePair, getPkceCookieName } from "@/lib/social-oauth/pkce";
import { createOAuthState } from "@/lib/social-oauth/state";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: User session required" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { platform, channelTypeId, redirectTo: customRedirect } = body;

    if (!platform && !channelTypeId) {
      return NextResponse.json(
        { error: "Platform (e.g. 'TWITTER', 'LINKEDIN') or channelTypeId is required" },
        { status: 400 }
      );
    }

    // Resolve channel_type from database
    let query = insforge.database.from("channel_types").select("id, type, name");
    if (channelTypeId) {
      query = query.eq("id", channelTypeId);
    } else if (platform) {
      const normalizedType = String(platform).trim().toUpperCase();
      query = query.eq("type", normalizedType);
    }

    const { data: channelType, error: channelTypeError } = await query.single();

    if (channelTypeError || !channelType) {
      return NextResponse.json({ error: "Unsupported or unseeded channel type" }, { status: 404 });
    }

    const type = channelType.type as ChannelTypeEnum;
    if (type !== ChannelTypeEnum.TWITTER && type !== ChannelTypeEnum.LINKEDIN) {
      return NextResponse.json(
        { error: `Only Twitter and LinkedIn are supported on /api/social/connect. Received: ${type}` },
        { status: 400 }
      );
    }

    if (!isProviderConfigured(type)) {
      return NextResponse.json(
        {
          error: `OAuth credentials for ${channelType.name} are missing. Please set ${type}_CLIENT_ID in .env.local`,
          configured: false,
        },
        { status: 400 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin ||
      "http://localhost:3000";

    const redirectTo = customRedirect || `${appUrl}/settings`;
    const callbackUrl = `${appUrl}/api/social/callback`;

    // Generate cryptographic HMAC-SHA256 signed state (10 minute expiry)
    const state = createOAuthState({
      userId,
      channelTypeId: channelType.id,
      channelType: type,
      redirectTo,
    });

    // Twitter requires PKCE
    const pkce = type === ChannelTypeEnum.TWITTER ? createPkcePair() : null;
    const provider = getOAuthProvider(type);

    const authorizationUrl = provider.getAuthorizationUrl({
      state,
      redirectUri: callbackUrl,
      codeChallenge: pkce?.codeChallenge,
      codeChallengeMethod: pkce?.codeChallengeMethod,
    });

    const response = NextResponse.json({
      url: authorizationUrl,
      platform: type,
      channelTypeId: channelType.id,
    });

    if (pkce) {
      const isProduction = process.env.NODE_ENV === "production";
      response.cookies.set(getPkceCookieName(state), pkce.codeVerifier, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10, // 10 minutes
      });
    }

    return response;
  } catch (error) {
    console.error("Error in POST /api/social/connect:", error);
    return NextResponse.json(
      { error: "Failed to generate social authorization URL" },
      { status: 500 }
    );
  }
}
