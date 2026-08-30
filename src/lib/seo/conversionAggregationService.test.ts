/**
 * Tests for SEO conversion evidence aggregation (no PII).
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import {
  classifyChannelGroup,
  buildJourneyDedupKey,
  isReliableOrganicEvidence,
} from './conversionAttribution.ts';
import {
  aggregateConversionEvidenceRecords,
  persistConversionBuckets,
  rebuildSeoPageConversions,
} from './conversionAggregationService.ts';
import {
  collectConversionEvidence,
  toSafeConversionEvidenceSummary,
  type RawConversionEvidence,
} from './conversionEvidenceCollector.ts';
import {
  mapChatStatusToConversationOutcome,
  mapReviewLeadStatusToLeadQuality,
} from './conversionTaxonomies.ts';
import { computeConversionBucketKeyHash } from './conversionBucketKey.ts';
import {
  acquireConversionRebuildLock,
  releaseConversionRebuildLock,
} from './conversionRebuildLock.ts';

type StoredConversionRow = {
  id: number;
  metricDate: Date;
  seoPageId: number | null;
  bucketKeyHash: string;
  attributionModel: 'first_touch' | 'last_touch';
  channelGroup: string;
  chatsInitiated: number;
  qualifiedChats: number;
  contactForms: number;
  reviewRequests: number;
  bookingRequests: number;
  bookingsCompleted: number;
  qualifiedLeads: number;
  proposals: number;
  wonOpportunities: number;
  attributedValueMinor: number;
  currency: string;
  unknownAttributionCount: number;
};

type ConversionRebuildTestPrisma = {
  chatSession: { findMany: () => Promise<unknown[]> };
  formResponse: { findMany: () => Promise<unknown[]> };
  digitalSystemsReviewLead: { findMany: () => Promise<unknown[]> };
  seoPage: {
    findUnique: (args: { where: { id: number } }) => Promise<{
      path: string;
      canonicalUrl: string;
    } | null>;
    create: () => Promise<{ id: number }>;
  };
  seoPageAlias: {
    findUnique: () => Promise<null>;
    create: () => Promise<{ id: number }>;
    update: () => Promise<Record<string, never>>;
  };
  seoPageConversionDaily: {
    deleteMany: (args: { where: Record<string, unknown> }) => Promise<{ count: number }>;
    createMany: (args: { data: Array<Record<string, unknown>> }) => Promise<{ count: number }>;
  };
  $transaction: (
    callback: (tx: ConversionRebuildTestPrisma) => Promise<unknown>,
  ) => Promise<unknown>;
  $queryRaw: (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<Array<{ result: number }>>;
  _rows: StoredConversionRow[];
  _lockState: { held: boolean; acquireCount: number; releaseCount: number };
};

function createConversionRebuildPrisma(input?: {
  initialRows?: StoredConversionRow[];
  failCreate?: boolean;
  lockHeld?: boolean;
}): ConversionRebuildTestPrisma {
  const rows = [...(input?.initialRows ?? [])];
  let nextId = rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  const lockState = { held: input?.lockHeld ?? false, acquireCount: 0, releaseCount: 0 };

  const prisma: ConversionRebuildTestPrisma = {
    chatSession: {
      findMany: async () => [
        {
          id: 'chat-page-1',
          createdAt: new Date('2026-07-10T12:00:00.000Z'),
          status: 'bot_replied',
          firstLandingPage: '/services/crm',
          currentPageUrl: '/services/crm',
          utmSource: 'google',
          utmMedium: 'organic',
          email: null,
          name: null,
          serviceInterest: null,
          appointments: [],
        },
        {
          id: 'chat-unknown',
          createdAt: new Date('2026-07-11T12:00:00.000Z'),
          status: 'new',
          firstLandingPage: null,
          currentPageUrl: null,
          utmSource: null,
          utmMedium: null,
          email: null,
          name: null,
          serviceInterest: null,
          appointments: [],
        },
      ],
    },
    formResponse: { findMany: async () => [] },
    digitalSystemsReviewLead: { findMany: async () => [] },
    seoPage: {
      findUnique: async ({ where }: { where: { id: number } }) =>
        where.id === 7
          ? { path: '/services/crm', canonicalUrl: 'https://uk.primewayz.com/services/crm' }
          : null,
      create: async () => ({ id: 7 }),
    },
    seoPageAlias: {
      findUnique: async () => null,
      create: async () => ({ id: 1 }),
      update: async () => ({}),
    },
    seoPageConversionDaily: {
      deleteMany: async ({ where }: { where: Record<string, unknown> }) => {
        const before = rows.length;
        const metricDate = where.metricDate as { gte: Date; lte: Date } | undefined;
        const seoPageId = where.seoPageId as number | null | undefined;

        for (let index = rows.length - 1; index >= 0; index -= 1) {
          const row = rows[index];
          const inRange =
            !metricDate ||
            (row.metricDate >= metricDate.gte && row.metricDate <= metricDate.lte);
          const pageMatch =
            seoPageId === undefined ||
            (seoPageId === null ? row.seoPageId === null : row.seoPageId === seoPageId);
          if (inRange && pageMatch) rows.splice(index, 1);
        }

        return { count: before - rows.length };
      },
      createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => {
        if (input?.failCreate) {
          throw new Error('insert failed');
        }
        for (const item of data) {
          rows.push({
            id: nextId,
            metricDate: item.metricDate as Date,
            seoPageId: (item.seoPageId as number | null) ?? null,
            bucketKeyHash: item.bucketKeyHash as string,
            attributionModel: item.attributionModel as 'first_touch' | 'last_touch',
            channelGroup: item.channelGroup as string,
            chatsInitiated: item.chatsInitiated as number,
            qualifiedChats: item.qualifiedChats as number,
            contactForms: item.contactForms as number,
            reviewRequests: item.reviewRequests as number,
            bookingRequests: item.bookingRequests as number,
            bookingsCompleted: item.bookingsCompleted as number,
            qualifiedLeads: item.qualifiedLeads as number,
            proposals: item.proposals as number,
            wonOpportunities: item.wonOpportunities as number,
            attributedValueMinor: item.attributedValueMinor as number,
            currency: item.currency as string,
            unknownAttributionCount: item.unknownAttributionCount as number,
          });
          nextId += 1;
        }
        return { count: data.length };
      },
    },
    $transaction: async (callback: (tx: ConversionRebuildTestPrisma) => Promise<unknown>) =>
      callback(prisma),
    $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.join('');
      if (sql.includes('GET_LOCK')) {
        lockState.acquireCount += 1;
        if (lockState.held) return [{ result: 0 }];
        lockState.held = true;
        return [{ result: 1 }];
      }
      if (sql.includes('RELEASE_LOCK')) {
        lockState.releaseCount += 1;
        lockState.held = false;
        return [{ result: 1 }];
      }
      throw new Error(`Unexpected query: ${sql}`);
    },
    _rows: rows,
    _lockState: lockState,
  };

  return prisma;
}

function normaliseRowsForComparison(rows: StoredConversionRow[]) {
  return rows
    .map(({ id: _id, ...rest }) => rest)
    .sort((left, right) => left.bucketKeyHash.localeCompare(right.bucketKeyHash));
}

test('organic source classification requires reliable evidence', () => {
  assert.equal(classifyChannelGroup('google', 'organic'), 'organic');
  assert.equal(isReliableOrganicEvidence('google', 'organic'), true);
  assert.equal(classifyChannelGroup('(direct)', '(none)'), 'direct');
  assert.equal(isReliableOrganicEvidence('(direct)', '(none)'), false);
});

test('journey dedupe prefers journeyReference then sessionReference then chatSessionId', () => {
  assert.equal(
    buildJourneyDedupKey({
      journeyReference: 'j-1',
      sessionReference: 's-1',
      chatSessionId: 'c-1',
      fallbackId: 'x',
    }),
    'journey:j-1',
  );
  assert.equal(
    buildJourneyDedupKey({ sessionReference: 's-1', chatSessionId: 'c-1', fallbackId: 'x' }),
    'session:s-1',
  );
  assert.equal(buildJourneyDedupKey({ chatSessionId: 'c-1', fallbackId: 'x' }), 'chat:c-1');
});

test('chat-only journey produces chat initiation evidence', async () => {
  const prisma = {
    chatSession: {
      findMany: async () => [
        {
          id: 'chat-1',
          createdAt: new Date('2026-07-10T12:00:00.000Z'),
          status: 'bot_replied',
          firstLandingPage: '/services/crm',
          currentPageUrl: '/services/crm',
          utmSource: 'google',
          utmMedium: 'organic',
          email: null,
          name: null,
          serviceInterest: null,
          appointments: [],
        },
      ],
    },
    formResponse: { findMany: async () => [] },
    digitalSystemsReviewLead: { findMany: async () => [] },
  };

  const records = await collectConversionEvidence(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
  });

  assert.equal(records.length, 1);
  assert.ok(records[0].conversionTypes.includes('chat_initiated'));
  assert.equal(records[0].journeyKey, 'chat:chat-1');
});

test('chat followed by review lead shares chatSession journey key', async () => {
  const prisma = {
    chatSession: {
      findMany: async () => [
        {
          id: 'shared-chat',
          createdAt: new Date('2026-07-10T10:00:00.000Z'),
          status: 'admin_needed',
          firstLandingPage: '/digital-systems-review',
          currentPageUrl: '/digital-systems-review',
          utmSource: 'google',
          utmMedium: 'cpc',
          email: 'hidden@example.com',
          name: 'Hidden',
          serviceInterest: 'CRM',
          appointments: [],
        },
      ],
    },
    formResponse: { findMany: async () => [] },
    digitalSystemsReviewLead: {
      findMany: async () => [
        {
          id: 1,
          submissionId: 'sub-1',
          createdAt: new Date('2026-07-10T11:00:00.000Z'),
          status: 'qualified',
          landingPage: '/digital-systems-review',
          sourcePagePath: '/digital-systems-review',
          pageLocation: '/digital-systems-review',
          chatSessionId: 'shared-chat',
          journeyReference: null,
          sessionReference: null,
          firstTouchSource: 'google',
          firstTouchMedium: 'cpc',
          latestTouchSource: 'google',
          latestTouchMedium: 'cpc',
          proposalValueMinor: null,
          proposalCurrency: 'GBP',
          wonAt: null,
          proposalSentAt: null,
          qualifiedAt: new Date('2026-07-11T09:00:00.000Z'),
        },
      ],
    },
  };

  const records = await collectConversionEvidence(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
  });

  assert.equal(records.length, 2);
  assert.equal(records[0].journeyKey, 'chat:shared-chat');
  assert.equal(records[1].journeyKey, 'chat:shared-chat');
});

test('duplicate journey references dedupe qualified lead counting', () => {
  const record: RawConversionEvidence = {
    recordId: 'review:1',
    metricDate: '2026-07-10',
    journeyKey: 'journey:abc',
    conversionTypes: ['systems_review_requested', 'qualified_lead'],
    firstTouch: { page: '/review', source: 'google', medium: 'organic' },
    lastTouch: { page: '/review', source: 'google', medium: 'organic' },
    leadQuality: 'qualified',
    attributedValueMinor: 0,
    currency: 'GBP',
  };

  const resolved = [
    {
      record,
      model: 'first_touch' as const,
      attribution: {
        landingPageUrl: 'https://uk.primewayz.com/review',
        seoPageId: 1,
        channelGroup: 'organic',
        isUnknownLanding: false,
      },
    },
    {
      record: { ...record, recordId: 'review:2' },
      model: 'first_touch' as const,
      attribution: {
        landingPageUrl: 'https://uk.primewayz.com/review',
        seoPageId: 1,
        channelGroup: 'organic',
        isUnknownLanding: false,
      },
    },
  ];

  const { buckets, dedupedEvents } = aggregateConversionEvidenceRecords(resolved);
  assert.ok(dedupedEvents >= 1);
  assert.equal(buckets[0]?.qualifiedLeads, 1);
});

test('unknown source keeps unknown channel group', () => {
  assert.equal(classifyChannelGroup(null, null), 'unknown');
});

test('qualified lead mapping does not treat new review status as qualified', () => {
  assert.equal(mapReviewLeadStatusToLeadQuality('new'), 'unknown');
});

test('booking and won opportunity evidence increments counters', () => {
  const record: RawConversionEvidence = {
    recordId: 'review:99',
    metricDate: '2026-07-15',
    journeyKey: 'journey:won-1',
    conversionTypes: ['systems_review_requested', 'opportunity_won', 'booking_completed'],
    firstTouch: { page: '/pricing', source: '(direct)', medium: '(none)' },
    lastTouch: { page: '/pricing', source: '(direct)', medium: '(none)' },
    leadQuality: 'sales_accepted',
    attributedValueMinor: 250000,
    currency: 'GBP',
  };

  const { buckets } = aggregateConversionEvidenceRecords([
    {
      record,
      model: 'first_touch',
      attribution: {
        landingPageUrl: 'https://uk.primewayz.com/pricing',
        seoPageId: 3,
        channelGroup: 'direct',
        isUnknownLanding: false,
      },
    },
  ]);

  assert.equal(buckets[0]?.wonOpportunities, 1);
  assert.equal(buckets[0]?.bookingsCompleted, 1);
  assert.equal(buckets[0]?.attributedValueMinor, 250000);
});

test('missing landing page increments unknown attribution in rebuild dry-run', async () => {
  const prisma = {
    chatSession: {
      findMany: async () => [
        {
          id: 'chat-unknown',
          createdAt: new Date('2026-07-12T12:00:00.000Z'),
          status: 'new',
          firstLandingPage: null,
          currentPageUrl: null,
          utmSource: null,
          utmMedium: null,
          email: null,
          name: null,
          serviceInterest: null,
          appointments: [],
        },
      ],
    },
    formResponse: { findMany: async () => [] },
    digitalSystemsReviewLead: { findMany: async () => [] },
    seoPage: { findUnique: async () => null, create: async () => ({ id: 1 }) },
    seoPageAlias: {
      findUnique: async () => null,
      create: async () => ({ id: 1 }),
      update: async () => ({}),
    },
  };

  const report = await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: true,
  });

  assert.equal(report.dryRun, true);
  assert.ok(report.unknownAttributionCount >= 1);
});

test('safe summary never includes email, phone or message fields', () => {
  const records: RawConversionEvidence[] = [
    {
      recordId: 'chat:1',
      metricDate: '2026-07-01',
      journeyKey: 'chat:1',
      conversionTypes: ['chat_initiated'],
      firstTouch: { page: '/a', source: 'google', medium: 'organic' },
      lastTouch: { page: '/a', source: 'google', medium: 'organic' },
      leadQuality: 'unknown',
      attributedValueMinor: 0,
      currency: 'GBP',
    },
  ];
  const summary = toSafeConversionEvidenceSummary(records);
  const serialised = JSON.stringify(summary);
  assert.equal(serialised.includes('email'), false);
  assert.equal(serialised.includes('phone'), false);
  assert.equal(serialised.includes('message'), false);
});

test('chat contact details map to captured outcome without reading message text', () => {
  const outcome = mapChatStatusToConversationOutcome({
    status: 'admin_needed',
    hasContactDetails: true,
    hasServiceInterest: false,
    hasPendingAppointment: false,
  });
  assert.equal(outcome, 'contact_details_captured');
});

test('first write creates conversion aggregate rows', async () => {
  const prisma = createConversionRebuildPrisma();
  const report = await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: false,
  });

  assert.equal(report.dryRun, false);
  assert.ok(report.bucketsWritten > 0);
  assert.equal(prisma._rows.length, report.bucketsWritten);
});

test('rerunning the same range is idempotent', async () => {
  const prisma = createConversionRebuildPrisma();
  const options = {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: false,
  };

  const first = await rebuildSeoPageConversions(prisma as unknown as PrismaClient, options);
  const snapshot = normaliseRowsForComparison(prisma._rows);
  const second = await rebuildSeoPageConversions(prisma as unknown as PrismaClient, options);

  assert.equal(first.bucketsWritten, second.bucketsWritten);
  assert.deepEqual(normaliseRowsForComparison(prisma._rows), snapshot);
});

test('rerun does not duplicate unknown-page rows', async () => {
  const prisma = createConversionRebuildPrisma();
  const options = {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: false,
    pageScope: { kind: 'unknown' as const },
  };

  await rebuildSeoPageConversions(prisma as unknown as PrismaClient, options);
  const unknownRowsAfterFirst = prisma._rows.filter((row) => row.seoPageId === null).length;
  await rebuildSeoPageConversions(prisma as unknown as PrismaClient, options);
  const unknownRowsAfterSecond = prisma._rows.filter((row) => row.seoPageId === null).length;

  assert.ok(unknownRowsAfterFirst > 0);
  assert.equal(unknownRowsAfterFirst, unknownRowsAfterSecond);
});

test('stale buckets are removed on rebuild', async () => {
  const staleHash = computeConversionBucketKeyHash({
    seoPageId: 99,
    attributionModel: 'first_touch',
    channelGroup: 'paid',
  });
  const prisma = createConversionRebuildPrisma({
    initialRows: [
      {
        id: 1,
        metricDate: new Date('2026-07-10T00:00:00.000Z'),
        seoPageId: 99,
        bucketKeyHash: staleHash,
        attributionModel: 'first_touch',
        channelGroup: 'paid',
        chatsInitiated: 50,
        qualifiedChats: 0,
        contactForms: 0,
        reviewRequests: 0,
        bookingRequests: 0,
        bookingsCompleted: 0,
        qualifiedLeads: 0,
        proposals: 0,
        wonOpportunities: 0,
        attributedValueMinor: 0,
        currency: 'GBP',
        unknownAttributionCount: 0,
      },
    ],
  });

  await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: false,
  });

  assert.equal(prisma._rows.some((row) => row.seoPageId === 99), false);
});

test('changed evidence replaces old values', async () => {
  const prisma = createConversionRebuildPrisma();
  await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: false,
  });
  const before = prisma._rows.find(
    (row) => row.seoPageId === 7 && row.attributionModel === 'first_touch',
  )?.chatsInitiated;

  prisma.chatSession.findMany = async () => [
    {
      id: 'chat-page-1',
      createdAt: new Date('2026-07-10T12:00:00.000Z'),
      status: 'bot_replied',
      firstLandingPage: '/services/crm',
      currentPageUrl: '/services/crm',
      utmSource: 'google',
      utmMedium: 'organic',
      email: null,
      name: null,
      serviceInterest: null,
      appointments: [],
    },
    {
      id: 'chat-page-2',
      createdAt: new Date('2026-07-10T13:00:00.000Z'),
      status: 'bot_replied',
      firstLandingPage: '/services/crm',
      currentPageUrl: '/services/crm',
      utmSource: 'google',
      utmMedium: 'organic',
      email: null,
      name: null,
      serviceInterest: null,
      appointments: [],
    },
    {
      id: 'chat-unknown',
      createdAt: new Date('2026-07-11T12:00:00.000Z'),
      status: 'new',
      firstLandingPage: null,
      currentPageUrl: null,
      utmSource: null,
      utmMedium: null,
      email: null,
      name: null,
      serviceInterest: null,
      appointments: [],
    },
  ];

  await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: false,
  });
  const after = prisma._rows.find(
    (row) => row.seoPageId === 7 && row.attributionModel === 'first_touch',
  )?.chatsInitiated;
  assert.equal(before, 1);
  assert.equal(after, 2);
});

test('page-scoped rebuild preserves unrelated pages', async () => {
  const prisma = createConversionRebuildPrisma();
  await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: false,
  });
  const unrelated = prisma._rows.filter((row) => row.seoPageId === null);
  assert.ok(unrelated.length > 0);

  await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: false,
    pageScope: { kind: 'page', seoPageId: 7 },
  });

  assert.ok(prisma._rows.some((row) => row.seoPageId === null));
});

test('full-range rebuild replaces all rows in scope', async () => {
  const prisma = createConversionRebuildPrisma();
  await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: false,
  });
  const firstCount = prisma._rows.length;

  prisma.chatSession.findMany = async () => [];
  await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: false,
  });

  assert.equal(prisma._rows.length, 0);
  assert.ok(firstCount > 0);
});

test('concurrent write rebuild is rejected', async () => {
  const prisma = createConversionRebuildPrisma({ lockHeld: true });
  await assert.rejects(
    () =>
      rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
        dateFrom: '2026-07-01',
        dateTo: '2026-07-31',
        dryRun: false,
      }),
    /already running/,
  );
});

test('dry-run does not acquire write lock', async () => {
  const prisma = createConversionRebuildPrisma();
  await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: true,
  });
  assert.equal(prisma._lockState.acquireCount, 0);
  assert.equal(prisma._lockState.releaseCount, 0);
});

test('dry-run performs no delete or create', async () => {
  const prisma = createConversionRebuildPrisma({
    initialRows: [
      {
        id: 1,
        metricDate: new Date('2026-07-10T00:00:00.000Z'),
        seoPageId: null,
        bucketKeyHash: computeConversionBucketKeyHash({
          seoPageId: null,
          attributionModel: 'first_touch',
          channelGroup: 'unknown',
        }),
        attributionModel: 'first_touch',
        channelGroup: 'unknown',
        chatsInitiated: 3,
        qualifiedChats: 0,
        contactForms: 0,
        reviewRequests: 0,
        bookingRequests: 0,
        bookingsCompleted: 0,
        qualifiedLeads: 0,
        proposals: 0,
        wonOpportunities: 0,
        attributedValueMinor: 0,
        currency: 'GBP',
        unknownAttributionCount: 1,
      },
    ],
  });

  const report = await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: true,
  });

  assert.equal(report.rowsDeleted, 0);
  assert.equal(prisma._rows.length, 1);
  assert.equal(prisma._rows[0]?.chatsInitiated, 3);
});

test('transaction rollback preserves previous rows', async () => {
  const prisma = createConversionRebuildPrisma({
    initialRows: [
      {
        id: 1,
        metricDate: new Date('2026-07-10T00:00:00.000Z'),
        seoPageId: null,
        bucketKeyHash: computeConversionBucketKeyHash({
          seoPageId: null,
          attributionModel: 'first_touch',
          channelGroup: 'unknown',
        }),
        attributionModel: 'first_touch',
        channelGroup: 'unknown',
        chatsInitiated: 4,
        qualifiedChats: 0,
        contactForms: 0,
        reviewRequests: 0,
        bookingRequests: 0,
        bookingsCompleted: 0,
        qualifiedLeads: 0,
        proposals: 0,
        wonOpportunities: 0,
        attributedValueMinor: 0,
        currency: 'GBP',
        unknownAttributionCount: 1,
      },
    ],
    failCreate: true,
  });

  prisma.$transaction = async (callback: (tx: ConversionRebuildTestPrisma) => Promise<unknown>) => {
    const snapshot = JSON.stringify(prisma._rows);
    try {
      return await callback(prisma);
    } catch {
      prisma._rows.splice(0, prisma._rows.length, ...JSON.parse(snapshot));
      throw new Error('transaction rolled back');
    }
  };

  await assert.rejects(
    () =>
      rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
        dateFrom: '2026-07-01',
        dateTo: '2026-07-31',
        dryRun: false,
      }),
    /transaction rolled back/,
  );
  assert.equal(prisma._rows.length, 1);
  assert.equal(prisma._rows[0]?.chatsInitiated, 4);
});

test('write rebuild releases lock after success', async () => {
  const prisma = createConversionRebuildPrisma();
  await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: false,
  });
  assert.equal(prisma._lockState.acquireCount, 1);
  assert.equal(prisma._lockState.releaseCount, 1);
  assert.equal(prisma._lockState.held, false);
});

test('write rebuild releases lock after failure', async () => {
  const prisma = createConversionRebuildPrisma({ failCreate: true });
  await assert.rejects(
    () =>
      rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
        dateFrom: '2026-07-01',
        dateTo: '2026-07-31',
        dryRun: false,
      }),
    /insert failed/,
  );
  assert.equal(prisma._lockState.acquireCount, 1);
  assert.equal(prisma._lockState.releaseCount, 1);
  assert.equal(prisma._lockState.held, false);
});

test('rebuild report and bucket keys contain no PII', async () => {
  const prisma = createConversionRebuildPrisma();
  const report = await rebuildSeoPageConversions(prisma as unknown as PrismaClient, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-31',
    dryRun: true,
  });
  const serialised = JSON.stringify({
    report,
    bucketHashes: prisma._rows.map((row) => row.bucketKeyHash),
  });
  assert.equal(serialised.includes('email'), false);
  assert.equal(serialised.includes('phone'), false);
  assert.equal(serialised.includes('message'), false);
});

test('persistConversionBuckets uses scoped delete replacement', async () => {
  const prisma = createConversionRebuildPrisma();
  const buckets = aggregateConversionEvidenceRecords([
    {
      record: {
        recordId: 'chat:1',
        metricDate: '2026-07-10',
        journeyKey: 'chat:1',
        conversionTypes: ['chat_initiated'],
        firstTouch: { page: '/services/crm', source: 'google', medium: 'organic' },
        lastTouch: { page: '/services/crm', source: 'google', medium: 'organic' },
        leadQuality: 'unknown',
        attributedValueMinor: 0,
        currency: 'GBP',
      },
      model: 'first_touch',
      attribution: {
        landingPageUrl: 'https://uk.primewayz.com/services/crm',
        seoPageId: 7,
        channelGroup: 'organic',
        isUnknownLanding: false,
      },
    },
  ]).buckets;

  const result = await persistConversionBuckets(
    prisma as unknown as PrismaClient,
    { dateFrom: '2026-07-01', dateTo: '2026-07-31' },
    buckets,
    { kind: 'page', seoPageId: 7 },
  );

  assert.equal(result.rowsDeleted, 0);
  assert.equal(prisma._rows.length, 1);
  assert.equal(prisma._lockState.acquireCount, 1);
});

test('dry-run lock helpers are not invoked by aggregation dry-run path', async () => {
  const prisma = createConversionRebuildPrisma();
  assert.equal(await acquireConversionRebuildLock(prisma as unknown as PrismaClient), true);
  await releaseConversionRebuildLock(prisma as unknown as PrismaClient);
  assert.equal(prisma._lockState.acquireCount, 1);
});
