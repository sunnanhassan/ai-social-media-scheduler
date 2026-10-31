import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { runAgentEngine } from "@/lib/agent/engine";

export async function POST(request: NextRequest) {
  try {
    const { has, userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isDev = process.env.NODE_ENV === "development";
    const canUseAgent =
      isDev || (has ? has({ plan: "pro" }) || has({ plan: "premium" }) : true);

    if (!canUseAgent) {
      return NextResponse.json(
        { error: "Autopilot AI Agent requires Pro or Premium plan" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { messages = [], brandVoice, timezone = "UTC" } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing or empty messages array" }, { status: 400 });
    }

    const result = await runAgentEngine({
      userId,
      messages,
      brandVoice,
      timezone,
      autonomy: "copilot",
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[POST /api/agent/chat]", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

