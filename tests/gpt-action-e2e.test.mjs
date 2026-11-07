import test from "node:test";
import assert from "node:assert";
import { GET as getOpenApiSpec } from "../app/api/v1/openapi.json/route.ts";
import { GET as getChannels } from "../app/api/v1/channels/route.ts";
import { GET as getPosts, POST as createPost } from "../app/api/v1/posts/route.ts";
import { GET as getSinglePost, DELETE as deleteSinglePost } from "../app/api/v1/posts/[id]/route.ts";
import { GET as getAnalytics } from "../app/api/v1/analytics/route.ts";
import { POST as getViralHooks } from "../app/api/v1/posts/viral-hooks/route.ts";
import { registerApiKey, revokeApiKey } from "../lib/auth/api-key.ts";
import { addDays, subDays } from "date-fns";

function createMockRequest(url, options = {}) {
  const headers = new Headers(options.headers || {});
  return {
    url,
    nextUrl: new URL(url),
    headers,
    json: async () => options.body || {},
  };
}

test("ChatGPT Action - End-to-End (E2E) Integration Suite", async (t) => {
  let testUserId = "usr_e2e_tester_101";
  let validRawKey = "";
  let apiKeyRecord = null;

  // Setup live API key
  const registered = await registerApiKey(testUserId, "E2E Automated Agent");
  validRawKey = registered.rawKey;
  apiKeyRecord = registered.key;

  await t.test("E2E 1: OpenAPI 3.0.3 Contract Verification", async () => {
    const req = createMockRequest("http://localhost:3000/api/v1/openapi.json");
    const res = await getOpenApiSpec(req);
    assert.strictEqual(res.status, 200);

    const spec = await res.json();
    assert.strictEqual(spec.openapi, "3.0.3");
    assert.ok(spec.info?.title?.includes("OmniPost"));
    assert.ok(Array.isArray(spec.servers) && spec.servers.length > 0);

    // Verify critical endpoints exist
    assert.ok(spec.paths["/channels"]?.get?.operationId === "listChannels");
    assert.ok(spec.paths["/posts"]?.get?.operationId === "listPosts");
    assert.ok(spec.paths["/posts"]?.post?.operationId === "createPost");
    assert.ok(spec.paths["/posts/{id}"]?.delete?.operationId === "deletePost");
    assert.ok(spec.paths["/analytics"]?.get?.operationId === "getAnalytics");
    assert.ok(spec.paths["/posts/viral-hooks"]?.post?.operationId === "generateViralHooks");

    // Verify security scheme
    const bearerScheme = spec.components?.securitySchemes?.bearerAuth;
    assert.ok(bearerScheme);
    assert.strictEqual(bearerScheme.type, "http");
    assert.strictEqual(bearerScheme.scheme, "bearer");
  });

  await t.test("E2E 2: Authentication Lifecycles (401 vs 200)", async () => {
    // Missing Authorization header
    const noAuthReq = createMockRequest("http://localhost:3000/api/v1/channels");
    const noAuthRes = await getChannels(noAuthReq);
    assert.strictEqual(noAuthRes.status, 401);

    // Malformed Bearer header
    const malformedReq = createMockRequest("http://localhost:3000/api/v1/channels", {
      headers: { Authorization: "Basic invalid_credentials" },
    });
    const malformedRes = await getChannels(malformedReq);
    assert.strictEqual(malformedRes.status, 401);

    // Valid Bearer key
    const validReq = createMockRequest("http://localhost:3000/api/v1/channels", {
      headers: { Authorization: `Bearer ${validRawKey}` },
    });
    const validRes = await getChannels(validReq);
    assert.strictEqual(validRes.status, 200);
    const channelData = await validRes.json();
    assert.ok(Array.isArray(channelData.channels));
    assert.ok(channelData.channels.some((c) => c.type === "TWITTER"));
  });

  await t.test("E2E 3: Post Scheduling Lifecycle & Idempotency", async () => {
    const futureDate = addDays(new Date(), 3).toISOString();
    const payload = {
      content: "Building Next.js 16 Turbo applications with real-time analytics. #webdev",
      channels: ["TWITTER"],
      scheduledAt: futureDate,
      firstComment: "Check out the repo here: https://github.com",
    };

    // 1. Initial Schedule Request
    const scheduleReq = createMockRequest("http://localhost:3000/api/v1/posts", {
      headers: {
        Authorization: `Bearer ${validRawKey}`,
        "Idempotency-Key": "req_unique_001",
      },
      body: payload,
    });
    const scheduleRes = await createPost(scheduleReq);
    assert.strictEqual(scheduleRes.status, 201);
    const createdData = await scheduleRes.json();
    assert.strictEqual(createdData.success, true);
    assert.ok(createdData.id.startsWith("post_"));
    assert.strictEqual(createdData.status, "queue");

    // 2. Duplicate Network Retry (Idempotency)
    const retryReq = createMockRequest("http://localhost:3000/api/v1/posts", {
      headers: {
        Authorization: `Bearer ${validRawKey}`,
        "Idempotency-Key": "req_unique_001",
      },
      body: payload,
    });
    const retryRes = await createPost(retryReq);
    assert.strictEqual(retryRes.status, 201);
    assert.strictEqual(retryRes.headers.get("X-Idempotent-Replay"), "true");

    // 3. List Scheduled Posts
    const listReq = createMockRequest("http://localhost:3000/api/v1/posts?status=queue", {
      headers: { Authorization: `Bearer ${validRawKey}` },
    });
    const listRes = await getPosts(listReq);
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(listData.posts.some((p) => p.id === createdData.id));

    // 4. Cancel Post
    const deleteReq = createMockRequest(`http://localhost:3000/api/v1/posts/${createdData.id}`, {
      headers: { Authorization: `Bearer ${validRawKey}` },
    });
    const deleteRes = await deleteSinglePost(deleteReq, {
      params: Promise.resolve({ id: createdData.id }),
    });
    assert.strictEqual(deleteRes.status, 200);
    const deleteData = await deleteRes.json();
    assert.strictEqual(deleteData.success, true);
  });

  await t.test("E2E 4: Analytics Query", async () => {
    const analyticsReq = createMockRequest("http://localhost:3000/api/v1/analytics?range=30d", {
      headers: { Authorization: `Bearer ${validRawKey}` },
    });
    const analyticsRes = await getAnalytics(analyticsReq);
    assert.strictEqual(analyticsRes.status, 200);
    const analyticsData = await analyticsRes.json();
    assert.ok(analyticsData.summary);
    assert.ok(analyticsData.summary.totalImpressions >= 0);
    assert.ok(Array.isArray(analyticsData.topPosts));
  });

  await t.test("E2E 5: Viral Hooks Generator", async () => {
    const hookReq = createMockRequest("http://localhost:3000/api/v1/posts/viral-hooks", {
      headers: { Authorization: `Bearer ${validRawKey}` },
      body: { content: "Writing an in-depth breakdown of Next.js 16 caching" },
    });
    const hookRes = await getViralHooks(hookReq);
    assert.strictEqual(hookRes.status, 200);
    const hookData = await hookRes.json();
    assert.ok(Array.isArray(hookData.hooks));
    assert.strictEqual(hookData.hooks.length, 3);
    assert.ok(hookData.hooks.some((h) => h.angle === "Curiosity"));
    assert.ok(hookData.hooks.some((h) => h.angle === "Contrarian"));
    assert.ok(hookData.hooks.some((h) => h.angle === "Story"));
  });

  await t.test("E2E 6: Error Boundaries & Input Validation", async () => {
    // Twitter 280 character limit overflow
    const overflowReq = createMockRequest("http://localhost:3000/api/v1/posts", {
      headers: { Authorization: `Bearer ${validRawKey}` },
      body: {
        content: "X".repeat(300),
        channels: ["TWITTER"],
        scheduledAt: addDays(new Date(), 2).toISOString(),
      },
    });
    const overflowRes = await createPost(overflowReq);
    assert.strictEqual(overflowRes.status, 422);
    const overflowData = await overflowRes.json();
    assert.strictEqual(overflowData.error, "Character limit exceeded");
    assert.strictEqual(overflowData.channel, "TWITTER");
    assert.strictEqual(overflowData.limit, 280);

    // Past date rejection
    const pastReq = createMockRequest("http://localhost:3000/api/v1/posts", {
      headers: { Authorization: `Bearer ${validRawKey}` },
      body: {
        content: "Valid post content",
        channels: ["TWITTER"],
        scheduledAt: subDays(new Date(), 1).toISOString(),
      },
    });
    const pastRes = await createPost(pastReq);
    assert.strictEqual(pastRes.status, 400);
    const pastData = await pastRes.json();
    assert.strictEqual(pastData.error, "Invalid Schedule Time");

    // Unsupported channel rejection
    const badChReq = createMockRequest("http://localhost:3000/api/v1/posts", {
      headers: { Authorization: `Bearer ${validRawKey}` },
      body: {
        content: "Valid post content",
        channels: ["TIKTOK_UNSUPPORTED"],
        scheduledAt: addDays(new Date(), 1).toISOString(),
      },
    });
    const badChRes = await createPost(badChReq);
    assert.strictEqual(badChRes.status, 400);
  });
});
