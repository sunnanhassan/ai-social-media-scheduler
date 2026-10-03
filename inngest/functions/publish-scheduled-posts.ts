import { getInsforgeAdminClient } from "@/lib/insforge-server";
import { inngest } from "../client";
import { PostType } from "@/types/post.type";
import { decrypt } from "@/lib/encryption";
import { refreshOauthToken } from "@/lib/social-oauth";
import { ChannelTypeEnum } from "@/constants/channels";
import {
  markPostFailed,
  markPostProcessing,
  markPostPublished,
  saveRefreshedToken,
  shouldRefreshToken,
} from "@/lib/publish-handlers/lifecycle";
import { publishToTwitter } from "@/lib/publish-handlers/twitter";
import { publishToLinkedIn } from "@/lib/publish-handlers/linkedin";

type DuePost = {
  id: string;
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Recurring cron job checking for due scheduled posts every 5 minutes.
 */
export const publishScheduledPostsCron = inngest.createFunction(
  {
    id: "publish-scheduled-posts-cron",
    name: "Publish Scheduled Posts",
    triggers: [
      {
        cron: "*/5 * * * *",
      },
    ],
  },
  async ({ step, logger }) => {
    const duePosts = await step.run("load-due-scheduled-posts", async () => {
      const insforge = getInsforgeAdminClient();
      const now = new Date().toISOString();
      const { data, error } = await insforge.database
        .from("scheduled_posts")
        .select("id, status, scheduled_at")
        .eq("status", "queue")
        .lte("scheduled_at", now)
        .order("scheduled_at", { ascending: true });

      logger.info("[cron:scan] Due posts checked", { count: data?.length || 0, timestamp: now });

      if (error) {
        logger.error("[cron:scan] Database query error", { error });
        throw error;
      }
      return (data ?? []) as DuePost[];
    });

    if (duePosts.length === 0) {
      return { queued: 0 };
    }

    logger.info("[cron:dispatch] Emitting publish events", { count: duePosts.length });

    await step.sendEvent(
      "send-out-post-for-publish",
      duePosts.map((post) => ({
        name: "post/publish.requested",
        data: {
          postId: post.id,
        },
      }))
    );

    return { message: "Dispatched due posts for publishing", queued: duePosts.length };
  }
);

/**
 * Event-driven executor that publishes an individual post to its destination social platform.
 */
export const publishScheduledPost = inngest.createFunction(
  {
    id: "publish-scheduled-post",
    name: "Publish Scheduled Post",
    triggers: {
      event: "post/publish.requested",
    },
  },
  async ({ event, step, logger }) => {
    const post = await step.run("load-post", async () => {
      const insforge = getInsforgeAdminClient();
      const { data, error } = await insforge.database
        .from("scheduled_posts")
        .select("*, user_channels(*, channel_types(id, type, name))")
        .eq("id", event.data.postId)
        .single();

      if (error) {
        logger.error("[publish:load-post] Database fetch error", { error, postId: event.data.postId });
        throw error;
      }

      return data as PostType;
    });

    if (!post) {
      logger.error("[publish:load-post] Post not found", { postId: event.data.postId });
      return { skipped: true, reason: "post_not_found" };
    }

    if (post.status === "published") {
      logger.warn("[publish:skip] Post already published", { postId: post.id });
      return { skipped: true, reason: "already_published" };
    }

    // Step 1: Atomic state transition: queue -> processing
    await step.run("mark-post-processing", async () => {
      await markPostProcessing(post.id);
      logger.info("[publish:processing] Post status transitioned to processing", { postId: post.id });
    });

    const userChannel = post.user_channels;
    if (!userChannel) {
      await markPostFailed(post.id, "No connected social channel found for this post");
      return { skipped: true, reason: "user_channel_not_found" };
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
      const errMsg = "Missing provider type or valid decrypted access token";
      logger.error("[publish:auth]", { providerType, hasAccessToken: !!accessToken });
      await markPostFailed(post.id, errMsg);
      return { skipped: true, reason: "missing_provider_or_token" };
    }

    let currentAccessToken = accessToken;

    // Step 2: Proactive Token Refresh with 5-minute safety buffer
    if (shouldRefreshToken(tokenExpiresAt) && refreshToken) {
      const refreshed = await step.run("refresh-token", async () => {
        logger.info("[publish:token-refresh] Token expired or expiring soon, refreshing...", {
          providerType,
          expiresAt: userChannel.token_expires_at,
        });

        const callbackUrl = `${APP_URL}/api/channel/callback`;
        const data = await refreshOauthToken(
          providerType as ChannelTypeEnum,
          refreshToken,
          callbackUrl
        );

        await saveRefreshedToken(
          userChannel.id,
          data.accessToken,
          data.refreshToken ?? refreshToken,
          data.expiresAt
        );

        return data;
      });

      currentAccessToken = refreshed.accessToken;
    }

    let publishedUrl: string | null = null;

    // Step 3: Platform Publishing Execution
    try {
      publishedUrl = await step.run("publish-to-provider", async () => {
        logger.info("[publish:execute] Calling platform API", {
          provider: providerType,
          postId: post.id,
          hasImages: post.images?.length || 0,
        });

        if (providerType === ChannelTypeEnum.TWITTER) {
          return publishToTwitter({
            accessToken: currentAccessToken,
            content: post.content,
            handle: userChannel.handle,
            images: post.images,
            logger,
          });
        }

        if (providerType === ChannelTypeEnum.LINKEDIN) {
          return publishToLinkedIn({
            accessToken: currentAccessToken,
            content: post.content,
            authorId: userChannel.provider_account_id,
            images: post.images,
            logger,
          });
        }

        throw new Error(`Unsupported provider type: ${providerType}`);
      });

      // Step 4: Atomic state transition: processing -> published
      await step.run("mark-post-published", async () => {
        await markPostPublished(post.id, publishedUrl);
        logger.info("[publish:success] Post published successfully", {
          postId: post.id,
          provider: providerType,
          publishedUrl,
        });
      });

      return { published: true, provider: providerType, publishedUrl };
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : "Social platform publishing failed";
      logger.error("[publish:failed] Failed to publish post", { postId: post.id, error: errorMessage });
      await markPostFailed(post.id, errorMessage);
      throw error;
    }
  }
);