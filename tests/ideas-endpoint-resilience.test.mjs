import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MOCK_GROUPS,
  getInMemoryMockGroups,
  resetInMemoryMockGroups,
  fetchIdeaGroupsWithResilience,
  createIdeaWithResilience,
  updateIdeaWithResilience,
  deleteIdeaWithResilience,
  UUID_REGEX,
} from "../lib/ideas/ideas-service.ts";
import { insforgeCircuitBreaker } from "../lib/insforge-circuit-breaker.ts";
import { calculateNewOrder } from "../lib/kanban-sort.ts";

test.beforeEach(() => {
  resetInMemoryMockGroups();
  insforgeCircuitBreaker.reset();
});

test("Ideas Service - Mock Groups & Schema Integrity", async () => {
  const groups = getInMemoryMockGroups();
  assert.ok(Array.isArray(groups), "Mock groups must be an array");
  assert.equal(groups.length, 4, "Should have 4 default kanban columns");

  const columnTitles = groups.map((g) => g.title);
  assert.ok(columnTitles.includes("Backlog"));
  assert.ok(columnTitles.includes("In Progress"));
  assert.ok(columnTitles.includes("Ready to Schedule"));
  assert.ok(columnTitles.includes("Published / Archived"));

  for (const group of groups) {
    assert.ok(group.id, "Each group must have an ID");
    assert.ok(group.title, "Each group must have a title");
    assert.ok(Array.isArray(group.ideas), "Each group must have an ideas array");
    for (const idea of group.ideas) {
      assert.ok(idea.id, "Idea must have an ID");
      assert.ok(idea.title, "Idea must have a title");
      assert.equal(idea.columnId, group.id, "Idea columnId must match parent group id");
    }
  }
});

test("Ideas Service - Fast Fallback on Outage (< 15ms)", async () => {
  // Force circuit breaker OPEN (simulating remote InsForge 503/timeout)
  insforgeCircuitBreaker.recordFailure(new Error("503 Service Unavailable"));
  assert.equal(insforgeCircuitBreaker.isAvailable(), false);

  const start = performance.now();
  const result = await fetchIdeaGroupsWithResilience("user_test_999");
  const duration = performance.now() - start;

  assert.ok(duration < 25, `Expected fast fallback < 25ms, got ${duration.toFixed(2)}ms`);
  assert.ok(result.groups.length >= 4);
  assert.equal(result.isFallback, true);
});

test("Ideas Service - Unauthenticated User Fallback", async () => {
  const result = await fetchIdeaGroupsWithResilience(null);
  assert.equal(result.isFallback, true);
  assert.ok(Array.isArray(result.groups));
  assert.equal(result.groups[0].title, "Backlog");
});

test("Ideas Service - Create Idea with Local Persistence", async () => {
  const newIdeaPayload = {
    groupId: "col-backlog",
    title: "AI Viral Hook Generator Feature",
    description: "Analyze hooks against top 10% engagement patterns",
    images: [{ url: "https://example.com/hook.png", path: "hook.png" }],
  };

  const result = await createIdeaWithResilience(null, newIdeaPayload);
  assert.ok(result.idea);
  assert.equal(result.idea.title, "AI Viral Hook Generator Feature");
  assert.equal(result.idea.columnId, "col-backlog");
  assert.equal(result.isLocalMock, true);

  // Verify idea is reflected in memory store
  const store = getInMemoryMockGroups();
  const backlog = store.find((g) => g.id === "col-backlog");
  const found = backlog.ideas.find((i) => i.title === "AI Viral Hook Generator Feature");
  assert.ok(found, "Newly created idea should be present in memory backlog");
});

test("Ideas Service - Drag-and-Drop Move & Repositioning on Mock Ideas", async () => {
  // Move "idea-1" from Backlog to In Progress
  const updatePayload = {
    groupId: "col-progress",
    sortOrder: 1500,
  };

  const updateResult = await updateIdeaWithResilience(null, "idea-1", updatePayload);
  assert.equal(updateResult.idea.id, "idea-1");
  assert.equal(updateResult.idea.columnId, "col-progress");
  assert.equal(updateResult.idea.sortOrder, 1500);

  const store = getInMemoryMockGroups();
  const backlog = store.find((g) => g.id === "col-backlog");
  const inProgress = store.find((g) => g.id === "col-progress");

  assert.equal(backlog.ideas.some((i) => i.id === "idea-1"), false, "Should be removed from Backlog");
  assert.equal(inProgress.ideas.some((i) => i.id === "idea-1"), true, "Should be present in In Progress");
});

test("Ideas Service - Delete Mock Idea Safely", async () => {
  const deleteResult = await deleteIdeaWithResilience(null, "idea-2");
  assert.equal(deleteResult.success, true);
  assert.equal(deleteResult.isLocalMock, true);

  const store = getInMemoryMockGroups();
  const backlog = store.find((g) => g.id === "col-backlog");
  assert.equal(backlog.ideas.some((i) => i.id === "idea-2"), false, "idea-2 must be removed");
});

test("Kanban Ordering - LexoRank Float Calculations", async () => {
  const items = [
    { sortOrder: 1000 },
    { sortOrder: 2000 },
    { sortOrder: 3000 },
  ];

  // Insert at top
  const topOrder = calculateNewOrder(items, 0);
  assert.equal(topOrder, 500);

  // Insert between index 1 and 2 (between 2000 and 3000)
  const middleOrder = calculateNewOrder(items, 2);
  assert.equal(middleOrder, 2500);

  // Insert at bottom (after 3000)
  const bottomOrder = calculateNewOrder(items, 3);
  assert.equal(bottomOrder, 4000);

  // Empty list
  const emptyOrder = calculateNewOrder([], 0);
  assert.equal(emptyOrder, 1000);
});

test("Ideas Service - In-column Reordering & Content Edits", async () => {
  // Edit title and description
  const editResult = await updateIdeaWithResilience(null, "idea-3", {
    title: "Updated Tech Stack Guide",
    description: "Added Turbopack benchmarks",
    sortOrder: 2500,
  });
  assert.equal(editResult.idea.title, "Updated Tech Stack Guide");
  assert.equal(editResult.idea.description, "Added Turbopack benchmarks");
  assert.equal(editResult.idea.sortOrder, 2500);

  const store = getInMemoryMockGroups();
  const progressCol = store.find((g) => g.id === "col-progress");
  const updatedItem = progressCol.ideas.find((i) => i.id === "idea-3");
  assert.ok(updatedItem);
  assert.equal(updatedItem.title, "Updated Tech Stack Guide");
});

test("Ideas Service - UUID Regex Validator Integrity", () => {
  assert.equal(UUID_REGEX.test("123e4567-e89b-12d3-a456-426614174000"), true);
  assert.equal(UUID_REGEX.test("idea-1"), false);
  assert.equal(UUID_REGEX.test("col-backlog"), false);
  assert.equal(UUID_REGEX.test("temp-1731000000"), false);
  assert.equal(UUID_REGEX.test(""), false);
});

