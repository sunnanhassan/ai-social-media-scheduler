import type { PublishContext } from "./types";

/**
 * Modular publisher for Facebook Pages via Meta Graph API with image attachments and dev simulation.
 */
export async function publishToFacebook({
  accessToken,
  content,
  authorId,
  handle,
  images,
  logger,
}: PublishContext): Promise<string> {
  // Support simulation in development when using mock tokens
  if (
    accessToken.startsWith("mock_") ||
    (process.env.ALLOW_MOCK_OAUTH === "true" &&
      (!process.env.META_APP_SECRET || accessToken.startsWith("mock_")))
  ) {
    logger?.info("Simulated Facebook publishing for dev/mock token", { handle, authorId });
    return `https://facebook.com/${authorId || "page"}/posts/sim_${Date.now()}`;
  }

  const pageId = authorId || "me";
  const hasImages = images && images.length > 0;

  // Single or primary photo posting
  if (hasImages && images[0]?.url) {
    const photoUrl = new URL(`https://graph.facebook.com/v19.0/${pageId}/photos`);
    photoUrl.searchParams.set("access_token", accessToken);
    photoUrl.searchParams.set("url", images[0].url);
    if (content) photoUrl.searchParams.set("caption", content);

    const res = await fetch(photoUrl.toString(), { method: "POST" });
    const data = await res.json();

    if (!res.ok || data.error) {
      const errMsg = data?.error?.message || "Failed to publish photo to Facebook Page";
      logger?.error("Facebook Graph API Photo Error", { errMsg, error: data?.error });
      throw new Error(errMsg);
    }

    const postId = data.post_id || data.id;
    return `https://facebook.com/${postId}`;
  }

  // Plain text post to Facebook Page feed
  const feedUrl = new URL(`https://graph.facebook.com/v19.0/${pageId}/feed`);
  feedUrl.searchParams.set("access_token", accessToken);
  feedUrl.searchParams.set("message", content);

  const res = await fetch(feedUrl.toString(), { method: "POST" });
  const data = await res.json();

  if (!res.ok || data.error) {
    const errMsg = data?.error?.message || "Failed to publish post to Facebook Page";
    logger?.error("Facebook Graph API Feed Error", { errMsg, error: data?.error });
    throw new Error(errMsg);
  }

  return `https://facebook.com/${data.id}`;
}
