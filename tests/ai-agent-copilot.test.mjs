import test from 'node:test';
import assert from 'node:assert';
import { AGENT_TOOL_DEFINITIONS, toolExecutors } from '../lib/agent/tools.ts';

test('Autopilot AI Agent - Copilot Tools & Guardrails', async (t) => {
  await t.test('tool definitions integrity: exposes all 4 core planning tools', () => {
    const toolNames = AGENT_TOOL_DEFINITIONS.map((t) => t.name);
    assert.ok(toolNames.includes('get_channels'));
    assert.ok(toolNames.includes('list_ideas'));
    assert.ok(toolNames.includes('get_schedule'));
    assert.ok(toolNames.includes('create_draft'));

    for (const tool of AGENT_TOOL_DEFINITIONS) {
      assert.ok(tool.description.length > 10);
      assert.strictEqual(tool.parameters.type, 'object');
    }
  });

  await t.test('create_draft executor: strictly enforces status="draft" and agent_generated=true', async () => {
    const ctx = {
      userId: 'user_test_99',
      runId: 'run_audit_01',
      autonomy: 'copilot',
    };

    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const result = await toolExecutors.create_draft(
      {
        userChannelId: 'uc-x-1',
        content: 'Excited to announce our new AI social scheduler features! #buildinpublic',
        scheduledAt: futureDate,
        status: 'queue', // Intentionally attempting to bypass draft status
      },
      ctx
    );

    assert.strictEqual(result.success, true);
    assert.ok(result.draft);
    assert.strictEqual(result.draft.status, 'draft'); // Security guardrail verification
    assert.strictEqual(result.draft.agent_generated, true);
    assert.strictEqual(result.draft.agent_run_id, 'run_audit_01');
    assert.strictEqual(result.draft.user_channel_id, 'uc-x-1');
  });

  await t.test('create_draft validation: rejects missing required arguments cleanly', async () => {
    const ctx = {
      userId: 'user_test_99',
      runId: 'run_audit_02',
      autonomy: 'copilot',
    };

    const result = await toolExecutors.create_draft(
      {
        content: 'Incomplete call',
      },
      ctx
    );

    assert.ok(result.error);
    assert.ok(result.error.includes('Missing required fields'));
  });

  await t.test('create_draft validation: rejects invalid or unparseable date strings', async () => {
    const ctx = {
      userId: 'user_test_99',
      runId: 'run_audit_03',
      autonomy: 'copilot',
    };

    const result = await toolExecutors.create_draft(
      {
        userChannelId: 'uc-1',
        content: 'Valid content',
        scheduledAt: 'not-a-valid-date',
      },
      ctx
    );

    assert.ok(result.error);
    assert.ok(result.error.includes('Invalid scheduledAt'));
  });

  await t.test('get_channels fallback: returns active social channel profiles gracefully', async () => {
    const ctx = {
      userId: 'user_test_99',
      runId: 'run_audit_04',
      autonomy: 'copilot',
    };

    const res = await toolExecutors.get_channels({}, ctx);
    assert.strictEqual(res.success, true);
    assert.ok(Array.isArray(res.channels));
    assert.ok(res.channels.length >= 2);
    assert.ok(res.channels.some((c) => c.channel_types.type === 'TWITTER'));
  });

  await t.test('list_ideas fallback: returns structured backlog items', async () => {
    const ctx = {
      userId: 'user_test_99',
      runId: 'run_audit_05',
      autonomy: 'copilot',
    };

    const res = await toolExecutors.list_ideas({ limit: 5 }, ctx);
    assert.strictEqual(res.success, true);
    assert.ok(Array.isArray(res.ideas));
    assert.ok(res.ideas.length > 0);
    assert.ok(typeof res.ideas[0].title === 'string');
  });
});
