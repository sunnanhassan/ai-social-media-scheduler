import { inngest } from "../client";
import { runAgentEngine } from "@/lib/agent/engine";
import { getInsforgeAdminClient } from "@/lib/insforge-server";

/**
 * Weekly autonomous planner that runs every Monday at 08:00 UTC.
 * Inspects empty schedule slots, reads backlog ideas, and prepares drafts
 * for user approval on the Kanban board.
 */
export const agentWeeklyPlannerCron = inngest.createFunction(
  {
    id: "agent-weekly-planner-cron",
    name: "Agent Weekly Content Planner",
    triggers: [
      { cron: "0 8 * * 1" }, // Every Monday 08:00 UTC
      { event: "agent.plan.requested" },
      { event: "agent/plan.requested" },
    ],
    retries: 2,
  },
  async ({ step, logger, event }) => {
    const targetUserId = (event?.data as any)?.userId || "user_demo_101";

    const planSummary = await step.run("generate-weekly-plan", async () => {
      logger.info("[agent-planner:start]", { userId: targetUserId });

      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextSunday.getDate() + 6);

      const prompt = `Review my active channels and ideas. Generate 3 draft posts for the upcoming week (${nextMonday.toLocaleDateString()} to ${nextSunday.toLocaleDateString()}) distributed across available slots.`;

      const result = await runAgentEngine({
        userId: targetUserId,
        runId: `planner-${Date.now()}`,
        autonomy: "planner",
        messages: [{ role: "user", content: prompt }],
      });

      logger.info("[agent-planner:completed]", {
        userId: targetUserId,
        stepsExecuted: result.steps.length,
      });

      return result;
    });

    return {
      success: true,
      userId: targetUserId,
      summary: planSummary.reply,
      stepsCount: planSummary.steps.length,
    };
  }
);
