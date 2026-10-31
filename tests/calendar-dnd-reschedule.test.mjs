import test from 'node:test';
import assert from 'node:assert';
import { isBefore, startOfDay, addDays, subDays } from 'date-fns';

/**
 * Pure functions matching the DnD Calendar logic in:
 * - components/schedule/post-calendar/index.tsx (draggableAccessor, onEventDrop guard)
 * - components/schedule/calendar-view.tsx (handleEventDrop, time preservation, optimistic cache update)
 */

export function canDragPost(status) {
  return status !== 'published' && status !== 'processing';
}

export function validateDropTarget(targetDate, postStatus) {
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) {
    return { valid: false, error: 'Invalid drop target date' };
  }
  if (isBefore(target, startOfDay(new Date()))) {
    return { valid: false, error: 'Cannot reschedule to a past date or time.' };
  }
  if (postStatus === 'published' || postStatus === 'processing') {
    return { valid: false, error: 'Cannot reschedule an already published post.' };
  }
  return { valid: true };
}

export function mergeDropDateTime(originalScheduledAt, targetDropDate) {
  const target = new Date(targetDropDate);
  try {
    const original = new Date(originalScheduledAt);
    if (!isNaN(original.getTime())) {
      target.setHours(original.getHours(), original.getMinutes(), 0, 0);
    }
  } catch {
    // Keep target as is if parse fails
  }
  return target.toISOString();
}

export function applyOptimisticReschedule(posts, postId, newIsoDate) {
  if (!Array.isArray(posts)) return [];
  return posts.map((p) => (p.id === postId ? { ...p, scheduled_at: newIsoDate } : p));
}

test('Calendar Drag-and-Drop Rescheduling Logic', async (t) => {
  await t.test('canDragPost: only allows non-terminal, unprocessing posts to be dragged', () => {
    assert.strictEqual(canDragPost('published'), false);
    assert.strictEqual(canDragPost('processing'), false);
    assert.strictEqual(canDragPost('draft'), true);
    assert.strictEqual(canDragPost('queue'), true);
    assert.strictEqual(canDragPost('failed'), true);
    assert.strictEqual(canDragPost('pending_review'), true);
  });

  await t.test('validateDropTarget: rejects dates in the past', () => {
    const pastDate = subDays(new Date(), 2);
    const result = validateDropTarget(pastDate, 'queue');
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, 'Cannot reschedule to a past date or time.');
  });

  await t.test('validateDropTarget: accepts today and future dates', () => {
    const today = new Date();
    const futureDate = addDays(new Date(), 5);

    const resultToday = validateDropTarget(today, 'queue');
    assert.strictEqual(resultToday.valid, true);

    const resultFuture = validateDropTarget(futureDate, 'queue');
    assert.strictEqual(resultFuture.valid, true);
  });

  await t.test('validateDropTarget: rejects drops of published or processing posts', () => {
    const futureDate = addDays(new Date(), 3);
    const resultPub = validateDropTarget(futureDate, 'published');
    assert.strictEqual(resultPub.valid, false);
    assert.strictEqual(resultPub.error, 'Cannot reschedule an already published post.');

    const resultProc = validateDropTarget(futureDate, 'processing');
    assert.strictEqual(resultProc.valid, false);
    assert.strictEqual(resultProc.error, 'Cannot reschedule an already published post.');
  });

  await t.test('mergeDropDateTime: preserves original hours and minutes when dropping onto a new day', () => {
    const originalIso = '2026-11-01T15:30:00.000Z';
    const targetDay = new Date(2026, 10, 15, 0, 0, 0); // Nov 15, midnight

    const mergedIso = mergeDropDateTime(originalIso, targetDay);
    const mergedDate = new Date(mergedIso);
    const originalDate = new Date(originalIso);

    assert.strictEqual(mergedDate.getFullYear(), 2026);
    assert.strictEqual(mergedDate.getMonth(), 10); // November (0-indexed)
    assert.strictEqual(mergedDate.getDate(), 15);
    assert.strictEqual(mergedDate.getHours(), originalDate.getHours());
    assert.strictEqual(mergedDate.getMinutes(), originalDate.getMinutes());
  });

  await t.test('mergeDropDateTime: handles corrupted original date gracefully without throwing', () => {
    const corruptedIso = 'invalid-date-string';
    const targetDay = new Date(2026, 10, 20, 10, 0, 0);

    const mergedIso = mergeDropDateTime(corruptedIso, targetDay);
    assert.ok(mergedIso.includes('2026'));
  });

  await t.test('applyOptimisticReschedule: updates target post immutably and preserves others', () => {
    const initialPosts = [
      { id: 'post_1', scheduled_at: '2026-11-01T10:00:00.000Z', content: 'First' },
      { id: 'post_2', scheduled_at: '2026-11-02T12:00:00.000Z', content: 'Second' },
      { id: 'post_3', scheduled_at: '2026-11-03T14:00:00.000Z', content: 'Third' },
    ];

    const newIso = '2026-11-10T12:00:00.000Z';
    const updated = applyOptimisticReschedule(initialPosts, 'post_2', newIso);

    assert.strictEqual(updated.length, 3);
    assert.strictEqual(updated[0].scheduled_at, '2026-11-01T10:00:00.000Z');
    assert.strictEqual(updated[1].scheduled_at, newIso);
    assert.strictEqual(updated[2].scheduled_at, '2026-11-03T14:00:00.000Z');
    // Ensure immutability
    assert.notStrictEqual(updated, initialPosts);
  });
});
