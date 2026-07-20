/**
 * Article Autopilot 2.0 — score persistence service (Phase 1C).
 * Recomputes totals from stored dimension/penalty columns; never trusts a client total.
 */

import { Prisma, type PrismaClient } from '@prisma/client';
import { AUTOPILOT_SCORE_DIMENSION_KEYS } from '../../data/autopilot/scoringConfig.ts';
import type {
  AutopilotScoreDimensions,
  AutopilotScorePenalties,
} from '../../data/autopilot/types.ts';
import { appendActivityLog } from './activityLogService.ts';
import { AUTOPILOT_ERROR_CODES, AutopilotError } from './apiErrors.ts';
import { calculateAutopilotScore } from './scoringService.ts';
import {
  actorDisplayName,
  decimalToNumber,
  requireTopic,
  serializeTopicRow,
  toDecimalOrNull,
  type AdminActor,
} from './topicHelpers.ts';

export async function recalculateAndPersistTopicScore(
  prisma: PrismaClient,
  topicId: number,
  actor: AdminActor,
  correlationId: string,
) {
  const topic = await requireTopic(prisma, topicId);
  const topicRecord = topic as unknown as Record<string, unknown>;

  const missing: string[] = [];
  const dimensions = {} as AutopilotScoreDimensions;
  for (const key of AUTOPILOT_SCORE_DIMENSION_KEYS) {
    const value = decimalToNumber(topicRecord[key]);
    if (value === null) {
      missing.push(key);
    } else {
      dimensions[key] = value;
    }
  }

  if (missing.length > 0) {
    throw new AutopilotError(
      AUTOPILOT_ERROR_CODES.SCORE_DIMENSIONS_INCOMPLETE,
      'All score dimensions must be set before a score can be calculated.',
      400,
      { missing },
    );
  }

  const penalties: AutopilotScorePenalties = {
    cannibalisation: decimalToNumber(topic.cannibalisationPenalty) ?? 0,
    unsupportedClaimRisk: decimalToNumber(topic.unsupportedClaimRiskPenalty) ?? 0,
  };

  const calculation = calculateAutopilotScore({ dimensions, penalties });

  const previousValue = {
    rawScore: decimalToNumber(topic.rawScore),
    totalScore: decimalToNumber(topic.totalScore),
  };
  const newValue = {
    rawScore: calculation.rawWeightedScore,
    totalScore: calculation.totalScore,
    scoringVersion: calculation.scoringVersion,
  };

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.autopilotTopic.update({
      where: { id: topicId },
      data: {
        rawScore: toDecimalOrNull(calculation.rawWeightedScore),
        totalScore: toDecimalOrNull(calculation.totalScore),
        scoringVersion: calculation.scoringVersion,
        scoreBreakdown: {
          dimensions: calculation.dimensions,
          penalties: calculation.penalties,
          ...(calculation.explanations ? { explanations: calculation.explanations } : {}),
        } as Prisma.InputJsonValue,
        serviceRelevance: toDecimalOrNull(calculation.dimensions.serviceRelevance),
        businessValue: toDecimalOrNull(calculation.dimensions.businessValue),
        buyerIntent: toDecimalOrNull(calculation.dimensions.buyerIntent),
        topicalAuthorityFit: toDecimalOrNull(calculation.dimensions.topicalAuthorityFit),
        contentGap: toDecimalOrNull(calculation.dimensions.contentGap),
        differentiationPotential: toDecimalOrNull(
          calculation.dimensions.differentiationPotential,
        ),
        rankingFeasibility: toDecimalOrNull(calculation.dimensions.rankingFeasibility),
        evidenceConfidence: toDecimalOrNull(calculation.dimensions.evidenceConfidence),
        internalLinkOpportunity: toDecimalOrNull(calculation.dimensions.internalLinkOpportunity),
        commercialPageSupport: toDecimalOrNull(calculation.dimensions.commercialPageSupport),
        cannibalisationPenalty: toDecimalOrNull(calculation.penalties.cannibalisation),
        unsupportedClaimRiskPenalty: toDecimalOrNull(
          calculation.penalties.unsupportedClaimRisk,
        ),
        updatedById: actor.id,
      },
    });

    await appendActivityLog(tx, {
      entityType: 'topic',
      entityId: String(topicId),
      eventType: 'score_calculated',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue,
      newValue,
      metadata: {
        scoringVersion: calculation.scoringVersion,
        recommendationBand: calculation.recommendationBand,
      },
      correlationId,
    });

    return row;
  });

  return {
    calculation,
    topic: serializeTopicRow(updated as unknown as Record<string, unknown>),
  };
}
