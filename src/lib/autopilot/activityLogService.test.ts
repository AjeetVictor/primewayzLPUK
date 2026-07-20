import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendActivityLog,
  buildActivitySummary,
  listActivityLogs,
  redactSensitive,
} from './activityLogService.ts';

test('redactSensitive recursively redacts known secret keys', () => {
  const input = {
    password: 'secret',
    nested: { apiKey: 'abc', ok: true },
    token: 't',
    list: [{ refreshToken: 'r', name: 'x' }],
    refreshTokenCiphertext: 'cipher',
    clientSecret: 'cs',
  };
  const redacted = redactSensitive(input) as typeof input;
  assert.equal(redacted.password, '[REDACTED]');
  assert.equal(redacted.nested.apiKey, '[REDACTED]');
  assert.equal(redacted.nested.ok, true);
  assert.equal(redacted.token, '[REDACTED]');
  assert.equal(redacted.list[0].refreshToken, '[REDACTED]');
  assert.equal(redacted.list[0].name, 'x');
  assert.equal(redacted.refreshTokenCiphertext, '[REDACTED]');
  assert.equal(redacted.clientSecret, '[REDACTED]');
});

test('buildActivitySummary covers foundation events', () => {
  assert.equal(buildActivitySummary('topic_created', { workingTitle: 'A' }), 'Topic created: A');
  assert.equal(buildActivitySummary('decision_approved'), 'Decision approved');
  assert.equal(buildActivitySummary('score_calculated'), 'Score calculated');
});

test('appendActivityLog writes redacted JSON and listActivityLogs paginates', async () => {
  const rows: Array<Record<string, unknown>> = [];
  const db = {
    autopilotActivityLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: rows.length + 1, createdAt: new Date(), ...data };
        rows.push(row);
        return row;
      },
      findMany: async ({
        where,
        take,
        skip,
        orderBy,
      }: {
        where?: { entityId?: string };
        take: number;
        skip: number;
        orderBy: { createdAt: string };
      }) => {
        assert.equal(orderBy.createdAt, 'desc');
        let items = [...rows].reverse();
        if (where?.entityId) items = items.filter((row) => row.entityId === where.entityId);
        return items.slice(skip, skip + take);
      },
      count: async ({ where }: { where?: { entityId?: string } }) => {
        if (where?.entityId) return rows.filter((row) => row.entityId === where.entityId).length;
        return rows.length;
      },
    },
  };

  await appendActivityLog(db as never, {
    entityType: 'topic',
    entityId: '1',
    eventType: 'topic_created',
    actorType: 'user',
    actorId: 9,
    actorDisplayName: 'editor@example.com',
    source: 'admin',
    previousValue: null,
    newValue: { password: 'nope', title: 'Hello' },
    correlationId: 'corr-12345678',
  });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].actorDisplayName, 'editor@example.com');
  assert.equal(rows[0].correlationId, 'corr-12345678');
  const newValue = rows[0].newValue as { password: string; title: string };
  assert.equal(newValue.password, '[REDACTED]');
  assert.equal(newValue.title, 'Hello');

  await appendActivityLog(db as never, {
    entityType: 'topic',
    entityId: '2',
    eventType: 'topic_updated',
    actorType: 'user',
    source: 'admin',
  });

  const page = await listActivityLogs(db as never, {
    entityType: 'topic',
    entityId: '1',
    limit: 10,
    offset: 0,
  });
  assert.equal(page.total, 1);
  assert.equal(page.items.length, 1);
});

test('activity log service surface has no update or delete exports', async () => {
  const mod = await import('./activityLogService.ts');
  assert.equal(typeof mod.appendActivityLog, 'function');
  assert.equal(typeof mod.listActivityLogs, 'function');
  assert.equal('updateActivityLog' in mod, false);
  assert.equal('deleteActivityLog' in mod, false);
});
