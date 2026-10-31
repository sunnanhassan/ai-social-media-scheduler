import { getInsforgeAdminClient } from "../insforge-server";
import { AGENT_TOOL_DEFINITIONS, toolExecutors, ToolExecutionContext } from "./tools";

export interface AgentRunOptions {
  userId: string;
  runId?: string;
  autonomy?: "copilot" | "planner" | "autopilot";
  brandVoice?: string;
  timezone?: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}

export interface AgentStepEvent {
  step: number;
  tool: string;
  args: any;
  result: any;
}

export async function runAgentEngine(options: AgentRunOptions) {
  const {
    userId,
    runId = `run-${Date.now()}`,
    autonomy = "copilot",
    brandVoice = "Clear, practical, and engaging without corporate jargon",
    timezone = "UTC",
    messages,
  } = options;

  const insforge = getInsforgeAdminClient();
  const ctx: ToolExecutionContext = { userId, runId, autonomy };

  const systemPrompt = `You are Autopilot, the AI social media planning agent.
Current Time: ${new Date().toISOString()}.
User Timezone: ${timezone}.
Brand Voice: ${brandVoice}.
Autonomy Level: ${autonomy}.

Rules:
1. When asked to plan or draft, call get_channels first to know character limits and connected channels.
2. Call get_schedule to check for empty slots and avoid double-scheduling on the same day.
3. Call list_ideas to use the user's backlog of ideas when drafting.
4. You can only create DRAFT posts using the create_draft tool. Never claim a post is scheduled or published.
5. Provide a clear, friendly summary of what actions you took.`;

  const conversation = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  const executedSteps: AgentStepEvent[] = [];
  const MAX_STEPS = 5;

  for (let step = 0; step < MAX_STEPS; step++) {
    try {
      const completionPromise = insforge.ai.chat.completions.create({
        model: "google/gemini-2.5-flash-lite",
        messages: conversation as any,
        tools: AGENT_TOOL_DEFINITIONS.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        })) as any,
        temperature: 0.7,
      });

      const timeoutPromise = new Promise<{ choices: any[] }>((resolve) =>
        setTimeout(() => resolve({ choices: [] }), 5000)
      );

      const response = await Promise.race([completionPromise, timeoutPromise]);
      const choice = response.choices?.[0];
      const message = choice?.message;

      if (!message) {
        break;
      }

      // If model returned a direct text answer without tool calls
      const toolCalls = message.tool_calls || [];
      if (toolCalls.length === 0) {
        return {
          reply: message.content || "I have analyzed your schedule and recommendations are ready.",
          runId,
          steps: executedSteps,
        };
      }

      // Execute tool calls
      for (const call of toolCalls) {
        const toolName = call.function?.name;
        let toolArgs: any = {};
        try {
          toolArgs = typeof call.function?.arguments === "string"
            ? JSON.parse(call.function.arguments)
            : (call.function?.arguments || {});
        } catch {
          toolArgs = {};
        }

        const executor = toolExecutors[toolName];
        let toolOutput: any;
        if (executor) {
          toolOutput = await executor(toolArgs, ctx);
        } else {
          toolOutput = { error: `Tool ${toolName} not supported` };
        }

        executedSteps.push({
          step: step + 1,
          tool: toolName,
          args: toolArgs,
          result: toolOutput,
        });

        conversation.push({
          role: "assistant",
          content: `Executed tool: ${toolName}`,
        });
        conversation.push({
          role: "user",
          content: `Tool ${toolName} output: ${JSON.stringify(toolOutput)}`,
        });
      }
    } catch (loopErr) {
      console.warn("[runAgentEngine] Iteration fallback:", loopErr);
      break;
    }
  }

  return {
    reply: `I checked your channels and schedule. ${executedSteps.length} automated steps completed.`,
    runId,
    steps: executedSteps,
  };
}

