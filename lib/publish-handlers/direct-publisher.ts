import { getInsforgeAdminClient } from "@/lib/insforge-server";
import { decrypt } from "@/lib/encryption";
import { refreshOauthToken } from "@/lib/social-oauth";
import { ChannelTypeEnum } from "@/constants/channels";
import {
  markPostFailed,
  markPostProcessing,
  markPostPublished,
  saveRefreshedToken,
  shouldRefreshToken,
} from "./lifecycle";
import { publishToTwitter } from "./twitter";
import { publishToLinkedIn } from "./linkedin";
import { PostType } from "@/types/post.type";

export interface DirectPublishResult {
  success: boolean;
  publishedUrl?: string;
  error?: string;
  provider?: string;
}

/**
 * Direct publishing executor used as an instant fallback when background
 * queue systems (Inngest) are offline or in local development environments.
 */
export async function executeDirectPublish(postId: string): Promise<DirectPublishResult> {
  const insforge = getInsforgeAdminClient();

  const { data, error } = await insforge.database
    .from("scheduled_posts")
    .select("*, user_channels(*, channel_types(id, type, name))")
    .eq("id", postId)
    .single();

  if (error || !data) {
    return { success: false, error: "Post not found or inaccessible" };
  }

  const post = data as PostType;

  if (post.status === "published") {
    return {
      success: true,
      publishedUrl: post.published_url || undefined,
      provider: post.user_channels?.channel_types?.type,
    };
  }

  // Atomically transition state
  await markPostProcessing(post.id);

  const userChannel = post.user_channels;
  if (!userChannel) {
    const errorMsg = "No connected social channel found for this post";
    await markPostFailed(post.id, errorMsg);
    return { success: false, error: errorMsg };
  }

  const providerType = userChannel.channel_types?.type;
  const encryptedAccessToken = userChannel.access_token;
  const encryptedRefreshToken = userChannel.refresh_token;

  const accessToken = decrypt(encryptedAccessToken);
  const refreshToken = decrypt(encryptedRefreshToken);
  const tokenExpiresAt = userChannel.token_expires_at
    ? new Date(userChannel.token_expires_at).getTime()
    : null;

  if (!providerType || !accessToken) {
    const errorMsg = "Missing provider credentials or valid decrypted access token";
    await markPostFailed(post.id, errorMsg);
    return { success: false, error: errorMsg };
  }

  let currentAccessToken = accessToken;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Proactive token refresh if within 5-minute safety threshold
  if (shouldRefreshToken(tokenExpiresAt) && refreshToken) {
    try {
      const callbackUrl = `${appUrl}/api/channel/callback`;
      const refreshed = await refreshOauthToken(
        providerType as ChannelTypeEnum,
        refreshToken,
        callbackUrl
      );
      await saveRefreshedToken(
        userChannel.id,
        refreshed.accessToken,
        refreshed.refreshToken ?? refreshToken,
        refreshed.expiresAt
      );
      currentAccessToken = refreshed.accessToken;
    } catch (refreshErr: any) {
      console.warn("[direct-publisher] Token refresh warning:", refreshErr?.message);
    }
  }

  try {
    let publishedUrl: string | null = null;

    if (providerType === ChannelTypeEnum.TWITTER) {
      publishedUrl = await publishToTwitter({
        accessToken: currentAccessToken,
        content: post.content,
        handle: userChannel.handle,
        images: post.images,
      });
    } else if (providerType === ChannelTypeEnum.LINKEDIN) {
      publishedUrl = await publishToLinkedIn({
        accessToken: currentAccessToken,
        content: post.content,
        authorId: userChannel.provider_account_id,
        images: post.images,
      });
    } else {
      throw new Error(`Unsupported provider type: ${providerType}`);
    }

    await markPostPublished(post.id, publishedUrl);

    return {
      success: true,
      publishedUrl: publishedUrl || undefined,
      provider: providerType,
    };
  } catch (publishErr: any) {
    const errorMsg = publishErr instanceof Error ? publishErr.message : "Failed to publish post";
    await markPostFailed(post.id, errorMsg);
    return { success: false, error: errorMsg, provider: providerType };
  }
}
