import { getInsforgeServerClient } from "@/lib/insforge-server";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const FALLBACK_IDEAS = [
  {
    title: "Behind the Scenes: How We Built Our Queue",
    description: "Share the technical hurdle of preventing race conditions in automated publishing.",
  },
  {
    title: "Why Most Creators Fail at Consistency",
    description: "Debunk the myth that you need to write daily instead of batch scheduling once a week.",
  },
  {
    title: "5 Tools Every Solo Founder Needs in 2026",
    description: "Curated toolkit breakdown highlighting Next.js 16, Inngest, and AI Copilots.",
  },
];

export async function POST(request: NextRequest) {
  try {
    const { has, userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isDev = process.env.NODE_ENV === "development";
    const canUseAI =
      isDev || (has ? has({ plan: "pro" }) || has({ plan: "premium" }) : true);
    if (!canUseAI) {
      return NextResponse.json(
        { error: "AI Idea generation requires Pro or Premium plan" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { businessType, targetAudience, action, title, description } = body;

    const isExpandAngles = action === "expand_angles" || Boolean(title);

    if (!isExpandAngles && (!businessType || !targetAudience)) {
      return NextResponse.json(
        { error: "Missing businessType or targetAudience" },
        { status: 400 }
      );
    }

    const { insforge } = await getInsforgeServerClient();

    const systemPrompt = isExpandAngles
      ? `You are an expert social media content strategist.
Transform the provided core idea into 5 distinct angles:
1. Actionable How-To Guide
2. Contrarian / Counter-Intuitive Truth
3. Personal Story / Real Lesson Learned
4. Curated Checklist or Framework
5. Engaging Discussion / Poll Question
Return ONLY valid JSON with an "ideas" array containing objects with "title" and "description". No markdown.`
      : `You are a social media content ideation assistant.
Return ONLY valid JSON with an "ideas" array containing 3 objects with "title" and "description". No markdown.`;

    const userPrompt = isExpandAngles
      ? `Base Idea: "${title || ""}". Context: "${description || ""}". Generate 5 compelling post angles.`
      : `Business type: ${businessType}. Target audience: ${targetAudience}. Generate 3 fresh ideas.`;

    try {
      const completionPromise = insforge.ai.chat.completions.create({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      });

      const timeoutPromise = new Promise<{ choices: any[] }>((resolve) =>
        setTimeout(() => resolve({ choices: [] }), 4000)
      );

      const result = await Promise.race([completionPromise, timeoutPromise]);
      let text = result.choices[0]?.message?.content ?? "";
      text = text.trim();
      if (text.startsWith("```")) {
        text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      }

      let parsed: { ideas?: { title: string; description: string }[] } = {};
      try {
        parsed = JSON.parse(text);
      } catch {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end !== -1 && end > start) {
          try {
            parsed = JSON.parse(text.slice(start, end + 1));
          } catch (e) {
            console.warn("JSON substring parse fallback failed:", e);
          }
        }
      }

      const ideas = Array.isArray(parsed.ideas) && parsed.ideas.length > 0
        ? parsed.ideas
        : FALLBACK_IDEAS;

      return NextResponse.json({ ideas });
    } catch (aiErr: any) {
      console.warn("[POST /api/idea/generate-ideas] AI Gateway fallback:", aiErr?.message);
      return NextResponse.json({ ideas: FALLBACK_IDEAS, isFallback: true });
    }
  } catch (error) {
    console.error("Error generating ideas:", error);
    return NextResponse.json({ ideas: FALLBACK_IDEAS, isFallback: true });
  }
}
