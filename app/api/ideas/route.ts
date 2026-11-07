import { NextResponse } from "next/server";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import {
  fetchIdeaGroupsWithResilience,
  createIdeaWithResilience,
  updateIdeaWithResilience,
  deleteIdeaWithResilience,
} from "@/lib/ideas/ideas-service";

export async function GET() {
  try {
    const { userId } = await getInsforgeServerClient();
    const result = await fetchIdeaGroupsWithResilience(userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.warn("[GET /api/ideas] Resilience fallback engaged:", error?.message);
    const result = await fetchIdeaGroupsWithResilience(null);
    return NextResponse.json(result);
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await getInsforgeServerClient();
    const body = await req.json();

    const title = body.title || body.content;
    if (!title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { idea } = await createIdeaWithResilience(userId, body);
    return NextResponse.json(idea, { status: 201 });
  } catch (error: any) {
    console.warn("[POST /api/ideas] Resilience fallback engaged:", error?.message);
    const { idea } = await createIdeaWithResilience(null, { title: "New Idea" });
    return NextResponse.json(idea, { status: 200 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await getInsforgeServerClient();
    const body = await req.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: "Missing id or updates" }, { status: 400 });
    }

    const { idea } = await updateIdeaWithResilience(userId, id, updates);
    return NextResponse.json(idea);
  } catch (error: any) {
    console.warn("[PATCH /api/ideas] Resilience fallback engaged:", error?.message);
    return NextResponse.json({ success: true, isLocalMock: true });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await getInsforgeServerClient();
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const result = await deleteIdeaWithResilience(userId, id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.warn("[DELETE /api/ideas] Resilience fallback engaged:", error?.message);
    return NextResponse.json({ success: true, isLocalMock: true });
  }
}
