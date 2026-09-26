import { getInsforgeServerClient } from "@/lib/insforge-server";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_MOCK_GROUPS = [
  {
    id: "col-backlog",
    title: "Backlog",
    ideas: [
      {
        id: "idea-1",
        title: "Product Launch Announcement",
        description:
          "Thread breaking down the core value proposition, AI scheduler features, and early access discount.",
        images: [
          {
            url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80",
            path: "mock/launch.png",
          },
        ],
        columnId: "col-backlog",
        sortOrder: 0,
      },
      {
        id: "idea-2",
        title: "5 Lessons from Building in Public",
        description:
          "Share lessons learned about multi-platform OAuth, rate-limiting queues, and design systems.",
        images: [],
        columnId: "col-backlog",
        sortOrder: 1,
      },
    ],
  },
  {
    id: "col-progress",
    title: "In Progress",
    ideas: [
      {
        id: "idea-3",
        title: "Micro-SaaS Tech Stack Comparison",
        description:
          "Infographic comparing Next.js 16 App Router vs Vite SPA for SaaS applications.",
        images: [
          {
            url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&auto=format&fit=crop&q=80",
            path: "mock/stats.png",
          },
        ],
        columnId: "col-progress",
        sortOrder: 0,
      },
    ],
  },
  {
    id: "col-ready",
    title: "Ready to Schedule",
    ideas: [
      {
        id: "idea-4",
        title: "Weekly Growth Metric Roundup",
        description:
          "Recap our +240% engagement surge after shifting to automated timing optimization.",
        images: [],
        columnId: "col-ready",
        sortOrder: 0,
      },
    ],
  },
  {
    id: "col-done",
    title: "Published / Archived",
    ideas: [
      {
        id: "idea-5",
        title: "Customer Milestone Celebration",
        description:
          "A huge thank you to our first 1,000 active creators on the platform!",
        images: [],
        columnId: "col-done",
        sortOrder: 0,
      },
    ],
  },
];

export async function GET() {
  try {
    const { insforge, userId } = await getInsforgeServerClient();
    if (!userId) return NextResponse.json({ groups: DEFAULT_MOCK_GROUPS });

    const [ideasRes, groupsRes] = await Promise.all([
      insforge.database
        .from("ideas")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      insforge.database
        .from("idea_groups")
        .select("*")
        .order("created_at", { ascending: true }),
    ]);

    if (groupsRes.error || !groupsRes.data?.length) {
      return NextResponse.json({ groups: DEFAULT_MOCK_GROUPS });
    }

    const ideas = ideasRes.data ?? [];
    const groups = groupsRes.data.map((group) => ({
      id: group.id,
      title: group.name,
      ideas: ideas
        .filter((idea) => idea.group_id === group.id)
        .map((idea) => ({
          id: idea.id,
          title: idea.title,
          description: idea.description,
          images: idea.images ?? [],
          columnId: idea.group_id,
          sortOrder: idea.sort_order,
        })),
    }));

    return NextResponse.json({ groups });
  } catch (error) {
    console.warn("Using fallback ideas groups due to server error:", error);
    return NextResponse.json({ groups: DEFAULT_MOCK_GROUPS });
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, groupId, description, images, sortOrder } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    try {
      const { insforge, userId } = await getInsforgeServerClient();
      if (!userId) {
        return NextResponse.json({
          idea: {
            id: id || `mock-${Date.now()}`,
            title,
            description: description || "",
            images: images || [],
            columnId: groupId || "col-backlog",
            sortOrder: sortOrder || 0,
          },
        });
      }

      let resolvedGroupId = groupId;
      if (!resolvedGroupId || !UUID_REGEX.test(resolvedGroupId)) {
        const { data: defaultGroup } = await insforge.database
          .from("idea_groups")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .single();
        if (defaultGroup?.id) {
          resolvedGroupId = defaultGroup.id;
        }
      }

      const isUpdate = !!id && !id.startsWith("temp-") && UUID_REGEX.test(id);
      if (isUpdate) {
        const { data, error } = await insforge.database
          .from("ideas")
          .update({
            title,
            description,
            images: images || [],
            group_id: resolvedGroupId,
            sort_order: sortOrder,
          })
          .eq("id", id)
          .eq("user_id", userId)
          .select()
          .single();

        if (error) {
          console.warn("Update idea database warning:", error);
          return NextResponse.json({ idea: body });
        }
        return NextResponse.json({ idea: data });
      }

      const { data, error } = await insforge.database
        .from("ideas")
        .insert([{
          user_id: userId,
          title,
          description: description || "",
          images: images || [],
          group_id: resolvedGroupId,
          sort_order: sortOrder || 0,
        }])
        .select()
        .single();

      if (error) {
        console.warn("Insert idea database warning:", error);
        return NextResponse.json({ idea: body });
      }
      return NextResponse.json({ idea: data });
    } catch {
      return NextResponse.json({ idea: body });
    }
  } catch (error) {
    console.error("Error in POST /api/idea:", error);
    return NextResponse.json({ error: "Failed to save idea" }, { status: 500 });
  }
}
