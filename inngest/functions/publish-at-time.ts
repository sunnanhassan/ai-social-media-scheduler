import { inngest } from "../client";

/**
 * Event-driven durable scheduler that sleeps until the exact target time,
 * eliminating the 10-minute cron lag.
 * Automatically cancelled if post is updated, rescheduled, or deleted.
 */
export const publishAtScheduledTime = inngest.createFunction(
  {
    id: "publish-at-scheduled-time",
    name: "Publish At Scheduled Time",
    triggers: [
      { event: "post.scheduled" },
      { event: "post/scheduled" },
    ],
    cancelOn: [
      { event: "post.cancelled", match: "data.postId" },
      { event: "post/cancelled", match: "data.postId" },
    ],
    retries: 3,
  },
  async ({ event, step, logger }) => {
    const { postId, scheduledAt } = event.data;

    if (!postId || !scheduledAt) {
      logger.error("[publish-at-time:invalid-payload]", { eventData: event.data });
      return { skipped: true, reason: "missing_required_fields" };
    }

    const targetDate = new Date(scheduledAt);
    const now = new Date();

    // If target date is in the future, sleep until exact due time
    if (targetDate > now) {
      logger.info("[publish-at-time:sleep-until]", {
        postId,
        scheduledAt,
        waitMs: targetDate.getTime() - now.getTime(),
      });
      await step.sleepUntil("wait-until-due", targetDate);
    } else {
      logger.info("[publish-at-time:immediate-dispatch]", { postId, scheduledAt });
    }

    // Dispatch the publish event to trigger the atomic publisher
    await step.sendEvent("dispatch-publish-event", {
      name: "post.publish.requested",
      data: {
        postId,
      },
    });

    return {
      dispatched: true,
      postId,
      dispatchedAt: new Date().toISOString(),
    };
  }
);
