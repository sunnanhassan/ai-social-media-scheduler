import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isPast, parseISO } from "date-fns";

/**
 * Sanitizes channelIds from URL query strings or array inputs.
 * Strips empty strings, whitespace, and splits comma-separated strings.
 */
export function sanitizeChannelIds(raw: string | string[] | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .flatMap((item) => (typeof item === "string" ? item.split(",") : []))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Serializes channelIds array into a URL-safe query string.
 */
export function serializeChannelIds(channelIds: string[]): string {
  if (!channelIds || !Array.isArray(channelIds)) return "";
  return channelIds.filter(Boolean).join(",");
}

/**
 * Normalizes status filter option, mapping 'all' or empty to null (no filter),
 * and validating allowed statuses.
 */
export function normalizeStatusFilter(status: string | null | undefined): string | null {
  if (!status || status === "all") return null;
  const validStatuses = ["draft", "queue", "published", "failed"];
  const lower = status.toLowerCase().trim();
  return validStatuses.includes(lower) ? lower : null;
}

/**
 * Calculates start and end boundaries for calendar view grid rendering.
 */
export function calculateCalendarGridBounds(date: Date): { startDate: Date; endDate: Date } {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));
  return { startDate: start, endDate: end };
}

/**
 * Determines whether a scheduled post is overdue.
 */
export function isPostOverdue(scheduledAt: string | Date, status: string): boolean {
  if (status !== "queue" && status !== "draft") return false;
  const parsed = typeof scheduledAt === "string" ? parseISO(scheduledAt) : scheduledAt;
  if (isNaN(parsed.getTime())) return false;
  return isPast(parsed);
}

/**
 * Groups an array of posts by scheduled calendar day (YYYY-MM-DD).
 */
export function buildGroupPosts(posts: any[]) {
  const groupMap = new Map<string, { label: string; posts: any[] }>();

  posts.forEach((post) => {
    const date = new Date(post.scheduled_at || Date.now());
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    if (!groupMap.has(key)) {
      groupMap.set(key, { label: formatDayLabel(date), posts: [] });
    }
    groupMap.get(key)!.posts.push(post);
  });

  return Array.from(groupMap.entries()).map(([key, value]) => ({
    key,
    ...value,
  }));
}

export function formatDayLabel(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString();
}

/**
 * Builds normalized post records enriched with resolved social channel metadata.
 */
export function buildPostPayload(
  normalizedItems: { user_channel_id?: string; channelTypeId?: string; content: string; images: any[] }[],
  activeChannels: any[],
  userId: string,
  targetScheduledAt: string,
  postStatus: any
) {
  return normalizedItems.map((item) => {
    const matchingChannel =
      activeChannels.find(
        (c: any) =>
          c.id === item.channelTypeId ||
          c.channel_type_id === item.channelTypeId ||
          c.user_channel_id === item.user_channel_id ||
          c.id === item.user_channel_id
      ) ||
      activeChannels.find((c: any) => c.connected) ||
      activeChannels[0];

    const userChannelData = matchingChannel
      ? {
          id: matchingChannel.user_channel_id || matchingChannel.id,
          handle: matchingChannel.handle || matchingChannel.name,
          profile_image: matchingChannel.profile_image,
          profile_url: matchingChannel.profile_url,
          channel_type_id: matchingChannel.channel_type_id,
          is_connected: matchingChannel.connected,
          is_active: true,
          channel_types: {
            id: matchingChannel.channel_type_id,
            type: matchingChannel.type,
            name: matchingChannel.name,
            color: matchingChannel.color,
            character_limit: matchingChannel.character_limit,
            connected: matchingChannel.connected,
          },
        }
      : undefined;

    return {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      user_id: userId,
      user_channel_id: item.user_channel_id || matchingChannel?.id || "uc-x-1",
      content: item.content,
      images: Array.isArray(item.images) ? item.images : [],
      scheduled_at: targetScheduledAt,
      status: postStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_channels: userChannelData,
    };
  });
}

