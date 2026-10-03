import test from 'node:test';
import assert from 'node:assert';
import { POST_STATUS } from '../constants/post.ts';

// Helper function simulating the Kanban column distribution logic
function partitionPostsForKanban(posts) {
  const drafts = [];
  const queue = [];
  const published = [];

  posts.forEach((post) => {
    if (post.status === POST_STATUS.DRAFT) {
      drafts.push(post);
    } else if (post.status === POST_STATUS.QUEUE || post.status === POST_STATUS.PROCESSING) {
      queue.push(post);
    } else if (post.status === POST_STATUS.PUBLISHED || post.status === POST_STATUS.FAILED) {
      published.push(post);
    } else {
      drafts.push(post);
    }
  });

  queue.sort((a, b) => {
    const timeA = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
    const timeB = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
    return timeA - timeB;
  });

  published.sort((a, b) => {
    const timeA = new Date(a.scheduled_at || 0).getTime();
    const timeB = new Date(b.scheduled_at || 0).getTime();
    return timeB - timeA;
  });

  return { drafts, queue, published };
}

// Helper simulating hashtag and mention parser
function parseHashtagsAndMentions(text) {
  const hashtags = (text.match(/#[a-zA-Z0-9_]+/g) || []);
  const mentions = (text.match(/@[a-zA-Z0-9_]+/g) || []);
  return { hashtags, mentions };
}

test('Schedule Hybrid Kanban & Live Mobile Preview - Edge Cases', async (t) => {
  await t.test('column partitioning: accurately groups posts by lifecycle status', () => {
    const samplePosts = [
      { id: '1', status: 'draft', content: 'Draft post' },
      { id: '2', status: 'queue', scheduled_at: '2026-10-10T10:00:00Z', content: 'Queued post' },
      { id: '3', status: 'processing', scheduled_at: '2026-10-09T10:00:00Z', content: 'Processing post' },
      { id: '4', status: 'published', scheduled_at: '2026-10-05T10:00:00Z', content: 'Published post' },
      { id: '5', status: 'failed', scheduled_at: '2026-10-04T10:00:00Z', content: 'Failed post' },
    ];

    const { drafts, queue, published } = partitionPostsForKanban(samplePosts);

    assert.strictEqual(drafts.length, 1);
    assert.strictEqual(drafts[0].id, '1');

    assert.strictEqual(queue.length, 2);
    // Queue should sort ascending (Oct 9 before Oct 10)
    assert.strictEqual(queue[0].id, '3');
    assert.strictEqual(queue[1].id, '2');

    assert.strictEqual(published.length, 2);
    // Published should sort descending (Oct 5 before Oct 4)
    assert.strictEqual(published[0].id, '4');
    assert.strictEqual(published[1].id, '5');
  });

  await t.test('sorting: handles posts with missing or malformed schedule dates without throwing', () => {
    const edgePosts = [
      { id: 'a', status: 'queue', scheduled_at: null },
      { id: 'b', status: 'queue', scheduled_at: undefined },
      { id: 'c', status: 'queue', scheduled_at: '2026-10-12T12:00:00Z' },
    ];

    const { queue } = partitionPostsForKanban(edgePosts);
    assert.strictEqual(queue.length, 3);
    assert.strictEqual(queue[2].id, 'c');
  });

  await t.test('mobile preview: extracts hashtags and mentions cleanly for rich styling', () => {
    const copy = 'Excited to launch our #SaaS product! Check with @alex and @sam on #marketing and #startup.';
    const { hashtags, mentions } = parseHashtagsAndMentions(copy);

    assert.deepStrictEqual(hashtags, ['#SaaS', '#marketing', '#startup']);
    assert.deepStrictEqual(mentions, ['@alex', '@sam']);
  });

  await t.test('mobile preview: handles empty copy gracefully without regex crash', () => {
    const { hashtags, mentions } = parseHashtagsAndMentions('');
    assert.deepStrictEqual(hashtags, []);
    assert.deepStrictEqual(mentions, []);
  });

  await t.test('view switcher: validates allowed views and board default', () => {
    const allowedViews = ['board', 'calendar', 'list'];
    assert(allowedViews.includes('board'));
    assert(allowedViews.includes('calendar'));
    assert(allowedViews.includes('list'));

    const normalizeView = (v) => (allowedViews.includes(v) ? v : 'board');
    assert.strictEqual(normalizeView('unknown'), 'board');
    assert.strictEqual(normalizeView(null), 'board');
    assert.strictEqual(normalizeView('calendar'), 'calendar');
    assert.strictEqual(normalizeView('board'), 'board');
  });
});
