export interface PostMetricSnapshot {
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  lastFetchedAt: string;
}

export interface PostAnalyticsItem {
  id: string;
  postId: string;
  content: string;
  channelType: "TWITTER" | "LINKEDIN" | "INSTAGRAM" | "FACEBOOK";
  handle: string;
  profileImage?: string | null;
  scheduledAt: string;
  publishedUrl: string | null;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  lastFetchedAt: string;
}

export interface AnalyticsSummary {
  totalImpressions: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalEngagements: number;
  averageEngagementRate: number;
  postsAnalyzed: number;
  topChannel: string;
}

export interface AnalyticsTimeseriesPoint {
  date: string;
  impressions: number;
  engagements: number;
}

export interface HourlyPeakPoint {
  hour: number; // 0 - 23
  label: string; // e.g. "10 AM"
  avgEngagements: number;
  postCount: number;
}

export interface AnalyticsDashboardData {
  summary: AnalyticsSummary;
  timeseries: AnalyticsTimeseriesPoint[];
  bestTimeToPost: {
    peakDay: string;
    peakHour: number;
    peakLabel: string;
    hourlyBreakdown: HourlyPeakPoint[];
  };
  topPosts: PostAnalyticsItem[];
  recentPosts: PostAnalyticsItem[];
  isFallback?: boolean;
}

