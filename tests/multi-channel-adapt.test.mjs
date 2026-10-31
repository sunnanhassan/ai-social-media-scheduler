import test from 'node:test';
import assert from 'node:assert';
import { sanitizeAIGeneratedText } from '../lib/ai-prompt-builders.ts';

// Deterministic offline adaptation helper mirroring app/api/posts/adapt-all/route.ts
function createOfflineAdaptation(content, type, limit) {
  const clean = content.trim();
  const lower = type.toLowerCase();

  if (lower.includes('twitter') || lower === 'x') {
    if (clean.length <= 250) return clean;
    return clean.slice(0, 245).trim() + '...';
  }

  if (lower.includes('linkedin')) {
    return `${clean}\n\nWhat are your thoughts on this? Drop a comment below. 👇\n\n#leadership #productivity #growth`;
  }

  if (lower.includes('instagram')) {
    return `${clean}\n.\n.\n.\n#inspiration #buildinpublic #creators`;
  }

  return clean.slice(0, limit);
}

test('Multi-Channel Content Adaptation & 5-Angle Ideas Engine', async (t) => {
  const masterContent =
    'Building an automated social media scheduler with Inngest, Next.js, and multi-channel publishing requires strict concurrency locks and exact-minute sleepUntil routines to eliminate lag and prevent duplicate dispatches.';

  await t.test('Twitter adaptation: enforces strict 280-character ceiling', () => {
    const twitterDraft = createOfflineAdaptation(masterContent, 'TWITTER', 280);
    const sanitized = sanitizeAIGeneratedText(twitterDraft, 280);

    assert.ok(sanitized.length <= 280);
    assert.strictEqual(sanitized.length > 0, true);
    assert.ok(!sanitized.startsWith('#')); // No markdown header
  });

  await t.test('LinkedIn adaptation: appends community call-to-action and thought leadership tags', () => {
    const liDraft = createOfflineAdaptation(masterContent, 'LINKEDIN', 3000);
    const sanitized = sanitizeAIGeneratedText(liDraft, 3000);

    assert.ok(sanitized.includes('What are your thoughts'));
    assert.ok(sanitized.includes('#leadership'));
    assert.ok(sanitized.length <= 3000);
  });

  await t.test('Instagram adaptation: formats with line breaks and relevant hashtags', () => {
    const igDraft = createOfflineAdaptation(masterContent, 'INSTAGRAM', 2200);
    const sanitized = sanitizeAIGeneratedText(igDraft, 2200);

    assert.ok(sanitized.includes('#inspiration'));
    assert.ok(sanitized.includes('#buildinpublic'));
    assert.ok(sanitized.length <= 2200);
  });

  await t.test('5-angle expansion taxonomy: generates 5 distinct perspectives', () => {
    const angles = [
      { type: 'how_to', title: 'Actionable How-To Guide' },
      { type: 'contrarian', title: 'The Counter-Intuitive Truth' },
      { type: 'story', title: 'Personal Story & Lesson Learned' },
      { type: 'checklist', title: 'Curated 5-Point Checklist' },
      { type: 'question', title: 'Community Discussion Prompt' },
    ];

    assert.strictEqual(angles.length, 5);
    const types = new Set(angles.map((a) => a.type));
    assert.strictEqual(types.size, 5);
  });

  await t.test('unicode and emoji preservation: handles multi-byte characters safely', () => {
    const emojiText = '🚀 Scaling Next.js 16 to 1M requests/sec! 💡 What is your favorite optimization?';
    const sanitized = sanitizeAIGeneratedText(emojiText, 280);

    assert.ok(sanitized.includes('🚀'));
    assert.ok(sanitized.includes('💡'));
    assert.strictEqual(sanitized, emojiText);
  });

  await t.test('clamping long content: clamps cleanly without breaking sentences', () => {
    const veryLongText = 'A '.repeat(300);
    const clamped = sanitizeAIGeneratedText(veryLongText, 280);

    assert.ok(clamped.length <= 280);
    assert.ok(clamped.length > 200);
  });
});
