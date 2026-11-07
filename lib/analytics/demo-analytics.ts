import type {
  AnalyticsSummary,
  AnalyticsTimeseriesPoint,
  HourlyPeakPoint,
  PostAnalyticsItem,
} from "./types.ts";
import {
  calculateSummaryTotals,
  bucketHourlyEngagement,
  rankTopPosts,
  buildTimeseriesData,
} from "./calculator.ts";

export const DEMO_ANALYTICS_POSTS: PostAnalyticsItem[] = [
  {
    id: "pa_1",
    postId: "post_nextjs_turbopack",
    content: "Deep dive: Next.js 16 App Router & Turbopack cut our build times by 42%. Key optimizations inside 💡",
    channelType: "TWITTER",
    handle: "@sunnanhassan",
    scheduledAt: "2026-11-01T14:30:00.000Z",
    publishedUrl: "https://x.com/sunnanhassan/status/101",
    impressions: 4850,
    likes: 312,
    comments: 48,
    shares: 29,
    engagementRate: 8.02,
    lastFetchedAt: "2026-11-02T14:30:00.000Z",
  },
  {
    id: "pa_2",
    postId: "post_linkedin_architecture",
    content: "Why we abandoned micro-frontends in favor of modular monolithic Next.js applications for 10x developer velocity.",
    channelType: "LINKEDIN",
    handle: "Sunnan Hassan",
    scheduledAt: "2026-11-03T10:00:00.000Z",
    publishedUrl: "https://linkedin.com/posts/sunnanhassan-102",
    impressions: 6200,
    likes: 420,
    comments: 86,
    shares: 54,
    engagementRate: 9.03,
    lastFetchedAt: "2026-11-04T10:00:00.000Z",
  },
  {
    id: "pa_3",
    postId: "post_ai_agents",
    content: "How we connected Claude MCP and Inngest durable workflows to build an autonomous social scheduler.",
    channelType: "TWITTER",
    handle: "@sunnanhassan",
    scheduledAt: "2026-11-05T16:00:00.000Z",
    publishedUrl: "https://x.com/sunnanhassan/status/103",
    impressions: 3400,
    likes: 215,
    comments: 32,
    shares: 18,
    engagementRate: 7.79,
    lastFetchedAt: "2026-11-06T16:00:00.000Z",
  },
  {
    id: "pa_4",
    postId: "post_tailwind_v4",
    content: "Tailwind CSS v4 is an absolute game-changer. Lightning CSS engine, pure CSS variables, and zero config file.",
    channelType: "TWITTER",
    handle: "@sunnanhassan",
    scheduledAt: "2026-11-06T12:00:00.000Z",
    publishedUrl: "https://x.com/sunnanhassan/status/104",
    impressions: 5120,
    likes: 340,
    comments: 45,
    shares: 22,
    engagementRate: 7.95,
    lastFetchedAt: "2026-11-07T12:00:00.000Z",
  },
];

export function getDemoAnalyticsData(range: "7d" | "30d" | "90d" | number = "30d"): {
  summary: AnalyticsSummary;
  topPosts: PostAnalyticsItem[];
  timeseries: AnalyticsTimeseriesPoint[];
  hourlyPeaks: HourlyPeakPoint[];
  allPosts: PostAnalyticsItem[];
} {
  const days = typeof range === "number" ? range : range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const summary = calculateSummaryTotals(DEMO_ANALYTICS_POSTS);
  const topPosts = rankTopPosts(DEMO_ANALYTICS_POSTS, 5);
  const timeseries = buildTimeseriesData(DEMO_ANALYTICS_POSTS, days);
  const hourlyPeaks = bucketHourlyEngagement(DEMO_ANALYTICS_POSTS);

  return {
    summary,
    topPosts,
    timeseries,
    hourlyPeaks,
    allPosts: DEMO_ANALYTICS_POSTS,
  };
}
