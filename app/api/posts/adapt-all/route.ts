import { getInsforgeServerClient } from "@/lib/insforge-server";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  buildSystemPrompt,
  sanitizeAIGeneratedText,
} from "@/lib/ai-prompt-builders";

interface ChannelTarget {
  id: string;
  type: string;
  name: string;
  limit: number;
}

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
        { error: "Multi-channel adaptation requires Pro or Premium plan" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { masterContent = "", channelIds = [], tone, brandVoice } = body;

    if (!masterContent || typeof masterContent !== "string" || !masterContent.trim()) {
      return NextResponse.json({ error: "Missing or empty masterContent" }, { status: 400 });
    }

    const { insforge } = await getInsforgeServerClient();

    // 1. Resolve channel targets
    let targets: ChannelTarget[] = [];
    if (Array.isArray(channelIds) && channelIds.length > 0) {
      const { data: userChannels } = await insforge.database
        .from("user_channels")
        .select("id, channel_types(id, type, name, character_limit)")
        .in("id", channelIds);

      if (userChannels && userChannels.length > 0) {
        targets = userChannels.map((uc: any) => ({
          id: uc.id,
          type: uc.channel_types?.type || "TWITTER",
          name: uc.channel_types?.name || "Social Channel",
          limit: uc.channel_types?.character_limit || 280,
        }));
      }
    }

    // Fallback: If no specific user channels requested, default to Twitter, LinkedIn, Instagram
    if (targets.length === 0) {
      targets = [
        { id: "target-twitter", type: "TWITTER", name: "X (Twitter)", limit: 280 },
        { id: "target-linkedin", type: "LINKEDIN", name: "LinkedIn", limit: 3000 },
        { id: "target-instagram", type: "INSTAGRAM", name: "Instagram", limit: 2200 },
      ];
    }

    // 2. Generate adaptations in parallel for all target channels
    const adaptationPromises = targets.map(async (target) => {
      try {
        const sysPrompt = buildSystemPrompt(target.type, target.limit);
        const userPrompt = [
          `Master Draft to Adapt: "${masterContent.trim()}"`,
          tone ? `Tone preference: ${tone}.` : "",
          brandVoice ? `Brand voice: ${brandVoice}.` : "",
          `Tailor this message specifically for ${target.name}. Keep strictly under ${target.limit} characters.`,
        ]
          .filter(Boolean)
          .join("\n");

        const completionPromise = insforge.ai.chat.completions.create({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: sysPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
        });

        const timeoutPromise = new Promise<{ choices: any[] }>((resolve) =>
          setTimeout(() => resolve({ choices: [] }), 4000)
        );

        const completion = await Promise.race([completionPromise, timeoutPromise]);
        let adapted = completion.choices[0]?.message?.content ?? "";

        // If AI timed out or empty, apply smart offline formatting
        if (!adapted) {
          adapted = createOfflineAdaptation(masterContent, target.type, target.limit);
        }

        const sanitized = sanitizeAIGeneratedText(adapted, target.limit);
        return {
          userChannelId: target.id,
          channelType: target.type,
          channelName: target.name,
          content: sanitized,
          characterCount: sanitized.length,
          characterLimit: target.limit,
          isWithinLimit: sanitized.length <= target.limit,
        };
      } catch (genErr) {
        console.warn(`[adapt-all] Generation fallback for ${target.type}:`, genErr);
        const fallback = sanitizeAIGeneratedText(
          createOfflineAdaptation(masterContent, target.type, target.limit),
          target.limit
        );
        return {
          userChannelId: target.id,
          channelType: target.type,
          channelName: target.name,
          content: fallback,
          characterCount: fallback.length,
          characterLimit: target.limit,
          isWithinLimit: fallback.length <= target.limit,
        };
      }
    });

    const results = await Promise.all(adaptationPromises);
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("[POST /api/posts/adapt-all]", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

/**
 * Deterministic offline adaptation fallback when AI model is slow or unreachable.
 */
function createOfflineAdaptation(content: string, type: string, limit: number): string {
  const clean = content.trim();
  const lower = type.toLowerCase();

  if (lower.includes("twitter") || lower === "x") {
    if (clean.length <= 250) return clean;
    return clean.slice(0, 245).trim() + "...";
  }

  if (lower.includes("linkedin")) {
    return `${clean}\n\nWhat are your thoughts on this? Drop a comment below. 👇\n\n#leadership #productivity #growth`;
  }

  if (lower.includes("instagram")) {
    return `${clean}\n.\n.\n.\n#inspiration #buildinpublic #creators`;
  }

  return clean.slice(0, limit);
}

