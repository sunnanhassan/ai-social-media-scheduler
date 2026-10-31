import {
  AnalyticsDashboardData,
  PostAnalyticsItem,
} from "./types";
import {
  bucketHourlyEngagement,
  buildTimeseriesData,
  calculateSummaryTotals,
  rankTopPosts,
} from "./calculator";

export const DEMO_ANALYTICS_POSTS: PostAnalyticsItem[] = [
  {
    id: "metric-1",
    postId: "post-demo-101",
    content: "🚀 Excited to unveil our new AI-powered social media scheduling SaaS! Built with Next.js 16 and multi-channel publishing. #buildinpublic",
    channelType: "TWITTER",
    handle: "sunnanhassan",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    scheduledAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    publishedUrl: "https://x.com/sunnanhassan/status/1791051",
    impressions: 4820,
    likes: 194,
    comments: 42,
    shares: 28,
    engagementRate: 5.48,
    lastFetchedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "metric-2",
    postId: "post-demo-102",
    content: "5 lessons learned while architecting our modern data-dense social queue pipeline:\n\n1. Decoupled Inngest events eliminate publish lag\n2. AES-256-GCM secures OAuth tokens\n3. Zero nested scroll conflicts in Kanban\n4. Strict channel guards prevent unauthorized dispatches\n5. Real-time smartphone previews elevate authoring confidence",
    channelType: "LINKEDIN",
    handle: "Sunnan Hassan",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    scheduledAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    publishedUrl: "https://linkedin.com/in/sunnanhassan",
    impressions: 8940,
    likes: 420,
    comments: 88,
    shares: 54,
    engagementRate: 6.29,
    lastFetchedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "metric-3",
    postId: "post-demo-103",
    content: "Just deployed our new responsive calendar and kanban board! Check out the live dispatch feed. #buildinpublic #creators",
    channelType: "TWITTER",
    handle: "sunnanhassan",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    scheduledAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    publishedUrl: "https://x.com/sunnanhassan/status/1791052",
    impressions: 3120,
    likes: 112,
    comments: 18,
    shares: 9,
    engagementRate: 4.46,
    lastFetchedAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    id: "metric-4",
    postId: "post-demo-104",
    content: "Why asynchronous background queues with sleepUntil outperform traditional cron polling in high-concurrency systems. Full breakdown below 👇",
    channelType: "LINKEDIN",
    handle: "Sunnan Hassan",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop",
    scheduledAt: new Date(Date.now() - 86400000).toISOString(),
    publishedUrl: "https://linkedin.com/in/sunnanhassan",
    impressions: 6450,
    likes: 310,
    comments: 65,
    shares: 33,
    engagementRate: 6.33,
    lastFetchedAt: new Date(Date.now() - 1800000).toISOString(),
  },
];

export function getDemoAnalyticsData(rangeDays: number = 7): AnalyticsDashboardData {
  const summary = calculateSummaryTotals(DEMO_ANALYTICS_POSTS);
  const timeseries = buildTimeseriesData(DEMO_ANALYTICS_POSTS, rangeDays);
  const hourlyBreakdown = bucketHourlyEngagement(DEMO_ANALYTICS_POSTS);
  const topPosts = rankTopPosts(DEMO_ANALYTICS_POSTS, 5);

  return {
    summary,
    timeseries,
    bestTimeToPost: {
      peakDay: "Wednesday",
      peakHour: 10,
      peakLabel: "10:00 AM – 11:00 AM",
      hourlyBreakdown,
    },
    topPosts,
    recentPosts: DEMO_ANALYTICS_POSTS,
    isFallback: true,
  };
}
