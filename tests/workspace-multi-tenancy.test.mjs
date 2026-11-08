import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MOCK_WORKSPACES,
  getMockWorkspaceById,
} from "../constants/mock-workspaces.ts";
import {
  generateSlug,
  getInMemoryWorkspaces,
  resetInMemoryWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  fetchUserWorkspacesWithResilience,
} from "../lib/workspaces/workspace-service.ts";

test("Workspace - Mock Workspaces & Default Brand Contract", () => {
  assert.ok(Array.isArray(DEFAULT_MOCK_WORKSPACES));
  assert.ok(DEFAULT_MOCK_WORKSPACES.length >= 3);

  const defaultBrand = DEFAULT_MOCK_WORKSPACES.find((w) => w.is_default);
  assert.ok(defaultBrand, "Must contain exactly one default workspace");
  assert.equal(defaultBrand?.name, "Personal Brand");
  assert.equal(defaultBrand?.slug, "personal-brand");
  assert.ok(defaultBrand?.color.startsWith("#"), "Workspace must have a valid hex color");
  assert.ok(defaultBrand?.ai_persona?.tone, "Must have defined AI persona tone");
});

test("Workspace - generateSlug edge cases", () => {
  assert.equal(generateSlug("Personal Brand"), "personal-brand");
  assert.equal(generateSlug("  Tech & SaaS Hub!!!  "), "tech-saas-hub");
  assert.equal(generateSlug("Gaming_101_Clips"), "gaming-101-clips");
  assert.equal(generateSlug("---Messy---Name---"), "messy-name");
  assert.equal(generateSlug(""), "brand", "Empty name falls back to 'brand'");
});

test("Workspace - getMockWorkspaceById lookup & fallback", () => {
  const found = getMockWorkspaceById("ws-saas-brand");
  assert.equal(found.name, "OmniPost SaaS");
  assert.equal(found.is_default, false);

  const fallbackNull = getMockWorkspaceById(null);
  assert.equal(fallbackNull.id, "ws-default-brand");
  assert.equal(fallbackNull.is_default, true);

  const fallbackUnknown = getMockWorkspaceById("non-existent-id-999");
  assert.equal(fallbackUnknown.id, "ws-default-brand");
});

test("Workspace - In-Memory State & Reset", () => {
  resetInMemoryWorkspaces();
  const initial = getInMemoryWorkspaces();
  assert.equal(initial.length, 3);
});

test("Workspace - Create New Brand with Custom AI Persona", async () => {
  resetInMemoryWorkspaces();
  const { workspace } = await createWorkspace("test-user-1", {
    name: "E-Commerce Store",
    color: "#F59E0B",
    icon: "shopping-bag",
    ai_persona: {
      tone: "persuasive, punchy, e-commerce direct response",
      industry: "fashion & retail",
      target_audience: "online shoppers",
    },
  });

  assert.ok(workspace.id);
  assert.equal(workspace.name, "E-Commerce Store");
  assert.equal(workspace.color, "#F59E0B");
  assert.equal(workspace.is_default, false);
  assert.equal(workspace.ai_persona?.tone, "persuasive, punchy, e-commerce direct response");

  const list = getInMemoryWorkspaces();
  assert.equal(list.length, 4);
  assert.ok(list.some((w) => w.id === workspace.id));
});

test("Workspace - Update Brand Attributes", async () => {
  resetInMemoryWorkspaces();
  const { workspace: created } = await createWorkspace("test-user-1", {
    name: "Temporary Brand",
    color: "#000000",
  });

  const { workspace: updated } = await updateWorkspace("test-user-1", created.id, {
    name: "Updated Brand Name",
    color: "#8B5CF6",
  });

  assert.equal(updated.name, "Updated Brand Name");
  assert.equal(updated.color, "#8B5CF6");
});

test("Workspace - Default Workspace Protected from Deletion", async () => {
  resetInMemoryWorkspaces();
  const defaultWs = getInMemoryWorkspaces().find((w) => w.is_default);
  assert.ok(defaultWs);

  await assert.rejects(
    async () => {
      await deleteWorkspace("test-user-1", defaultWs.id);
    },
    {
      message: "Cannot delete default workspace",
    }
  );

  // Default workspace should still exist in memory
  const afterCheck = getInMemoryWorkspaces().find((w) => w.id === defaultWs.id);
  assert.ok(afterCheck, "Default workspace must not be deleted");
});

test("Workspace - Delete Custom Brand Lifecycle", async () => {
  resetInMemoryWorkspaces();
  const { workspace: toDelete } = await createWorkspace("test-user-1", {
    name: "To Be Deleted",
    color: "#EF4444",
  });

  const beforeCount = getInMemoryWorkspaces().length;
  const result = await deleteWorkspace("test-user-1", toDelete.id);
  assert.equal(result.success, true);

  const afterCount = getInMemoryWorkspaces().length;
  assert.equal(afterCount, beforeCount - 1);
  assert.ok(!getInMemoryWorkspaces().some((w) => w.id === toDelete.id));
});

test("Workspace - Auto-Provisioning Resilience Fallback", async () => {
  // When userId is null or database is unavailable, resilient service returns active workspaces
  const { workspaces, isFallback } = await fetchUserWorkspacesWithResilience(null);
  assert.ok(Array.isArray(workspaces));
  assert.ok(workspaces.length > 0);
  assert.equal(isFallback, true);
  assert.ok(workspaces.some((w) => w.is_default));
});
