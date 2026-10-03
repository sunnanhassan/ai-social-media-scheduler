import { encrypt } from "../encryption";
import { POST_STATUS } from "../../constants/post";

async function getAdmin() {
  const { getInsforgeAdminClient } = await import("../insforge-server");
  return getInsforgeAdminClient();
}

export { shouldRefreshToken } from "./token-utils";

/**
 * Atomically marks a post as processing to prevent race conditions and duplicate publishing.
 */
export async function markPostProcessing(postId: string): Promise<boolean> {
  try {
    const insforge = await getAdmin();
    const { error } = await insforge.database
      .from("scheduled_posts")
      .update({
        status: POST_STATUS.PROCESSING,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("status", POST_STATUS.QUEUE);

    if (error) {
      // If DB has old check constraint without 'processing', log and allow flow to proceed
      console.warn("[lifecycle:markPostProcessing] Notice:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[lifecycle:markPostProcessing] Error:", err);
    return false;
  }
}

/**
 * Marks a post as published and stores its live public URL.
 */
export async function markPostPublished(
  postId: string,
  publishedUrl: string | null
): Promise<void> {
  const insforge = await getAdmin();
  const { error } = await insforge.database
    .from("scheduled_posts")
    .update({
      status: POST_STATUS.PUBLISHED,
      published_at: new Date().toISOString(),
      published_url: publishedUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw error;
}

/**
 * Records specific error messages if an API request fails, allowing for user visibility and retry logic.
 */
export async function markPostFailed(
  postId: string,
  errorMessage: string
): Promise<void> {
  const insforge = await getAdmin();
  const { error } = await insforge.database
    .from("scheduled_posts")
    .update({
      status: POST_STATUS.FAILED,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  if (error) throw error;
}

/**
 * Encrypts and securely persists refreshed OAuth access and refresh tokens.
 */
export async function saveRefreshedToken(
  userChannelId: string | undefined,
  accessToken: string,
  refreshToken: string,
  expiresAt?: string | number | null
): Promise<void> {
  if (!userChannelId) {
    throw new Error("User channel ID is missing for token update");
  }
  const insforge = await getAdmin();
  const { error } = await insforge.database
    .from("user_channels")
    .update({
      access_token: encrypt(accessToken),
      refresh_token: encrypt(refreshToken),
      token_expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userChannelId);

  if (error) throw error;
}
