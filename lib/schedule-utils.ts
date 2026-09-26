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
