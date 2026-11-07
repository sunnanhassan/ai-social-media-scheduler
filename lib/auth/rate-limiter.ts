/**
 * Sliding-window in-memory rate limiter for OpenAPI / ChatGPT Action requests.
 * Limits each API key to maxRequestsPerWindow within a rolling time window.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const keyRequestMap = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export function checkRateLimit(
  keyIdentifier: string,
  maxRequests: number = 60,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = keyRequestMap.get(keyIdentifier);
  if (!record) {
    record = { timestamps: [] };
    keyRequestMap.set(keyIdentifier, record);
  }

  // Filter out timestamps older than the rolling window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0] || now;
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetSeconds,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, maxRequests - record.timestamps.length);
  return {
    allowed: true,
    limit: maxRequests,
    remaining,
    resetSeconds: Math.ceil(windowMs / 1000),
  };
}

export function clearRateLimitCache(): void {
  keyRequestMap.clear();
}
