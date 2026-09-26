import test from 'node:test';
import assert from 'node:assert';
import { validatePostContent, resolveScheduleTime } from '../lib/post-validator.ts';

test('Post Scheduling & Validation - Edge Cases', async (t) => {
  await t.test('rejects empty and whitespace-only content', () => {
    assert.strictEqual(validatePostContent('').isValid, false);
    assert.strictEqual(validatePostContent('   ').isValid, false);
    assert.strictEqual(validatePostContent('\n\t').isValid, false);
  });

  await t.test('accepts valid content within limit', () => {
    const res = validatePostContent('Hello world!', 280);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(res.length, 12);
  });

  await t.test('enforces exact limit boundary for Twitter (280 chars)', () => {
    const text280 = 'a'.repeat(280);
    const text281 = 'a'.repeat(281);
    assert.strictEqual(validatePostContent(text280, 280).isValid, true);
    assert.strictEqual(validatePostContent(text281, 280).isValid, false);
  });

  await t.test('enforces exact limit boundary for LinkedIn (3000 chars)', () => {
    const text3000 = 'a'.repeat(3000);
    const text3001 = 'a'.repeat(3001);
    assert.strictEqual(validatePostContent(text3000, 3000).isValid, true);
    assert.strictEqual(validatePostContent(text3001, 3000).isValid, false);
  });

  await t.test('drafts resolve safely without a timeSlot (no RangeError crash)', () => {
    const res = resolveScheduleTime(new Date(), '', true);
    assert.strictEqual(res.error, undefined);
    assert(res.scheduleAt instanceof Date);
    assert(!isNaN(res.scheduleAt.getTime()));
  });

  await t.test('scheduled queue post requires a timeSlot', () => {
    const res = resolveScheduleTime(new Date(), '', false);
    assert.strictEqual(res.error, 'Please select a time slot for scheduling');
  });

  await t.test('scheduled queue post rejects past dates', () => {
    const yesterday = new Date(Date.now() - 86400000);
    const res = resolveScheduleTime(yesterday, '10:00 AM', false);
    assert.strictEqual(res.error, 'Scheduled time must be at least 1 minute in the future');
  });

  await t.test('scheduled queue post accepts valid future date and timeSlot', () => {
    const tomorrow = new Date(Date.now() + 86400000);
    const res = resolveScheduleTime(tomorrow, '2:30 PM', false);
    assert.strictEqual(res.error, undefined);
    assert.strictEqual(res.scheduleAt.getHours(), 14);
    assert.strictEqual(res.scheduleAt.getMinutes(), 30);
  });
});
