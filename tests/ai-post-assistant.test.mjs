import test from 'node:test';
import assert from 'node:assert';
import {
  buildSystemPrompt,
  buildUserPrompt,
  normalizeAction,
  sanitizeAIGeneratedText,
} from '../lib/ai-prompt-builders.ts';

test('AI Post Assistant - Edge Cases & Prompt Engineering', async (t) => {
  await t.test('buildSystemPrompt: generates platform-specific instructions for Twitter (280 chars)', () => {
    const prompt = buildSystemPrompt('twitter', 280);
    assert(prompt.includes('Twitter/X'));
    assert(prompt.includes('280'));
    assert(prompt.includes('Punchy'));
  });

  await t.test('buildSystemPrompt: generates platform-specific instructions for LinkedIn (3000 chars)', () => {
    const prompt = buildSystemPrompt('linkedin', 3000);
    assert(prompt.includes('LinkedIn'));
    assert(prompt.includes('3000'));
    assert(prompt.includes('thought-leadership'));
  });

  await t.test('buildSystemPrompt: generates platform-specific instructions for Instagram (2200 chars)', () => {
    const prompt = buildSystemPrompt('instagram', 2200);
    assert(prompt.includes('Instagram'));
    assert(prompt.includes('2200'));
    assert(prompt.includes('hashtags'));
  });

  await t.test('buildSystemPrompt: generates platform-specific instructions for Facebook (5000 chars)', () => {
    const prompt = buildSystemPrompt('facebook', 5000);
    assert(prompt.includes('Facebook'));
    assert(prompt.includes('5000'));
    assert(prompt.includes('community-oriented'));
  });

  await t.test('buildSystemPrompt: handles undefined channel with fallback limits', () => {
    const prompt = buildSystemPrompt();
    assert(prompt.includes('3000'));
    assert(prompt.includes('clean, plain text'));
  });

  await t.test('normalizeAction: validates case-insensitive supported actions', () => {
    assert.strictEqual(normalizeAction('generate'), 'generate');
    assert.strictEqual(normalizeAction('Generate'), 'generate');
    assert.strictEqual(normalizeAction('REPHRASE'), 'rephrase');
    assert.strictEqual(normalizeAction('Shorten'), 'shorten');
    assert.strictEqual(normalizeAction('expand'), 'expand');
  });

  await t.test('normalizeAction: rejects invalid, unsupported, or empty actions', () => {
    assert.strictEqual(normalizeAction('delete'), null);
    assert.strictEqual(normalizeAction('post'), null);
    assert.strictEqual(normalizeAction(''), null);
    assert.strictEqual(normalizeAction(null), null);
    assert.strictEqual(normalizeAction(undefined), null);
  });

  await t.test('buildUserPrompt: formats "generate" with prompt', () => {
    const userPrompt = buildUserPrompt('generate', '', 'Announce our new AI scheduling launch');
    assert(userPrompt.includes('Announce our new AI scheduling launch'));
    assert(userPrompt.includes('Write a high-converting'));
  });

  await t.test('buildUserPrompt: formats "generate" with outline context and prompt', () => {
    const userPrompt = buildUserPrompt('generate', 'Context points: fast, cheap, scalable', 'Turn into an announcement');
    assert(userPrompt.includes('Context points: fast, cheap, scalable'));
    assert(userPrompt.includes('Turn into an announcement'));
  });

  await t.test('buildUserPrompt: throws error when "generate" is missing prompt', () => {
    assert.throws(
      () => buildUserPrompt('generate', '', ''),
      /Prompt is required for post generation/
    );
  });

  await t.test('buildUserPrompt: formats "rephrase" with existing content', () => {
    const userPrompt = buildUserPrompt('rephrase', 'We are releasing version 2.0 today!');
    assert(userPrompt.includes('We are releasing version 2.0 today!'));
    assert(userPrompt.includes('Rephrase and polish'));
  });

  await t.test('buildUserPrompt: formats "rephrase" with additional style instruction', () => {
    const userPrompt = buildUserPrompt('rephrase', 'Original content', 'Make it humorous');
    assert(userPrompt.includes('Original content'));
    assert(userPrompt.includes('Make it humorous'));
  });

  await t.test('buildUserPrompt: throws error when "rephrase" is missing content', () => {
    assert.throws(
      () => buildUserPrompt('rephrase', '', 'Some prompt'),
      /Content is required for rephrasing/
    );
  });

  await t.test('buildUserPrompt: formats "shorten" and requires content', () => {
    const userPrompt = buildUserPrompt('shorten', 'A very long winded social media post with unnecessary filler words.');
    assert(userPrompt.includes('Condense and shorten'));
    assert.throws(
      () => buildUserPrompt('shorten', ''),
      /Content is required to shorten/
    );
  });

  await t.test('buildUserPrompt: formats "expand" and requires content', () => {
    const userPrompt = buildUserPrompt('expand', 'Quick tip: drink more water.');
    assert(userPrompt.includes('Expand this social media post'));
    assert.throws(
      () => buildUserPrompt('expand', ''),
      /Content is required to expand/
    );
  });

  await t.test('sanitizeAIGeneratedText: strips markdown code blocks cleanly', () => {
    const raw = '```markdown\nExcited to announce our new feature launch!\n```';
    assert.strictEqual(sanitizeAIGeneratedText(raw), 'Excited to announce our new feature launch!');
  });

  await t.test('sanitizeAIGeneratedText: strips wrapping quotation marks', () => {
    const raw = '"This is a clean post without quotes"';
    assert.strictEqual(sanitizeAIGeneratedText(raw), 'This is a clean post without quotes');
  });

  await t.test('sanitizeAIGeneratedText: clamps text strictly under character limit', () => {
    const longText = 'First sentence. Second sentence that pushes beyond limit. Third sentence.';
    const clamped = sanitizeAIGeneratedText(longText, 25);
    assert(clamped.length <= 25);
    assert.strictEqual(clamped, 'First sentence.');
  });
});
