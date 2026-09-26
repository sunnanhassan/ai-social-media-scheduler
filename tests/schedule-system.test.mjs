import test from 'node:test';
import assert from 'node:assert';
import {
  sanitizeChannelIds,
  serializeChannelIds,
  normalizeStatusFilter,
  calculateCalendarGridBounds,
  isPostOverdue,
} from '../lib/schedule-utils.ts';
import { validatePostContent, resolveScheduleTime } from '../lib/post-validator.ts';

test('Schedule System & State Synchronization - Edge Cases', async (t) => {
  await t.test('sanitizeChannelIds: handles null, undefined, and empty string', () => {
    assert.deepStrictEqual(sanitizeChannelIds(null), []);
    assert.deepStrictEqual(sanitizeChannelIds(undefined), []);
    assert.deepStrictEqual(sanitizeChannelIds(''), []);
    assert.deepStrictEqual(sanitizeChannelIds('   '), []);
  });

  await t.test('sanitizeChannelIds: cleans up messy comma-delimited strings', () => {
    const input = 'ch_twitter, , ch_linkedin ,, , ch_facebook  ';
    const result = sanitizeChannelIds(input);
    assert.deepStrictEqual(result, ['ch_twitter', 'ch_linkedin', 'ch_facebook']);
  });

  await t.test('sanitizeChannelIds: handles array of strings with nested commas', () => {
    const input = ['ch_1, ch_2', 'ch_3', '  '];
    const result = sanitizeChannelIds(input);
    assert.deepStrictEqual(result, ['ch_1', 'ch_2', 'ch_3']);
  });

  await t.test('serializeChannelIds: converts array to clean comma-separated URL string', () => {
    assert.strictEqual(serializeChannelIds([]), '');
    assert.strictEqual(serializeChannelIds(null), '');
    assert.strictEqual(serializeChannelIds(['ch1', 'ch2']), 'ch1,ch2');
  });

  await t.test('normalizeStatusFilter: maps "all", empty, or null to null', () => {
    assert.strictEqual(normalizeStatusFilter('all'), null);
    assert.strictEqual(normalizeStatusFilter('ALL'), null);
    assert.strictEqual(normalizeStatusFilter(''), null);
    assert.strictEqual(normalizeStatusFilter(null), null);
    assert.strictEqual(normalizeStatusFilter(undefined), null);
  });

  await t.test('normalizeStatusFilter: preserves valid statuses in lowercase', () => {
    assert.strictEqual(normalizeStatusFilter('draft'), 'draft');
    assert.strictEqual(normalizeStatusFilter('Queue'), 'queue');
    assert.strictEqual(normalizeStatusFilter('PUBLISHED'), 'published');
    assert.strictEqual(normalizeStatusFilter('failed'), 'failed');
  });

  await t.test('normalizeStatusFilter: rejects invalid / injected statuses', () => {
    assert.strictEqual(normalizeStatusFilter('malicious_status'), null);
    assert.strictEqual(normalizeStatusFilter('deleted'), null);
    assert.strictEqual(normalizeStatusFilter('123'), null);
  });

  await t.test('calculateCalendarGridBounds: computes valid start and end bounds across month boundaries', () => {
    const testDate = new Date(2026, 8, 27); // Sep 27, 2026
    const { startDate, endDate } = calculateCalendarGridBounds(testDate);
    assert(startDate instanceof Date);
    assert(endDate instanceof Date);
    assert(startDate.getTime() <= testDate.getTime());
    assert(endDate.getTime() >= testDate.getTime());
    // Start date must be Sunday (0) in US localizer
    assert.strictEqual(startDate.getDay(), 0);
  });

  await t.test('isPostOverdue: correctly flags overdue queued posts', () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour in future

    assert.strictEqual(isPostOverdue(pastDate, 'queue'), true);
    assert.strictEqual(isPostOverdue(pastDate, 'draft'), true);
    assert.strictEqual(isPostOverdue(futureDate, 'queue'), false);
    // Published or failed posts are not considered overdue
    assert.strictEqual(isPostOverdue(pastDate, 'published'), false);
    assert.strictEqual(isPostOverdue(pastDate, 'failed'), false);
  });

  await t.test('isPostOverdue: safely handles malformed dates without throwing', () => {
    assert.strictEqual(isPostOverdue('invalid-date', 'queue'), false);
  });

  await t.test('post editing: validates updated text and limits correctly', () => {
    const valid = validatePostContent('Updated scheduled announcement', 280);
    assert.strictEqual(valid.isValid, true);
    assert.strictEqual(valid.length, 30);

    const tooLong = validatePostContent('x'.repeat(281), 280);
    assert.strictEqual(tooLong.isValid, false);
    assert(tooLong.error.includes('280'));
  });

  await t.test('post editing: reschedules to valid future slot', () => {
    const futureDate = new Date(Date.now() + 172800000); // 2 days in future
    const res = resolveScheduleTime(futureDate, '11:00 AM', false);
    assert.strictEqual(res.error, undefined);
    assert.strictEqual(res.scheduleAt.getHours(), 11);
  });
});
