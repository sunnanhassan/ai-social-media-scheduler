import test from "node:test";
import assert from "node:assert/strict";
import {
  addActivePost,
  getActivePostById,
  updateActivePost,
  deleteActivePost,
  getActivePosts,
  resetActivePosts,
} from "../lib/demo-posts.ts";
import { POST_STATUS } from "../constants/post.ts";

test.beforeEach(() => {
  resetActivePosts();
});

test("Published Post Actions - Revert to Draft", () => {
  const publishedPost = addActivePost({
    id: "post-test-pub-1",
    content: "Published post announcement",
    status: POST_STATUS.PUBLISHED,
    scheduled_at: new Date().toISOString(),
    published_url: "https://facebook.com/123/posts/456",
  });

  assert.strictEqual(publishedPost.status, POST_STATUS.PUBLISHED);

  // User triggers Revert to Draft
  const reverted = updateActivePost("post-test-pub-1", {
    status: POST_STATUS.DRAFT,
  });

  assert.ok(reverted);
  assert.strictEqual(reverted.status, POST_STATUS.DRAFT);

  // Check in active store
  const stored = getActivePostById("post-test-pub-1");
  assert.strictEqual(stored?.status, POST_STATUS.DRAFT);
});

test("Published Post Actions - Delete Post", () => {
  addActivePost({
    id: "post-test-pub-2",
    content: "Post to be deleted",
    status: POST_STATUS.PUBLISHED,
    scheduled_at: new Date().toISOString(),
  });

  assert.ok(getActivePostById("post-test-pub-2"));

  // Delete post
  const deleted = deleteActivePost("post-test-pub-2");
  assert.strictEqual(deleted, true);

  // Verify it is no longer in active store
  assert.strictEqual(getActivePostById("post-test-pub-2"), undefined);
});

test("Published Post Actions - Duplicate as Draft", () => {
  const original = addActivePost({
    id: "post-test-pub-3",
    content: "Original evergreen post idea",
    images: [{ url: "https://example.com/image.png" }],
    status: POST_STATUS.PUBLISHED,
    scheduled_at: new Date().toISOString(),
    user_channel_id: "uc-facebook-12345",
  });

  // Duplicate into a new draft
  const duplicatedId = `post-dup-${Date.now()}`;
  const duplicated = addActivePost({
    id: duplicatedId,
    content: original.content,
    images: original.images,
    status: POST_STATUS.DRAFT,
    user_channel_id: original.user_channel_id,
  });

  assert.strictEqual(duplicated.content, original.content);
  assert.strictEqual(duplicated.status, POST_STATUS.DRAFT);
  assert.notStrictEqual(duplicated.id, original.id);

  // Original remains published
  assert.strictEqual(getActivePostById("post-test-pub-3")?.status, POST_STATUS.PUBLISHED);
});

test("Published Post Actions - Update Content while Preserving Published Status", () => {
  addActivePost({
    id: "post-test-pub-4",
    content: "Typo in this post",
    status: POST_STATUS.PUBLISHED,
    scheduled_at: new Date().toISOString(),
  });

  const updated = updateActivePost("post-test-pub-4", {
    content: "Fixed typo in this post",
  });

  assert.strictEqual(updated?.content, "Fixed typo in this post");
  assert.strictEqual(updated?.status, POST_STATUS.PUBLISHED);
});
