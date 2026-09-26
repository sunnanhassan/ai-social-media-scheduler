import { ChannelTypeEnum } from "@/constants/channels";
import { OAuthProvider, OAuthTokenResponse } from "./types";

const DEFAULT_PROVIDER_CONFIGS: Record<
  ChannelTypeEnum,
  {
    authUrl: string;
    tokenUrl: string;
    profileUrl: string;
    defaultScopes: string[];
  }
> = {
  [ChannelTypeEnum.TWITTER]: {
    authUrl: "https://x.com/i/oauth2/authorize",
    tokenUrl: "https://api.x.com/2/oauth2/token",
    profileUrl: "https://api.x.com/2/users/me?user.fields=profile_image_url,username",
    defaultScopes: ["tweet.read", "users.read", "tweet.write", "offline.access", "media.write"],
  },
  [ChannelTypeEnum.LINKEDIN]: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    profileUrl: "https://api.linkedin.com/v2/userinfo",
    defaultScopes: ["openid", "profile", "email", "w_member_social"],
  },
  [ChannelTypeEnum.INSTAGRAM]: {
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    profileUrl: "https://graph.instagram.com/me?fields=id,username",
    defaultScopes: ["user_profile", "user_media"],
  },
  [ChannelTypeEnum.FACEBOOK]: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    profileUrl: "https://graph.facebook.com/me?fields=id,name,picture",
    defaultScopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts"],
  },
  [ChannelTypeEnum.THREADS]: {
    authUrl: "https://threads.net/oauth/authorize",
    tokenUrl: "https://graph.threads.net/oauth/access_token",
    profileUrl: "https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url",
    defaultScopes: ["threads_basic", "threads_content_publish"],
  },
  [ChannelTypeEnum.BLUESKY]: {
    authUrl: "",
    tokenUrl: "",
    profileUrl: "",
    defaultScopes: [],
  },
  [ChannelTypeEnum.YOUTUBE]: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    profileUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    defaultScopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/userinfo.profile"],
  },
  [ChannelTypeEnum.TIKTOK]: {
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    profileUrl: "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name",
    defaultScopes: ["user.info.basic", "video.publish"],
  },
};

export function getProviderConfig(type: ChannelTypeEnum) {
  const defaults = DEFAULT_PROVIDER_CONFIGS[type];
  const customScope = process.env[`${type}_SCOPES`];
  const scopes = customScope
    ? customScope.split(",").map((s) => s.trim()).filter(Boolean)
    : defaults?.defaultScopes ?? [];

  return {
    authUrl: process.env[`${type}_AUTH_URL`] || defaults?.authUrl || "",
    tokenUrl: process.env[`${type}_TOKEN_URL`] || defaults?.tokenUrl || "",
    profileUrl: process.env[`${type}_PROFILE_URL`] || defaults?.profileUrl || "",
    clientId: process.env[`${type}_CLIENT_ID`] || "",
    clientSecret: process.env[`${type}_CLIENT_SECRET`] || "",
    scope: scopes,
  };
}

export function isProviderConfigured(type: ChannelTypeEnum): boolean {
  const config = getProviderConfig(type);
  if (!config.clientId) return false;
  if (type === ChannelTypeEnum.LINKEDIN && !config.clientSecret) return false;
  return true;
}

async function requestToken(type: ChannelTypeEnum, body: URLSearchParams) {
  const config = getProviderConfig(type);
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  if (type === ChannelTypeEnum.TWITTER && config.clientSecret) {
    const authHeader = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
    headers.Authorization = `Basic ${authHeader}`;
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers,
    body,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error_description || data?.error || `Token exchange failed: ${response.statusText}`);
  }

  return data;
}

function createProvider(type: ChannelTypeEnum, opts: { pkce?: boolean } = {}): OAuthProvider {
  return {
    type,
    getAuthorizationUrl: ({ state, redirectUri, codeChallenge, codeChallengeMethod }) => {
      const config = getProviderConfig(type);
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: config.scope.join(" "),
        state,
      });
      if (opts.pkce && codeChallenge && codeChallengeMethod) {
        params.append("code_challenge", codeChallenge);
        params.append("code_challenge_method", codeChallengeMethod);
      }
      return `${config.authUrl}?${params.toString()}`;
    },
    exchangeCodeForToken: async ({ code, redirectUri, codeVerifier }): Promise<OAuthTokenResponse> => {
      const config = getProviderConfig(type);
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: config.clientId,
      });

      if (!opts.pkce || config.clientSecret) {
        params.append("client_secret", config.clientSecret);
      }
      if (codeVerifier) {
        params.append("code_verifier", codeVerifier);
      }

      const data = await requestToken(type, params);
      const seconds = Number(data.expires_in);
      const expiresAt = seconds > 0 ? new Date(Date.now() + seconds * 1000).toISOString() : null;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresAt,
      };
    },
    refreshToken: async ({ refreshToken, redirectUri }) => {
      const config = getProviderConfig(type);
      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: config.clientId,
      });

      if (config.clientSecret) {
        params.append("client_secret", config.clientSecret);
      }
      if (redirectUri) {
        params.append("redirect_uri", redirectUri);
      }

      const data = await requestToken(type, params);
      const seconds = Number(data.expires_in);
      const expiresAt = seconds > 0 ? new Date(Date.now() + seconds * 1000).toISOString() : null;

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? null,
        expiresAt,
      };
    },
    getProfile: async ({ accessToken }) => {
      const config = getProviderConfig(type);
      const response = await fetch(config.profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      const profileData = data?.data ?? data?.user ?? data;
      const providerAccountId = profileData?.id ?? profileData?.sub ?? profileData?.user_id ?? null;
      const handle = profileData?.username ?? profileData?.screen_name ?? profileData?.handle ?? profileData?.name ?? null;
      const profileImage =
        profileData?.profile_image_url ??
        profileData?.avatar_url ??
        profileData?.picture ??
        profileData?.picture?.data?.url ??
        null;

      return {
        providerAccountId,
        handle,
        profileImage,
      };
    },
  };
}

const PROVIDERS: Record<ChannelTypeEnum, OAuthProvider> = {
  [ChannelTypeEnum.TWITTER]: createProvider(ChannelTypeEnum.TWITTER, { pkce: true }),
  [ChannelTypeEnum.LINKEDIN]: createProvider(ChannelTypeEnum.LINKEDIN),
  [ChannelTypeEnum.INSTAGRAM]: createProvider(ChannelTypeEnum.INSTAGRAM),
  [ChannelTypeEnum.FACEBOOK]: createProvider(ChannelTypeEnum.FACEBOOK),
  [ChannelTypeEnum.THREADS]: createProvider(ChannelTypeEnum.THREADS),
  [ChannelTypeEnum.BLUESKY]: createProvider(ChannelTypeEnum.BLUESKY),
  [ChannelTypeEnum.YOUTUBE]: createProvider(ChannelTypeEnum.YOUTUBE),
  [ChannelTypeEnum.TIKTOK]: createProvider(ChannelTypeEnum.TIKTOK),
};

export function getOAuthProvider(type: ChannelTypeEnum): OAuthProvider {
  return PROVIDERS[type];
}

export async function refreshOauthToken(type: ChannelTypeEnum, refreshToken: string, redirectUri: string) {
  const provider = getOAuthProvider(type);
  if (!provider.refreshToken) {
    throw new Error("Refresh token not supported for this provider");
  }
  return provider.refreshToken({ refreshToken, redirectUri });
}
