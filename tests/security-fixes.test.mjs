import test from "node:test";
import assert from "node:assert/strict";
import { buildRedirectUrl } from "../lib/social-oauth/redirect.ts";
import { authenticateV1Request } from "../lib/auth/api-key.ts";
import { verifyCronSecret } from "../lib/auth/cron-auth.ts";

test("Security Fix - Open Redirect Mitigation in buildRedirectUrl", () => {
  const appUrl = "http://localhost:3000";

  // 1. Legitimate relative path
  const normalRes = buildRedirectUrl(appUrl, "/settings", { connected: "true" });
  assert.equal(normalRes.status, 307);
  assert.equal(normalRes.headers.get("location"), "http://localhost:3000/settings?connected=true");

  // 2. Malicious external origin attempt
  const externalAttempt = buildRedirectUrl(appUrl, "https://attacker.evil.com/phishing", { connected: "true" });
  assert.equal(externalAttempt.status, 307);
  assert.equal(externalAttempt.headers.get("location"), "http://localhost:3000/settings?connected=true");

  // 3. Protocol-relative attempt (//evil.com)
  const protoRelative = buildRedirectUrl(appUrl, "//attacker.evil.com/stealth", { connected: "true" });
  assert.equal(protoRelative.status, 307);
  assert.equal(protoRelative.headers.get("location"), "http://localhost:3000/settings?connected=true");
});

test("Security Fix - Hardcoded Demo API Key Blocked in Production Mode", async () => {
  const priorEnv = process.env.NODE_ENV;
  try {
    // Simulate production environment
    process.env.NODE_ENV = "production";

    const dummyReq = {
      headers: {
        get(name) {
          if (name.toLowerCase() === "authorization") {
            return "Bearer op_live_test_chatgpt_action_key_1234567890";
          }
          return null;
        },
      },
    };

    const auth = await authenticateV1Request(dummyReq);
    assert.equal(auth.success, false, "Demo key must be rejected in production");
    assert.equal(auth.status, 401);
  } finally {
    process.env.NODE_ENV = priorEnv;
  }
});

test("Security Fix - Demo API Key Allowed in Development Mode for Local Testing", async () => {
  const priorEnv = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "development";

    const dummyReq = {
      headers: {
        get(name) {
          if (name.toLowerCase() === "authorization") {
            return "Bearer op_live_test_chatgpt_action_key_1234567890";
          }
          return null;
        },
      },
    };

    const auth = await authenticateV1Request(dummyReq);
    assert.equal(auth.success, true);
    assert.equal(auth.userId, "user_demo_101");
  } finally {
    process.env.NODE_ENV = priorEnv;
  }
});

test("Security Fix - Cron Trigger Endpoint Requires CRON_SECRET When Configured", () => {
  const priorSecret = process.env.CRON_SECRET;
  try {
    process.env.CRON_SECRET = "super_secure_cron_secret_test_123";

    // 1. Unauthenticated request without header
    const unauthReq = new Request("http://localhost:3000/api/posts/cron", {
      method: "GET",
    });
    const unauthCheck = verifyCronSecret(unauthReq);
    assert.equal(unauthCheck.authorized, false);
    assert.equal(unauthCheck.response?.status, 401);

    // 2. Request with wrong token
    const wrongReq = new Request("http://localhost:3000/api/posts/cron", {
      method: "GET",
      headers: { authorization: "Bearer invalid_secret_token" },
    });
    const wrongCheck = verifyCronSecret(wrongReq);
    assert.equal(wrongCheck.authorized, false);
    assert.equal(wrongCheck.response?.status, 401);

    // 3. Request with correct token
    const validReq = new Request("http://localhost:3000/api/posts/cron", {
      method: "GET",
      headers: { authorization: "Bearer super_secure_cron_secret_test_123" },
    });
    const validCheck = verifyCronSecret(validReq);
    assert.equal(validCheck.authorized, true);
    assert.equal(validCheck.response, undefined);
  } finally {
    if (priorSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = priorSecret;
    }
  }
});
