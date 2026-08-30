/**
 * Orchestrates GSC opportunity refresh after metric sync.
 * Failure here must not invalidate a successful metric sync.
 */

import type { PrismaClient } from '@prisma/client';
import { appendActivityLog } from './activityLogService.ts';
import {
  analyseGscOpportunities,
  upsertGscOpportunityCandidates,
  type UpsertGscOpportunityResult,
} from './gscOpportunityService.ts';
import { addDaysToDateString } from './gscDateUtils.ts';
import { countInclusiveCalendarDays } from './gscSyncDateValidation.ts';

export type GscOpportunityRefreshResult = {
  status: 'succeeded' | 'failed' | 'skipped';
  findingsCount: number;
  upsert: UpsertGscOpportunityResult | null;
  errorCode: string | null;
  errorMessage: string | null;
  currentPeriod: { dateFrom: string; dateTo: string } | null;
  comparisonPeriod: { dateFrom: string; dateTo: string } | null;
};

export type RefreshGscOpportunitiesInput = {
  connectionId: number;
  dateFrom: string;
  dateTo: string;
  actorId?: number | null;
  correlationId?: string | null;
  syncRunId?: number | null;
};

export async function refreshGscOpportunitiesAfterSync(
  prisma: PrismaClient,
  input: RefreshGscOpportunitiesInput,
): Promise<GscOpportunityRefreshResult> {
  const dayCount = countInclusiveCalendarDays(input.dateFrom, input.dateTo);
  const currentPeriod = { dateFrom: input.dateFrom, dateTo: input.dateTo };
  const comparisonPeriod = {
    dateFrom: addDaysToDateString(input.dateFrom, -dayCount),
    dateTo: addDaysToDateString(input.dateFrom, -1),
  };

  try {
    const findings = await analyseGscOpportunities(prisma, input.connectionId, {
      currentPeriod,
      comparisonPeriod,
    });

    const upsert = await upsertGscOpportunityCandidates(prisma, findings);

    await appendActivityLog(prisma, {
      entityType: 'gsc_connection',
      entityId: String(input.connectionId),
      eventType: 'gsc_opportunity_refresh_completed',
      actorType: input.actorId ? 'user' : 'system',
      actorId: input.actorId ?? null,
      source: 'admin',
      metadata: {
        connectionId: input.connectionId,
        syncRunId: input.syncRunId ?? null,
        findingsCount: findings.length,
        created: upsert.created,
        updated: upsert.updated,
        skipped: upsert.skipped,
        currentPeriod,
        comparisonPeriod,
      },
      correlationId: input.correlationId ?? null,
    }).catch(() => undefined);

    return {
      status: 'succeeded',
      findingsCount: findings.length,
      upsert,
      errorCode: null,
      errorMessage: null,
      currentPeriod,
      comparisonPeriod,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'GSC opportunity refresh failed.';
    const errorCode = 'GSC_OPPORTUNITY_REFRESH_FAILED';

    await appendActivityLog(prisma, {
      entityType: 'gsc_connection',
      entityId: String(input.connectionId),
      eventType: 'gsc_opportunity_refresh_failed',
      actorType: input.actorId ? 'user' : 'system',
      actorId: input.actorId ?? null,
      source: 'admin',
      metadata: {
        connectionId: input.connectionId,
        syncRunId: input.syncRunId ?? null,
        errorCode,
        currentPeriod,
        comparisonPeriod,
      },
      reason: errorMessage,
      correlationId: input.correlationId ?? null,
    }).catch(() => undefined);

    return {
      status: 'failed',
      findingsCount: 0,
      upsert: null,
      errorCode,
      errorMessage,
      currentPeriod,
      comparisonPeriod,
    };
  }
}

export async function getLatestGscOpportunityRefreshStatus(prisma: PrismaClient, connectionId: number) {
  const latest = await prisma.autopilotActivityLog.findFirst({
    where: {
      entityType: 'gsc_connection',
      entityId: String(connectionId),
      eventType: { in: ['gsc_opportunity_refresh_completed', 'gsc_opportunity_refresh_failed'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!latest) return null;

  const metadata =
    latest.metadata && typeof latest.metadata === 'object' && !Array.isArray(latest.metadata)
      ? (latest.metadata as Record<string, unknown>)
      : {};

  return {
    status: latest.eventType === 'gsc_opportunity_refresh_completed' ? 'succeeded' : 'failed',
    at: latest.createdAt.toISOString(),
    findingsCount: typeof metadata.findingsCount === 'number' ? metadata.findingsCount : null,
    errorMessage: latest.reason,
  };
}
