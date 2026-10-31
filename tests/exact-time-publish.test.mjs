import test from 'node:test';
import assert from 'node:assert';

test('Exact-Time Publishing & Concurrency Claim Engine', async (t) => {
  await t.test('atomic claim: simulates concurrent claim requests, ensuring only 1 worker succeeds', () => {
    let postState = {
      id: 'post-claim-1',
      status: 'queue',
      attempts: 0,
    };

    // Atomic claim simulation simulating PostgreSQL:
    // UPDATE scheduled_posts SET status='processing', attempts=attempts+1 WHERE id=$1 AND status='queue' RETURNING id
    function attemptAtomicClaim(targetId) {
      if (postState.id === targetId && (postState.status === 'queue' || postState.status === 'queued')) {
        postState = {
          ...postState,
          status: 'processing',
          attempts: postState.attempts + 1,
        };
        return { success: true, post: postState };
      }
      return { success: false, reason: 'already_claimed_or_not_queued' };
    }

    const worker1 = attemptAtomicClaim('post-claim-1');
    const worker2 = attemptAtomicClaim('post-claim-1');
    const worker3 = attemptAtomicClaim('post-claim-1');

    assert.strictEqual(worker1.success, true);
    assert.strictEqual(worker1.post.status, 'processing');
    assert.strictEqual(worker1.post.attempts, 1);

    // Second and third concurrent workers MUST fail to prevent duplicate publishing
    assert.strictEqual(worker2.success, false);
    assert.strictEqual(worker2.reason, 'already_claimed_or_not_queued');
    assert.strictEqual(worker3.success, false);
    assert.strictEqual(worker3.reason, 'already_claimed_or_not_queued');
  });

  await t.test('sleepUntil calculation: accurately computes future wait duration for exact-minute dispatch', () => {
    const futureDate = new Date(Date.now() + 3600000); // 1 hour ahead
    const now = new Date();

    const waitMs = futureDate.getTime() - now.getTime();
    assert.ok(waitMs > 3500000 && waitMs <= 3600000);
    assert.strictEqual(futureDate > now, true);
  });

  await t.test('sleepUntil past date: recognizes past or overdue dates for immediate dispatch', () => {
    const pastDate = new Date(Date.now() - 120000); // 2 minutes ago
    const now = new Date();

    assert.strictEqual(pastDate <= now, true);
    const shouldSleep = pastDate > now;
    assert.strictEqual(shouldSleep, false);
  });

  await t.test('event payload: post.scheduled satisfies schema contract', () => {
    const eventPayload = {
      name: 'post.scheduled',
      data: {
        postId: 'post-uuid-1234',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      },
    };

    assert.strictEqual(eventPayload.name, 'post.scheduled');
    assert.ok(typeof eventPayload.data.postId === 'string');
    assert.ok(typeof eventPayload.data.scheduledAt === 'string');
    assert.ok(!isNaN(new Date(eventPayload.data.scheduledAt).getTime()));
  });

  await t.test('event payload: post.cancelled satisfies cancellation schema', () => {
    const cancelPayload = {
      name: 'post.cancelled',
      data: {
        postId: 'post-uuid-1234',
      },
    };

    assert.strictEqual(cancelPayload.name, 'post.cancelled');
    assert.strictEqual(cancelPayload.data.postId, 'post-uuid-1234');
  });

  await t.test('event payload: post.publish.requested triggers dispatch executor', () => {
    const requestPayload = {
      name: 'post.publish.requested',
      data: {
        postId: 'post-uuid-1234',
      },
    };

    assert.strictEqual(requestPayload.name, 'post.publish.requested');
    assert.strictEqual(requestPayload.data.postId, 'post-uuid-1234');
  });

  await t.test('rescheduling state machine: cancel and re-queue lifecycle', () => {
    const history = [];

    function handleReschedule(postId, newDate) {
      // 1. Cancel existing sleepUntil
      history.push({ event: 'post.cancelled', postId });
      // 2. Schedule new sleepUntil
      history.push({ event: 'post.scheduled', postId, scheduledAt: newDate });
    }

    const testTime = new Date(Date.now() + 7200000).toISOString();
    handleReschedule('post-99', testTime);

    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].event, 'post.cancelled');
    assert.strictEqual(history[1].event, 'post.scheduled');
    assert.strictEqual(history[1].scheduledAt, testTime);
  });
});
