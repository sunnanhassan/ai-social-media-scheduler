import type { PublishContext } from "./types";

/**
 * Normalizes quotes and formats text for LinkedIn.
 */
export function formatLinkedInText(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/(\d+\.)\s{2}/g, "\n\n$1 ")
    .trim()
    .slice(0, 3000);
}

/**
 * Modular publisher for LinkedIn Rest Posts API.
 */
export async function publishToLinkedIn({
  accessToken,
  content,
  authorId,
  images,
  logger,
}: PublishContext): Promise<string> {
  // Support simulation in development when using mock tokens
  if (
    accessToken.startsWith("mock_") ||
    (process.env.ALLOW_MOCK_OAUTH === "true" &&
      (!process.env.LINKEDIN_CLIENT_SECRET || accessToken.startsWith("mock_")))
  ) {
    logger?.info("Simulated LinkedIn publishing for dev/mock token", { authorId });
    return `https://www.linkedin.com/feed/update/urn:li:share:sim_${Date.now()}`;
  }

  if (!authorId) {
    throw new Error("Missing LinkedIn author ID (provider_account_id)");
  }

  let imageUrn: string | null = null;
  const firstImage = images?.[0]?.url;

  if (firstImage) {
    imageUrn = await uploadLinkedInImage({
      accessToken,
      authorId,
      imageUrl: firstImage,
      logger,
    });
  }

  const formattedText = formatLinkedInText(content);

  const body: Record<string, any> = {
    author: `urn:li:person:${authorId}`,
    commentary: formattedText,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  if (imageUrn) {
    body.content = {
      media: {
        id: imageUrn,
      },
    };
  }

  const response = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": "202604",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  let data: any = null;
  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    logger?.error("Failed to parse LinkedIn response", { responseText });
  }

  if (!response.ok) {
    const errorMsg = data?.message || "Failed to publish to LinkedIn";
    logger?.error("LinkedIn API Error", { errorMsg, status: response.status });
    throw new Error(errorMsg);
  }

  const restliId = response.headers.get("x-restli-id") || data?.id || null;
  if (!restliId) {
    return "https://www.linkedin.com/feed/";
  }

  return `https://www.linkedin.com/feed/update/${encodeURIComponent(restliId)}`;
}

async function uploadLinkedInImage({
  accessToken,
  authorId,
  imageUrl,
  logger,
}: {
  accessToken: string;
  authorId: string;
  imageUrl: string;
  logger?: any;
}): Promise<string> {
  const initResponse = await fetch(
    "https://api.linkedin.com/rest/images?action=initializeUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "Linkedin-Version": "202604",
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: `urn:li:person:${authorId}`,
        },
      }),
    }
  );

  const initData = await initResponse.json().catch(() => null);

  if (!initResponse.ok || !initData?.value?.uploadUrl || !initData?.value?.image) {
    const msg = initData?.message || "Failed to initialize LinkedIn image upload";
    logger?.error("LinkedIn Image Init Error", { msg });
    throw new Error(msg);
  }

  const { uploadUrl, image: imageUrn } = initData.value;

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error("Failed to fetch image binary for LinkedIn upload");
  }

  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
  const imageBuffer = await imageResponse.arrayBuffer();

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: imageBuffer,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload image binary to LinkedIn S3 bucket");
  }

  return imageUrn as string;
}
