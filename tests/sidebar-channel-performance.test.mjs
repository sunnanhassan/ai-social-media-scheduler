import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MOCK_CHANNELS,
  applyChannelFilter,
} from "../constants/mock-channels.ts";
import {
  ChannelTypeEnum,
  getChannelIcon,
  getChannelUrl,
} from "../constants/channels.ts";

test("Sidebar Channels - 8 Platforms Integrity & Completeness", () => {
  assert.equal(DEFAULT_MOCK_CHANNELS.length, 8, "Must support all 8 social platforms");

  const types = DEFAULT_MOCK_CHANNELS.map((c) => c.type);
  assert.ok(types.includes(ChannelTypeEnum.TWITTER));
  assert.ok(types.includes(ChannelTypeEnum.LINKEDIN));
  assert.ok(types.includes(ChannelTypeEnum.INSTAGRAM));
  assert.ok(types.includes(ChannelTypeEnum.FACEBOOK));
  assert.ok(types.includes(ChannelTypeEnum.THREADS));
  assert.ok(types.includes(ChannelTypeEnum.YOUTUBE));
  assert.ok(types.includes(ChannelTypeEnum.BLUESKY));
  assert.ok(types.includes(ChannelTypeEnum.TIKTOK));

  for (const channel of DEFAULT_MOCK_CHANNELS) {
    assert.ok(channel.id, "Channel must have an ID");
    assert.ok(channel.name, "Channel must have a name");
    assert.ok(channel.color.startsWith("#"), "Channel color must be a valid hex string");
    assert.ok(channel.character_limit > 0, "Channel character limit must be positive");
  }
});

test("Sidebar Channels - Icon & URL Resolution for All Platforms", () => {
  for (const channel of DEFAULT_MOCK_CHANNELS) {
    const icon = getChannelIcon(channel.type);
    assert.ok(icon, `Icon must exist for ${channel.name}`);

    const url = getChannelUrl(channel.type);
    assert.ok(url.startsWith("https://"), `URL must start with https:// for ${channel.name}`);
  }
});

test("Sidebar Channels - Character Limits Validation", () => {
  const twitter = DEFAULT_MOCK_CHANNELS.find((c) => c.type === ChannelTypeEnum.TWITTER);
  assert.equal(twitter?.character_limit, 280);

  const linkedin = DEFAULT_MOCK_CHANNELS.find((c) => c.type === ChannelTypeEnum.LINKEDIN);
  assert.equal(linkedin?.character_limit, 3000);

  const threads = DEFAULT_MOCK_CHANNELS.find((c) => c.type === ChannelTypeEnum.THREADS);
  assert.equal(threads?.character_limit, 500);

  const instagram = DEFAULT_MOCK_CHANNELS.find((c) => c.type === ChannelTypeEnum.INSTAGRAM);
  assert.equal(instagram?.character_limit, 2200);
});

test("Sidebar Channels - Filtering Logic", () => {
  const simulatedChannels = [
    { ...DEFAULT_MOCK_CHANNELS[0], connected: true },
    { ...DEFAULT_MOCK_CHANNELS[1], connected: true },
    { ...DEFAULT_MOCK_CHANNELS[2], connected: false },
    { ...DEFAULT_MOCK_CHANNELS[3], connected: false },
  ];

  const connectedOnly = applyChannelFilter(simulatedChannels, "connected");
  assert.equal(connectedOnly.length, 2);
  assert.ok(connectedOnly.every((c) => c.connected));

  const unconnectedOnly = applyChannelFilter(simulatedChannels, "unconnected");
  assert.equal(unconnectedOnly.length, 2);
  assert.ok(unconnectedOnly.every((c) => !c.connected));

  const all = applyChannelFilter(simulatedChannels, null);
  assert.equal(all.length, 4);
});

test("Sidebar Channels - Connect Channels 4-Item Limiting", () => {
  const unconnected = DEFAULT_MOCK_CHANNELS.filter((c) => !c.connected);
  const limited = unconnected.slice(0, 4);

  assert.equal(limited.length, 4, "Sidebar Connect Channels should display top 4 platforms");
  assert.equal(limited[0].name, "X (Twitter)");
  assert.equal(limited[1].name, "LinkedIn");
  assert.equal(limited[2].name, "Instagram");
  assert.equal(limited[3].name, "Facebook");
});

test("Sidebar Channels - Zero-Latency Placeholder Data Shape", () => {
  const placeholder = {
    channels: DEFAULT_MOCK_CHANNELS,
    totalChannels: DEFAULT_MOCK_CHANNELS.length,
    connectedCount: 0,
  };

  assert.equal(placeholder.totalChannels, 8);
  assert.equal(placeholder.connectedCount, 0);
  assert.equal(placeholder.channels.length, 8);
  assert.equal(
    `${placeholder.connectedCount}/${placeholder.totalChannels} channels connected`,
    "0/8 channels connected"
  );
});
