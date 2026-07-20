import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import { convertKeywordCandidateToTopic, patchKeywordCandidate } from './keywordCandidateService.ts';
import { AUTOPILOT_FOUNDATION_DEFAULT_STATUSES } from '../../data/autopilot/status.ts';

function mockPrismaForConversion(options?: { alreadyConverted?: boolean }) {
  const logs: string[] = [];
  let candidate: Record<string, unknown> = {
    id: 11,
    batchId: 2,
    keyword: 'custom software development',
    normalisedKeyword: 'custom software development',
    status: options?.alreadyConverted ? 'converted' : 'accepted',
    convertedTopicId: options?.alreadyConverted ? 55 : null,
    impressions: 100,
    clicks: 10,
    ctr: new Prisma.Decimal(0.1),
    averagePosition: new Prisma.Decimal(4.2),
    searchVolume: null,
    keywordDifficulty: null,
    currentUrl: null,
    country: null,
    language: null,
    sourceType: 'gsc_export',
    reviewedAt: null,
    reviewedById: null,
  };
  let topic: Record<string, unknown> | null = null;
  let batchIncrement = 0;

  const tx = {
    autopilotTopic: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        topic = {
          id: 99,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          archivedAt: null,
          decidedAt: null,
          supportingKeywords: data.supportingKeywords ?? [],
          keywordVariants: data.keywordVariants ?? [],
          secondaryCategories: data.secondaryCategories ?? [],
        };
        return topic;
      },
    },
    autopilotKeywordCandidate: {
      update: async ({ data }: { data: Record<string, unknown> }) => {
        candidate = { ...candidate, ...data };
        return candidate;
      },
    },
    autopilotKeywordImportBatch: {
      update: async () => {
        batchIncrement += 1;
        return {};
      },
    },
    autopilotActivityLog: {
      create: async ({ data }: { data: { eventType: string } }) => {
        logs.push(data.eventType);
        return data;
      },
    },
  };

  const prisma = {
    autopilotKeywordCandidate: {
      findUnique: async () => candidate,
    },
    $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
  };

  return { prisma, logs, getTopic: () => topic, getCandidate: () => candidate, getBatchIncrement: () => batchIncrement };
}

test('convert candidate creates topic with empty JSON arrays, provenance, no score/category/approval', async () => {
  const { prisma, logs, getTopic, getCandidate, getBatchIncrement } = mockPrismaForConversion();
  const result = await convertKeywordCandidateToTopic(
    prisma as never,
    { id: 7, email: 'author@example.com', role: 'blog_author' },
    11,
    {
      workingTitle: 'Custom Software Development Guide',
      userProblem: 'SMEs need clear delivery options',
      audience: 'UK SME owners',
    },
    'corr-convert-001',
  );

  const topic = getTopic();
  assert.ok(topic);
  assert.deepEqual(topic!.keywordVariants, []);
  assert.deepEqual(topic!.secondaryCategories, []);
  assert.equal(topic!.source, 'import');
  assert.equal(topic!.primaryKeyword, 'custom software development');
  assert.equal(topic!.topicStatus, AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.topicStatus);
  assert.equal(topic!.decisionStatus, AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.decisionStatus);
  assert.equal(topic!.primaryCategory, undefined);
  assert.equal(topic!.totalScore, undefined);
  assert.equal(topic!.publishingStatus, AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.publishingStatus);

  const serp = topic!.serpEvidence as Record<string, unknown>;
  assert.equal(serp.impressions, 100);
  assert.equal(serp.searchVolumeExplicit, null);
  assert.equal(getCandidate().status, 'converted');
  assert.equal(getCandidate().convertedTopicId, 99);
  assert.equal(getBatchIncrement(), 1);
  assert.ok(logs.includes('keyword_candidate_converted_to_topic'));
  assert.ok(logs.includes('topic_created'));
  assert.equal(result.topic.id, 99);
});

test('duplicate conversion returns conflict with existing topic id', async () => {
  const { prisma } = mockPrismaForConversion({ alreadyConverted: true });
  await assert.rejects(
    () =>
      convertKeywordCandidateToTopic(
        prisma as never,
        { id: 7, email: 'author@example.com', role: 'blog_author' },
        11,
        {
          workingTitle: 'Title',
          userProblem: 'Problem',
          audience: 'Audience',
        },
        'corr-convert-002',
      ),
    (error: unknown) => {
      assert.ok(error && typeof error === 'object');
      const err = error as { status?: number; details?: { convertedTopicId?: number } };
      assert.equal(err.status, 409);
      assert.equal(err.details?.convertedTopicId, 55);
      return true;
    },
  );
});

test('ordinary patch cannot mutate source metrics', async () => {
  const candidate = {
    id: 1,
    status: 'new',
    reviewNotes: null,
    convertedTopicId: null,
    duplicateOfCandidateId: null,
  };
  const prisma = {
    autopilotKeywordCandidate: {
      findUnique: async () => candidate,
      update: async () => candidate,
    },
    autopilotActivityLog: { create: async () => ({}) },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        autopilotKeywordCandidate: {
          update: async ({ data }: { data: Record<string, unknown> }) => ({ ...candidate, ...data }),
        },
        autopilotActivityLog: { create: async () => ({}) },
      }),
  };

  await assert.rejects(
    () =>
      patchKeywordCandidate(
        prisma as never,
        { id: 1, email: 'a@example.com', role: 'blog_author' },
        1,
        { impressions: 999 },
        'corr-patch-001',
      ),
    (error: unknown) => {
      assert.ok(error && typeof error === 'object');
      assert.equal((error as { status?: number }).status, 400);
      return true;
    },
  );
});
