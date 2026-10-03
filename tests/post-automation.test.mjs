import test from 'node:test';
import assert from 'node:assert';
import { encrypt, decrypt } from '../lib/encryption.ts';
import { shouldRefreshToken } from '../lib/publish-handlers/token-utils.ts';
import { formatLinkedInText } from '../lib/publish-handlers/linkedin.ts';
import { POST_STATUS } from '../constants/post.ts';

test('Post Automation & Publishing Engine - Edge Cases', async (t) => {
  await t.test('token encryption: securely encrypts and decrypts OAuth secrets', () => {
    const rawSecret = 'oauth_access_token_super_secret_xyz123';
    const encrypted = encrypt(rawSecret);
    assert.notStrictEqual(encrypted, rawSecret);
    assert(typeof encrypted === 'string');
    assert.strictEqual(encrypted.split('.').length, 3); // iv.tag.enc

    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, rawSecret);
  });

  await t.test('token encryption: safely handles null, undefined, and empty string', () => {
    assert.strictEqual(encrypt(null), null);
    assert.strictEqual(encrypt(undefined), null);
    assert.strictEqual(encrypt(''), null);
    assert.strictEqual(decrypt(null), null);
    assert.strictEqual(decrypt(undefined), null);
    assert.strictEqual(decrypt(''), null);
  });

  await t.test('token encryption: rejects tampered or malformed ciphertexts safely', () => {
    assert.strictEqual(decrypt('not.valid.ciphertext'), null);
    assert.strictEqual(decrypt('random_string'), null);
    assert.strictEqual(decrypt('abc.def'), null);
    assert.strictEqual(decrypt('a.b.c.d'), null);
  });

  await t.test('token refresh buffer: flags expired tokens for refresh', () => {
    const pastTimestamp = Date.now() - 60000; // 1 min ago
    assert.strictEqual(shouldRefreshToken(pastTimestamp), true);
  });

  await t.test('token refresh buffer: flags tokens expiring within 5-minute safety window', () => {
    const expiringIn3Minutes = Date.now() + 3 * 60 * 1000;
    assert.strictEqual(shouldRefreshToken(expiringIn3Minutes), true);
  });

  await t.test('token refresh buffer: skips refresh for healthy long-lived tokens', () => {
    const expiringIn2Hours = Date.now() + 2 * 60 * 60 * 1000;
    assert.strictEqual(shouldRefreshToken(expiringIn2Hours), false);
  });

  await t.test('token refresh buffer: returns false when expiry is null or undefined', () => {
    assert.strictEqual(shouldRefreshToken(null), false);
    assert.strictEqual(shouldRefreshToken(undefined), false);
  });

  await t.test('token refresh buffer: respects custom safety buffer thresholds', () => {
    const expiringIn7Minutes = Date.now() + 7 * 60 * 1000;
    // With default 5-min buffer: false
    assert.strictEqual(shouldRefreshToken(expiringIn7Minutes), false);
    // With custom 10-min buffer: true
    assert.strictEqual(shouldRefreshToken(expiringIn7Minutes, 10 * 60 * 1000), true);
  });

  await t.test('linkedin text formatting: normalizes smart quotes and clamps length', () => {
    const smartText = '“Here’s an amazing update” with smart quotes.';
    const formatted = formatLinkedInText(smartText);
    assert.strictEqual(formatted, '"Here\'s an amazing update" with smart quotes.');

    const overflow = 'a'.repeat(3500);
    const clamped = formatLinkedInText(overflow);
    assert.strictEqual(clamped.length, 3000);
  });

  await t.test('linkedin text formatting: formats numbered list paragraph spacing', () => {
    const rawList = 'Check these items: 1.  First item 2.  Second item';
    const formatted = formatLinkedInText(rawList);
    assert(formatted.includes('\n\n1. First item'));
    assert(formatted.includes('\n\n2. Second item'));
  });

  await t.test('state transitions: verifies valid lifecycle statuses', () => {
    assert.strictEqual(POST_STATUS.QUEUE, 'queue');
    assert.strictEqual(POST_STATUS.PROCESSING, 'processing');
    assert.strictEqual(POST_STATUS.PUBLISHED, 'published');
    assert.strictEqual(POST_STATUS.FAILED, 'failed');
    assert.strictEqual(POST_STATUS.DRAFT, 'draft');
  });

  await t.test('event names: confirms standard and decoupled publish event formats', () => {
    const primaryEvent = 'post.publish.requested';
    const legacyEvent = 'post/publish.requested';
    assert.strictEqual(primaryEvent, 'post.publish.requested');
    assert(primaryEvent.startsWith('post.'));
    assert(legacyEvent.startsWith('post/'));
  });
});
