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

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let channelType: { id: string; type: string; name: string } | null = null;

    // 1. If valid UUID provided, query by ID
    if (channelTypeId && UUID_REGEX.test(channelTypeId)) {
      const { data } = await insforge.database
        .from("channel_types")
        .select("id, type, name")
        .eq("id", channelTypeId)
        .maybeSingle();
      if (data) channelType = data;
    }

    // 2. If not found by ID, infer type string and query by type
    if (!channelType) {
      let inferredType = platform ? String(platform).trim().toUpperCase() : null;
      if (!inferredType && channelTypeId) {
        const lower = channelTypeId.toLowerCase();
        if (lower.includes("x") || lower.includes("twit")) inferredType = ChannelTypeEnum.TWITTER;
        else if (lower.includes("link")) inferredType = ChannelTypeEnum.LINKEDIN;
        else if (lower.includes("insta")) inferredType = ChannelTypeEnum.INSTAGRAM;
        else if (lower.includes("face")) inferredType = ChannelTypeEnum.FACEBOOK;
        else if (lower.includes("thread")) inferredType = ChannelTypeEnum.THREADS;
        else if (lower.includes("blue")) inferredType = ChannelTypeEnum.BLUESKY;
        else if (lower.includes("tube")) inferredType = ChannelTypeEnum.YOUTUBE;
        else if (lower.includes("tik")) inferredType = ChannelTypeEnum.TIKTOK;
        else inferredType = channelTypeId.toUpperCase();
      }

      if (inferredType) {
        const { data } = await insforge.database
          .from("channel_types")
          .select("id, type, name")
          .eq("type", inferredType)
          .maybeSingle();
        if (data) channelType = data;
      }
    }

    // 3. Fallback to known seeded records if database lookup was empty or failed
    if (!channelType) {
      const SEEDED_FALLBACKS: Record<string, { id: string; type: ChannelTypeEnum; name: string }> = {
        [ChannelTypeEnum.TWITTER]: {
          id: "833c1b98-4637-4a4d-ab1d-2d8c3fea4e97",
          type: ChannelTypeEnum.TWITTER,
          name: "Twitter / X",
        },
        [ChannelTypeEnum.LINKEDIN]: {
          id: "ef235b28-2201-4dda-9b07-d137a3c7c2f2",
          type: ChannelTypeEnum.LINKEDIN,
          name: "LinkedIn",
        },
        [ChannelTypeEnum.INSTAGRAM]: {
          id: "4586c03e-264e-403a-a6ba-deecb49f505e",
          type: ChannelTypeEnum.INSTAGRAM,
          name: "Instagram",
        },
        [ChannelTypeEnum.FACEBOOK]: {
          id: "4e0ce0ab-a935-42f4-a294-b08bfab6f87c",
          type: ChannelTypeEnum.FACEBOOK,
          name: "Facebook",
        },
      };

      const key = (platform || channelTypeId || "").toUpperCase();
      if (key.includes("TWITTER") || key.includes("X")) {
        channelType = SEEDED_FALLBACKS[ChannelTypeEnum.TWITTER];
      } else if (key.includes("LINKEDIN")) {
        channelType = SEEDED_FALLBACKS[ChannelTypeEnum.LINKEDIN];
      } else if (key.includes("INSTAGRAM") || key.includes("INSTA")) {
        channelType = SEEDED_FALLBACKS[ChannelTypeEnum.INSTAGRAM];
      } else if (key.includes("FACEBOOK") || key.includes("FB")) {
        channelType = SEEDED_FALLBACKS[ChannelTypeEnum.FACEBOOK];
      }
    }

    if (!channelType) {
      return NextResponse.json({ error: "Unsupported or unseeded channel type" }, { status: 404 });
    }

    const type = channelType.type as ChannelTypeEnum;
    const SUPPORTED_PLATFORMS = [
      ChannelTypeEnum.TWITTER,
      ChannelTypeEnum.LINKEDIN,
      ChannelTypeEnum.FACEBOOK,
      ChannelTypeEnum.INSTAGRAM,
    ];

    if (!SUPPORTED_PLATFORMS.includes(type)) {
      return NextResponse.json(
        { error: `Channel type ${type} is not yet supported on /api/social/connect.` },
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

    if (!isProviderConfigured(type)) {
      if (process.env.NODE_ENV !== "production" && process.env.ALLOW_MOCK_OAUTH === "true") {
        const mockCallbackUrl = `${appUrl}/api/social/callback?mock=true&state=${encodeURIComponent(state)}&platform=${type}`;
        return NextResponse.json({
          url: mockCallbackUrl,
          platform: type,
          channelTypeId: channelType.id,
          mock: true,
        });
      }

      return NextResponse.json(
        {
          error: `OAuth credentials for ${channelType.name} are missing. Please set ${type}_CLIENT_ID in .env.local`,
          configured: false,
        },
        { status: 400 }
      );
    }


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
