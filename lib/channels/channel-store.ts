import { ChannelTypeEnum } from "../../constants/channels.ts";
import {
  DEFAULT_MOCK_CHANNELS,
  DEFAULT_PLATFORMS,
  type MockChannelItem,
  applyChannelFilter,
} from "../../constants/mock-channels.ts";

/**
 * Resilient In-Memory Social Channel Store
 * Ensures connected channels (Facebook, Instagram, YouTube, TikTok, Twitter, LinkedIn)
 * remain available and functional even if the remote database is sleeping, paused, or slow.
 */

// Active state of all channels
let activeChannels: MockChannelItem[] = JSON.parse(JSON.stringify(DEFAULT_MOCK_CHANNELS));

export interface ActiveChannelToken {
  accessToken: string;
  refreshToken?: string | null;
  providerAccountId?: string | null;
  tokenExpiresAt?: string | null;
}

const channelTokenVault = new Map<string, ActiveChannelToken>();

export function storeChannelToken(key: string, tokens: ActiveChannelToken): void {
  if (!key) return;
  channelTokenVault.set(key, tokens);
  if (tokens.providerAccountId) {
    channelTokenVault.set(tokens.providerAccountId, tokens);
  }
}

export function getChannelToken(key: string): ActiveChannelToken | undefined {
  if (!key) return undefined;
  return channelTokenVault.get(key);
}

export interface UpsertChannelParams {
  channelTypeId?: string;
  type: ChannelTypeEnum;
  handle: string;
  profileImage?: string | null;
  profileUrl?: string | null;
  providerAccountId?: string | null;
  workspaceId?: string | null;
  accessToken?: string | null;
  encryptedAccessToken?: string | null;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
}

/**
 * Returns all active channels, optionally filtered by status or workspace.
 */
export function getActiveChannels(filter?: string | null, workspaceId?: string | null): MockChannelItem[] {
  let channels = [...activeChannels];

  // In workspace mode, channels can be scoped or shared
  if (filter) {
    channels = applyChannelFilter(channels, filter);
  }

  return channels;
}

/**
 * Persists a newly connected or re-authenticated social channel into active store.
 */
export function upsertActiveChannel(params: UpsertChannelParams): MockChannelItem {
  const platform = DEFAULT_PLATFORMS.find((p) => p.type === params.type);
  const color = platform?.color || "#1877F2";
  const name = platform?.name || params.type;
  const characterLimit = platform?.character_limit || 2200;
  const channelTypeId = params.channelTypeId || platform?.id || `type-${params.type.toLowerCase()}`;

  const cleanHandle = params.handle.startsWith("@") ? params.handle : `@${params.handle}`;
  const userChannelId = params.providerAccountId
    ? `uc-${params.type.toLowerCase()}-${params.providerAccountId}`
    : `uc-${params.type.toLowerCase()}-${Date.now()}`;

  // Securely store token credentials in server-side vault
  const tokenToStore = params.encryptedAccessToken || params.accessToken;
  if (tokenToStore) {
    const tokenObj: ActiveChannelToken = {
      accessToken: tokenToStore,
      refreshToken: params.refreshToken,
      providerAccountId: params.providerAccountId,
      tokenExpiresAt: params.tokenExpiresAt,
    };
    storeChannelToken(userChannelId, tokenObj);
    storeChannelToken(cleanHandle, tokenObj);
    if (params.providerAccountId) storeChannelToken(params.providerAccountId, tokenObj);
    if (params.channelTypeId) storeChannelToken(params.channelTypeId, tokenObj);
  }

  // Check if an existing connected account matches this handle or provider ID
  const existingIndex = activeChannels.findIndex(
    (c) =>
      c.type === params.type &&
      c.connected &&
      (c.handle?.toLowerCase() === cleanHandle.toLowerCase() ||
        (params.providerAccountId && c.id.includes(params.providerAccountId)))
  );

  if (existingIndex !== -1) {
    // Update existing connected account details
    activeChannels[existingIndex] = {
      ...activeChannels[existingIndex],
      handle: cleanHandle,
      profile_image: params.profileImage || activeChannels[existingIndex].profile_image,
      profile_url: params.profileUrl || activeChannels[existingIndex].profile_url,
      connected: true,
    };
    return activeChannels[existingIndex];
  }

  // Check if an unconnected placeholder exists for this platform
  const placeholderIndex = activeChannels.findIndex((c) => c.type === params.type && !c.connected);

  const newChannelItem: MockChannelItem = {
    id: userChannelId,
    channel_type_id: channelTypeId,
    type: params.type,
    name,
    color,
    character_limit: characterLimit,
    user_channel_id: userChannelId,
    handle: cleanHandle,
    profile_image: params.profileImage || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    profile_url: params.profileUrl || `https://${params.type.toLowerCase()}.com/${params.handle.replace(/^@/, "")}`,
    connected: true,
  };

  if (placeholderIndex !== -1) {
    // Replace the first unconnected placeholder with this connected channel
    activeChannels[placeholderIndex] = newChannelItem;
  } else {
    // Multi-account: Add as an additional connected account for this platform
    activeChannels.push(newChannelItem);
  }

  return newChannelItem;
}

/**
 * Disconnects a channel by userChannelId.
 */
export function disconnectActiveChannel(userChannelId: string): boolean {
  const index = activeChannels.findIndex((c) => c.user_channel_id === userChannelId || c.id === userChannelId);
  if (index === -1) return false;

  const target = activeChannels[index];
  const samePlatformConnected = activeChannels.filter(
    (c) => c.type === target.type && c.connected && c.id !== target.id
  );

  if (samePlatformConnected.length > 0) {
    // Other accounts exist for this platform, remove this one
    activeChannels.splice(index, 1);
  } else {
    // Revert to unconnected placeholder
    activeChannels[index] = {
      ...target,
      user_channel_id: null,
      handle: null,
      profile_image: null,
      profile_url: null,
      connected: false,
    };
  }

  return true;
}

/**
 * Resets the in-memory store to default state (used in unit tests).
 */
export function resetChannelStore(): void {
  activeChannels = JSON.parse(JSON.stringify(DEFAULT_MOCK_CHANNELS));
  channelTokenVault.clear();
}
