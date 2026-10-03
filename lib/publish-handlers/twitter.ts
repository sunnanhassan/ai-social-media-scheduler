import type { ImageObject } from "@/types/post.type";
import type { PublishContext } from "./types";

/**
 * Modular publisher for Twitter/X with image attachments and dev simulation support.
 */
export async function publishToTwitter({
  accessToken,
  content,
  handle,
  images,
  logger,
}: PublishContext): Promise<string> {
  // Support simulation in development when using mock tokens
  if (
    accessToken.startsWith("mock_") ||
    (process.env.ALLOW_MOCK_OAUTH === "true" &&
      (!process.env.TWITTER_CLIENT_SECRET || accessToken.startsWith("mock_")))
  ) {
    logger?.info("Simulated Twitter publishing for dev/mock token", { handle });
    return `https://x.com/${handle || "user"}/status/sim_${Date.now()}`;
  }

  const mediaIds = images?.length
    ? await uploadTwitterMedia({ accessToken, images, logger })
    : [];

  const payload: { text: string; media?: { media_ids: string[] } } = {
    text: content.slice(0, 280),
  };

  if (mediaIds.length > 0) {
    payload.media = { media_ids: mediaIds };
  }

  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let data: any = null;
  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    logger?.error("Failed to parse Twitter response", { responseText });
  }

  if (!response.ok) {
    const errorMsg =
      data?.detail ||
      data?.title ||
      data?.errors?.[0]?.message ||
      "Failed to publish tweet";
    logger?.error("Twitter API Error", { errorMsg, status: response.status });
    throw new Error(errorMsg);
  }

  const tweetId = data?.data?.id;
  if (!tweetId) {
    throw new Error("Twitter API did not return a tweet ID");
  }

  return `https://x.com/${handle || "user"}/status/${tweetId}`;
}

async function uploadTwitterMedia({
  accessToken,
  images,
  logger,
}: {
  accessToken: string;
  images: ImageObject[];
  logger: any;
}): Promise<string[]> {
  const mediaIds: string[] = [];

  for (const img of images.slice(0, 4)) {
    if (!img.url) continue;
    try {
      const imgRes = await fetch(img.url);
      if (!imgRes.ok) {
        logger?.warn("Failed to fetch image for Twitter upload", { url: img.url });
        continue;
      }

      const imgBuffer = await imgRes.arrayBuffer();
      const base64Data = Buffer.from(imgBuffer).toString("base64");

      const formData = new URLSearchParams();
      formData.append("media_data", base64Data);

      const uploadRes = await fetch(
        "https://upload.twitter.com/1.1/media/upload.json",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        }
      );

      const uploadData = await uploadRes.json();
      if (uploadData?.media_id_string) {
        mediaIds.push(uploadData.media_id_string);
      }
    } catch (err: any) {
      logger?.warn("Error uploading media to Twitter", { error: err?.message });
    }
  }

  return mediaIds;
}
