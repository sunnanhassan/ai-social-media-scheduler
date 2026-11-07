import { authenticateV1Request } from "../../../../../lib/auth/api-key.ts";

async function getAdminClientSafe() {
  try {
    const mod = await import("../../../../../lib/insforge-server.ts").catch(() => null);
    return mod?.getInsforgeAdminClient ? mod.getInsforgeAdminClient() : null;
  } catch {
    return null;
  }
}

async function sendInngestSafe(event: any) {
  try {
    const mod = await import("../../../../../inngest/client.ts").catch(() => null);
    if (mod?.inngest?.send) {
      await mod.inngest.send(event);
    }
  } catch {}
}

export async function GET(
  req: Request | any,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateV1Request(req);
  if (!auth.success) {
    return Response.json({ error: auth.error }, { status: auth.status || 401, headers: auth.headers });
  }

  const { id } = await params;

  try {
    const insforge = await getAdminClientSafe();
    if (insforge) {
      const { data } = await Promise.race([
        insforge.database
          .from("scheduled_posts")
          .select("id, content, status, scheduled_at, created_at, user_id")
          .eq("id", id)
          .eq("user_id", auth.userId!)
          .maybeSingle(),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500)),
      ]);

      if (data) {
        return Response.json({ post: data }, { headers: auth.headers });
      }
    }
  } catch {}

  return Response.json({ error: "Post not found or unauthorized" }, { status: 404, headers: auth.headers });
}

export async function DELETE(
  req: Request | any,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateV1Request(req);
  if (!auth.success) {
    return Response.json({ error: auth.error }, { status: auth.status || 401, headers: auth.headers });
  }

  const { id } = await params;

  try {
    const insforge = await getAdminClientSafe();
    if (insforge) {
      await Promise.race([
        insforge.database
          .from("scheduled_posts")
          .delete()
          .eq("id", id)
          .eq("user_id", auth.userId!),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500)),
      ]);
    }
  } catch {}

  // Cancel Inngest exact-time sleep if pending
  await sendInngestSafe({
    name: "post.cancelled",
    data: { postId: id },
  });

  return Response.json(
    { success: true, message: `Post ${id} cancelled and deleted successfully.` },
    { headers: auth.headers }
  );
}
