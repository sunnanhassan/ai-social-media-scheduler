import { NextRequest, NextResponse } from "next/server";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { revokeApiKey } from "@/lib/auth/api-key";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await getInsforgeServerClient();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await revokeApiKey(userId, id);
  return NextResponse.json({ success: true, message: "API key revoked" });
}
