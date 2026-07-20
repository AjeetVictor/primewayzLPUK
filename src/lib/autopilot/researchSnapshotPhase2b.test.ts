import assert from 'node:assert/strict';
import test from 'node:test';
import { AutopilotError } from './apiErrors.ts';
import {
  confirmResearchSnapshot,
  createResearchSnapshot,
  evaluateResearchReadiness,
  serializeResearchSnapshot,
  updateResearchSnapshot,
} from './researchSnapshotService.ts';

const actor = { id: 9, email: 'author@example.com', role: 'blog_author' };

function baseTopic(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    workingTitle: 'SDaaS capacity planning',
    primaryKeyword: 'software development capacity planning',
    proposedSlug: 'sdaas-capacity-planning',
    primaryCategory: 'ai-automation',
    topicStatus: 'DISCOVERED',
    decisionStatus: 'NOT_READY',
    market: 'United Kingdom',
    language: 'en-GB',
    location: null,
    archivedAt: null,
    totalScore: 55,
    rawScore: 55,
    categoryRecommendation: { primaryCategory: 'existing' },
    searchIntent: null,
    serpEvidence: null,
    businessAlignment: null,
    contentArchitecture: null,
    riskAssessment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function completeEvidence() {
  return {
    searchIntent: {
      primaryIntent: 'informational',
      userNeed: 'Understand capacity planning',
      journeyStage: 'solution_awareness',
    },
    serpEvidence: {
      rows: [
        { title: 'A', url: 'https://example.com/a', observedAt: '2026-01-02' },
        { title: 'B', url: 'https://example.com/b', observedAt: '2026-01-02' },
        { title: 'C', url: 'https://example.com/c', observedAt: '2026-01-02' },
      ],
    },
    businessAlignment: {
      serviceRelevanceNotes: 'Supports SDaaS commercial page',
      businessValueNotes: 'Helps buyers evaluate capacity',
      targetServicePaths: ['/software-development-subscription'],
    },
    contentArchitecture: {
      proposedPageType: 'supporting',
      differentiationAngle: 'UK SME capacity framing',
      requiredSections: ['Overview', 'How capacity works', 'Next steps'],
    },
    riskAssessment: {
      cannibalisationNotes: 'Possible overlap with capacity article — requires editorial review.',
      unsupportedClaimRisks: 'Do not invent ranking outcomes.',
      evidenceLimitations: 'Manual SERP rows only.',
    },
    overlapAnalysis: {
      version: 'overlap-analysis-v1',
      analysedAt: '2026-07-20T00:00:00.000Z',
      inventoryCounts: { total: 1 },
      findings: [],
      clusterHints: [],
      internalLinkHints: [],
      summary: {
        exactConflictCount: 0,
        highOverlapCount: 0,
        moderateOverlapCount: 0,
        phraseContainmentCount: 0,
        advisoryCount: 0,
        clusterHintCount: 0,
        internalLinkHintCount: 0,
      },
    },
  };
}

test('serializeResearchSnapshot converts decimals and dates', () => {
  const row = serializeResearchSnapshot({
    id: 1,
    evidenceCompleteness: { toNumber: () => 72.5 },
    createdAt: new Date('2026-07-20T10:00:00.000Z'),
    confirmedAt: null,
  });
  assert.equal(row.evidenceCompleteness, 72.5);
  assert.equal(row.createdAt, '2026-07-20T10:00:00.000Z');
});

test('create allocates first version and transitions DISCOVERED to RESEARCHING', async () => {
  const topic = baseTopic();
  const activity: unknown[] = [];
  let created: Record<string, unknown> | null = null;

  const prisma = {
    autopilotTopic: {
      findUnique: async () => topic,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(topic, data);
        return topic;
      },
    },
    autopilotResearchSnapshot: {
      findFirst: async () => null,
      aggregate: async () => ({ _max: { version: null } }),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        created = {
          id: 100,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          confirmedAt: null,
          supersededAt: null,
          evidenceCompleteness: null,
          overlapAnalysis: null,
          clusterHints: null,
          internalLinkHints: null,
        };
        return created;
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
    autopilotActivityLog: {
      create: async ({ data }: { data: unknown }) => {
        activity.push(data);
        return data;
      },
    },
  };

  // Wire activity through appendActivityLog path — service uses tx.autopilotActivityLog
  (prisma as { autopilotActivityLog: unknown }).autopilotActivityLog = {
    create: async ({ data }: { data: unknown }) => {
      activity.push(data);
      return data;
    },
  };

  const result = await createResearchSnapshot(
    prisma as never,
    actor,
    42,
    {},
    'corr-create-1',
  );

  assert.equal(result.reusedExistingDraft, false);
  assert.equal(result.snapshot.version, 1);
  assert.equal(result.snapshot.status, 'draft');
  assert.equal(topic.topicStatus, 'RESEARCHING');
  assert.ok(activity.some((entry) => (entry as { eventType: string }).eventType === 'research_snapshot_created'));
  assert.ok(activity.some((entry) => (entry as { eventType: string }).eventType === 'research_started'));
});

test('existing draft is reused unless createNewVersion is set', async () => {
  const draft = {
    id: 7,
    topicId: 42,
    version: 1,
    status: 'draft',
    sourceType: 'manual',
    query: 'software development capacity planning',
    searchIntent: null,
    serpEvidence: null,
    businessAlignment: null,
    contentArchitecture: null,
    riskAssessment: null,
    evidenceQuality: 'not_assessed',
    evidenceCompleteness: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const prisma = {
    autopilotTopic: { findUnique: async () => baseTopic({ topicStatus: 'RESEARCHING' }) },
    autopilotResearchSnapshot: {
      findFirst: async () => draft,
      aggregate: async () => {
        throw new Error('should not allocate version');
      },
      create: async () => {
        throw new Error('should not create');
      },
    },
    $transaction: async () => {
      throw new Error('should not transaction');
    },
  };

  const reused = await createResearchSnapshot(prisma as never, actor, 42, {}, 'corr-reuse');
  assert.equal(reused.reusedExistingDraft, true);
  assert.equal(reused.snapshot.id, 7);

  let createdVersion: number | null = null;
  const prismaNew = {
    autopilotTopic: {
      findUnique: async () => baseTopic({ topicStatus: 'RESEARCHING' }),
      update: async ({ data }: { data: Record<string, unknown> }) =>
        baseTopic({ topicStatus: data.topicStatus as string }),
    },
    autopilotResearchSnapshot: {
      findFirst: async () => draft,
      aggregate: async () => ({ _max: { version: 1 } }),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdVersion = data.version as number;
        return {
          id: 8,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          confirmedAt: null,
          supersededAt: null,
          evidenceCompleteness: null,
          overlapAnalysis: null,
          clusterHints: null,
          internalLinkHints: null,
        };
      },
    },
    autopilotActivityLog: { create: async ({ data }: { data: unknown }) => data },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prismaNew),
  };

  const created = await createResearchSnapshot(
    prismaNew as never,
    actor,
    42,
    { createNewVersion: true },
    'corr-new',
  );
  assert.equal(created.reusedExistingDraft, false);
  assert.equal(createdVersion, 2);
});

test('archived topic rejects research snapshot creation', async () => {
  const prisma = {
    autopilotTopic: {
      findUnique: async () => baseTopic({ archivedAt: new Date() }),
    },
  };
  await assert.rejects(
    () => createResearchSnapshot(prisma as never, actor, 42, {}, 'corr-arch'),
    (error: unknown) =>
      error instanceof AutopilotError && error.code === 'AUTOPILOT_RESEARCH_TOPIC_ARCHIVED',
  );
});

test('draft update allowlist and confirmed immutability', async () => {
  const draft = {
    id: 11,
    topicId: 42,
    version: 1,
    status: 'draft',
    sourceType: 'manual',
    query: 'q',
    market: 'United Kingdom',
    language: 'en-GB',
    location: null,
    researchNotes: null,
    evidenceQuality: 'not_assessed',
    searchIntent: null,
    serpEvidence: null,
    businessAlignment: null,
    contentArchitecture: null,
    riskAssessment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const prismaDraft = {
    autopilotTopic: { findUnique: async () => baseTopic({ topicStatus: 'RESEARCHING' }) },
    autopilotResearchSnapshot: {
      findUnique: async () => draft,
      update: async ({ data }: { data: Record<string, unknown> }) => ({ ...draft, ...data }),
      findUniqueOrThrow: async () => ({ ...draft, query: 'updated query', evidenceCompleteness: 0 }),
    },
    autopilotActivityLog: { create: async ({ data }: { data: unknown }) => data },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prismaDraft),
  };

  await assert.rejects(
    () =>
      updateResearchSnapshot(
        prismaDraft as never,
        actor,
        11,
        { status: 'confirmed', query: 'x' },
        'corr-bad',
      ),
    (error: unknown) => error instanceof AutopilotError,
  );

  const updated = await updateResearchSnapshot(
    prismaDraft as never,
    actor,
    11,
    { query: 'updated query' },
    'corr-ok',
  );
  assert.equal(updated.snapshot.query, 'updated query');

  const confirmed = { ...draft, status: 'confirmed' };
  const prismaConfirmed = {
    autopilotTopic: { findUnique: async () => baseTopic() },
    autopilotResearchSnapshot: { findUnique: async () => confirmed },
  };
  await assert.rejects(
    () =>
      updateResearchSnapshot(
        prismaConfirmed as never,
        actor,
        11,
        { query: 'nope' },
        'corr-imm',
      ),
    (error: unknown) =>
      error instanceof AutopilotError && error.code === 'AUTOPILOT_RESEARCH_SNAPSHOT_IMMUTABLE',
  );
});

test('mark-ready blockers when overlap missing', () => {
  const readiness = evaluateResearchReadiness({
    snapshot: {
      query: 'q',
      sourceType: 'manual',
      ...completeEvidence(),
      overlapAnalysis: null,
    },
  });
  assert.equal(readiness.ready, false);
  assert.ok(readiness.blockers.some((b) => b.code === 'AUTOPILOT_OVERLAP_ANALYSIS_REQUIRED'));
});

test('confirmation copies evidence, sets RESEARCH_COMPLETE, preserves decision and score', async () => {
  const evidence = completeEvidence();
  const topic = baseTopic({
    topicStatus: 'RESEARCHING',
    decisionStatus: 'NOT_READY',
    totalScore: 61,
    rawScore: 61,
    categoryRecommendation: { primaryCategory: 'keep-me' },
  });
  const snapshot = {
    id: 20,
    topicId: 42,
    version: 2,
    status: 'ready_for_confirmation',
    sourceType: 'manual',
    query: 'software development capacity planning',
    ...evidence,
    evidenceQuality: 'medium',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const activity: Array<{ eventType: string }> = [];
  let supersededId: number | null = null;

  const prisma = {
    autopilotTopic: {
      findUnique: async () => topic,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(topic, data);
        return topic;
      },
    },
    autopilotResearchSnapshot: {
      findUnique: async () => snapshot,
      findFirst: async () => ({ id: 19, version: 1, status: 'confirmed' }),
      update: async ({
        where,
        data,
      }: {
        where: { id: number };
        data: Record<string, unknown>;
      }) => {
        if (where.id === 19) {
          supersededId = 19;
          return { id: 19, ...data };
        }
        return { ...snapshot, ...data, confirmedAt: new Date() };
      },
    },
    autopilotActivityLog: {
      create: async ({ data }: { data: { eventType: string } }) => {
        activity.push(data);
        return data;
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };

  const result = await confirmResearchSnapshot(
    prisma as never,
    actor,
    20,
    { confirmationNote: 'Evidence reviewed by editor.' },
    'corr-confirm',
  );

  assert.equal(result.snapshot.status, 'confirmed');
  assert.equal(result.supersededSnapshotId, 19);
  assert.equal(supersededId, 19);
  assert.equal(topic.topicStatus, 'RESEARCH_COMPLETE');
  assert.equal(topic.decisionStatus, 'NOT_READY');
  assert.equal(topic.totalScore, 61);
  assert.deepEqual(topic.categoryRecommendation, { primaryCategory: 'keep-me' });
  assert.ok(topic.searchIntent);
  assert.ok(topic.serpEvidence);
  assert.ok(activity.some((e) => e.eventType === 'research_snapshot_confirmed'));
  assert.ok(activity.some((e) => e.eventType === 'research_snapshot_superseded'));
  assert.ok(activity.some((e) => e.eventType === 'research_completed'));
});

test('confirmation rolls back when activity append fails mid-transaction', async () => {
  const evidence = completeEvidence();
  const topic = baseTopic({ topicStatus: 'RESEARCHING' });
  const snapshot = {
    id: 21,
    topicId: 42,
    version: 1,
    status: 'ready_for_confirmation',
    sourceType: 'manual',
    query: 'q',
    ...evidence,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  let writes = 0;
  const prisma = {
    autopilotTopic: {
      findUnique: async () => topic,
      update: async () => {
        writes += 1;
        return topic;
      },
    },
    autopilotResearchSnapshot: {
      findUnique: async () => snapshot,
      findFirst: async () => null,
      update: async () => {
        writes += 1;
        return { ...snapshot, status: 'confirmed' };
      },
    },
    autopilotActivityLog: {
      create: async () => {
        throw new Error('activity failed');
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      try {
        return await fn(prisma);
      } catch (error) {
        // Simulate rollback — topic untouched outside successful commit
        writes = 0;
        throw error;
      }
    },
  };

  await assert.rejects(() =>
    confirmResearchSnapshot(
      prisma as never,
      actor,
      21,
      { confirmationNote: 'note' },
      'corr-rollback',
    ),
  );
  assert.equal(writes, 0);
  assert.equal(topic.topicStatus, 'RESEARCHING');
});
