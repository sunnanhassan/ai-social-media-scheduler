import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createOAuthState, verifyOAuthState } from "@/lib/social-oauth/state";
import { createPkcePair, getPkceCookieName } from "@/lib/social-oauth/pkce";
import { encrypt, decrypt } from "@/lib/encryption";
import { getOAuthProvider, isProviderConfigured } from "@/lib/social-oauth";
import { ChannelTypeEnum } from "@/constants/channels";
import { createHash } from "node:crypto";

describe("OAuth State Security (HMAC-SHA256)", () => {
  it("generates a signed state string with payload and signature separated by dot", () => {
    const state = createOAuthState({
      userId: "user-12345",
      channelTypeId: "chan-twitter",
      channelType: ChannelTypeEnum.TWITTER,
      redirectTo: "http://localhost:3000/settings",
    });

    assert.ok(typeof state === "string");
    assert.ok(state.includes("."));
    const parts = state.split(".");
    assert.equal(parts.length, 2);
  });

  it("verifies and extracts the original payload correctly", () => {
    const originalPayload = {
      userId: "user_test_987",
      channelTypeId: "type_uuid_456",
      channelType: ChannelTypeEnum.LINKEDIN,
      redirectTo: "https://myapp.com/dashboard",
    };

    const state = createOAuthState(originalPayload);
    const decoded = verifyOAuthState(state);

    assert.equal(decoded.userId, originalPayload.userId);
    assert.equal(decoded.channelTypeId, originalPayload.channelTypeId);
    assert.equal(decoded.channelType, originalPayload.channelType);
    assert.equal(decoded.redirectTo, originalPayload.redirectTo);
    assert.ok(decoded.exp > Date.now());
  });

  it("rejects state with tampered payload content", () => {
    const state = createOAuthState({
      userId: "legitimate_user",
      channelTypeId: "type_twitter",
      channelType: ChannelTypeEnum.TWITTER,
    });

    const [payloadB64, signature] = state.split(".");
    const decodedPayload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    decodedPayload.userId = "hacker_user";
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decodedPayload)).toString("base64url");
    const tamperedState = `${tamperedPayloadB64}.${signature}`;

    assert.throws(
      () => verifyOAuthState(tamperedState),
      /Invalid state signature/
    );
  });

  it("rejects state with tampered or mismatched signature", () => {
    const state = createOAuthState({
      userId: "user_test",
      channelTypeId: "type_linkedin",
      channelType: ChannelTypeEnum.LINKEDIN,
    });

    const [payloadB64] = state.split(".");
    const invalidSignature = "tampered_signature_with_same_length_43chars123";
    const tamperedState = `${payloadB64}.${invalidSignature}`;

    assert.throws(
      () => verifyOAuthState(tamperedState),
      /Invalid state signature/
    );
  });

  it("safely rejects arbitrary short signature without throwing Buffer RangeError", () => {
    const state = createOAuthState({
      userId: "user_test",
      channelTypeId: "type_twitter",
      channelType: ChannelTypeEnum.TWITTER,
    });

    const [payloadB64] = state.split(".");
    assert.throws(
      () => verifyOAuthState(`${payloadB64}.short`),
      /Invalid state signature/
    );
  });

  it("rejects expired state timestamp", () => {
    const expiredState = createOAuthState({
      userId: "user_expired",
      channelTypeId: "type_twitter",
      channelType: ChannelTypeEnum.TWITTER,
      expiresInMs: -1000, // expired 1 second ago
    });

    assert.throws(
      () => verifyOAuthState(expiredState),
      /OAuth state expired/
    );
  });

  it("rejects malformed state strings without a delimiter", () => {
    assert.throws(
      () => verifyOAuthState("malformed_state_string_without_dots"),
      /Invalid state format/
    );
  });
});

describe("PKCE Code Challenge & Verifier (RFC 7636)", () => {
  it("generates a random code verifier and valid S256 code challenge", () => {
    const pkce = createPkcePair();

    assert.ok(pkce.codeVerifier);
    assert.ok(pkce.codeChallenge);
    assert.equal(pkce.codeChallengeMethod, "S256");

    // Verify SHA-256 base64url derivation
    const expectedChallenge = createHash("sha256")
      .update(pkce.codeVerifier)
      .digest("base64url");

    assert.equal(pkce.codeChallenge, expectedChallenge);
  });

  it("creates deterministic, secure cookie names from state parameter", () => {
    const state1 = "state_value_alpha";
    const state2 = "state_value_beta";

    const cookie1 = getPkceCookieName(state1);
    const cookie1Repeat = getPkceCookieName(state1);
    const cookie2 = getPkceCookieName(state2);

    assert.ok(cookie1.startsWith("oauth_pkce_"));
    assert.equal(cookie1, cookie1Repeat);
    assert.notEqual(cookie1, cookie2);
  });
});

describe("AES-256-GCM Token Encryption", () => {
  it("encrypts and decrypts social tokens losslessly", () => {
    const testToken = "gho_sample_oauth_access_token_1234567890_x_twitter";
    const encrypted = encrypt(testToken);

    assert.ok(encrypted);
    assert.notEqual(encrypted, testToken);
    assert.equal(encrypted?.split(".").length, 3); // iv.tag.ciphertext

    const decrypted = decrypt(encrypted);
    assert.equal(decrypted, testToken);
  });

  it("returns null when encrypting or decrypting empty or null tokens", () => {
    assert.equal(encrypt(null), null);
    assert.equal(encrypt(undefined), null);
    assert.equal(encrypt(""), null);

    assert.equal(decrypt(null), null);
    assert.equal(decrypt(undefined), null);
    assert.equal(decrypt(""), null);
  });

  it("returns null or throws safely when decrypting tampered payload", () => {
    const token = "sensitive_refresh_token_to_protect";
    const encrypted = encrypt(token)!;
    const [iv, tag, ciphertext] = encrypted.split(".");

    // Tampered ciphertext
    const tamperedCiphertext = ciphertext.slice(0, -4) + "AAAA";
    const tampered = `${iv}.${tag}.${tamperedCiphertext}`;

    assert.throws(
      () => decrypt(tampered),
      /Unsupported state or unable to authenticate data/
    );
  });
});

describe("OAuth Provider Configuration & URL Generation", () => {
  it("generates Twitter OAuth 2.0 authorization URL with PKCE parameters", () => {
    process.env.TWITTER_CLIENT_ID = "mock_twitter_client_id";
    const provider = getOAuthProvider(ChannelTypeEnum.TWITTER);
    assert.ok(provider);

    const pkce = createPkcePair();
    const url = provider.getAuthorizationUrl({
      state: "mock_state_123",
      redirectUri: "http://localhost:3000/api/social/callback",
      codeChallenge: pkce.codeChallenge,
      codeChallengeMethod: pkce.codeChallengeMethod,
    });

    const parsedUrl = new URL(url);
    assert.equal(parsedUrl.origin + parsedUrl.pathname, "https://x.com/i/oauth2/authorize");
    assert.equal(parsedUrl.searchParams.get("client_id"), "mock_twitter_client_id");
    assert.equal(parsedUrl.searchParams.get("response_type"), "code");
    assert.equal(parsedUrl.searchParams.get("code_challenge"), pkce.codeChallenge);
    assert.equal(parsedUrl.searchParams.get("code_challenge_method"), "S256");
    assert.equal(parsedUrl.searchParams.get("state"), "mock_state_123");
    assert.ok(parsedUrl.searchParams.get("scope")?.includes("tweet.read"));
    assert.ok(parsedUrl.searchParams.get("scope")?.includes("offline.access"));
  });

  it("generates LinkedIn OAuth 2.0 authorization URL", () => {
    process.env.LINKEDIN_CLIENT_ID = "mock_linkedin_client_id";
    const provider = getOAuthProvider(ChannelTypeEnum.LINKEDIN);
    assert.ok(provider);

    const url = provider.getAuthorizationUrl({
      state: "mock_state_linkedin",
      redirectUri: "http://localhost:3000/api/social/callback",
    });

    const parsedUrl = new URL(url);
    assert.equal(parsedUrl.origin + parsedUrl.pathname, "https://www.linkedin.com/oauth/v2/authorization");
    assert.equal(parsedUrl.searchParams.get("client_id"), "mock_linkedin_client_id");
    assert.equal(parsedUrl.searchParams.get("response_type"), "code");
    assert.equal(parsedUrl.searchParams.get("state"), "mock_state_linkedin");
    assert.ok(parsedUrl.searchParams.get("scope")?.includes("w_member_social"));
    assert.ok(parsedUrl.searchParams.get("scope")?.includes("openid"));
  });

  it("accurately detects whether provider credentials are configured", () => {
    delete process.env.TWITTER_CLIENT_ID;
    assert.equal(isProviderConfigured(ChannelTypeEnum.TWITTER), false);

    process.env.TWITTER_CLIENT_ID = "test_twitter_key";
    assert.equal(isProviderConfigured(ChannelTypeEnum.TWITTER), true);

    delete process.env.LINKEDIN_CLIENT_ID;
    delete process.env.LINKEDIN_CLIENT_SECRET;
    assert.equal(isProviderConfigured(ChannelTypeEnum.LINKEDIN), false);

    process.env.LINKEDIN_CLIENT_ID = "test_li_key";
    assert.equal(isProviderConfigured(ChannelTypeEnum.LINKEDIN), false); // Needs secret too

    process.env.LINKEDIN_CLIENT_SECRET = "test_li_secret";
    assert.equal(isProviderConfigured(ChannelTypeEnum.LINKEDIN), true);
  });

  it("respects custom scope environment variables", () => {
    process.env.TWITTER_SCOPES = "custom.read,custom.write";
    const provider = getOAuthProvider(ChannelTypeEnum.TWITTER);
    const url = provider.getAuthorizationUrl({
      state: "state_scope_test",
      redirectUri: "http://localhost:3000/callback",
    });
    const parsedUrl = new URL(url);
    assert.equal(parsedUrl.searchParams.get("scope"), "custom.read custom.write");
    delete process.env.TWITTER_SCOPES;
  });
});

