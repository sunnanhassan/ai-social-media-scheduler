import { createHash } from "node:crypto";

/**
 * In-memory idempotency cache for ChatGPT Action requests.
 * Retains response payloads for 90 seconds. If an identical request arrives,
 * it returns the cached response instead of re-executing.
 */

interface CachedIdempotencyResponse {
  status: number;
  body: any;
  createdAt: number;
}

const idempotencyStore = new Map<string, CachedIdempotencyResponse>();
const DEFAULT_TTL_MS = 90_000; // 90 seconds

export function generateIdempotencyFingerprint(
  userId: string,
  content: string,
  scheduledAt: string,
  clientKey?: string
): string {
  if (clientKey && clientKey.trim()) {
    return `${userId}:${clientKey.trim()}`;
  }
  const raw = `${userId}:${content.trim()}:${scheduledAt.trim()}`;
  return createHash("sha256").update(raw).digest("hex");
}

export function getIdempotentResponse(fingerprint: string): CachedIdempotencyResponse | null {
  const cached = idempotencyStore.get(fingerprint);
  if (!cached) return null;

  if (Date.now() - cached.createdAt > DEFAULT_TTL_MS) {
    idempotencyStore.delete(fingerprint);
    return null;
  }

  return cached;
}

export function setIdempotentResponse(
  fingerprint: string,
  status: number,
  body: any
): void {
  // Housekeeping: remove expired items if cache grows
  if (idempotencyStore.size > 1000) {
    const now = Date.now();
    for (const [key, val] of idempotencyStore.entries()) {
      if (now - val.createdAt > DEFAULT_TTL_MS) {
        idempotencyStore.delete(key);
      }
    }
  }

  idempotencyStore.set(fingerprint, {
    status,
    body,
    createdAt: Date.now(),
  });
}

export function clearIdempotencyCache(): void {
  idempotencyStore.clear();
}
