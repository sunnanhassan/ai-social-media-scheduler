import test from "node:test";
import assert from "node:assert/strict";
import { ChannelTypeEnum } from "../constants/channels.ts";
import {
  getActiveChannels,
  upsertActiveChannel,
  disconnectActiveChannel,
  resetChannelStore,
} from "../lib/channels/channel-store.ts";

test.beforeEach(() => {
  resetChannelStore();
});

test("Channel Store Resilience - In-Memory Initial State", () => {
  const channels = getActiveChannels();
  assert.ok(channels.length > 0, "Channels list should not be empty");

  // Verify Facebook initially exists as unconnected placeholder
  const facebook = channels.find((c) => c.type === ChannelTypeEnum.FACEBOOK);
  assert.ok(facebook, "Facebook channel should exist");
  assert.strictEqual(facebook.connected, false, "Facebook initially unconnected");
});

test("Channel Store Resilience - Connect Facebook Page with Real Handle & Image", () => {
  const result = upsertActiveChannel({
    type: ChannelTypeEnum.FACEBOOK,
    handle: "OmniPost Official Page",
    profileImage: "https://example.com/page-avatar.png",
    profileUrl: "https://facebook.com/omnipost",
    providerAccountId: "page_123456789",
  });

  assert.strictEqual(result.connected, true);
  assert.strictEqual(result.handle, "@OmniPost Official Page");
  assert.strictEqual(result.profile_image, "https://example.com/page-avatar.png");
  assert.ok(result.id.includes("page_123456789"));

  // Verify it appears in active connected channels
  const connected = getActiveChannels("connected");
  const fb = connected.find((c) => c.type === ChannelTypeEnum.FACEBOOK);
  assert.ok(fb, "Facebook should now be in connected list");
  assert.strictEqual(fb.connected, true);
  assert.strictEqual(fb.handle, "@OmniPost Official Page");
});

test("Channel Store Resilience - Multi-Account Support on Same Platform", () => {
  // Connect Page 1
  upsertActiveChannel({
    type: ChannelTypeEnum.FACEBOOK,
    handle: "Brand Page 1",
    providerAccountId: "page_1",
  });

  // Connect Page 2 on same Facebook platform
  upsertActiveChannel({
    type: ChannelTypeEnum.FACEBOOK,
    handle: "Brand Page 2",
    providerAccountId: "page_2",
  });

  const fbAccounts = getActiveChannels("connected").filter(
    (c) => c.type === ChannelTypeEnum.FACEBOOK
  );
  assert.strictEqual(fbAccounts.length, 2, "Should support multiple connected accounts for Facebook");
  assert.ok(fbAccounts.some((a) => a.handle === "@Brand Page 1"));
  assert.ok(fbAccounts.some((a) => a.handle === "@Brand Page 2"));
});

test("Channel Store Resilience - Update Existing Account in Place", () => {
  const initial = upsertActiveChannel({
    type: ChannelTypeEnum.FACEBOOK,
    handle: "Initial Brand",
    providerAccountId: "page_fixed_id",
  });

  const updated = upsertActiveChannel({
    type: ChannelTypeEnum.FACEBOOK,
    handle: "Updated Brand Name",
    profileImage: "https://example.com/new-image.jpg",
    providerAccountId: "page_fixed_id",
  });

  assert.strictEqual(updated.id, initial.id, "ID should be preserved on re-auth update");
  assert.strictEqual(updated.handle, "@Updated Brand Name");
  assert.strictEqual(updated.profile_image, "https://example.com/new-image.jpg");
});

test("Channel Store Resilience - Disconnect Multi-Account Gracefully", () => {
  const page1 = upsertActiveChannel({
    type: ChannelTypeEnum.FACEBOOK,
    handle: "Page One",
    providerAccountId: "p1",
  });

  upsertActiveChannel({
    type: ChannelTypeEnum.FACEBOOK,
    handle: "Page Two",
    providerAccountId: "p2",
  });

  // Disconnect Page 1
  const success = disconnectActiveChannel(page1.id);
  assert.strictEqual(success, true);

  const remainingFb = getActiveChannels("connected").filter(
    (c) => c.type === ChannelTypeEnum.FACEBOOK
  );
  assert.strictEqual(remainingFb.length, 1);
  assert.strictEqual(remainingFb[0].handle, "@Page Two");
});

test("Channel Store Resilience - Filter Connected and Unconnected", () => {
  const connected = getActiveChannels("connected");
  const unconnected = getActiveChannels("unconnected");

  assert.ok(connected.every((c) => c.connected === true));
  assert.ok(unconnected.every((c) => c.connected === false));
});

