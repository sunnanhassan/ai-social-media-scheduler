import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MOCK_CHANNELS,
  DEFAULT_PLATFORMS,
  applyChannelFilter,
} from "../constants/mock-channels.ts";
import {
  ChannelTypeEnum,
  getChannelIcon,
  getChannelUrl,
} from "../constants/channels.ts";
import { getOAuthProvider } from "../lib/social-oauth/index.ts";

test("Multi-Account - Multiple Accounts Coexistence on Same Platform", () => {
  // Check YouTube has 2 distinct accounts
  const youtubeAccounts = DEFAULT_MOCK_CHANNELS.filter(
    (c) => c.type === ChannelTypeEnum.YOUTUBE && c.connected
  );
  assert.equal(youtubeAccounts.length, 2, "Must support multiple YouTube channels");

  const [yt1, yt2] = youtubeAccounts;
  assert.notEqual(yt1.id, yt2.id, "Each account must have a unique ID");
  assert.equal(yt1.channel_type_id, yt2.channel_type_id, "Both must share the same parent platform ID");
  assert.equal(yt1.handle, "@SunnanTech");
  assert.equal(yt2.handle, "@SunnanGaming");

  // Check TikTok has 2 distinct accounts
  const tiktokAccounts = DEFAULT_MOCK_CHANNELS.filter(
    (c) => c.type === ChannelTypeEnum.TIKTOK && c.connected
  );
  assert.equal(tiktokAccounts.length, 2, "Must support multiple TikTok profiles");
  assert.notEqual(tiktokAccounts[0].id, tiktokAccounts[1].id);
  assert.equal(tiktokAccounts[0].handle, "@sunnan_clips");
  assert.equal(tiktokAccounts[1].handle, "@sunnan_vlogs");
});

test("Multi-Account - Google / YouTube OAuth Prompt Builder", () => {
  const provider = getOAuthProvider(ChannelTypeEnum.YOUTUBE);
  const authUrl = provider.getAuthorizationUrl({
    state: "test-state-token.signature",
    redirectUri: "http://localhost:3000/api/social/callback",
  });

  assert.ok(authUrl.includes("accounts.google.com"), "Must target Google OAuth");
  assert.ok(authUrl.includes("access_type=offline"), "Must request offline access for refresh token");
  assert.ok(
    authUrl.includes("prompt=consent+select_account") || authUrl.includes("prompt=consent%20select_account"),
    "Must request select_account so user can pick which YouTube channel to connect"
  );
});

test("Multi-Account - Platform Grouping Logic for Settings UI", () => {
  const platformGroups = DEFAULT_PLATFORMS.map((platform) => {
    const accounts = DEFAULT_MOCK_CHANNELS.filter(
      (c) => c.connected && (c.type === platform.type || c.channel_type_id === platform.id)
    );
    return { ...platform, accounts };
  });

  const ytGroup = platformGroups.find((g) => g.type === ChannelTypeEnum.YOUTUBE);
  assert.ok(ytGroup);
  assert.equal(ytGroup.accounts.length, 2, "YouTube group must contain 2 accounts");

  const ttGroup = platformGroups.find((g) => g.type === ChannelTypeEnum.TIKTOK);
  assert.ok(ttGroup);
  assert.equal(ttGroup.accounts.length, 2, "TikTok group must contain 2 accounts");

  const twGroup = platformGroups.find((g) => g.type === ChannelTypeEnum.TWITTER);
  assert.ok(twGroup);
  assert.equal(twGroup.accounts.length, 1, "Twitter group must contain 1 account");

  const igGroup = platformGroups.find((g) => g.type === ChannelTypeEnum.INSTAGRAM);
  assert.ok(igGroup);
  assert.equal(igGroup.accounts.length, 0, "Instagram group has 0 accounts (available to connect)");
});

test("Multi-Account - Selective Disconnection", () => {
  let simulatedAccounts = [...DEFAULT_MOCK_CHANNELS];

  // Disconnect uc-yt-1 only
  const disconnectId = "uc-yt-1";
  simulatedAccounts = simulatedAccounts.filter((c) => c.id !== disconnectId);

  const remainingYt = simulatedAccounts.filter(
    (c) => c.type === ChannelTypeEnum.YOUTUBE && c.connected
  );

  assert.equal(remainingYt.length, 1, "Only one YouTube channel should remain");
  assert.equal(remainingYt[0].id, "uc-yt-2", "uc-yt-2 must remain active");
  assert.equal(remainingYt[0].handle, "@SunnanGaming");
});

test("Multi-Account - Multi-Target Post Dispatch Payload Builder", () => {
  const selectedChannelIds = ["uc-yt-1", "uc-yt-2", "uc-tt-1"];
  const postContent = "Check out our newest AI automation workflow!";

  const generatedPosts = selectedChannelIds.map((channelId) => {
    const channel = DEFAULT_MOCK_CHANNELS.find((c) => c.id === channelId);
    return {
      user_channel_id: channelId,
      platform: channel?.type,
      handle: channel?.handle,
      content: postContent,
      character_limit: channel?.character_limit,
      isValidLength: postContent.length <= (channel?.character_limit ?? 5000),
    };
  });

  assert.equal(generatedPosts.length, 3, "Must create 3 distinct scheduled post payloads");
  assert.equal(generatedPosts[0].user_channel_id, "uc-yt-1");
  assert.equal(generatedPosts[1].user_channel_id, "uc-yt-2");
  assert.equal(generatedPosts[2].user_channel_id, "uc-tt-1");
  assert.ok(generatedPosts.every((p) => p.isValidLength));
});

test("Multi-Account - Provider Conflict Resolution Key", () => {
  const existingAccounts = new Map([
    ["user_101:UC_12345", { id: "uc-yt-1", handle: "@OldHandle" }],
  ]);

  // Re-authenticating existing account updates row
  const reAuthKey = "user_101:UC_12345";
  const isExisting = existingAccounts.has(reAuthKey);
  assert.equal(isExisting, true, "Should identify existing account to update tokens");

  // Authenticating second channel on same platform inserts new row
  const newAccountKey = "user_101:UC_67890";
  const isNew = existingAccounts.has(newAccountKey);
  assert.equal(isNew, false, "Should identify new channel ID as distinct account");
});

test("Multi-Account - Character Limit Independent Validation", () => {
  const shortPost = "A".repeat(250);
  const mediumPost = "B".repeat(2100);
  const longPost = "C".repeat(4500);

  const twitter = DEFAULT_MOCK_CHANNELS.find((c) => c.type === ChannelTypeEnum.TWITTER);
  const tiktok = DEFAULT_MOCK_CHANNELS.find((c) => c.type === ChannelTypeEnum.TIKTOK);
  const youtube = DEFAULT_MOCK_CHANNELS.find((c) => c.type === ChannelTypeEnum.YOUTUBE);

  assert.equal(shortPost.length <= (twitter?.character_limit ?? 280), true);
  assert.equal(mediumPost.length <= (twitter?.character_limit ?? 280), false);

  assert.equal(mediumPost.length <= (tiktok?.character_limit ?? 2200), true);
  assert.equal(longPost.length <= (tiktok?.character_limit ?? 2200), false);

  assert.equal(longPost.length <= (youtube?.character_limit ?? 5000), true);
});

test("Multi-Account - Zero-Latency Placeholder Multi-Account Shape", () => {
  const connected = DEFAULT_MOCK_CHANNELS.filter((c) => c.connected);
  const unconnected = DEFAULT_MOCK_CHANNELS.filter((c) => !c.connected);

  assert.equal(connected.length, 6, "Must have 6 connected accounts (1 X, 1 LI, 2 YT, 2 TT)");
  assert.equal(unconnected.length, 4, "Must have 4 unconnected platforms (IG, FB, Threads, Bluesky)");
  assert.equal(DEFAULT_MOCK_CHANNELS.length, 10, "Total entries must equal 10");
});

