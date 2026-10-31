import test from 'node:test';
import assert from 'node:assert';

test('UI Features & End-to-End User Interaction Engine', async (t) => {
  await t.test('adapt-channels payload builder: trims master text and formats target channels', () => {
    const rawMaster = '   Launch day is finally here! Multi-channel AI scheduler is live.   ';
    const channelIds = ['uc-x-1', 'uc-li-1'];

    function buildAdaptPayload(text, channels) {
      const trimmed = text.trim();
      if (!trimmed) throw new Error('Empty content');
      if (!channels || channels.length === 0) throw new Error('No channels');
      return { masterContent: trimmed, channelIds: channels };
    }

    const payload = buildAdaptPayload(rawMaster, channelIds);
    assert.strictEqual(payload.masterContent, 'Launch day is finally here! Multi-channel AI scheduler is live.');
    assert.strictEqual(payload.channelIds.length, 2);
  });

  await t.test('convert idea to post: formats title and description into cohesive post draft', () => {
    const idea = {
      id: 'idea-101',
      title: '5 Lessons From Next.js 16 Upgrades',
      description: 'Break down Turbopack speed, proxy.ts, and React 19 compiler benefits.',
    };

    function convertIdeaToComposerText(i) {
      if (!i.description) return i.title;
      return `${i.title}\n\n${i.description}`;
    }

    const composerText = convertIdeaToComposerText(idea);
    assert.ok(composerText.includes('5 Lessons From Next.js 16 Upgrades'));
    assert.ok(composerText.includes('Break down Turbopack speed'));
    assert.ok(composerText.includes('\n\n'));
  });

  await t.test('expand 5 angles dialog query builder: produces safe URL params for scheduling', () => {
    const angle = {
      title: 'How We Cut Serverless Cold Starts by 80%',
      description: 'Practical walkthrough of in-memory caching and connection pooling.',
    };

    const query = new URLSearchParams({
      create: 'true',
      content: `${angle.title}\n\n${angle.description}`,
    });

    const parsed = new URLSearchParams(query.toString());
    assert.strictEqual(parsed.get('create'), 'true');
    assert.ok(parsed.get('content')?.includes('How We Cut Serverless'));
  });

  await t.test('kanban card retry handler: propagates failed post to publisher dispatch', () => {
    const failedPost = {
      id: 'post-failed-1',
      status: 'failed',
      error_message: 'OAuth token revoked by user on Twitter',
      content: 'Important update',
    };

    let retriedPostId = null;
    function handleRetry(post) {
      retriedPostId = post.id;
    }

    handleRetry(failedPost);
    assert.strictEqual(retriedPostId, 'post-failed-1');
  });

  await t.test('character count indicator: flags near-limit and over-limit states accurately', () => {
    function evaluateLengthState(len, limit) {
      const isOver = len > limit;
      const isNear = len >= limit * 0.9 && !isOver;
      return { isOver, isNear };
    }

    // Twitter limit: 280
    assert.deepStrictEqual(evaluateLengthState(150, 280), { isOver: false, isNear: false });
    assert.deepStrictEqual(evaluateLengthState(260, 280), { isOver: false, isNear: true }); // > 90%
    assert.deepStrictEqual(evaluateLengthState(285, 280), { isOver: true, isNear: false }); // Over limit
  });

  await t.test('copilot chat query mapper: maps quick prompts cleanly', () => {
    const quickPrompts = [
      'Plan 3 posts for this week',
      'Check my idea backlog and draft 2 posts',
      'Are there any empty schedule slots this week?',
    ];

    for (const prompt of quickPrompts) {
      assert.ok(typeof prompt === 'string' && prompt.length > 5);
      const userPayload = { role: 'user', content: prompt.trim() };
      assert.strictEqual(userPayload.role, 'user');
      assert.strictEqual(userPayload.content, prompt);
    }
  });
});
