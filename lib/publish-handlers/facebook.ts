import type { PublishContext } from "./types";
import fs from "node:fs/promises";
import path from "node:path";

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
    const rawUrl = images[0].url;
    const isLocal =
      rawUrl.startsWith("/") ||
      rawUrl.includes("localhost") ||
      rawUrl.includes("127.0.0.1");

    // If image is stored locally, upload binary bytes via multipart FormData so Facebook doesn't need to reach localhost
    if (isLocal) {
      try {
        const cleanPath = rawUrl.replace(/^https?:\/\/[^\/]+/, "").replace(/^\/+/, "");
        const filePath = path.join(process.cwd(), "public", cleanPath.replace(/^public[\/\\]/, ""));
        const fileBuffer = await fs.readFile(filePath);

        const formData = new FormData();
        formData.append("access_token", accessToken);
        formData.append("source", new Blob([fileBuffer]), "photo.png");
        if (content) formData.append("caption", content);

        const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!res.ok || data.error) {
          const errMsg = data?.error?.message || "Failed to upload photo to Facebook Page";
          logger?.error("Facebook Photo Upload Error", { errMsg, error: data?.error });
          throw new Error(errMsg);
        }

        const postId = data.post_id || data.id;
        return `https://facebook.com/${postId}`;
      } catch (localErr: any) {
        logger?.warn?.("Local photo read failed, falling back to URL parameter:", localErr?.message);
      }
    }

    // Remote photo upload by URL
    const photoUrl = new URL(`https://graph.facebook.com/v19.0/${pageId}/photos`);
    photoUrl.searchParams.set("access_token", accessToken);
    photoUrl.searchParams.set("url", rawUrl);
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

