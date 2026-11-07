import { isBefore, addMinutes, addYears, parseISO } from "date-fns";

export const CHANNEL_LIMITS: Record<string, number> = {
  TWITTER: 280,
  LINKEDIN: 3000,
  INSTAGRAM: 2200,
  FACEBOOK: 5000,
};

export interface PostValidationResult {
  valid: boolean;
  error?: string;
  channel?: string;
  limit?: number;
  currentLength?: number;
}

export function validatePostContent(
  content: string,
  channels: string[] = ["TWITTER"]
): PostValidationResult {
  if (!content || typeof content !== "string" || content.trim().length < 3) {
    return {
      valid: false,
      error: "Post content cannot be empty (minimum 3 characters required).",
    };
  }

  const trimmed = content.trim();

  for (const rawCh of channels) {
    const ch = (rawCh || "").toUpperCase().trim();
    const limit = CHANNEL_LIMITS[ch] || 280;
    if (trimmed.length > limit) {
      return {
        valid: false,
        error: `Content length (${trimmed.length} chars) exceeds ${ch} limit of ${limit} characters.`,
        channel: ch,
        limit,
        currentLength: trimmed.length,
      };
    }
  }

  return { valid: true };
}

export interface DateValidationResult {
  valid: boolean;
  normalizedDate?: string;
  error?: string;
}

export function validateScheduledDate(scheduledAt: string | undefined): DateValidationResult {
  if (!scheduledAt || typeof scheduledAt !== "string") {
    return { valid: false, error: "Missing scheduledAt timestamp (ISO 8601 required)." };
  }

  const parsed = parseISO(scheduledAt);
  if (isNaN(parsed.getTime())) {
    return { valid: false, error: `Invalid date format '${scheduledAt}'. Please provide valid ISO 8601 string.` };
  }

  const now = new Date();
  const minAllowed = addMinutes(now, 1); // at least 1-2 min in future
  const maxAllowed = addYears(now, 1);

  if (isBefore(parsed, minAllowed)) {
    return {
      valid: false,
      error: "Scheduled date must be at least 2 minutes in the future.",
    };
  }

  if (isBefore(maxAllowed, parsed)) {
    return {
      valid: false,
      error: "Scheduled date cannot be more than 1 year in the future.",
    };
  }

  return {
    valid: true,
    normalizedDate: parsed.toISOString(),
  };
}
