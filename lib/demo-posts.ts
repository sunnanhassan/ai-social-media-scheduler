import type { PostType } from "../types/post.type";
import type { ChannelTypeEnum } from "../constants/channels";

const POST_STATUS = {
  DRAFT: "draft",
  QUEUE: "queue",
  PROCESSING: "processing",
  PUBLISHED: "published",
  FAILED: "failed",
} as const;

export const DEMO_FALLBACK_POSTS: PostType[] = [
  {
    id: "demo-post-1",
    user_id: "user_demo_101",
    user_channel_id: "uc-x-1",
    content: "🚀 Excited to unveil our new AI-powered social media scheduling SaaS! Built with Next.js 16, Electric Mint & Charcoal styling, and multi-channel publishing. #buildinpublic #saas",
    images: [
      {
        url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        key: "mock/launch.png",
      },
    ],
    scheduled_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    status: POST_STATUS.QUEUE,
    published_at: null,
    published_url: null,
    error_message: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    user_channels: {
      id: "uc-x-1",
      handle: "@sunnanhassan",
      profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      profile_url: "https://x.com/sunnanhassan",
      channel_type_id: "833c1b98-4637-4a4d-ab1d-2d8c3fea4e97",
      is_connected: true,
      is_active: true,
      channel_types: {
        id: "833c1b98-4637-4a4d-ab1d-2d8c3fea4e97",
        type: "TWITTER" as unknown as ChannelTypeEnum,
        name: "X (Twitter)",
        color: "#1DA1F2",
        character_limit: 280,
        connected: true,
      },
    },
  },
  {
    id: "demo-post-2",
    user_id: "user_demo_101",
    user_channel_id: "uc-li-1",
    content: "5 lessons learned while architecting our modern data-dense social queue pipeline:\n\n1. Decoupled Inngest events eliminate publish lag\n2. AES-256-GCM secures OAuth tokens\n3. Zero nested scroll conflicts in Kanban drag-and-drop\n4. Strict channel guards prevent unauthorized dispatches\n5. Real-time smartphone previews elevate authoring confidence\n\nWhat does your content scheduling stack look like?",
    images: [],
    scheduled_at: new Date(Date.now() + 172800000).toISOString(), // In 2 days
    status: POST_STATUS.QUEUE,
    published_at: null,
    published_url: null,
    error_message: null,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date(Date.now() - 7200000).toISOString(),
    user_channels: {
      id: "uc-li-1",
      handle: "Sunnan Hassan",
      profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      profile_url: "https://linkedin.com/in/sunnanhassan",
      channel_type_id: "ef235b28-2201-4dda-9b07-d137a3c7c2f2",
      is_connected: true,
      is_active: true,
      channel_types: {
        id: "ef235b28-2201-4dda-9b07-d137a3c7c2f2",
        type: "LINKEDIN" as unknown as ChannelTypeEnum,
        name: "LinkedIn",
        color: "#0A66C2",
        character_limit: 3000,
        connected: true,
      },
    },
  },
  {
    id: "demo-post-3",
    user_id: "user_demo_101",
    user_channel_id: "uc-x-1",
    content: "Drafting an in-depth breakdown of Next.js 16 App Router & Turbopack performance wins. Key takeaways dropping soon! 💡",
    images: [],
    scheduled_at: new Date(Date.now() + 259200000).toISOString(), // In 3 days
    status: POST_STATUS.DRAFT,
    published_at: null,
    published_url: null,
    error_message: null,
    created_at: new Date(Date.now() - 10800000).toISOString(),
    updated_at: new Date(Date.now() - 10800000).toISOString(),
    user_channels: {
      id: "uc-x-1",
      handle: "@sunnanhassan",
      profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      profile_url: "https://x.com/sunnanhassan",
      channel_type_id: "833c1b98-4637-4a4d-ab1d-2d8c3fea4e97",
      is_connected: true,
      is_active: true,
      channel_types: {
        id: "833c1b98-4637-4a4d-ab1d-2d8c3fea4e97",
        type: "TWITTER" as unknown as ChannelTypeEnum,
        name: "X (Twitter)",
        color: "#1DA1F2",
        character_limit: 280,
        connected: true,
      },
    },
  },
  {
    id: "demo-post-4",
    user_id: "user_demo_101",
    user_channel_id: "uc-x-1",
    content: "Just deployed our new responsive calendar and kanban board! Check out the live dispatch feed at https://x.com/sunnanhassan/status/sim_179105",
    images: [],
    scheduled_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    status: POST_STATUS.PUBLISHED,
    published_at: new Date(Date.now() - 86400000).toISOString(),
    published_url: "https://x.com/sunnanhassan/status/sim_179105",
    error_message: null,
    created_at: new Date(Date.now() - 90000000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    user_channels: {
      id: "uc-x-1",
      handle: "@sunnanhassan",
      profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
      profile_url: "https://x.com/sunnanhassan",
      channel_type_id: "833c1b98-4637-4a4d-ab1d-2d8c3fea4e97",
      is_connected: true,
      is_active: true,
      channel_types: {
        id: "833c1b98-4637-4a4d-ab1d-2d8c3fea4e97",
        type: "TWITTER" as unknown as ChannelTypeEnum,
        name: "X (Twitter)",
        color: "#1DA1F2",
        character_limit: 280,
        connected: true,
      },
    },
  },
];

export interface FilterOptions {
  channelIds?: string[];
  status?: string | null;
  groupByDate?: boolean;
}

export function filterDemoPosts(posts: PostType[], options: FilterOptions = {}) {
  let filtered = [...posts];

  // Filter by status
  if (options.status && options.status !== "all") {
    const targetStatus = options.status.toLowerCase();
    filtered = filtered.filter((p) => p.status?.toLowerCase() === targetStatus);
  }

  // Filter by channelIds
  if (options.channelIds && options.channelIds.length > 0) {
    const targetSet = new Set(options.channelIds);
    filtered = filtered.filter(
      (p) =>
        (p.user_channel_id && targetSet.has(p.user_channel_id)) ||
        (p.user_channels?.id && targetSet.has(p.user_channels.id)) ||
        (p.user_channels?.channel_type_id && targetSet.has(p.user_channels.channel_type_id))
    );
  }

  // Sort descending by scheduled_at
  filtered.sort((a, b) => {
    const tA = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
    const tB = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
    return tB - tA;
  });

  return filtered;
}
