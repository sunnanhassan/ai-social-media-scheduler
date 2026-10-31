import test from 'node:test';
import assert from 'node:assert';
import { DEMO_FALLBACK_POSTS, filterDemoPosts } from '../lib/demo-posts.ts';
import { buildGroupPosts, formatDayLabel } from '../lib/schedule-utils.ts';
import { POST_STATUS } from '../constants/post.ts';

test('Posts Resilience & Offline Fallback - Comprehensive Edge Cases', async (t) => {
  await t.test('schema integrity: all demo fallback posts possess required fields', () => {
    assert.ok(DEMO_FALLBACK_POSTS.length >= 3);
    for (const post of DEMO_FALLBACK_POSTS) {
      assert.ok(typeof post.id === 'string' && post.id.length > 0);
      assert.ok(typeof post.content === 'string' && post.content.length > 0);
      assert.ok(typeof post.status === 'string' && post.status.length > 0);
      assert.ok(typeof post.user_id === 'string');
      assert.ok(typeof post.scheduled_at === 'string');
      assert.ok(post.user_channels !== undefined);
      assert.ok(typeof post.user_channels?.handle === 'string');
      assert.ok(typeof post.user_channels?.channel_types?.name === 'string');
    }
  });

  await t.test('filterDemoPosts: returns all posts when status is undefined or "all"', () => {
    const resEmpty = filterDemoPosts(DEMO_FALLBACK_POSTS, {});
    assert.strictEqual(resEmpty.length, DEMO_FALLBACK_POSTS.length);

    const resAll = filterDemoPosts(DEMO_FALLBACK_POSTS, { status: 'all' });
    assert.strictEqual(resAll.length, DEMO_FALLBACK_POSTS.length);

    const resNull = filterDemoPosts(DEMO_FALLBACK_POSTS, { status: null });
    assert.strictEqual(resNull.length, DEMO_FALLBACK_POSTS.length);
  });

  await t.test('filterDemoPosts: accurately filters by status="draft"', () => {
    const drafts = filterDemoPosts(DEMO_FALLBACK_POSTS, { status: POST_STATUS.DRAFT });
    assert.ok(drafts.length > 0);
    for (const p of drafts) {
      assert.strictEqual(p.status, POST_STATUS.DRAFT);
    }
  });

  await t.test('filterDemoPosts: accurately filters by status="queue" case-insensitively', () => {
    const queueLower = filterDemoPosts(DEMO_FALLBACK_POSTS, { status: 'queue' });
    const queueUpper = filterDemoPosts(DEMO_FALLBACK_POSTS, { status: 'QUEUE' });
    assert.ok(queueLower.length > 0);
    assert.strictEqual(queueLower.length, queueUpper.length);
    for (const p of queueLower) {
      assert.strictEqual(p.status, POST_STATUS.QUEUE);
    }
  });

  await t.test('filterDemoPosts: accurately filters by status="published"', () => {
    const published = filterDemoPosts(DEMO_FALLBACK_POSTS, { status: POST_STATUS.PUBLISHED });
    assert.ok(published.length > 0);
    for (const p of published) {
      assert.strictEqual(p.status, POST_STATUS.PUBLISHED);
      assert.ok(typeof p.published_url === 'string');
    }
  });

  await t.test('filterDemoPosts: filters by single channelId', () => {
    const xPosts = filterDemoPosts(DEMO_FALLBACK_POSTS, { channelIds: ['uc-x-1'] });
    assert.ok(xPosts.length > 0);
    for (const p of xPosts) {
      assert.strictEqual(p.user_channel_id, 'uc-x-1');
    }
  });

  await t.test('filterDemoPosts: filters by multiple channelIds', () => {
    const multiPosts = filterDemoPosts(DEMO_FALLBACK_POSTS, { channelIds: ['uc-x-1', 'uc-li-1'] });
    assert.strictEqual(multiPosts.length, DEMO_FALLBACK_POSTS.length);
  });

  await t.test('filterDemoPosts: returns empty array for non-matching channelId', () => {
    const noMatch = filterDemoPosts(DEMO_FALLBACK_POSTS, { channelIds: ['uc-unknown-999'] });
    assert.strictEqual(noMatch.length, 0);
  });

  await t.test('filterDemoPosts: sorts posts strictly by scheduled_at descending', () => {
    const sorted = filterDemoPosts(DEMO_FALLBACK_POSTS);
    for (let i = 0; i < sorted.length - 1; i++) {
      const timeCurrent = new Date(sorted[i].scheduled_at).getTime();
      const timeNext = new Date(sorted[i + 1].scheduled_at).getTime();
      assert.ok(timeCurrent >= timeNext, `Expected ${timeCurrent} >= ${timeNext}`);
    }
  });

  await t.test('buildGroupPosts: groups posts by calendar day correctly', () => {
    const grouped = buildGroupPosts(DEMO_FALLBACK_POSTS);
    assert.ok(Array.isArray(grouped));
    assert.ok(grouped.length > 0);
    for (const group of grouped) {
      assert.ok(typeof group.key === 'string' && group.key.includes('-'));
      assert.ok(typeof group.label === 'string');
      assert.ok(Array.isArray(group.posts) && group.posts.length > 0);
    }
  });

  await t.test('formatDayLabel: correctly detects Today and Tomorrow', () => {
    const today = new Date();
    assert.strictEqual(formatDayLabel(today), 'Today');

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    assert.strictEqual(formatDayLabel(tomorrow), 'Tomorrow');

    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 10);
    assert.notStrictEqual(formatDayLabel(futureDate), 'Today');
    assert.notStrictEqual(formatDayLabel(futureDate), 'Tomorrow');
  });
});
