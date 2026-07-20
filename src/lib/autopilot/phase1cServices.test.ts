import assert from 'node:assert/strict';
import test from 'node:test';
import { AUTOPILOT_ERROR_CODES, AutopilotError, serializeAutopilotError } from './apiErrors.ts';
import {
  emptyPatchGuard,
  parseDecisionAction,
  parsePagination,
  parsePositiveIntId,
  parseStringArray,
  rejectUnknownKeys,
  requireNonEmptyString,
} from './apiValidation.ts';
import { resolveCorrelationId } from './correlation.ts';
import { assertAutoPublishCannotEnable, updateAutopilotSetting } from './settingService.ts';
import {
  createOrReuseWorkflowRun,
  createRetryWorkflowRun,
  getWorkflowRunById,
} from './workflowRunService.ts';
import { calculateAutopilotScore } from './scoringService.ts';
import { AUTOPILOT_SCORE_DIMENSION_KEYS } from '../../data/autopilot/scoringConfig.ts';

test('parsePositiveIntId and pagination validation', () => {
  assert.equal(parsePositiveIntId('12'), 12);
  assert.throws(() => parsePositiveIntId('0'));
  assert.throws(() => parsePositiveIntId('abc'));
  assert.deepEqual(parsePagination({ limit: '5', offset: '10' }), { limit: 5, offset: 10 });
  assert.equal(parsePagination({ limit: '999' }, { maxLimit: 100 }).limit, 100);
});

test('reject unknown keys and empty patch', () => {
  assert.throws(() => rejectUnknownKeys({ a: 1, b: 2 }, ['a']));
  assert.throws(() => emptyPatchGuard({}));
  rejectUnknownKeys({ a: 1 }, ['a']);
});

test('parseDecisionAction and string arrays', () => {
  assert.equal(parseDecisionAction('approve'), 'approve');
  assert.throws(() => parseDecisionAction('publish'));
  assert.deepEqual(parseStringArray([' one ', 'two'], 'tags'), ['one', 'two']);
  assert.throws(() => parseStringArray(new Array(51).fill('x'), 'tags'));
});

test('correlation id accepts safe headers otherwise generates UUID', () => {
  assert.equal(resolveCorrelationId('abcdefghi'), 'abcdefghi');
  assert.match(resolveCorrelationId('bad id'), /^[0-9a-f-]{36}$/i);
});

test('serializeAutopilotError never leaks raw Error messages for unknowns', () => {
  const payload = serializeAutopilotError(new Error('secret stack'), 'cid-12345678');
  assert.equal(payload.error.code, AUTOPILOT_ERROR_CODES.INTERNAL_ERROR);
  assert.equal(payload.correlationId, 'cid-12345678');
  assert.equal(payload.error.message.includes('secret'), false);
});

test('auto-publish cannot be enabled', () => {
  assert.throws(() => assertAutoPublishCannotEnable(true));
  assert.doesNotThrow(() => assertAutoPublishCannotEnable(false));
});

test('settings service rejects autoPublishEnabled updates for any role', async () => {
  const prisma = {
    autopilotSetting: {
      findUnique: async () => ({
        id: 1,
        key: 'autoPublishEnabled',
        value: false,
        isLocked: true,
        description: 'locked',
        updatedById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    },
    $transaction: async () => {
      throw new Error('should not run transaction');
    },
  };

  await assert.rejects(
    () =>
      updateAutopilotSetting(
        prisma as never,
        { id: 1, email: 'super@example.com', role: 'super_admin' },
        { key: 'autoPublishEnabled', value: true },
        'corr-settings1',
      ),
    (error: unknown) =>
      error instanceof AutopilotError && error.code === 'AUTOPILOT_AUTO_PUBLISH_LOCKED',
  );
});

test('workflow run idempotency reuses queued/running/succeeded', async () => {
  const existing = {
    id: 7,
    workflowType: 'score',
    entityType: 'topic',
    entityId: '1',
    status: 'queued',
    inputHash: 'hash-a',
    attempt: 1,
    progress: 0,
    providerMetadata: { apiKey: 'secret' },
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: null,
    completedAt: null,
    errorCode: null,
    errorMessage: null,
    currentStep: null,
    totalSteps: null,
    correlationId: 'c1',
    createdById: 1,
    retryOfRunId: null,
  };

  let createCalls = 0;
  const prisma = {
    autopilotWorkflowRun: {
      findFirst: async () => existing,
      create: async () => {
        createCalls += 1;
        return existing;
      },
      findUnique: async ({ where }: { where: { id: number } }) =>
        where.id === 7 ? existing : null,
    },
    autopilotActivityLog: {
      create: async () => ({}),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };

  const reused = await createOrReuseWorkflowRun(prisma as never, {
    workflowType: 'score',
    entityType: 'topic',
    entityId: '1',
    inputHash: 'hash-a',
    createdById: 1,
    correlationId: 'corr-wf-0001',
  });
  assert.equal(reused.reused, true);
  assert.equal(reused.run.id, 7);
  assert.equal(createCalls, 0);
  assert.equal((reused.run.providerMetadata as { apiKey: string }).apiKey, '[REDACTED]');

  await assert.rejects(() => getWorkflowRunById(prisma as never, 99));
});

test('workflow retry after failure creates new attempt', async () => {
  const failed = {
    id: 3,
    workflowType: 'score',
    entityType: 'topic',
    entityId: '9',
    status: 'failed',
    inputHash: 'h',
    attempt: 1,
    progress: 10,
    providerMetadata: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    startedAt: new Date(),
    completedAt: new Date(),
    errorCode: 'X',
    errorMessage: 'fail',
    currentStep: null,
    totalSteps: 2,
    correlationId: 'c',
    createdById: 1,
    retryOfRunId: null,
  };

  const created: Record<string, unknown>[] = [];
  const prisma = {
    autopilotWorkflowRun: {
      findUnique: async () => failed,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
          providerMetadata: null,
          startedAt: null,
          completedAt: null,
          errorCode: null,
          errorMessage: null,
          currentStep: null,
          ...data,
        };
        created.push(row);
        return row;
      },
      findFirst: async () => null,
    },
    autopilotActivityLog: { create: async () => ({}) },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };

  const retry = await createRetryWorkflowRun(prisma as never, 3, {
    createdById: 1,
    correlationId: 'corr-retry01',
  });
  assert.equal(retry.attempt, 2);
  assert.equal(retry.retryOfRunId, 3);
  assert.equal(created.length, 1);
});

test('scoring calculator ignores AI totals (service contract)', () => {
  const dimensions = Object.fromEntries(
    AUTOPILOT_SCORE_DIMENSION_KEYS.map((key) => [key, 70]),
  ) as Record<(typeof AUTOPILOT_SCORE_DIMENSION_KEYS)[number], number>;
  const result = calculateAutopilotScore({ dimensions, aiSuggestedTotal: 99 });
  assert.equal(result.totalScore, 70);
  assert.equal(result.ignoredAiSuggestedTotal, 99);
});

test('requireNonEmptyString trims and enforces max length', () => {
  assert.equal(requireNonEmptyString('  hi  ', 'field', 10), 'hi');
  assert.throws(() => requireNonEmptyString('   ', 'field', 10));
});
