import test from 'node:test';
import assert from 'node:assert';
import {
  calculateEngagementRate,
  calculateSummaryTotals,
  bucketHourlyEngagement,
  rankTopPosts,
  buildTimeseriesData,
} from '../lib/analytics/calculator.ts';

test('Post Analytics Engine & Performance Metrics', async (t) => {
  await t.test('calculateEngagementRate: accurately computes rate percentage', () => {
    // 50 likes + 10 comments + 5 shares on 1000 impressions = 6.5%
    const rate = calculateEngagementRate(1000, 50, 10, 5);
    assert.strictEqual(rate, 6.5);
  });

  await t.test('calculateEngagementRate: zero impressions returns 0 without NaN or infinity', () => {
    assert.strictEqual(calculateEngagementRate(0, 10, 5, 2), 0);
    assert.strictEqual(calculateEngagementRate(-100, 10, 5, 2), 0);
  });

  await t.test('calculateEngagementRate: clamps maximum rate to 100%', () => {
    const rate = calculateEngagementRate(10, 50, 20, 10);
    assert.strictEqual(rate, 100);
  });

  await t.test('calculateSummaryTotals: handles empty array gracefully', () => {
    const summary = calculateSummaryTotals([]);
    assert.strictEqual(summary.totalImpressions, 0);
    assert.strictEqual(summary.totalEngagements, 0);
    assert.strictEqual(summary.postsAnalyzed, 0);
    assert.strictEqual(summary.topChannel, 'None');
  });

  await t.test('calculateSummaryTotals: aggregates impressions, engagements, and top channel', () => {
    const sampleItems = [
      {
        id: '1',
        postId: 'p1',
        content: 'Post 1',
        channelType: 'TWITTER',
        handle: 'sunnan',
        scheduledAt: new Date().toISOString(),
        publishedUrl: null,
        impressions: 1000,
        likes: 50,
        comments: 10,
        shares: 5,
        engagementRate: 6.5,
        lastFetchedAt: new Date().toISOString(),
      },
      {
        id: '2',
        postId: 'p2',
        content: 'Post 2',
        channelType: 'TWITTER',
        handle: 'sunnan',
        scheduledAt: new Date().toISOString(),
        publishedUrl: null,
        impressions: 2000,
        likes: 100,
        comments: 20,
        shares: 10,
        engagementRate: 6.5,
        lastFetchedAt: new Date().toISOString(),
      },
      {
        id: '3',
        postId: 'p3',
        content: 'Post 3',
        channelType: 'LINKEDIN',
        handle: 'sunnan',
        scheduledAt: new Date().toISOString(),
        publishedUrl: null,
        impressions: 3000,
        likes: 120,
        comments: 30,
        shares: 15,
        engagementRate: 5.5,
        lastFetchedAt: new Date().toISOString(),
      },
    ];

    const summary = calculateSummaryTotals(sampleItems);
    assert.strictEqual(summary.totalImpressions, 6000);
    assert.strictEqual(summary.totalLikes, 270);
    assert.strictEqual(summary.totalComments, 60);
    assert.strictEqual(summary.totalShares, 30);
    assert.strictEqual(summary.totalEngagements, 360);
    assert.strictEqual(summary.postsAnalyzed, 3);
    assert.strictEqual(summary.topChannel, 'TWITTER');
  });

  await t.test('bucketHourlyEngagement: generates 24 hourly slots with labels', () => {
    const buckets = bucketHourlyEngagement([]);
    assert.strictEqual(buckets.length, 24);
    assert.strictEqual(buckets[0].label, '12 AM');
    assert.strictEqual(buckets[10].label, '10 AM');
    assert.strictEqual(buckets[12].label, '12 PM');
    assert.strictEqual(buckets[23].label, '11 PM');
  });

  await t.test('rankTopPosts: ranks by engagementRate descending and respects limit', () => {
    const posts = [
      { id: '1', engagementRate: 3.2, impressions: 5000 },
      { id: '2', engagementRate: 8.5, impressions: 1000 },
      { id: '3', engagementRate: 6.1, impressions: 2000 },
      { id: '4', engagementRate: 1.0, impressions: 9000 },
    ];

    const ranked = rankTopPosts(posts, 2);
    assert.strictEqual(ranked.length, 2);
    assert.strictEqual(ranked[0].id, '2'); // 8.5%
    assert.strictEqual(ranked[1].id, '3'); // 6.1%
  });

  await t.test('buildTimeseriesData: produces continuous daily points matching day count', () => {
    const timeseries = buildTimeseriesData([], 7);
    assert.strictEqual(timeseries.length, 7);
    for (const pt of timeseries) {
      assert.ok(typeof pt.date === 'string');
      assert.strictEqual(pt.impressions, 0);
      assert.strictEqual(pt.engagements, 0);
    }
  });
});
