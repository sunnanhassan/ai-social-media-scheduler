import { ChannelTypeEnum } from "./channels.ts";
import type { ChannelType } from "../types/channel.type.ts";

export interface MockChannelItem {
  id: string;
  type: ChannelTypeEnum;
  name: string;
  color: string;
  character_limit: number;
  user_channel_id: string | null;
  handle: string | null;
  profile_image: string | null;
  profile_url: string | null;
  connected: boolean;
}

export const DEFAULT_MOCK_CHANNELS: MockChannelItem[] = [
  {
    id: "833c1b98-4637-4a4d-ab1d-2d8c3fea4e97",
    type: ChannelTypeEnum.TWITTER,
    name: "X (Twitter)",
    color: "#1DA1F2",
    character_limit: 280,
    user_channel_id: "uc-x-1",
    handle: "@sunnanhassan",
    profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    profile_url: "https://x.com/sunnanhassan",
    connected: false,
  },
  {
    id: "ef235b28-2201-4dda-9b07-d137a3c7c2f2",
    type: ChannelTypeEnum.LINKEDIN,
    name: "LinkedIn",
    color: "#0A66C2",
    character_limit: 3000,
    user_channel_id: "uc-li-1",
    handle: "Sunnan Hassan",
    profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    profile_url: "https://linkedin.com/in/sunnanhassan",
    connected: false,
  },
  {
    id: "4586c03e-264e-403a-a6ba-deecb49f505e",
    type: ChannelTypeEnum.INSTAGRAM,
    name: "Instagram",
    color: "#E1306C",
    character_limit: 2200,
    user_channel_id: null,
    handle: null,
    profile_image: null,
    profile_url: null,
    connected: false,
  },
  {
    id: "4e0ce0ab-a935-42f4-a294-b08bfab6f87c",
    type: ChannelTypeEnum.FACEBOOK,
    name: "Facebook",
    color: "#1877F2",
    character_limit: 63206,
    user_channel_id: null,
    handle: null,
    profile_image: null,
    profile_url: null,
    connected: false,
  },
  {
    id: "fc2e2e75-adb1-4f0e-b82b-7147bf382d04",
    type: ChannelTypeEnum.THREADS,
    name: "Threads",
    color: "#000000",
    character_limit: 500,
    user_channel_id: null,
    handle: null,
    profile_image: null,
    profile_url: null,
    connected: false,
  },
  {
    id: "2b44ae4d-8d9c-4c3b-a5ba-6c63abd6389c",
    type: ChannelTypeEnum.YOUTUBE,
    name: "YouTube",
    color: "#FF0000",
    character_limit: 5000,
    user_channel_id: null,
    handle: null,
    profile_image: null,
    profile_url: null,
    connected: false,
  },
  {
    id: "61b3a519-1085-4bf5-a791-ad0f77f562c5",
    type: ChannelTypeEnum.BLUESKY,
    name: "Bluesky",
    color: "#0285FF",
    character_limit: 300,
    user_channel_id: null,
    handle: null,
    profile_image: null,
    profile_url: null,
    connected: false,
  },
  {
    id: "db5c863f-370b-4ec3-8779-deaa4edea0c4",
    type: ChannelTypeEnum.TIKTOK,
    name: "TikTok",
    color: "#000000",
    character_limit: 2200,
    user_channel_id: null,
    handle: null,
    profile_image: null,
    profile_url: null,
    connected: false,
  },
];

export function applyChannelFilter(channels: MockChannelItem[], filter: string | null): MockChannelItem[] {
  if (filter === "connected") return channels.filter((c) => c.connected);
  if (filter === "unconnected") return channels.filter((c) => !c.connected);
  return channels;
}
