import test from 'node:test';
import assert from 'node:assert';
import { InsforgeCircuitBreaker } from '../lib/insforge-circuit-breaker.ts';
import { getDemoAnalyticsData } from '../lib/analytics/demo-analytics.ts';

test('Fast-Fail Circuit Breaker & Performance Resilience Suite', async (t) => {
  await t.test('initial state: circuit breaker begins in CLOSED state', () => {
    const cb = new InsforgeCircuitBreaker({ cooldownMs: 50, timeoutMs: 100 });
    assert.strictEqual(cb.getState(), 'CLOSED');
    assert.strictEqual(cb.isAvailable(), true);
  });

  await t.test('trip circuit: 503 error transitions state to OPEN', () => {
    const cb = new InsforgeCircuitBreaker({ cooldownMs: 100, timeoutMs: 50 });
    cb.recordFailure({ message: 'No backend services available for app', status: 503 });

    assert.strictEqual(cb.getState(), 'OPEN');
    assert.strictEqual(cb.isAvailable(), false);
  });

  await t.test('fast fallback: execute() returns fallback in <5ms when circuit is OPEN', async () => {
    const cb = new InsforgeCircuitBreaker({ cooldownMs: 500, timeoutMs: 100 });
    cb.recordFailure(new Error('503 Service Unavailable'));

    const start = performance.now();
    let executed = false;
    const result = await cb.execute(
      async () => {
        executed = true;
        return { data: 'live' };
      },
      { data: 'fallback' }
    );
    const duration = performance.now() - start;

    assert.strictEqual(executed, false, 'Should not execute live task when OPEN');
    assert.strictEqual(result.isFallback, true);
    assert.strictEqual(result.data.data, 'fallback');
    assert.ok(duration < 15, `Expected fast-fail under 15ms, got ${duration}ms`);
  });

  await t.test('client errors (401/404) do NOT trip the circuit breaker', () => {
    const cb = new InsforgeCircuitBreaker({ cooldownMs: 100, timeoutMs: 50 });
    cb.recordFailure({ message: 'Not found', status: 404 });
    assert.strictEqual(cb.getState(), 'CLOSED');

    cb.recordFailure({ message: 'Unauthorized', statusCode: 401 });
    assert.strictEqual(cb.getState(), 'CLOSED');
  });

  await t.test('timeout race: task exceeding timeout trips circuit and returns fallback', async () => {
    const cb = new InsforgeCircuitBreaker({ cooldownMs: 200, timeoutMs: 30 });

    const result = await cb.execute(
      () => new Promise((resolve) => setTimeout(() => resolve({ live: true }), 150)),
      { fallback: true },
      30
    );

    assert.strictEqual(result.isFallback, true);
    assert.strictEqual(result.data.fallback, true);
    assert.strictEqual(cb.getState(), 'OPEN', 'Timed out task must trip circuit to OPEN');
  });

  await t.test('cooldown recovery: transitions to HALF_OPEN after cooldownMs', async () => {
    const cb = new InsforgeCircuitBreaker({ cooldownMs: 30, timeoutMs: 50 });
    cb.recordFailure(new Error('Backend 503'));
    assert.strictEqual(cb.getState(), 'OPEN');

    // Wait for cooldown to expire
    await new Promise((resolve) => setTimeout(resolve, 35));

    assert.strictEqual(cb.getState(), 'HALF_OPEN');
    assert.strictEqual(cb.isAvailable(), true, 'Probe request should be allowed');
  });

  await t.test('probe concurrency lock: only allows 1 probe in HALF_OPEN, concurrent callers fast-fail', async () => {
    const cb = new InsforgeCircuitBreaker({ cooldownMs: 20, timeoutMs: 100 });
    cb.recordFailure(new Error('503'));
    await new Promise((resolve) => setTimeout(resolve, 25));

    assert.strictEqual(cb.getState(), 'HALF_OPEN');

    // First call claims probe lock
    const firstAllowed = cb.isAvailable();
    assert.strictEqual(firstAllowed, true, 'First caller claims probe lock');

    // Second concurrent call while probe is in flight
    const secondAllowed = cb.isAvailable();
    assert.strictEqual(secondAllowed, false, 'Second concurrent caller must fast-fail');

    // Probe succeeds -> resets circuit to CLOSED
    cb.recordSuccess();
    assert.strictEqual(cb.getState(), 'CLOSED');
    assert.strictEqual(cb.isAvailable(), true);
  });

  await t.test('probe failure: failing probe resets cooldown to OPEN', async () => {
    const cb = new InsforgeCircuitBreaker({ cooldownMs: 20, timeoutMs: 100 });
    cb.recordFailure(new Error('503'));
    await new Promise((resolve) => setTimeout(resolve, 25));

    assert.strictEqual(cb.getState(), 'HALF_OPEN');
    assert.strictEqual(cb.isAvailable(), true);

    // Probe fails
    cb.recordFailure(new Error('Still 503'));
    assert.strictEqual(cb.getState(), 'OPEN');
    assert.strictEqual(cb.isAvailable(), false);
  });

  await t.test('endpoint fallback contracts: channels, analytics, ideas and totals', () => {
    const demo = getDemoAnalyticsData('7d');
    assert.strictEqual(demo.isFallback, true);
    assert.strictEqual(demo.timeseries.length, 7);
    assert.ok(demo.bestTimeToPost);
    assert.ok(demo.bestTimeToPost.hourlyBreakdown.length === 24);
  });
});
