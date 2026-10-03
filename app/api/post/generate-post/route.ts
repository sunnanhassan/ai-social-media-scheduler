import { getInsforgeServerClient } from "@/lib/insforge-server";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  buildSystemPrompt,
  buildUserPrompt,
  normalizeAction,
  sanitizeAIGeneratedText,
} from "@/lib/ai-prompt-builders";

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
        { error: "AI Post generation requires Pro or Premium plan" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { content = "", prompt = "", channelId, channel_id } = body;
    const targetChannelId = channelId || channel_id;

    const normalizedAction = normalizeAction(body.action);
    if (!normalizedAction) {
      return NextResponse.json(
        {
          error:
            "Invalid action. Supported actions are: generate, rephrase, shorten, expand",
        },
        { status: 400 }
      );
    }

    let channelType: string | undefined;
    let characterLimit: number | undefined;

    const { insforge } = await getInsforgeServerClient();

    if (targetChannelId) {
      // First check channel_types
      const { data: channelData } = await insforge.database
        .from("channel_types")
        .select("type, character_limit")
        .eq("id", targetChannelId)
        .maybeSingle();

      if (channelData) {
        channelType = channelData.type;
        characterLimit = channelData.character_limit;
      } else {
        // If not directly a channel_type id, check user_channels
        const { data: userChannel } = await insforge.database
          .from("user_channels")
          .select("channel_types(type, character_limit)")
          .eq("id", targetChannelId)
          .maybeSingle();

        const typeInfo = (userChannel as any)?.channel_types;
        if (typeInfo) {
          channelType = typeInfo.type;
          characterLimit = typeInfo.character_limit;
        }
      }
    }

    let userPrompt: string;
    try {
      userPrompt = buildUserPrompt(normalizedAction, content, prompt);
    } catch (validationErr: any) {
      return NextResponse.json(
        { error: validationErr.message || "Invalid input parameters" },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(channelType, characterLimit);

    const completion = await insforge.ai.chat.completions.create({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
    });

    const rawResponse = completion.choices[0]?.message?.content ?? "";
    const sanitizedContent = sanitizeAIGeneratedText(
      rawResponse,
      characterLimit
    );

    return NextResponse.json({
      content: sanitizedContent,
      characterCount: sanitizedContent.length,
      characterLimit: characterLimit || 3000,
      channelType: channelType || "general",
      action: normalizedAction,
    });
  } catch (error: any) {
    console.error("[POST /api/post/generate-post]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate post. Please try again." },
      { status: 500 }
    );
  }
}