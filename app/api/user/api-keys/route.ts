import { NextRequest, NextResponse } from "next/server";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { listUserApiKeys, registerApiKey } from "@/lib/auth/api-key";

export async function GET() {
  const { userId } = await getInsforgeServerClient();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await listUserApiKeys(userId);
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const { userId } = await getInsforgeServerClient();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = (body.name || "ChatGPT Action").trim();

  const { rawKey, key } = await registerApiKey(userId, name);
  return NextResponse.json({ rawKey, key }, { status: 201 });
}
