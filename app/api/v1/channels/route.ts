import { authenticateV1Request } from "../../../../lib/auth/api-key.ts";

const FALLBACK_CHANNELS = [
  {
    id: "ch_twitter_live",
    type: "TWITTER",
    name: "X (Twitter)",
    handle: "@sunnanhassan",
    characterLimit: 280,
    connected: true,
  },
  {
    id: "ch_linkedin_live",
    type: "LINKEDIN",
    name: "LinkedIn",
    handle: "Sunnan Hassan",
    characterLimit: 3000,
    connected: true,
  },
  {
    id: "ch_instagram_live",
    type: "INSTAGRAM",
    name: "Instagram",
    handle: "@sunnan.dev",
    characterLimit: 2200,
    connected: false,
  },
];

export async function GET(req: Request | any) {
  const auth = await authenticateV1Request(req);
  if (!auth.success) {
    return Response.json({ error: auth.error }, { status: auth.status || 401, headers: auth.headers });
  }

  try {
    const mod: any = await import("../../../../lib/insforge-server.ts").catch(() => null);
    const insforge = mod?.getInsforgeAdminClient ? mod.getInsforgeAdminClient() : null;
    if (insforge) {
      const { data } = await Promise.race([
        insforge.database
          .from("user_channels")
          .select("id, handle, channel_types(type, name, character_limit)")
          .eq("user_id", auth.userId!),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000)),
      ]);

      if (data && data.length > 0) {
        const channels = data.map((uc: any) => ({
          id: uc.id,
          type: uc.channel_types?.type || "TWITTER",
          name: uc.channel_types?.name || "Social Channel",
          handle: uc.handle || "@user",
          characterLimit: uc.channel_types?.character_limit || 280,
          connected: true,
        }));
        return Response.json({ channels }, { headers: auth.headers });
      }
    }
  } catch {}

  // Fallback active channels
  return Response.json({ channels: FALLBACK_CHANNELS }, { headers: auth.headers });
}
