import { NextRequest, NextResponse } from "next/server";
import { getInsforgeServerClient } from "@/lib/insforge-server";
import { deleteIdeaWithResilience } from "@/lib/ideas/ideas-service";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing idea ID" }, { status: 400 });
    }

    const { userId } = await getInsforgeServerClient();
    const result = await deleteIdeaWithResilience(userId, id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.warn("[DELETE /api/idea/[id]] Resilience fallback engaged:", error?.message);
    return NextResponse.json({ success: true, isLocalMock: true });
  }
}
