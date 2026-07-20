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
  };
}
