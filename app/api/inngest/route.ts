import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { publishScheduledPost, publishScheduledPostsCron } from "@/inngest/functions/publish-scheduled-posts";
import { publishAtScheduledTime } from "@/inngest/functions/publish-at-time";
import { agentWeeklyPlannerCron } from "@/inngest/functions/agent-weekly-planner";

import { fetchPostAnalyticsDurable, syncRecentPostMetricsCron } from "@/inngest/functions/fetch-post-analytics";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    publishScheduledPostsCron,
    publishScheduledPost,
    publishAtScheduledTime,
    agentWeeklyPlannerCron,
    fetchPostAnalyticsDurable,
    syncRecentPostMetricsCron,
  ],
});