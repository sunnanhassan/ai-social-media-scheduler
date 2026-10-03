/**
 * Supported AI Post Assistant actions
 */
export const AI_ACTIONS = ["generate", "rephrase", "shorten", "expand"] as const;
export type AIAction = (typeof AI_ACTIONS)[number];

/**
 * Validates and normalizes action string
 */
export function normalizeAction(action: string | null | undefined): AIAction | null {
  if (!action || typeof action !== "string") return null;
  const lower = action.toLowerCase().trim();
  if (AI_ACTIONS.includes(lower as AIAction)) {
    return lower as AIAction;
  }
  return null;
}

/**
 * Dynamically constructs system instructions based on platform constraints (e.g. Twitter vs LinkedIn)
 */
export function buildSystemPrompt(channelType?: string, limit?: number): string {
  const normalizedChannel = channelType?.toLowerCase().trim() || "";

  const systemPrompt = [
    "You are an expert social media copywriter and content strategist.",
    "Return only the final post text ready for publishing.",
    "Do not include any conversational preamble, greetings, quotes, or explanations (e.g., do not say 'Here is your post:').",
    "Do not use markdown heading symbols (#, ##) or code blocks.",
    "Return clean, plain text formatted appropriately for the target social platform.",
  ];

  if (normalizedChannel.includes("twitter") || normalizedChannel === "x") {
    systemPrompt.push(
      "Platform: Twitter/X.",
      "Style: Punchy, compelling hook in the first sentence, concise value, conversational tone.",
      "Use emojis sparingly and at most 1-2 relevant hashtags at the end.",
      `STRICT CONSTRAINT: Must be strictly under ${limit || 280} characters.`
    );
  } else if (normalizedChannel.includes("linkedin")) {
    systemPrompt.push(
      "Platform: LinkedIn.",
      "Style: Professional thought-leadership, engaging storytelling, clean paragraph breaks for readability.",
      "Include clear value takeaways or bullet points, followed by a thought-provoking closing question or call-to-action (CTA).",
      `STRICT CONSTRAINT: Must not exceed ${limit || 3000} characters.`
    );
  } else if (normalizedChannel.includes("instagram")) {
    systemPrompt.push(
      "Platform: Instagram.",
      "Style: Highly engaging visual caption, relatable hook, line breaks for readability, and 3-5 relevant hashtags at the bottom.",
      `STRICT CONSTRAINT: Must not exceed ${limit || 2200} characters.`
    );
  } else if (normalizedChannel.includes("facebook")) {
    systemPrompt.push(
      "Platform: Facebook.",
      "Style: Warm, community-oriented, discussion-starter tone encouraging comments and shares.",
      `STRICT CONSTRAINT: Must not exceed ${limit || 5000} characters.`
    );
  } else {
    const generalLimit = limit || 3000;
    systemPrompt.push(
      `Format for social media with engaging style. Must not exceed ${generalLimit} characters.`
    );
  }

  return systemPrompt.join("\n");
}

/**
 * Translates user intent into high-quality output requests
 */
export function buildUserPrompt(action: AIAction, content?: string, prompt?: string): string {
  const cleanContent = content?.trim() || "";
  const cleanPrompt = prompt?.trim() || "";

  switch (action) {
    case "generate":
      if (!cleanPrompt) {
        throw new Error("Prompt is required for post generation");
      }
      if (cleanContent) {
        return `Write an engaging social media post based on this outline/context:\n${cleanContent}\n\nAdditional instructions:\n${cleanPrompt}`;
      }
      return `Write a high-converting, engaging social media post based on the following instructions:\n${cleanPrompt}`;

    case "rephrase":
      if (!cleanContent) {
        throw new Error("Content is required for rephrasing");
      }
      if (cleanPrompt) {
        return `Rephrase and polish this social media post to make it more engaging while preserving its core message:\n\n${cleanContent}\n\nSpecific style/guidance: ${cleanPrompt}`;
      }
      return `Rephrase and polish this social media post to make it fresher, more engaging, and impactful while keeping the core message and meaning intact:\n\n${cleanContent}`;

    case "shorten":
      if (!cleanContent) {
        throw new Error("Content is required to shorten");
      }
      return `Condense and shorten the following social media post into a punchier, concise version without losing its essential insight or call-to-action:\n\n${cleanContent}`;

    case "expand":
      if (!cleanContent) {
        throw new Error("Content is required to expand");
      }
      if (cleanPrompt) {
        return `Expand this social media post by adding helpful supporting points, depth, and detail while keeping the same tone:\n\n${cleanContent}\n\nAdditional instructions: ${cleanPrompt}`;
      }
      return `Expand this social media post with compelling supporting details, concrete takeaways, and enhanced depth while maintaining a natural, authentic tone:\n\n${cleanContent}`;

    default:
      throw new Error(`Unsupported action: ${action}`);
  }
}

/**
 * Cleans AI output and clamps to platform character limit if needed
 */
export function sanitizeAIGeneratedText(rawText: string, characterLimit?: number): string {
  if (!rawText) return "";

  let cleaned = rawText.trim();

  // Strip markdown code fences if model wrapped response in ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:markdown|text)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  // Strip surrounding quotes if model added wrapping quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Enforce character limit safety clamping if model exceeded limit
  const limit = characterLimit && characterLimit > 0 ? characterLimit : undefined;
  if (limit && cleaned.length > limit) {
    // Try to cut at the last sentence boundary within limit
    const truncated = cleaned.slice(0, limit);
    const lastPunctuation = Math.max(
      truncated.lastIndexOf("."),
      truncated.lastIndexOf("!"),
      truncated.lastIndexOf("?")
    );

    // If there is a clean sentence ending in the latter half of the text, cut there
    if (lastPunctuation > limit * 0.5) {
      cleaned = truncated.slice(0, lastPunctuation + 1).trim();
    } else {
      // Otherwise cut at last space so we don't break a word in half
      const lastSpace = truncated.lastIndexOf(" ");
      cleaned = lastSpace > 0 ? truncated.slice(0, lastSpace).trim() : truncated.trim();
    }
  }

  return cleaned;
}
