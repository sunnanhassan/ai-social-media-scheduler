import { NextRequest, NextResponse } from "next/server";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import {
  updateWorkspace,
  deleteWorkspace,
} from "@/lib/workspaces/workspace-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await getInsforgeServerClient();
    const body = await req.json();

    const result = await updateWorkspace(
      userId || "demo-user",
      id,
      body.updates || body
    );
    return NextResponse.json(result);
  } catch (error: any) {
    console.warn("[PATCH /api/workspaces/[id]] Error:", error?.message);
    const status = error?.message === "Workspace not found" ? 404 : 500;
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await getInsforgeServerClient();

    const result = await deleteWorkspace(userId || "demo-user", id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.warn("[DELETE /api/workspaces/[id]] Error:", error?.message);
    const status =
      error?.message === "Cannot delete default workspace"
        ? 400
        : error?.message === "Workspace not found"
        ? 404
        : 500;
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status }
    );
  }
}

