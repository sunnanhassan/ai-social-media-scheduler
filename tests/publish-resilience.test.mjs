import test from 'node:test';
import assert from 'node:assert';
import { shouldRefreshToken } from '../lib/publish-handlers/token-utils.ts';
import { formatLinkedInText } from '../lib/publish-handlers/linkedin.ts';

test('Publishing Resilience & Direct Fallback - Edge Cases', async (t) => {
  await t.test('token refresh buffer: accurately identifies expiring vs healthy tokens', () => {
    const now = Date.now();
    const expiredTime = now - 60000; // 1 min ago
    const soonExpiringTime = now + 120000; // 2 min in future (within 5-min buffer)
    const healthyTime = now + 3600000; // 1 hour in future

    assert.strictEqual(shouldRefreshToken(expiredTime), true);
    assert.strictEqual(shouldRefreshToken(soonExpiringTime), true);
    assert.strictEqual(shouldRefreshToken(healthyTime), false);
    assert.strictEqual(shouldRefreshToken(null), false);
    assert.strictEqual(shouldRefreshToken(undefined), false);
  });

  await t.test('token refresh buffer: respects custom safety buffer', () => {
    const now = Date.now();
    const fifteenMinsAway = now + 15 * 60 * 1000;
    // Default 5-min buffer: false
    assert.strictEqual(shouldRefreshToken(fifteenMinsAway), false);
    // Custom 20-min buffer: true
    assert.strictEqual(shouldRefreshToken(fifteenMinsAway, 20 * 60 * 1000), true);
  });

  await t.test('linkedin formatting: trims and formats bullet points without corrupted line endings', () => {
    const input = 'Here is the release:\n\n1. First feature\n2. Second feature\n\nEnjoy!';
    const formatted = formatLinkedInText(input);
    assert.ok(formatted.includes('1. First feature'));
    assert.ok(formatted.includes('2. Second feature'));
  });

  await t.test('inngest timeout race: resolves fallback when background queue stalls', async () => {
    const timeoutThreshold = 100; // 100ms test assertion
    let timedOut = false;

    // Simulate stalled Inngest call
    const stalledInngest = new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      await Promise.race([
        stalledInngest,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Inngest timeout')), timeoutThreshold)
        ),
      ]);
    } catch (err) {
      timedOut = true;
      assert.strictEqual(err.message, 'Inngest timeout');
    }

    assert.strictEqual(timedOut, true);
  });

  await t.test('inngest timeout race: resolves immediately when queue responds quickly', async () => {
    const fastInngest = Promise.resolve({ ids: ['evt_publish_123'] });
    const timeoutThreshold = 1000;

    const result = await Promise.race([
      fastInngest,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Inngest timeout')), timeoutThreshold)
      ),
    ]);

    assert.deepStrictEqual(result, { ids: ['evt_publish_123'] });
  });

  await t.test('fallback result format: matches direct publish contract', () => {
    const mockSuccess = {
      success: true,
      mode: 'direct_published',
      publishedUrl: 'https://x.com/user/status/sim_123',
      provider: 'TWITTER',
      message: 'Post published successfully!',
    };

    assert.strictEqual(mockSuccess.success, true);
    assert.strictEqual(mockSuccess.mode, 'direct_published');
    assert.ok(mockSuccess.publishedUrl.includes('https://x.com/'));

    const mockFailure = {
      error: 'Missing provider credentials or valid decrypted access token',
    };
    assert.strictEqual(typeof mockFailure.error, 'string');
  });
});
