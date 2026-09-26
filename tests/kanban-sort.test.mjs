import test from 'node:test';
import assert from 'node:assert';
import { calculateNewOrder } from '../lib/kanban-sort.ts';

test('Kanban Sort Order Math - Edge Cases', async (t) => {
  await t.test('returns 1000 for empty list', () => {
    assert.strictEqual(calculateNewOrder([], 0), 1000);
  });

  await t.test('calculates half for top insertion with positive order', () => {
    const items = [{ sortOrder: 1000 }, { sortOrder: 2000 }];
    assert.strictEqual(calculateNewOrder(items, 0), 500);
  });

  await t.test('handles non-positive sortOrder when inserting at top', () => {
    const items = [{ sortOrder: 0 }, { sortOrder: 1000 }];
    assert.strictEqual(calculateNewOrder(items, 0), -500);
  });

  await t.test('appends 1000 when inserting at bottom', () => {
    const items = [{ sortOrder: 1000 }, { sortOrder: 2500 }];
    assert.strictEqual(calculateNewOrder(items, 2), 3500);
    assert.strictEqual(calculateNewOrder(items, 5), 3500);
  });

  await t.test('calculates midpoint when inserting between two items', () => {
    const items = [{ sortOrder: 1000 }, { sortOrder: 2000 }];
    assert.strictEqual(calculateNewOrder(items, 1), 1500);
  });

  await t.test('safeguards against precision collapse when diff < 0.0001', () => {
    const items = [{ sortOrder: 1000.00001 }, { sortOrder: 1000.00002 }];
    const newOrder = calculateNewOrder(items, 1);
    assert.strictEqual(newOrder, 1000.00001 + 0.01);
  });

  await t.test('handles identical orders gracefully', () => {
    const items = [{ sortOrder: 1000 }, { sortOrder: 1000 }];
    const newOrder = calculateNewOrder(items, 1);
    assert.strictEqual(newOrder, 1000.01);
  });
});
