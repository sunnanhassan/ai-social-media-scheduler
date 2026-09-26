import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ChannelTypeEnum } from "@/constants/channels";
import { getOAuthProvider, isProviderConfigured } from "@/lib/social-oauth";
import {
  extractPrimaryFacebookPage,
  extractPrimaryInstagramAccount,
  MetaPageAccount,
} from "@/lib/social-oauth/meta";

describe("Meta (Facebook & Instagram) Graph API Helpers", () => {
  const samplePages: MetaPageAccount[] = [
    {
      id: "page_12345",
      name: "Acme Brand Official",
      access_token: "EAAB_mock_page_access_token_123",
      picture: {
        data: {
          url: "https://lookaside.fbsbx.com/sample_page_icon.jpg",
        },
      },
      instagram_business_account: {
        id: "ig_biz_998877",
        username: "acme_brand_official",
        profile_picture_url: "https://instagram.fbsbx.com/sample_ig_icon.jpg",
      },
    },
    {
      id: "page_67890",
      name: "Acme Secondary Page",
      access_token: "EAAB_mock_secondary_token_456",
    },
  ];

  it("extracts the primary Facebook Page from Meta accounts array", () => {
    const page = extractPrimaryFacebookPage(samplePages);

    assert.equal(page.pageId, "page_12345");
    assert.equal(page.pageName, "Acme Brand Official");
    assert.equal(page.pageAccessToken, "EAAB_mock_page_access_token_123");
    assert.equal(page.pagePictureUrl, "https://lookaside.fbsbx.com/sample_page_icon.jpg");
  });

  it("throws no_facebook_pages_found when accounts array is empty", () => {
    assert.throws(
      () => extractPrimaryFacebookPage([]),
      /no_facebook_pages_found/
    );
  });

  it("throws error when page is missing access_token", () => {
    const invalidPages: MetaPageAccount[] = [
      {
        id: "page_no_token",
        name: "Broken Page",
        access_token: "",
      },
    ];

    assert.throws(
      () => extractPrimaryFacebookPage(invalidPages),
      /Facebook page missing access token/
    );
  });

  it("extracts connected Instagram Business account from Meta accounts", () => {
    const ig = extractPrimaryInstagramAccount(samplePages);

    assert.equal(ig.instagramAccountId, "ig_biz_998877");
    assert.equal(ig.username, "acme_brand_official");
    assert.equal(ig.pageAccessToken, "EAAB_mock_page_access_token_123");
    assert.equal(ig.profilePictureUrl, "https://instagram.fbsbx.com/sample_ig_icon.jpg");
  });

  it("throws no_instagram_business_linked when pages exist but none have IG business linked", () => {
    const pagesWithoutIg: MetaPageAccount[] = [
      {
        id: "page_solo",
        name: "Solo Page",
        access_token: "EAAB_token_solo",
      },
    ];

    assert.throws(
      () => extractPrimaryInstagramAccount(pagesWithoutIg),
      /no_instagram_business_linked/
    );
  });

  it("throws no_facebook_pages_found when attempting IG extraction on empty array", () => {
    assert.throws(
      () => extractPrimaryInstagramAccount([]),
      /no_facebook_pages_found/
    );
  });
});

describe("Meta OAuth Providers URL Generation & App ID Resolution", () => {
  it("generates Facebook OAuth authorization URL with required scopes", () => {
    process.env.FACEBOOK_CLIENT_ID = "mock_fb_app_id_101";
    const provider = getOAuthProvider(ChannelTypeEnum.FACEBOOK);
    assert.ok(provider);

    const url = provider.getAuthorizationUrl({
      state: "mock_state_facebook",
      redirectUri: "http://localhost:3000/api/social/callback",
    });

    const parsedUrl = new URL(url);
    assert.equal(parsedUrl.origin + parsedUrl.pathname, "https://www.facebook.com/v19.0/dialog/oauth");
    assert.equal(parsedUrl.searchParams.get("client_id"), "mock_fb_app_id_101");
    assert.equal(parsedUrl.searchParams.get("response_type"), "code");
    assert.equal(parsedUrl.searchParams.get("state"), "mock_state_facebook");
    assert.ok(parsedUrl.searchParams.get("scope")?.includes("pages_show_list"));
    assert.ok(parsedUrl.searchParams.get("scope")?.includes("pages_manage_posts"));
  });

  it("generates Instagram OAuth authorization URL with Instagram scopes", () => {
    process.env.INSTAGRAM_CLIENT_ID = "mock_ig_app_id_202";
    const provider = getOAuthProvider(ChannelTypeEnum.INSTAGRAM);
    assert.ok(provider);

    const url = provider.getAuthorizationUrl({
      state: "mock_state_instagram",
      redirectUri: "http://localhost:3000/api/social/callback",
    });

    const parsedUrl = new URL(url);
    assert.equal(parsedUrl.origin + parsedUrl.pathname, "https://www.facebook.com/v19.0/dialog/oauth");
    assert.equal(parsedUrl.searchParams.get("client_id"), "mock_ig_app_id_202");
    assert.equal(parsedUrl.searchParams.get("state"), "mock_state_instagram");
    assert.ok(parsedUrl.searchParams.get("scope")?.includes("instagram_basic"));
    assert.ok(parsedUrl.searchParams.get("scope")?.includes("instagram_content_publish"));
  });

  it("resolves shared META_APP_ID and META_APP_SECRET fallback", () => {
    delete process.env.FACEBOOK_CLIENT_ID;
    delete process.env.FACEBOOK_CLIENT_SECRET;
    delete process.env.INSTAGRAM_CLIENT_ID;
    delete process.env.INSTAGRAM_CLIENT_SECRET;

    process.env.META_APP_ID = "shared_meta_id_555";
    process.env.META_APP_SECRET = "shared_meta_secret_666";

    assert.equal(isProviderConfigured(ChannelTypeEnum.FACEBOOK), true);
    assert.equal(isProviderConfigured(ChannelTypeEnum.INSTAGRAM), true);

    const fbProvider = getOAuthProvider(ChannelTypeEnum.FACEBOOK);
    const fbUrl = fbProvider.getAuthorizationUrl({
      state: "meta_fallback_state",
      redirectUri: "http://localhost:3000/api/social/callback",
    });
    const parsedFb = new URL(fbUrl);
    assert.equal(parsedFb.searchParams.get("client_id"), "shared_meta_id_555");
  });
});
