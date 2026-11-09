import test from "node:test";
import assert from "node:assert/strict";
import {
  ChannelTypeEnum,
  getChannelProfileUrl,
  formatChannelHandle,
} from "../constants/channels.ts";

test("Channel Profile URL - Facebook Page Resolution", () => {
  // Case 1: Numeric Facebook Page ID from user_channel_id
  const urlWithPageId = getChannelProfileUrl({
    type: ChannelTypeEnum.FACEBOOK,
    handle: "@Cracking Computer",
    user_channel_id: "uc-facebook-109283746501928",
  });
  assert.strictEqual(urlWithPageId, "https://facebook.com/109283746501928");

  // Case 2: Clean existing Facebook profile URL with numeric ID
  const urlWithCleanProfile = getChannelProfileUrl({
    type: ChannelTypeEnum.FACEBOOK,
    handle: "@Cracking Computer",
    profile_url: "https://facebook.com/109283746501928",
  });
  assert.strictEqual(urlWithCleanProfile, "https://facebook.com/109283746501928");

  // Case 3: Broken profile URL containing '@' or spaces must be sanitized cleanly
  const urlFromBrokenProfile = getChannelProfileUrl({
    type: ChannelTypeEnum.FACEBOOK,
    handle: "@Cracking Computer",
    profile_url: "https://facebook.com/@Cracking Computer",
  });
  assert.strictEqual(urlFromBrokenProfile, "https://facebook.com/CrackingComputer");
  assert.ok(!urlFromBrokenProfile.includes("@"), "Facebook URL must never contain @");
  assert.ok(!urlFromBrokenProfile.includes(" "), "Facebook URL must never contain unencoded spaces");

  // Case 4: Facebook Page handle without numeric ID fallback
  const urlFromHandle = getChannelProfileUrl({
    type: ChannelTypeEnum.FACEBOOK,
    handle: "Cracking Computer",
  });
  assert.strictEqual(urlFromHandle, "https://facebook.com/CrackingComputer");
});

test("Channel Profile URL - Other Platforms Resolution", () => {
  // Twitter / X
  const twitterUrl = getChannelProfileUrl({
    type: ChannelTypeEnum.TWITTER,
    handle: "@sunnanhassan",
  });
  assert.strictEqual(twitterUrl, "https://x.com/sunnanhassan");

  // LinkedIn
  const linkedinUrl = getChannelProfileUrl({
    type: ChannelTypeEnum.LINKEDIN,
    handle: "Sunnan Hassan",
  });
  assert.strictEqual(linkedinUrl, "https://linkedin.com/in/sunnan-hassan");

  // YouTube
  const youtubeUrl = getChannelProfileUrl({
    type: ChannelTypeEnum.YOUTUBE,
    handle: "SunnanTech",
  });
  assert.strictEqual(youtubeUrl, "https://youtube.com/@SunnanTech");

  // TikTok
  const tiktokUrl = getChannelProfileUrl({
    type: ChannelTypeEnum.TIKTOK,
    handle: "sunnan_clips",
  });
  assert.strictEqual(tiktokUrl, "https://tiktok.com/@sunnan_clips");
});

test("Channel Handle Formatter - Platform Rules", () => {
  // Facebook pages should not have '@' prefix
  assert.strictEqual(formatChannelHandle(ChannelTypeEnum.FACEBOOK, "Cracking Computer"), "Cracking Computer");
  assert.strictEqual(formatChannelHandle(ChannelTypeEnum.FACEBOOK, "@Cracking Computer"), "Cracking Computer");
  assert.strictEqual(formatChannelHandle(ChannelTypeEnum.FACEBOOK, "@@Cracking Computer"), "Cracking Computer");

  // LinkedIn profiles should not have '@' prefix
  assert.strictEqual(formatChannelHandle(ChannelTypeEnum.LINKEDIN, "Sunnan Hassan"), "Sunnan Hassan");
  assert.strictEqual(formatChannelHandle(ChannelTypeEnum.LINKEDIN, "@Sunnan Hassan"), "Sunnan Hassan");

  // Twitter, Instagram, TikTok, YouTube should have exactly one '@'
  assert.strictEqual(formatChannelHandle(ChannelTypeEnum.TWITTER, "sunnanhassan"), "@sunnanhassan");
  assert.strictEqual(formatChannelHandle(ChannelTypeEnum.TWITTER, "@sunnanhassan"), "@sunnanhassan");
  assert.strictEqual(formatChannelHandle(ChannelTypeEnum.YOUTUBE, "SunnanTech"), "@SunnanTech");
  assert.strictEqual(formatChannelHandle(ChannelTypeEnum.TIKTOK, "sunnan_clips"), "@sunnan_clips");
});
