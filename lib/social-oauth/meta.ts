export interface MetaPageAccount {
  id: string;
  name: string;
  access_token: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
  instagram_business_account?: {
    id: string;
    username?: string;
    profile_picture_url?: string;
  };
}

export interface MetaAccountsResponse {
  data?: MetaPageAccount[];
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Exchanges a short-lived Meta user access token for a 60-day long-lived token.
 */
export async function exchangeForLongLivedToken({
  userToken,
  clientId,
  clientSecret,
}: {
  userToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<{ accessToken: string; expiresIn?: number }> {
  const url = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  url.searchParams.set("fb_exchange_token", userToken);

  const res = await fetch(url.toString(), { method: "GET" });
  const data = await res.json();

  if (!res.ok || !data.access_token) {
    throw new Error(data?.error?.message || "Failed to exchange for long-lived Meta token");
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ? Number(data.expires_in) : undefined,
  };
}

/**
 * Fetches managed Facebook pages and connected Instagram Business accounts.
 */
export async function fetchMetaAccounts(accessToken: string): Promise<MetaPageAccount[]> {
  const fields = "id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}";
  const url = `https://graph.facebook.com/v19.0/me/accounts?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url, { method: "GET" });
  const data: MetaAccountsResponse = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data?.error?.message || "Failed to fetch Facebook pages from Meta Graph API");
  }

  return data.data || [];
}

/**
 * Extracts the primary Facebook Page from Meta accounts response.
 */
export function extractPrimaryFacebookPage(pages: MetaPageAccount[]): {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  pagePictureUrl: string | null;
} {
  if (!pages || pages.length === 0) {
    throw new Error("no_facebook_pages_found");
  }

  const primaryPage = pages[0];
  if (!primaryPage.access_token) {
    throw new Error("Facebook page missing access token");
  }

  return {
    pageId: primaryPage.id,
    pageName: primaryPage.name,
    pageAccessToken: primaryPage.access_token,
    pagePictureUrl: primaryPage.picture?.data?.url || null,
  };
}

/**
 * Extracts the primary connected Instagram Business account from Meta accounts response.
 */
export function extractPrimaryInstagramAccount(pages: MetaPageAccount[]): {
  instagramAccountId: string;
  username: string;
  pageAccessToken: string;
  profilePictureUrl: string | null;
} {
  if (!pages || pages.length === 0) {
    throw new Error("no_facebook_pages_found");
  }

  const pageWithIg = pages.find((p) => p.instagram_business_account?.id);
  if (!pageWithIg || !pageWithIg.instagram_business_account) {
    throw new Error("no_instagram_business_linked");
  }

  const igAccount = pageWithIg.instagram_business_account;
  return {
    instagramAccountId: igAccount.id,
    username: igAccount.username || pageWithIg.name,
    pageAccessToken: pageWithIg.access_token,
    profilePictureUrl: igAccount.profile_picture_url || pageWithIg.picture?.data?.url || null,
  };
}
