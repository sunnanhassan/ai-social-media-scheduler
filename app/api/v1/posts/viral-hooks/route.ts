import { authenticateV1Request } from "../../../../../lib/auth/api-key.ts";

export function generateTemplateHooks(rawContent: string) {
  const firstLine = (rawContent || "").split("\n")[0].trim();
  const topic = firstLine.replace(/^(drafting|writing|sharing|here is|here's|my take on)/i, "").trim() || "modern web architecture";

  return [
    {
      angle: "Curiosity",
      title: "Curiosity Gap",
      hook: `Most people completely misunderstand ${topic}. Here is what actually matters:`,
    },
    {
      angle: "Contrarian",
      title: "Bold Stance",
      hook: `Stop doing ${topic} the traditional way. Here is the modern alternative:`,
    },
    {
      angle: "Story",
      title: "Result-Driven",
      hook: `We tested 5 different approaches to ${topic}. The data will surprise you:`,
    },
  ];
}

export async function POST(req: Request | any) {
  const auth = await authenticateV1Request(req);
  if (!auth.success) {
    return Response.json({ error: auth.error }, { status: auth.status || 401, headers: auth.headers });
  }

  const body = await req.json().catch(() => ({}));
  const content = body.content || "";

  if (!content || typeof content !== "string" || content.trim().length < 5) {
    return Response.json(
      { error: "Content too short to analyze hooks (minimum 5 characters)." },
      { status: 400, headers: auth.headers }
    );
  }

  const hooks = generateTemplateHooks(content);
  return Response.json({ hooks, originalContent: content }, { headers: auth.headers });
}
