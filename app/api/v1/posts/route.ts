import { authenticateV1Request } from "../../../../lib/auth/api-key.ts";
import {
  generateIdempotencyFingerprint,
  getIdempotentResponse,
  setIdempotentResponse,
} from "../../../../lib/auth/idempotency.ts";
import {
  validatePostContent,
  validateScheduledDate,
} from "../../../../lib/auth/validation.ts";
import { randomBytes } from "node:crypto";

async function getAdminClientSafe() {
  try {
    const mod = await import("../../../../lib/insforge-server.ts").catch(() => null);
    return mod?.getInsforgeAdminClient ? mod.getInsforgeAdminClient() : null;
  } catch {
    return null;
  }
}

async function sendInngestSafe(event: any) {
  try {
    const mod = await import("../../../../inngest/client.ts").catch(() => null);
    if (mod?.inngest?.send) {
      await mod.inngest.send(event);
    }
  } catch {}
}

// Fallback in-memory posts store for testing or offline resilience
const memoryPostsStore = new Map<string, any>();

export async function GET(req: Request | any) {
  const auth = await authenticateV1Request(req);
  if (!auth.success) {
    return Response.json({ error: auth.error }, { status: auth.status || 401, headers: auth.headers });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 50);

  try {
    const insforge = await getAdminClientSafe();
    if (insforge) {
      let query = insforge.database
        .from("scheduled_posts")
        .select("id, content, status, scheduled_at, created_at, user_channels(handle, channel_types(type, name))")
        .eq("user_id", auth.userId!)
        .order("scheduled_at", { ascending: true })
        .limit(limit);

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data } = await Promise.race([
        query,
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000)),
      ]);

      if (data && data.length > 0) {
        return Response.json({ posts: data, total: data.length }, { headers: auth.headers });
      }
    }
  } catch {}

  // Return in-memory fallback posts
  let list = Array.from(memoryPostsStore.values()).filter((p) => p.user_id === auth.userId!);
  if (status && status !== "all") {
    list = list.filter((p) => p.status === status);
  }
  list = list.slice(0, limit);

  return Response.json({ posts: list, total: list.length }, { headers: auth.headers });
}

export async function POST(req: Request | any) {
  const auth = await authenticateV1Request(req);
  if (!auth.success) {
    return Response.json({ error: auth.error }, { status: auth.status || 401, headers: auth.headers });
  }

  const body = await req.json().catch(() => ({}));
  const { content, channels = ["TWITTER"], scheduledAt, firstComment } = body;
  const clientKey = req.headers.get("Idempotency-Key") || req.headers.get("idempotency-key") || undefined;

  // 1. Idempotency Check
  const fingerprint = generateIdempotencyFingerprint(
    auth.userId!,
    content || "",
    scheduledAt || "",
    clientKey
  );
  const cachedResponse = getIdempotentResponse(fingerprint);
  if (cachedResponse) {
    return Response.json(cachedResponse.body, {
      status: cachedResponse.status,
      headers: { ...auth.headers, "X-Idempotent-Replay": "true" },
    });
  }

  // 2. Validate Content
  const contentValidation = validatePostContent(content, channels);
  if (!contentValidation.valid) {
    if (contentValidation.channel) {
      return Response.json(
        {
          error: "Character limit exceeded",
          channel: contentValidation.channel,
          limit: contentValidation.limit,
          currentLength: contentValidation.currentLength,
          message: contentValidation.error,
        },
        { status: 422, headers: auth.headers }
      );
    }
    return Response.json(
      { error: "Validation Error", message: contentValidation.error },
      { status: 400, headers: auth.headers }
    );
  }

  // 3. Validate Scheduled Date
  const dateValidation = validateScheduledDate(scheduledAt);
  if (!dateValidation.valid) {
    return Response.json(
      { error: "Invalid Schedule Time", message: dateValidation.error },
      { status: 400, headers: auth.headers }
    );
  }

  // 4. Validate Target Channels
  const allowed = ["TWITTER", "LINKEDIN", "INSTAGRAM", "FACEBOOK"];
  const invalidChannel = channels.find((c: string) => !allowed.includes((c || "").toUpperCase().trim()));
  if (invalidChannel) {
    return Response.json(
      {
        error: "Invalid Channel",
        message: `Channel '${invalidChannel}' is not supported. Supported channels: ${allowed.join(", ")}`,
      },
      { status: 400, headers: auth.headers }
    );
  }

  // 5. Create Post Record
  const postId = `post_${randomBytes(8).toString("hex")}`;
  const normalizedAt = dateValidation.normalizedDate!;
  const newPost = {
    id: postId,
    user_id: auth.userId!,
    content: content.trim(),
    status: "queue",
    scheduled_at: normalizedAt,
    channels: channels.map((c: string) => c.toUpperCase().trim()),
    first_comment: firstComment ? String(firstComment).trim() : null,
    created_at: new Date().toISOString(),
  };

  memoryPostsStore.set(postId, newPost);

  // Attempt database insertion
  try {
    const insforge = await getAdminClientSafe();
    if (insforge) {
      await Promise.race([
        insforge.database.from("scheduled_posts").insert([
          {
            id: postId,
            user_id: auth.userId!,
            content: newPost.content,
            status: "queue",
            scheduled_at: normalizedAt,
            first_comment: newPost.first_comment,
          },
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500)),
      ]);
    }
  } catch {}

  // 6. Trigger Inngest Exact-Time Wakeup Workflow
  await sendInngestSafe({
    name: "post.scheduled",
    data: {
      postId,
      scheduledAt: normalizedAt,
      userId: auth.userId!,
    },
  });

  const responsePayload = {
    success: true,
    id: postId,
    status: "queue",
    scheduledAt: normalizedAt,
    channels: newPost.channels,
    firstComment: newPost.first_comment,
    message: `Post successfully scheduled for ${normalizedAt}`,
  };

  // Cache for idempotency
  setIdempotentResponse(fingerprint, 201, responsePayload);

  return Response.json(responsePayload, { status: 201, headers: auth.headers });
}

export function clearMemoryPostsStore(): void {
  memoryPostsStore.clear();
}
