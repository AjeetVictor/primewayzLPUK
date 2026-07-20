/**
 * Keyword candidate review and conversion services (Phase 2A).
 */

import { Prisma, type PrismaClient } from '@prisma/client';
import {
  AUTOPILOT_KEYWORD_CANDIDATE_STATUSES,
  type AutopilotKeywordCandidateStatus,
} from '../../data/autopilot/keywordImportStatus.ts';
import { AUTOPILOT_FOUNDATION_DEFAULT_STATUSES } from '../../data/autopilot/status.ts';
import { appendActivityLog } from './activityLogService.ts';
import { conflict, notFound, validationError } from './apiErrors.ts';
import {
  assertNoPrototypePollution,
  AUTOPILOT_MAX_REASON_LENGTH,
  parsePagination,
  requireNonEmptyString,
} from './apiValidation.ts';
import { canEditorialAutopilot } from './autopilotPermissions.ts';
import { serializeKeywordCandidate } from './keywordImportService.ts';
import { normaliseAutopilotKeyword } from './keywordNormalisation.ts';
import {
  actorDisplayName,
  serializeTopicRow,
  type AdminActor,
} from './topicHelpers.ts';

const CONTRIBUTOR_REVIEW_STATUSES = new Set([
  'reviewing',
  'accepted',
  'rejected',
  'deferred',
]);

function isCandidateStatus(value: unknown): value is AutopilotKeywordCandidateStatus {
  return (
    typeof value === 'string' &&
    (AUTOPILOT_KEYWORD_CANDIDATE_STATUSES as readonly string[]).includes(value)
  );
}

async function requireCandidate(prisma: PrismaClient, id: number) {
  const candidate = await prisma.autopilotKeywordCandidate.findUnique({ where: { id } });
  if (!candidate) throw notFound('Keyword candidate not found.', { id });
  return candidate;
}

export async function listKeywordCandidates(
  prisma: PrismaClient,
  query: Record<string, unknown>,
) {
  const { limit, offset } = parsePagination(query);
  const where: Prisma.AutopilotKeywordCandidateWhereInput = {};

  if (typeof query.batchId === 'string' || typeof query.batchId === 'number') {
    const batchId = Number(query.batchId);
    if (Number.isInteger(batchId) && batchId > 0) where.batchId = batchId;
  }
  if (isCandidateStatus(query.status)) where.status = query.status;
  if (typeof query.sourceType === 'string' && query.sourceType.trim()) {
    where.sourceType = query.sourceType.trim();
  }
  if (typeof query.q === 'string' && query.q.trim()) {
    const q = query.q.trim();
    where.OR = [
      { keyword: { contains: q } },
      { normalisedKeyword: { contains: normaliseAutopilotKeyword(q).normalised } },
    ];
  }
  if (query.duplicatesOnly === 'true' || query.duplicatesOnly === true) {
    where.status = 'duplicate';
  }
  if (query.nonDuplicatesOnly === 'true' || query.nonDuplicatesOnly === true) {
    where.NOT = { status: 'duplicate' };
  }
  if (query.convertedOnly === 'true' || query.convertedOnly === true) {
    where.convertedTopicId = { not: null };
  }
  if (query.unconvertedOnly === 'true' || query.unconvertedOnly === true) {
    where.convertedTopicId = null;
  }
  if (query.hasSearchVolume === 'true' || query.hasSearchVolume === true) {
    where.searchVolume = { not: null };
  }
  if (query.hasSearchVolume === 'false' || query.hasSearchVolume === false) {
    where.searchVolume = null;
  }
  if (typeof query.minImpressions === 'string' || typeof query.minImpressions === 'number') {
    const min = Number(query.minImpressions);
    if (Number.isFinite(min) && min >= 0) where.impressions = { gte: Math.floor(min) };
  }
  if (typeof query.minClicks === 'string' || typeof query.minClicks === 'number') {
    const min = Number(query.minClicks);
    if (Number.isFinite(min) && min >= 0) where.clicks = { gte: Math.floor(min) };
  }

  const [total, items] = await Promise.all([
    prisma.autopilotKeywordCandidate.count({ where }),
    prisma.autopilotKeywordCandidate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ]);

  return {
    items: items.map((item) =>
      serializeKeywordCandidate(item as unknown as Record<string, unknown>),
    ),
    total,
    limit,
    offset,
  };
}

export async function getKeywordCandidate(prisma: PrismaClient, id: number) {
  const candidate = await requireCandidate(prisma, id);
  const recentActivity = await prisma.autopilotActivityLog.findMany({
    where: { entityType: 'keyword_candidate', entityId: String(id) },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return {
    candidate: serializeKeywordCandidate(candidate as unknown as Record<string, unknown>),
    recentActivity: recentActivity.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function patchKeywordCandidate(
  prisma: PrismaClient,
  actor: AdminActor,
  id: number,
  body: Record<string, unknown>,
  correlationId: string,
) {
  assertNoPrototypePollution(body);
  const candidate = await requireCandidate(prisma, id);
  const editorial = canEditorialAutopilot(actor.role);

  const forbidden = [
    'id',
    'batchId',
    'createdAt',
    'updatedAt',
    'convertedTopicId',
    'convertedById',
    'convertedAt',
    'impressions',
    'clicks',
    'ctr',
    'averagePosition',
    'searchVolume',
    'keywordDifficulty',
    'keyword',
    'normalisedKeyword',
    'sourceType',
    'sourceData',
    'sourceRowNumber',
  ];
  for (const key of forbidden) {
    if (key in body) {
      throw validationError(`Field "${key}" cannot be modified through ordinary review.`, {
        field: key,
      });
    }
  }

  const data: Prisma.AutopilotKeywordCandidateUpdateInput = {};
  const previous: Record<string, unknown> = {};
  const next: Record<string, unknown> = {};
  let eventType: string = 'keyword_candidate_reviewed';
  let reason: string | null = null;

  if ('reviewNotes' in body) {
    const notes =
      body.reviewNotes == null ? null : String(body.reviewNotes).trim().slice(0, 5000);
    previous.reviewNotes = candidate.reviewNotes;
    next.reviewNotes = notes;
    data.reviewNotes = notes;
  }

  if ('status' in body) {
    if (!isCandidateStatus(body.status)) {
      throw validationError('Invalid candidate status.');
    }
    if (candidate.status === 'converted') {
      throw conflict('Converted candidates cannot change status.', {
        convertedTopicId: candidate.convertedTopicId,
      });
    }
    if (body.status === 'converted') {
      throw validationError('Use convert-to-topic to mark a candidate as converted.');
    }
    if (body.status === 'duplicate') {
      if (!editorial) {
        throw validationError('Editorial permission is required to mark duplicates.');
      }
      reason = requireNonEmptyString(body.reason, 'reason', AUTOPILOT_MAX_REASON_LENGTH);
      eventType = 'keyword_candidate_marked_duplicate';
    } else if (!CONTRIBUTOR_REVIEW_STATUSES.has(body.status)) {
      throw validationError('Unsupported candidate status transition.');
    } else {
      if (body.status === 'accepted') eventType = 'keyword_candidate_accepted';
      if (body.status === 'rejected') eventType = 'keyword_candidate_rejected';
      if (body.status === 'deferred') eventType = 'keyword_candidate_deferred';
      if (['rejected', 'deferred', 'accepted'].includes(body.status)) {
        reason = requireNonEmptyString(body.reason, 'reason', AUTOPILOT_MAX_REASON_LENGTH);
      }
    }
    previous.status = candidate.status;
    next.status = body.status;
    data.status = body.status;
    data.reviewedAt = new Date();
    data.reviewedBy = { connect: { id: actor.id } };
  }

  if ('duplicateOfCandidateId' in body) {
    if (!editorial) {
      throw validationError('Editorial permission is required to override duplicate links.');
    }
    reason =
      reason ||
      requireNonEmptyString(body.reason, 'reason', AUTOPILOT_MAX_REASON_LENGTH);
    const dupId =
      body.duplicateOfCandidateId === null ? null : Number(body.duplicateOfCandidateId);
    if (dupId !== null && (!Number.isInteger(dupId) || dupId < 1 || dupId === id)) {
      throw validationError('duplicateOfCandidateId must be a different positive id or null.');
    }
    previous.duplicateOfCandidateId = candidate.duplicateOfCandidateId;
    next.duplicateOfCandidateId = dupId;
    data.duplicateOf =
      dupId == null ? { disconnect: true } : { connect: { id: dupId } };
    eventType = 'keyword_candidate_marked_duplicate';
  }

  if (Object.keys(data).length === 0) {
    throw validationError('No review fields to update.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.autopilotKeywordCandidate.update({
      where: { id },
      data,
    });
    await appendActivityLog(tx, {
      entityType: 'keyword_candidate',
      entityId: String(id),
      eventType,
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue: previous,
      newValue: next,
      reason,
      correlationId,
    });
    return row;
  });

  return serializeKeywordCandidate(updated as unknown as Record<string, unknown>);
}

export type ConvertCandidateInput = {
  workingTitle: unknown;
  userProblem: unknown;
  audience: unknown;
  supportingKeywords?: unknown;
  market?: unknown;
  language?: unknown;
  location?: unknown;
  proposedSlug?: unknown;
};

export async function convertKeywordCandidateToTopic(
  prisma: PrismaClient,
  actor: AdminActor,
  id: number,
  input: ConvertCandidateInput,
  correlationId: string,
) {
  assertNoPrototypePollution(input as unknown as Record<string, unknown>);
  const candidate = await requireCandidate(prisma, id);

  if (candidate.convertedTopicId) {
    throw conflict('Candidate has already been converted to a topic.', {
      convertedTopicId: candidate.convertedTopicId,
      code: 'AUTOPILOT_CANDIDATE_ALREADY_CONVERTED',
    });
  }
  if (candidate.status === 'rejected') {
    throw conflict('Rejected candidates cannot be converted.', { status: candidate.status });
  }

  const workingTitle = requireNonEmptyString(input.workingTitle, 'workingTitle', 200);
  const userProblem = requireNonEmptyString(input.userProblem, 'userProblem', 5000);
  const audience = requireNonEmptyString(input.audience, 'audience', 500);
  const primaryKeyword = candidate.keyword;
  const supportingKeywords = Array.isArray(input.supportingKeywords)
    ? input.supportingKeywords.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const market =
    (typeof input.market === 'string' && input.market.trim()) ||
    candidate.country ||
    'United Kingdom';
  const language =
    (typeof input.language === 'string' && input.language.trim()) ||
    candidate.language ||
    'en-GB';
  const location =
    typeof input.location === 'string' && input.location.trim()
      ? input.location.trim()
      : null;
  const proposedSlug =
    typeof input.proposedSlug === 'string' && input.proposedSlug.trim()
      ? input.proposedSlug.trim()
      : null;

  const result = await prisma.$transaction(async (tx) => {
    const topic = await tx.autopilotTopic.create({
      data: {
        workingTitle,
        primaryKeyword,
        supportingKeywords,
        keywordVariants: [],
        userProblem,
        audience,
        market,
        language,
        location,
        source: 'import',
        proposedSlug,
        secondaryCategories: [],
        topicStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.topicStatus,
        decisionStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.decisionStatus,
        briefStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.briefStatus,
        draftStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.draftStatus,
        mediaStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.mediaStatus,
        publishingStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.publishingStatus,
        performanceStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.performanceStatus,
        serpEvidence: {
          notes: 'Imported from keyword candidate. Metrics are source facts, not search volume.',
          importedCandidateId: candidate.id,
          impressions: candidate.impressions,
          clicks: candidate.clicks,
          ctr: candidate.ctr == null ? null : Number(candidate.ctr),
          averagePosition:
            candidate.averagePosition == null ? null : Number(candidate.averagePosition),
          currentUrl: candidate.currentUrl,
          searchVolumeExplicit: candidate.searchVolume,
          keywordDifficultyExplicit:
            candidate.keywordDifficulty == null ? null : Number(candidate.keywordDifficulty),
        } as Prisma.InputJsonValue,
        aiMetadata: {
          notes: 'No AI used. Candidate converted manually in Phase 2A.',
          sourceBatchId: candidate.batchId,
          sourceType: candidate.sourceType,
        } as Prisma.InputJsonValue,
        createdById: actor.id,
        updatedById: actor.id,
      },
    });

    const updatedCandidate = await tx.autopilotKeywordCandidate.update({
      where: { id },
      data: {
        status: 'converted',
        convertedTopicId: topic.id,
        convertedById: actor.id,
        convertedAt: new Date(),
        reviewedAt: candidate.reviewedAt ?? new Date(),
        reviewedById: candidate.reviewedById ?? actor.id,
      },
    });

    if (candidate.batchId) {
      await tx.autopilotKeywordImportBatch.update({
        where: { id: candidate.batchId },
        data: { createdTopicCount: { increment: 1 } },
      });
    }

    await appendActivityLog(tx, {
      entityType: 'keyword_candidate',
      entityId: String(id),
      eventType: 'keyword_candidate_converted_to_topic',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue: { status: candidate.status, convertedTopicId: null },
      newValue: { status: 'converted', convertedTopicId: topic.id },
      metadata: { keyword: candidate.keyword },
      correlationId,
    });

    await appendActivityLog(tx, {
      entityType: 'topic',
      entityId: String(topic.id),
      eventType: 'topic_created',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'import',
      newValue: { workingTitle, primaryKeyword, source: 'import' },
      metadata: {
        workingTitle,
        fromKeywordCandidateId: candidate.id,
      },
      correlationId,
    });

    return { topic, candidate: updatedCandidate };
  });

  return {
    candidate: serializeKeywordCandidate(
      result.candidate as unknown as Record<string, unknown>,
    ),
    topic: serializeTopicRow(result.topic as unknown as Record<string, unknown>),
  };
}

export async function getKeywordImportDashboardStats(prisma: PrismaClient) {
  try {
    const [unreviewedCount, duplicateCount, convertedCount, recentImports] =
      await Promise.all([
        prisma.autopilotKeywordCandidate.count({
          where: { status: { in: ['new', 'reviewing'] } },
        }),
        prisma.autopilotKeywordCandidate.count({ where: { status: 'duplicate' } }),
        prisma.autopilotKeywordCandidate.count({
          where: { convertedTopicId: { not: null } },
        }),
        prisma.autopilotKeywordImportBatch.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

    return {
      unreviewedKeywordCandidateCount: unreviewedCount,
      duplicateKeywordCandidateCount: duplicateCount,
      convertedKeywordCandidateCount: convertedCount,
      recentKeywordImports: recentImports.map((batch) => ({
        id: batch.id,
        sourceType: batch.sourceType,
        sourceName: batch.sourceName,
        originalFileName: batch.originalFileName,
        status: batch.status,
        totalRows: batch.totalRows,
        validRows: batch.validRows,
        invalidRows: batch.invalidRows,
        duplicateRows: batch.duplicateRows,
        createdTopicCount: batch.createdTopicCount,
        createdAt: batch.createdAt.toISOString(),
        completedAt: batch.completedAt?.toISOString() ?? null,
      })),
    };
  } catch {
    return null;
  }
}
