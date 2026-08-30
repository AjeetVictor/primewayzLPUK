/**
 * Article Autopilot 2.0 — editorial dashboard aggregate service (Phase 1C + 2A).
 */

import type { PrismaClient } from '@prisma/client';
import { AUTOPILOT_RECOMMENDATION_BAND_THRESHOLDS } from '../../data/autopilot/scoringConfig.ts';
import { AUTOPILOT_DECISION_STATUSES, AUTOPILOT_TOPIC_STATUSES } from '../../data/autopilot/status.ts';
import { redactSensitive } from './activityLogService.ts';
import { getKeywordImportDashboardStats } from './keywordCandidateService.ts';
import { getResearchDashboardStats } from './researchSnapshotService.ts';
import { serializeTopicRow } from './topicHelpers.ts';
import { listRecentFailedWorkflowRuns } from './workflowRunService.ts';
import { findRetainedGscConnection } from './gscConnectionService.ts';
import { getGscOpportunitySummary } from './gscOpportunityService.ts';
import { getLatestGscOpportunityRefreshStatus } from './gscOpportunityOrchestrationService.ts';
import { getGscPerformanceReport } from './gscPerformanceService.ts';

const ACTIVE_TOPIC_WHERE = { archivedAt: null } as const;

export async function getAutopilotDashboard(prisma: PrismaClient) {
  const [
    totalActiveTopics,
    archivedCount,
    topicStatusCounts,
    decisionStatusCounts,
    scoreBandCounts,
    recentTopicsRaw,
    recentActivityRaw,
    recentFailedWorkflowRuns,
    keywordImportStats,
    researchStatsBundle,
    gscConnection,
    gscPerformance,
    gscOpportunitySummary,
    gscOpportunityRefreshStatus,
  ] = await Promise.all([
    prisma.autopilotTopic.count({ where: ACTIVE_TOPIC_WHERE }),
    prisma.autopilotTopic.count({ where: { archivedAt: { not: null } } }),
    Promise.all(
      AUTOPILOT_TOPIC_STATUSES.map(async (status) => ({
        status,
        count: await prisma.autopilotTopic.count({
          where: { ...ACTIVE_TOPIC_WHERE, topicStatus: status },
        }),
      })),
    ),
    Promise.all(
      AUTOPILOT_DECISION_STATUSES.map(async (status) => ({
        status,
        count: await prisma.autopilotTopic.count({
          where: { ...ACTIVE_TOPIC_WHERE, decisionStatus: status },
        }),
      })),
    ),
    Promise.all(
      AUTOPILOT_RECOMMENDATION_BAND_THRESHOLDS.map(async (entry) => ({
        band: entry.band,
        label: entry.label,
        count: await prisma.autopilotTopic.count({
          where: { ...ACTIVE_TOPIC_WHERE, totalScore: { gte: entry.min, lte: entry.max } },
        }),
      })),
    ),
    prisma.autopilotTopic.findMany({
      where: ACTIVE_TOPIC_WHERE,
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.autopilotActivityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    listRecentFailedWorkflowRuns(prisma, 5),
    getKeywordImportDashboardStats(prisma),
    getResearchDashboardStats(prisma),
    findRetainedGscConnection(prisma),
    getGscPerformanceReport(prisma),
    getGscOpportunitySummary(prisma),
    findRetainedGscConnection(prisma).then((conn) =>
      conn ? getLatestGscOpportunityRefreshStatus(prisma, conn.id) : null,
    ),
  ]);

  return {
    totalActiveTopics,
    archivedCount,
    topicStatusCounts,
    decisionStatusCounts,
    scoreBandCounts,
    recentTopics: recentTopicsRaw.map((row) =>
      serializeTopicRow(row as unknown as Record<string, unknown>),
    ),
    recentActivity: recentActivityRaw.map((entry) => ({
      ...entry,
      previousValue: redactSensitive(entry.previousValue),
      newValue: redactSensitive(entry.newValue),
      metadata: redactSensitive(entry.metadata),
      createdAt: entry.createdAt.toISOString(),
    })),
    recentFailedWorkflowRuns,
    ...(keywordImportStats || {}),
    ...(researchStatsBundle || {}),
    gscSourceHealth: {
      connected: gscConnection?.status === 'ACTIVE',
      lastSuccessfulSyncAt: gscConnection?.lastSuccessfulSyncAt?.toISOString() ?? null,
      latestMetricDate: gscPerformance.dataQuality?.latestMetricDate ?? null,
      missingDatesCount: gscPerformance.dataQuality?.missingDates.length ?? 0,
      stale: gscPerformance.dataQuality?.stale ?? true,
      opportunityRefreshStatus: gscOpportunityRefreshStatus?.status ?? null,
      opportunityRefreshAt: gscOpportunityRefreshStatus?.at ?? null,
    },
    gscPerformanceSummary: gscPerformance.summary,
    gscPerformanceComparison: gscPerformance.comparison,
    gscOpportunityPipeline: gscOpportunitySummary,
  };
}
