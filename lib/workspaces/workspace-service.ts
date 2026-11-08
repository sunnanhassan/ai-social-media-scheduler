import { insforgeCircuitBreaker } from "../insforge-circuit-breaker.ts";
import type { WorkspaceItem } from "../../types/workspace.type.ts";
import { DEFAULT_MOCK_WORKSPACES } from "../../constants/mock-workspaces.ts";

let inMemoryWorkspaces: WorkspaceItem[] = JSON.parse(
  JSON.stringify(DEFAULT_MOCK_WORKSPACES)
);

export function getInMemoryWorkspaces(): WorkspaceItem[] {
  return inMemoryWorkspaces;
}

export function resetInMemoryWorkspaces(): void {
  inMemoryWorkspaces = JSON.parse(JSON.stringify(DEFAULT_MOCK_WORKSPACES));
}

async function getServerClient() {
  const mod = await import("../insforge-server.ts");
  return mod.getInsforgeServerClient();
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || "brand";
}

/**
 * Fetches all workspaces for a user with auto-provisioning and circuit-breaker protection.
 */
export async function fetchUserWorkspacesWithResilience(userId: string | null) {
  if (!userId) {
    return { workspaces: getInMemoryWorkspaces(), isFallback: true };
  }

  const queryTask = async () => {
    const { insforge } = await getServerClient();
    const res = await insforge.database
      .from("workspaces")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    return res;
  };

  const { data: res, isFallback } = await insforgeCircuitBreaker.execute(
    queryTask,
    { data: null, error: { message: "Fallback" } } as any,
    800
  );

  if (isFallback || res.error || !res.data) {
    return { workspaces: getInMemoryWorkspaces(), isFallback: true };
  }

  // Auto-provision if user has 0 workspaces
  if (res.data.length === 0) {
    try {
      const { insforge } = await getServerClient();
      const defaultBrand = {
        user_id: userId,
        name: "Personal Brand",
        slug: "personal-brand",
        color: "#10B981",
        icon: "user",
        is_default: true,
        ai_persona: {
          tone: "thoughtful, authentic, educator",
          industry: "tech & software development",
          target_audience: "developers and founders",
        },
      };

      const insertRes = await insforge.database
        .from("workspaces")
        .insert([defaultBrand])
        .select()
        .single();

      if (insertRes.data) {
        return { workspaces: [insertRes.data as WorkspaceItem], isFallback: false };
      }
    } catch {
      // Fallback if auto-provision insert fails
    }
    return { workspaces: getInMemoryWorkspaces(), isFallback: true };
  }

  return { workspaces: res.data as WorkspaceItem[], isFallback: false };
}

/**
 * Creates a new workspace.
 */
export async function createWorkspace(
  userId: string,
  params: {
    name: string;
    color?: string;
    icon?: string;
    ai_persona?: { tone: string; industry: string; target_audience: string };
  }
): Promise<{ workspace: WorkspaceItem; isFallback: boolean }> {
  const name = params.name.trim();
  if (!name) {
    throw new Error("Workspace name is required");
  }

  const slug = generateSlug(name);
  const color = params.color || "#10B981";
  const icon = params.icon || "sparkles";
  const aiPersona = params.ai_persona || {
    tone: "professional",
    industry: "creator",
    target_audience: "general",
  };

  if (!insforgeCircuitBreaker.isAvailable()) {
    const newWs: WorkspaceItem = {
      id: `ws-${Date.now()}`,
      name,
      slug: `${slug}-${Date.now().toString(36)}`,
      color,
      icon,
      is_default: false,
      channel_count: 0,
      ai_persona: aiPersona,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryWorkspaces.push(newWs);
    return { workspace: newWs, isFallback: true };
  }

  try {
    const { insforge } = await getServerClient();
    const insertRes = await insforge.database
      .from("workspaces")
      .insert([
        {
          user_id: userId,
          name,
          slug,
          color,
          icon,
          is_default: false,
          ai_persona: aiPersona,
        },
      ])
      .select()
      .single();

    if (insertRes.error || !insertRes.data) {
      throw new Error(insertRes.error?.message || "Failed to create workspace");
    }

    return { workspace: insertRes.data as WorkspaceItem, isFallback: false };
  } catch {
    const newWs: WorkspaceItem = {
      id: `ws-${Date.now()}`,
      name,
      slug: `${slug}-${Date.now().toString(36)}`,
      color,
      icon,
      is_default: false,
      channel_count: 0,
      ai_persona: aiPersona,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inMemoryWorkspaces.push(newWs);
    return { workspace: newWs, isFallback: true };
  }
}

/**
 * Updates a workspace.
 */
export async function updateWorkspace(
  userId: string,
  workspaceId: string,
  updates: Partial<WorkspaceItem>
): Promise<{ workspace: WorkspaceItem; isFallback: boolean }> {
  if (!insforgeCircuitBreaker.isAvailable()) {
    const index = inMemoryWorkspaces.findIndex((w) => w.id === workspaceId);
    if (index === -1) throw new Error("Workspace not found");
    inMemoryWorkspaces[index] = {
      ...inMemoryWorkspaces[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { workspace: inMemoryWorkspaces[index], isFallback: true };
  }

  try {
    const { insforge } = await getServerClient();
    const updateRes = await insforge.database
      .from("workspaces")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspaceId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateRes.error || !updateRes.data) {
      throw new Error(updateRes.error?.message || "Failed to update workspace");
    }

    return { workspace: updateRes.data as WorkspaceItem, isFallback: false };
  } catch {
    const index = inMemoryWorkspaces.findIndex((w) => w.id === workspaceId);
    if (index === -1) throw new Error("Workspace not found");
    inMemoryWorkspaces[index] = {
      ...inMemoryWorkspaces[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return { workspace: inMemoryWorkspaces[index], isFallback: true };
  }
}

/**
 * Deletes a workspace with protection for default workspace.
 */
export async function deleteWorkspace(
  userId: string,
  workspaceId: string
): Promise<{ success: boolean; isFallback: boolean }> {
  // Check if default
  const memoryWs = inMemoryWorkspaces.find((w) => w.id === workspaceId);
  if (memoryWs?.is_default) {
    throw new Error("Cannot delete default workspace");
  }

  if (!insforgeCircuitBreaker.isAvailable()) {
    const initialLen = inMemoryWorkspaces.length;
    inMemoryWorkspaces = inMemoryWorkspaces.filter((w) => w.id !== workspaceId);
    if (inMemoryWorkspaces.length === initialLen) {
      throw new Error("Workspace not found");
    }
    return { success: true, isFallback: true };
  }

  try {
    const { insforge } = await getServerClient();
    // Verify it's not default in DB
    const checkRes = await insforge.database
      .from("workspaces")
      .select("is_default")
      .eq("id", workspaceId)
      .eq("user_id", userId)
      .single();

    if (checkRes.data?.is_default) {
      throw new Error("Cannot delete default workspace");
    }

    const deleteRes = await insforge.database
      .from("workspaces")
      .delete()
      .eq("id", workspaceId)
      .eq("user_id", userId);

    if (deleteRes.error) {
      throw new Error(deleteRes.error.message);
    }

    inMemoryWorkspaces = inMemoryWorkspaces.filter((w) => w.id !== workspaceId);
    return { success: true, isFallback: false };
  } catch (err: any) {
    if (err.message === "Cannot delete default workspace") throw err;
    inMemoryWorkspaces = inMemoryWorkspaces.filter((w) => w.id !== workspaceId);
    return { success: true, isFallback: true };
  }
}

