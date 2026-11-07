import test from "node:test";
import assert from "node:assert";
import {
  generateApiKey,
  hashApiKey,
  verifyApiKeyHash,
} from "../lib/auth/api-key.ts";
import {
  checkRateLimit,
  clearRateLimitCache,
} from "../lib/auth/rate-limiter.ts";
import {
  generateIdempotencyFingerprint,
  getIdempotentResponse,
  setIdempotentResponse,
  clearIdempotencyCache,
} from "../lib/auth/idempotency.ts";
import {
  validatePostContent,
  validateScheduledDate,
} from "../lib/auth/validation.ts";
import { addDays, addMinutes, subMinutes, addYears } from "date-fns";

test("ChatGPT Action - Pure Unit Test Suite", async (t) => {
  await t.test("API Key Generation & Cryptography", () => {
    const { rawKey, keyPrefix, keyHash } = generateApiKey();

    assert.ok(rawKey.startsWith("op_live_"), "Raw key must start with op_live_");
    assert.strictEqual(rawKey.length, 40, "Key length must be 40 chars (prefix + 32 hex)");
    assert.strictEqual(keyPrefix, rawKey.slice(0, 16), "Key prefix must match first 16 chars");
    assert.strictEqual(keyHash.length, 64, "SHA-256 hash must be 64 hex characters");

    // Verification
    assert.strictEqual(verifyApiKeyHash(rawKey, keyHash), true, "Valid key and hash must verify");
    assert.strictEqual(verifyApiKeyHash(rawKey + "x", keyHash), false, "Tampered key must fail");
    assert.strictEqual(verifyApiKeyHash("op_live_wrong_key_1234567890abcdef", keyHash), false);
  });

  await t.test("Sliding-Window Rate Limiter Engine", () => {
    clearRateLimitCache();
    const testKey = "test_key_rate_limiter";

    // First 5 requests under limit of 5
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(testKey, 5, 10_000);
      assert.strictEqual(res.allowed, true);
      assert.strictEqual(res.remaining, 4 - i);
    }

    // 6th request must breach limit
    const breach = checkRateLimit(testKey, 5, 10_000);
    assert.strictEqual(breach.allowed, false);
    assert.strictEqual(breach.remaining, 0);
    assert.ok(breach.resetSeconds > 0 && breach.resetSeconds <= 10);
  });

  await t.test("Idempotency Fingerprint & Replay Prevention", () => {
    clearIdempotencyCache();
    const userId = "usr_999";
    const content = "Test Post for ChatGPT Action";
    const scheduledAt = "2026-11-15T10:00:00.000Z";

    const fp1 = generateIdempotencyFingerprint(userId, content, scheduledAt);
    const fp2 = generateIdempotencyFingerprint(userId, content, scheduledAt);
    assert.strictEqual(fp1, fp2, "Fingerprints for identical payload must match");

    // Custom client Idempotency-Key
    const customFp = generateIdempotencyFingerprint(userId, content, scheduledAt, "client-req-001");
    assert.strictEqual(customFp, "usr_999:client-req-001");

    // Cache hit and miss
    assert.strictEqual(getIdempotentResponse(fp1), null);
    setIdempotentResponse(fp1, 201, { id: "post_1", cached: true });

    const cached = getIdempotentResponse(fp1);
    assert.ok(cached);
    assert.strictEqual(cached.status, 201);
    assert.strictEqual(cached.body.id, "post_1");
  });

  await t.test("Post Content & Channel Limit Guardrails", () => {
    // Empty content
    assert.strictEqual(validatePostContent("").valid, false);
    assert.strictEqual(validatePostContent("   ").valid, false);
    assert.strictEqual(validatePostContent("hi").valid, false); // < 3 chars

    // Valid Twitter content (<= 280 chars)
    const validTweet = "A".repeat(280);
    assert.strictEqual(validatePostContent(validTweet, ["TWITTER"]).valid, true);

    // Overflow Twitter content (281 chars)
    const invalidTweet = "A".repeat(281);
    const tweetRes = validatePostContent(invalidTweet, ["TWITTER"]);
    assert.strictEqual(tweetRes.valid, false);
    assert.strictEqual(tweetRes.channel, "TWITTER");
    assert.strictEqual(tweetRes.limit, 280);
    assert.strictEqual(tweetRes.currentLength, 281);

    // Valid LinkedIn content (fits 3000 chars)
    const validLinkedIn = "B".repeat(2500);
    assert.strictEqual(validatePostContent(validLinkedIn, ["LINKEDIN"]).valid, true);

    // Multi-channel validation failure
    const multiRes = validatePostContent(validLinkedIn, ["LINKEDIN", "TWITTER"]);
    assert.strictEqual(multiRes.valid, false);
    assert.strictEqual(multiRes.channel, "TWITTER");
  });

  await t.test("Scheduled Date & Timezone Validation", () => {
    // Missing date
    assert.strictEqual(validateScheduledDate(undefined).valid, false);

    // Malformed string
    assert.strictEqual(validateScheduledDate("tomorrow at 5pm").valid, false);

    // Past date (5 mins ago)
    const past = subMinutes(new Date(), 5).toISOString();
    const pastRes = validateScheduledDate(past);
    assert.strictEqual(pastRes.valid, false);
    assert.ok(pastRes.error?.includes("at least 2 minutes in the future"));

    // Valid future date (2 days ahead)
    const future = addDays(new Date(), 2).toISOString();
    const futureRes = validateScheduledDate(future);
    assert.strictEqual(futureRes.valid, true);
    assert.ok(futureRes.normalizedDate?.includes("Z"));

    // Too far future (> 1 year)
    const tooFar = addYears(new Date(), 2).toISOString();
    const farRes = validateScheduledDate(tooFar);
    assert.strictEqual(farRes.valid, false);
    assert.ok(farRes.error?.includes("more than 1 year"));
  });
});

