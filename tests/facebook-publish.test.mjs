import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import {
  storeChannelToken,
  getChannelToken,
  resetChannelStore,
  upsertActiveChannel,
} from "../lib/channels/channel-store.ts";
import { publishToFacebook } from "../lib/publish-handlers/facebook.ts";

describe("Facebook Publishing & Token Vault Suite", () => {
  beforeEach(() => {
    resetChannelStore();
  });

  test("channel token vault stores and retrieves Page Access Tokens by ID and handle", () => {
    const mockToken = {
      accessToken: "mock_fb_access_token_12345",
      providerAccountId: "123456789_page",
      refreshToken: null,
      tokenExpiresAt: new Date(Date.now() + 86400000).toISOString(),
    };

    storeChannelToken("uc-facebook-123456789_page", mockToken);

    const retrieved = getChannelToken("uc-facebook-123456789_page");
    assert.ok(retrieved);
    assert.strictEqual(retrieved.accessToken, "mock_fb_access_token_12345");

    // Also indexed by providerAccountId
    const byProvider = getChannelToken("123456789_page");
    assert.ok(byProvider);
    assert.strictEqual(byProvider.accessToken, "mock_fb_access_token_12345");
  });

  test("upsertActiveChannel seamlessly registers tokens into vault", () => {
    upsertActiveChannel({
      channelTypeId: "type-facebook",
      type: "FACEBOOK",
      handle: "Cracking Computer",
      providerAccountId: "fb_page_999",
      accessToken: "mock_page_token_999",
    });

    const token = getChannelToken("fb_page_999");
    assert.ok(token);
    assert.strictEqual(token.accessToken, "mock_page_token_999");

    const byHandle = getChannelToken("@Cracking Computer");
    assert.ok(byHandle);
    assert.strictEqual(byHandle.accessToken, "mock_page_token_999");
  });

  test("publishToFacebook simulates publishing with mock token cleanly", async () => {
    const url = await publishToFacebook({
      accessToken: "mock_page_token_999",
      content: "HOw we can make a post",
      authorId: "fb_page_999",
      handle: "Cracking Computer",
    });

    assert.ok(url.startsWith("https://facebook.com/fb_page_999/posts/sim_"));
  });

  test("publishToFacebook with mock token and local image attachment", async () => {
    const url = await publishToFacebook({
      accessToken: "mock_page_token_999",
      content: "Post with image",
      authorId: "fb_page_999",
      handle: "Cracking Computer",
      images: [{ url: "/uploads/user_demo_101/test.png", key: "local://test.png" }],
    });

    assert.ok(url.startsWith("https://facebook.com/fb_page_999/posts/sim_"));
  });
});
