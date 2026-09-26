import { parse, set } from "date-fns";

export interface PostValidationInput {
  content: string;
  channelType?: string;
  characterLimit?: number;
  date?: Date;
  timeSlot?: string;
  isDraft?: boolean;
}

export function validatePostContent(
  content: string,
  characterLimit?: number
): { isValid: boolean; error?: string; length: number } {
  const trimmed = content?.trim() || "";
  const length = trimmed.length;

  if (length === 0) {
    return { isValid: false, error: "Content cannot be empty", length: 0 };
  }

  const limit = characterLimit || 3000;
  if (content.length > limit) {
    return { isValid: false, error: `Content exceeds character limit of ${limit}`, length: content.length };
  }

  return { isValid: true, length: content.length };
}

export function resolveScheduleTime(
  date?: Date,
  timeSlot?: string,
  isDraft: boolean = false
): { scheduleAt: Date; error?: string } {
  const baseDate = date || new Date();

  if (!timeSlot || !timeSlot.trim()) {
    if (isDraft) {
      return { scheduleAt: baseDate };
    }
    return { scheduleAt: baseDate, error: "Please select a time slot for scheduling" };
  }

  try {
    const parsedTime = parse(timeSlot.trim(), "h:mm a", new Date());
    if (isNaN(parsedTime.getTime())) {
      if (isDraft) return { scheduleAt: baseDate };
      return { scheduleAt: baseDate, error: "Invalid time format" };
    }

    const scheduleAt = set(baseDate, {
      hours: parsedTime.getHours(),
      minutes: parsedTime.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    });

    if (!isDraft && scheduleAt.getTime() <= Date.now() + 60000) {
      return { scheduleAt, error: "Scheduled time must be at least 1 minute in the future" };
    }

    return { scheduleAt };
  } catch {
    if (isDraft) return { scheduleAt: baseDate };
    return { scheduleAt: baseDate, error: "Failed to parse time slot" };
  }
}
