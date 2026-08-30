/**
 * Tests for GA4 performance reporting over stored metrics.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { getGa4PerformanceReport } from './ga4PerformanceService.ts';

test('source-not-configured response never includes summary zeros', async () => {
  delete process.env.GA4_PROPERTY_ID;
  delete process.env.GA4_SERVICE_ACCOUNT_CLIENT_EMAIL;
  delete process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY;

  const report = await getGa4PerformanceReport({} as never, {});
  assert.equal(report.configured, false);
  assert.equal(report.summary, null);
  assert.equal(report.dataQuality, null);
});

test('stored-data reporting aggregates summary from prisma rows', async () => {
  process.env.GA4_PROPERTY_ID = '123456789';
  process.env.GA4_SERVICE_ACCOUNT_CLIENT_EMAIL = 'ga4@project.iam.gserviceaccount.com';
  process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY = 'test-key';

  const prisma = {
    ga4ConfigurationState: {
      findUnique: async () => ({ lastSuccessfulSyncAt: new Date('2026-07-10T00:00:00.000Z') }),
    },
    ga4PageMetric: {
      findMany: async () => [
        {
          metricDate: new Date('2026-07-01T00:00:00.000Z'),
          seoPageId: 1,
          observedLandingPage: '/services/crm',
          normalisedLandingPage: 'https://uk.primewayz.com/services/crm',
          defaultChannelGroup: 'Organic Search',
          source: 'google',
          medium: 'organic',
          sessions: 10,
          organicSessions: 10,
          engagedSessions: 8,
          engagementRate: 0.8,
          averageEngagementTime: 40,
          keyEvents: 2,
          generateLeadEvents: 1,
          contactFormConversions: 1,
          bookingConversions: 0,
          seoPage: { canonicalUrl: 'https://uk.primewayz.com/services/crm' },
        },
      ],
      findFirst: async () => ({ metricDate: new Date('2026-07-01T00:00:00.000Z') }),
    },
  };

  const report = await getGa4PerformanceReport(prisma as never, {
    dateFrom: '2026-07-01',
    dateTo: '2026-07-01',
    compare: false,
  });

  assert.equal(report.configured, true);
  assert.equal(report.summary?.organicSessions, 10);
  assert.equal(report.summary?.engagementRate, 0.8);
  assert.equal(report.topPages.length, 1);
  assert.equal(report.topPages[0].matchStatus, 'matched');
});
