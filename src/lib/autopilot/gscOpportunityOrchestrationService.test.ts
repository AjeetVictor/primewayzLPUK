import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { refreshGscOpportunitiesAfterSync } from './gscOpportunityOrchestrationService.ts';

describe('gscOpportunityOrchestrationService', () => {
  it('records success without throwing when analysis returns empty', async () => {
    const activity: Array<Record<string, unknown>> = [];
    const prisma = {
      gscQueryPageMetric: {
        findMany: async () => [],
      },
      autopilotKeywordCandidate: {
        findMany: async () => [],
        findFirst: async () => null,
        create: async () => ({ id: 1 }),
        update: async () => ({}),
      },
      autopilotActivityLog: {
        create: async ({ data }: { data: Record<string, unknown> }) => {
          activity.push(data);
          return data;
        },
        findFirst: async () => null,
      },
    };

    const result = await refreshGscOpportunitiesAfterSync(prisma as never, {
      connectionId: 1,
      dateFrom: '2026-07-01',
      dateTo: '2026-07-28',
    });

    assert.equal(result.status, 'succeeded');
    assert.equal(result.findingsCount, 0);
    assert.ok(activity.some((row) => row.eventType === 'gsc_opportunity_refresh_completed'));
  });

  it('isolates downstream failure from sync success semantics', async () => {
    const prisma = {
      gscQueryPageMetric: {
        findMany: async () => {
          throw new Error('analysis exploded');
        },
      },
      autopilotActivityLog: {
        create: async ({ data }: { data: Record<string, unknown> }) => data,
        findFirst: async () => null,
      },
    };

    const result = await refreshGscOpportunitiesAfterSync(prisma as never, {
      connectionId: 1,
      dateFrom: '2026-07-01',
      dateTo: '2026-07-28',
    });

    assert.equal(result.status, 'failed');
    assert.match(result.errorMessage ?? '', /analysis exploded/);
  });
});
