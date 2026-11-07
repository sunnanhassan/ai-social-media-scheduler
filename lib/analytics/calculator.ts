import type {
  AnalyticsSummary,
  AnalyticsTimeseriesPoint,
  HourlyPeakPoint,
  PostAnalyticsItem,
} from "./types.ts";

/**
 * Calculates engagement rate as a percentage: (Likes + Comments + Shares) / Impressions * 100.
 * Safely guards against zero impressions or division by zero.
 */
export function calculateEngagementRate(
  impressions: number,
  likes: number,
  comments: number,
  shares: number
): number {
  if (!impressions || impressions <= 0) return 0;
  const engagements = (likes || 0) + (comments || 0) + (shares || 0);
  const rate = (engagements / impressions) * 100;
  return Number(Math.min(rate, 100).toFixed(2));
}

/**
 * Aggregates summary statistics across an array of analyzed posts.
 */
export function calculateSummaryTotals(items: PostAnalyticsItem[]): AnalyticsSummary {
  if (!items || items.length === 0) {
    return {
      totalImpressions: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalEngagements: 0,
      averageEngagementRate: 0,
      postsAnalyzed: 0,
      topChannel: "None",
    };
  }

  let totalImpressions = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  const channelCountMap: Record<string, number> = {};

  items.forEach((item) => {
    totalImpressions += item.impressions || 0;
    totalLikes += item.likes || 0;
    totalComments += item.comments || 0;
    totalShares += item.shares || 0;

    const ch = item.channelType || "TWITTER";
    channelCountMap[ch] = (channelCountMap[ch] || 0) + 1;
  });

  const totalEngagements = totalLikes + totalComments + totalShares;
  const averageEngagementRate = calculateEngagementRate(
    totalImpressions,
    totalLikes,
    totalComments,
    totalShares
  );

  let topChannel = "TWITTER";
  let maxCount = -1;
  for (const [ch, count] of Object.entries(channelCountMap)) {
    if (count > maxCount) {
      maxCount = count;
      topChannel = ch;
    }
  }

  return {
    totalImpressions,
    totalLikes,
    totalComments,
    totalShares,
    totalEngagements,
    averageEngagementRate,
    postsAnalyzed: items.length,
    topChannel,
  };
}

/**
 * Groups post engagements into 24 hourly buckets to discover peak posting windows.
 */
export function bucketHourlyEngagement(
  items: PostAnalyticsItem[]
): HourlyPeakPoint[] {
  const buckets: Record<number, { engagements: number; count: number }> = {};
  for (let h = 0; h < 24; h++) {
    buckets[h] = { engagements: 0, count: 0 };
  }

  items.forEach((item) => {
    try {
      const date = new Date(item.scheduledAt);
      if (!isNaN(date.getTime())) {
        const hour = date.getHours();
        const eng = (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
        buckets[hour].engagements += eng;
        buckets[hour].count += 1;
      }
    } catch {
      // Ignore invalid date
    }
  });

  return Object.entries(buckets).map(([hourStr, data]) => {
    const hour = Number(hourStr);
    const label =
      hour === 0
        ? "12 AM"
        : hour < 12
        ? `${hour} AM`
        : hour === 12
        ? "12 PM"
        : `${hour - 12} PM`;

    const avgEngagements =
      data.count > 0 ? Number((data.engagements / data.count).toFixed(1)) : 0;

    return {
      hour,
      label,
      avgEngagements,
      postCount: data.count,
    };
  });
}

/**
 * Sorts posts by highest engagement rate, resolving ties by impressions.
 */
export function rankTopPosts(
  items: PostAnalyticsItem[],
  limit: number = 5
): PostAnalyticsItem[] {
  return [...items]
    .sort((a, b) => {
      if (b.engagementRate !== a.engagementRate) {
        return b.engagementRate - a.engagementRate;
      }
      return b.impressions - a.impressions;
    })
    .slice(0, limit);
}

/**
 * Generates continuous daily timeseries data for area/trend charts.
 */
export function buildTimeseriesData(
  items: PostAnalyticsItem[],
  daysCount: number = 7
): AnalyticsTimeseriesPoint[] {
  const points: AnalyticsTimeseriesPoint[] = [];
  const map: Record<string, { impressions: number; engagements: number }> = {};

  const now = new Date();
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map[key] = { impressions: 0, engagements: 0 };
  }

  items.forEach((item) => {
    try {
      const key = new Date(item.scheduledAt).toISOString().slice(0, 10);
      if (map[key]) {
        map[key].impressions += item.impressions || 0;
        map[key].engagements +=
          (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
      }
    } catch {
      // Ignore unparseable date
    }
  });

  for (const [date, val] of Object.entries(map)) {
    points.push({
      date,
      impressions: val.impressions,
      engagements: val.engagements,
    });
  }

  return points;
}

/**
 * Computes peak posting window and optimal scheduling day from hourly breakdown and analyzed items.
 */
export function calculateBestTimeToPost(
  hourlyBreakdown: HourlyPeakPoint[],
  items?: PostAnalyticsItem[]
): {
  peakDay: string;
  peakHour: number;
  peakLabel: string;
  hourlyBreakdown: HourlyPeakPoint[];
} {
  const buckets =
    hourlyBreakdown && hourlyBreakdown.length > 0
      ? hourlyBreakdown
      : bucketHourlyEngagement(items || []);

  let peakHour = 10;
  let maxAvg = -1;

  buckets.forEach((h) => {
    if (h.avgEngagements > maxAvg) {
      maxAvg = h.avgEngagements;
      peakHour = h.hour;
    }
  });

  const nextHour = (peakHour + 1) % 24;
  const formatHour = (hr: number) => {
    if (hr === 0) return "12:00 AM";
    if (hr < 12) return `${hr}:00 AM`;
    if (hr === 12) return "12:00 PM";
    return `${hr - 12}:00 PM`;
  };

  const peakLabel = `${formatHour(peakHour)} – ${formatHour(nextHour)}`;

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayCounts: Record<string, number> = {};
  if (items && items.length > 0) {
    items.forEach((item) => {
      try {
        const d = new Date(item.scheduledAt);
        if (!isNaN(d.getTime())) {
          const name = dayNames[d.getDay()];
          const eng = (item.likes || 0) + (item.comments || 0) + (item.shares || 0);
          dayCounts[name] = (dayCounts[name] || 0) + eng;
        }
      } catch {}
    });
  }

  let peakDay = "Wednesday";
  let maxDayEng = -1;
  for (const [day, eng] of Object.entries(dayCounts)) {
    if (eng > maxDayEng) {
      maxDayEng = eng;
      peakDay = day;
    }
  }

  return {
    peakDay,
    peakHour,
    peakLabel,
    hourlyBreakdown: buckets,
  };
}
