import { insforgeCircuitBreaker } from "../insforge-circuit-breaker.ts";
import type { IdeaItem, IdeaGroup } from "./mock-ideas.ts";
import {
  DEFAULT_MOCK_GROUPS,
  getInMemoryMockGroups,
  resetInMemoryMockGroups,
} from "./mock-ideas.ts";

export type { IdeaItem, IdeaGroup };
export {
  DEFAULT_MOCK_GROUPS,
  getInMemoryMockGroups,
  resetInMemoryMockGroups,
};

async function getServerClient() {
  const mod = await import("../insforge-server.ts");
  return mod.getInsforgeServerClient();
}

export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Fetches all idea groups and user ideas with circuit-breaker protection and fast fallback.
 */
export async function fetchIdeaGroupsWithResilience(userId: string | null) {
  if (!userId) {
    return { groups: getInMemoryMockGroups(), isFallback: true };
  }

  const queryTask = async () => {
    const { insforge } = await getServerClient();
    const [groupsRes, ideasRes] = await Promise.all([
      insforge.database
        .from("idea_groups")
        .select("*")
        .order("sort_order", { ascending: true }),
      insforge.database
        .from("ideas")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true }),
    ]);
    return { groupsRes, ideasRes };
  };

  const { data: result, isFallback } = await insforgeCircuitBreaker.execute(
    queryTask,
    {
      groupsRes: { data: null, error: { message: "Fallback" } },
      ideasRes: { data: null, error: null },
    } as any,
    800
  );

  const { groupsRes, ideasRes } = result;
  if (isFallback || groupsRes.error || !groupsRes.data?.length) {
    return { groups: getInMemoryMockGroups(), isFallback: true };
  }

  const ideas = ideasRes.data ?? [];
  const groups: IdeaGroup[] = (groupsRes.data || []).map((group: any) => ({
    id: group.id,
    title: group.name || group.title,
    ideas: ideas
      .filter((idea: any) => idea.group_id === group.id)
      .map((idea: any) => ({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        images: Array.isArray(idea.images) ? idea.images : [],
        columnId: idea.group_id,
        sortOrder: idea.sort_order,
      })),
  }));

  return { groups, isFallback: false };
}

/**
 * Creates an idea with optimistic mock persistence and circuit breaker fallback.
 */
export async function createIdeaWithResilience(userId: string | null, payload: any) {
  const { groupId, columnId, title, content, description, images, sortOrder } = payload;
  const ideaTitle = title || content;
  const resolvedColumnId = groupId || columnId || "col-backlog";
  const ideaId = payload.id && !payload.id.startsWith("temp-") ? payload.id : `idea-${Date.now()}`;

  const mockItem: IdeaItem = {
    id: ideaId,
    title: ideaTitle,
    description: description || "",
    images: Array.isArray(images) ? images : [],
    columnId: resolvedColumnId,
    sortOrder: typeof sortOrder === "number" ? sortOrder : 1000,
  };

  if (!userId || !UUID_REGEX.test(resolvedColumnId) || !insforgeCircuitBreaker.isAvailable()) {
    const store = getInMemoryMockGroups();
    const targetCol = store.find((c) => c.id === resolvedColumnId) || store[0];
    if (targetCol) {
      targetCol.ideas.unshift(mockItem);
    }
    return { idea: mockItem, isLocalMock: true };
  }

  try {
    const { insforge } = await getServerClient();
    const { data, error } = await insforge.database
      .from("ideas")
      .insert({
        user_id: userId,
        group_id: resolvedColumnId,
        title: ideaTitle,
        description: description || null,
        images: Array.isArray(images) ? images : [],
        sort_order: mockItem.sortOrder,
      })
      .select()
      .single();

    if (error || !data) {
      return { idea: mockItem, isLocalMock: true };
    }

    return {
      idea: {
        ...data,
        columnId: data.group_id,
        sortOrder: data.sort_order,
      },
      isLocalMock: false,
    };
  } catch {
    return { idea: mockItem, isLocalMock: true };
  }
}

/**
 * Updates an idea with drag-and-drop resilience and mock ID support.
 */
export async function updateIdeaWithResilience(userId: string | null, id: string, updates: any) {
  const isMock = !UUID_REGEX.test(id) || id.startsWith("mock-") || id.startsWith("idea-") || id.startsWith("temp-");

  if (!userId || isMock || !insforgeCircuitBreaker.isAvailable()) {
    const store = getInMemoryMockGroups();
    const targetColId = updates.groupId || updates.columnId;
    let foundIdea: IdeaItem | null = null;

    for (const col of store) {
      const idx = col.ideas.findIndex((i) => i.id === id);
      if (idx !== -1) {
        [foundIdea] = col.ideas.splice(idx, 1);
        break;
      }
    }

    const updatedItem: IdeaItem = {
      ...(foundIdea || { id, title: updates.title || updates.content || "Idea", columnId: targetColId || "col-backlog" }),
      ...(updates.title || updates.content ? { title: updates.title || updates.content } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.images !== undefined ? { images: updates.images } : {}),
      ...(targetColId ? { columnId: targetColId } : {}),
      ...(updates.sortOrder !== undefined ? { sortOrder: updates.sortOrder } : {}),
    };

    const destCol = store.find((c) => c.id === updatedItem.columnId) || store[0];
    if (destCol) {
      destCol.ideas.push(updatedItem);
      destCol.ideas.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }

    return { idea: updatedItem, isLocalMock: true };
  }

  try {
    const { insforge } = await getServerClient();
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.groupId !== undefined) dbUpdates.group_id = updates.groupId;
    if (updates.columnId !== undefined) dbUpdates.group_id = updates.columnId;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
    if (updates.content !== undefined) dbUpdates.title = updates.content;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.images !== undefined) dbUpdates.images = updates.images;

    const { data, error } = await insforge.database
      .from("ideas")
      .update(dbUpdates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      return { idea: { id, ...updates }, isLocalMock: true };
    }

    return {
      idea: {
        ...data,
        columnId: data.group_id,
        sortOrder: data.sort_order,
      },
      isLocalMock: false,
    };
  } catch {
    return { idea: { id, ...updates }, isLocalMock: true };
  }
}

/**
 * Deletes an idea with mock ID bypass and circuit breaker resilience.
 */
export async function deleteIdeaWithResilience(userId: string | null, id: string) {
  const isMock = !UUID_REGEX.test(id) || id.startsWith("mock-") || id.startsWith("idea-") || id.startsWith("temp-");

  if (!userId || isMock || !insforgeCircuitBreaker.isAvailable()) {
    const store = getInMemoryMockGroups();
    for (const col of store) {
      const idx = col.ideas.findIndex((i) => i.id === id);
      if (idx !== -1) {
        col.ideas.splice(idx, 1);
        break;
      }
    }
    return { success: true, isLocalMock: true };
  }

  try {
    const { insforge } = await getServerClient();
    await insforge.database
      .from("ideas")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    return { success: true, isLocalMock: false };
  } catch {
    return { success: true, isLocalMock: true };
  }
}
