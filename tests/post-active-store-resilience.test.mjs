import { test, describe, beforeEach } from "node:test";
import assert from "node:assert";
import {
  getActivePosts,
  getActivePostById,
  addActivePost,
  updateActivePost,
  deleteActivePost,
  resetActivePosts,
} from "../lib/demo-posts.ts";

describe("Active Post Store Resilience (Offline & Dev Fallback)", () => {
  beforeEach(() => {
    resetActivePosts();
  });

  test("initial state contains the 4 baseline fallback posts", () => {
    const posts = getActivePosts();
    assert.strictEqual(posts.length, 4);
  });

  test("adding a new scheduled post persists immediately into active store", () => {
    const newPost = addActivePost({
      id: "post-test-123",
      content: "Testing 1-minute scheduling",
      status: "queue",
      scheduled_at: new Date(Date.now() + 60000).toISOString(),
      user_channels: {
        id: "c-facebook-1",
        handle: "Testing Page",
        profile_image: null,
        profile_url: "https://facebook.com/123",
        channel_type_id: "type-facebook",
        is_connected: true,
        is_active: true,
        channel_types: {
          id: "type-facebook",
          type: "FACEBOOK",
          name: "Facebook",
          color: "#1877F2",
          character_limit: 5000,
          connected: true,
        },
      },
    });

    assert.strictEqual(newPost.id, "post-test-123");

    // Must be returned by getActivePosts
    const allPosts = getActivePosts();
    assert.strictEqual(allPosts.length, 5);
    assert.strictEqual(allPosts[0].id, "post-test-123");

    // Must be queryable by ID
    const retrieved = getActivePostById("post-test-123");
    assert.ok(retrieved);
    assert.strictEqual(retrieved.content, "Testing 1-minute scheduling");
  });

  test("filtering by status=queue isolates scheduled posts", () => {
    addActivePost({
      id: "queued-post-1",
      content: "Queued post test",
      status: "queue",
    });

    const queuePosts = getActivePosts({ status: "queue" });
    assert.ok(queuePosts.length >= 3);
    assert.ok(queuePosts.every((p) => p.status === "queue"));
  });

  test("updating status to published updates in place", () => {
    addActivePost({
      id: "post-lifecycle-1",
      content: "Will publish soon",
      status: "queue",
    });

    const updated = updateActivePost("post-lifecycle-1", {
      status: "published",
      published_url: "https://facebook.com/123_456",
      published_at: new Date().toISOString(),
    });

    assert.ok(updated);
    assert.strictEqual(updated.status, "published");
    assert.strictEqual(updated.published_url, "https://facebook.com/123_456");

    const fetched = getActivePostById("post-lifecycle-1");
    assert.strictEqual(fetched?.status, "published");
  });

  test("deleting post removes it cleanly", () => {
    addActivePost({
      id: "to-delete-1",
      content: "Temporary post",
      status: "draft",
    });

    assert.ok(getActivePostById("to-delete-1"));
    const deleted = deleteActivePost("to-delete-1");
    assert.strictEqual(deleted, true);
    assert.strictEqual(getActivePostById("to-delete-1"), undefined);
  });
});
