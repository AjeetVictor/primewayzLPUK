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
