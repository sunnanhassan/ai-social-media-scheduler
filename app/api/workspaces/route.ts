import { NextResponse } from "next/server";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import {
  fetchUserWorkspacesWithResilience,
  createWorkspace,
} from "@/lib/workspaces/workspace-service";

export async function GET() {
  try {
    const { userId } = await getInsforgeServerClient();
    const result = await fetchUserWorkspacesWithResilience(userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.warn("[GET /api/workspaces] Fallback engaged:", error?.message);
    const result = await fetchUserWorkspacesWithResilience(null);
    return NextResponse.json(result);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await getInsforgeServerClient();
    const body = await req.json();

    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    const { workspace, isFallback } = await createWorkspace(
      userId || "demo-user",
      {
        name: body.name.trim(),
        color: body.color,
        icon: body.icon,
        ai_persona: body.ai_persona,
      }
    );

    return NextResponse.json({ workspace, isFallback }, { status: 201 });
  } catch (error: any) {
    console.warn("[POST /api/workspaces] Failed to create:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

