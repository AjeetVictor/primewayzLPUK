/**
 * Article Autopilot 2.0 — topic CRUD + workflow service (Phase 1C).
 * Every mutation runs inside a transaction paired with an activity-log entry.
 */

import { Prisma, type PrismaClient } from '@prisma/client';
import { AUTOPILOT_SCORE_DIMENSION_KEYS } from '../../data/autopilot/scoringConfig.ts';
import type { AutopilotCategoryRecommendation } from '../../data/autopilot/types.ts';
import { appendActivityLog } from './activityLogService.ts';
import { forbidden, validationError } from './apiErrors.ts';
import {
  AUTOPILOT_MAX_AUDIENCE_LENGTH,
  AUTOPILOT_MAX_CATEGORY_LENGTH,
  AUTOPILOT_MAX_KEYWORD_LENGTH,
  AUTOPILOT_MAX_LANGUAGE_LENGTH,
  AUTOPILOT_MAX_LOCATION_LENGTH,
  AUTOPILOT_MAX_MARKET_LENGTH,
  AUTOPILOT_MAX_REASON_LENGTH,
  AUTOPILOT_MAX_SLUG_LENGTH,
  AUTOPILOT_MAX_SOURCE_LENGTH,
  AUTOPILOT_MAX_TITLE_LENGTH,
  AUTOPILOT_MAX_USER_PROBLEM_LENGTH,
  assertJsonDepth,
  assertNoPrototypePollution,
  emptyPatchGuard,
  optionalString,
  parsePagination,
  parsePositiveIntId,
  parseStringArray,
  rejectUnknownKeys,
  requireNonEmptyString,
} from './apiValidation.ts';
import {
  normaliseAutopilotCategoryAssignment,
  validateAutopilotCategoryAssignment,
  validateAutopilotCategoryRecommendation,
  validateAutopilotFinalCategoryAssignment,
} from './categoryValidation.ts';
import { clampAutopilotDimensionScore, clampAutopilotPenalty } from './scoringService.ts';
import { validateAutopilotDecisionCardForApproval } from './transitionGuards.ts';
import { buildAutopilotSlugAdvisory } from './slugAdvisory.ts';
import {
  AUTOPILOT_FOUNDATION_DEFAULT_STATUSES,
  actorDisplayName,
  asStringArray,
  decimalToNumber,
  parseDecisionStatusFilter,
  parseOptionalCategorySlug,
  parseScoreBandFilter,
  parseTopicStatusFilter,
  recommendationBandForTopic,
  requireTopic,
  scoreBandRange,
  serializeTopicRow,
  toDecimalOrNull,
  type AdminActor,
} from './topicHelpers.ts';

const SCORE_DIMENSION_FIELDS = AUTOPILOT_SCORE_DIMENSION_KEYS;
const SCORE_PENALTY_FIELDS = ['cannibalisationPenalty', 'unsupportedClaimRiskPenalty'] as const;
const SCORE_PATCH_FIELDS = [...SCORE_DIMENSION_FIELDS, ...SCORE_PENALTY_FIELDS] as const;
type ScorePatchField = (typeof SCORE_PATCH_FIELDS)[number];

const ORDINARY_PATCH_FIELDS = [
  'workingTitle',
  'primaryKeyword',
  'supportingKeywords',
  'keywordVariants',
  'userProblem',
  'audience',
  'market',
  'language',
  'location',
  'source',
  'proposedSlug',
  'searchIntent',
  'serpEvidence',
  'businessAlignment',
  'contentArchitecture',
  'riskAssessment',
  'aiMetadata',
] as const;

const CATEGORY_PATCH_FIELDS = ['primaryCategory', 'secondaryCategories'] as const;

const PRIVILEGED_PATCH_FIELDS = [
  'id',
  'createdAt',
  'updatedAt',
  'createdById',
  'decidedById',
  'decidedAt',
  'rawScore',
  'totalScore',
  'scoringVersion',
  'topicStatus',
  'decisionStatus',
  'briefStatus',
  'draftStatus',
  'mediaStatus',
  'publishingStatus',
  'performanceStatus',
  'archivedAt',
  'mergeIntoTopicId',
] as const;

const PATCH_ALLOWED_KEYS = [
  ...ORDINARY_PATCH_FIELDS,
  ...CATEGORY_PATCH_FIELDS,
  ...SCORE_PATCH_FIELDS,
  'assignedToId',
  'reason',
] as const;

function normaliseJsonField(
  value: unknown,
  field: string,
): Prisma.InputJsonValue | typeof Prisma.DbNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.DbNull;
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw validationError(`${field} must be a JSON object.`, { field });
  }
  assertNoPrototypePollution(value);
  assertJsonDepth(value);
  return value as Prisma.InputJsonValue;
}

/* -------------------------------------------------------------------------- */
/* Create                                                                    */
/* -------------------------------------------------------------------------- */

export type CreateAutopilotTopicInput = {
  workingTitle: unknown;
  primaryKeyword: unknown;
  userProblem: unknown;
  audience: unknown;
  supportingKeywords?: unknown;
  keywordVariants?: unknown;
  market?: unknown;
  language?: unknown;
  location?: unknown;
  source?: unknown;
  proposedSlug?: unknown;
  searchIntent?: unknown;
  serpEvidence?: unknown;
  businessAlignment?: unknown;
  contentArchitecture?: unknown;
  riskAssessment?: unknown;
  aiMetadata?: unknown;
  categoryRecommendation?: unknown;
};

export async function createAutopilotTopic(
  prisma: PrismaClient,
  actor: AdminActor,
  input: CreateAutopilotTopicInput,
  correlationId: string,
) {
  const workingTitle = requireNonEmptyString(
    input.workingTitle,
    'workingTitle',
    AUTOPILOT_MAX_TITLE_LENGTH,
  );
  const primaryKeyword = requireNonEmptyString(
    input.primaryKeyword,
    'primaryKeyword',
    AUTOPILOT_MAX_KEYWORD_LENGTH,
  );
  const userProblem = requireNonEmptyString(
    input.userProblem,
    'userProblem',
    AUTOPILOT_MAX_USER_PROBLEM_LENGTH,
  );
  const audience = requireNonEmptyString(input.audience, 'audience', AUTOPILOT_MAX_AUDIENCE_LENGTH);

  const supportingKeywords = parseStringArray(input.supportingKeywords, 'supportingKeywords', {
    maxItemLen: AUTOPILOT_MAX_KEYWORD_LENGTH,
  });
  const keywordVariants = parseStringArray(input.keywordVariants, 'keywordVariants', {
    maxItemLen: AUTOPILOT_MAX_KEYWORD_LENGTH,
  });

  const market = optionalString(input.market, 'market', AUTOPILOT_MAX_MARKET_LENGTH) ?? 'United Kingdom';
  const language = optionalString(input.language, 'language', AUTOPILOT_MAX_LANGUAGE_LENGTH) ?? 'en-GB';
  const location = optionalString(input.location, 'location', AUTOPILOT_MAX_LOCATION_LENGTH) ?? null;
  const source = optionalString(input.source, 'source', AUTOPILOT_MAX_SOURCE_LENGTH) ?? 'manual';
  const proposedSlug =
    optionalString(input.proposedSlug, 'proposedSlug', AUTOPILOT_MAX_SLUG_LENGTH) ?? null;

  const searchIntent = normaliseJsonField(input.searchIntent, 'searchIntent');
  const serpEvidence = normaliseJsonField(input.serpEvidence, 'serpEvidence');
  const businessAlignment = normaliseJsonField(input.businessAlignment, 'businessAlignment');
  const contentArchitecture = normaliseJsonField(input.contentArchitecture, 'contentArchitecture');
  const riskAssessment = normaliseJsonField(input.riskAssessment, 'riskAssessment');
  const aiMetadata = normaliseJsonField(input.aiMetadata, 'aiMetadata');
  const categoryRecommendation = normaliseJsonField(
    input.categoryRecommendation,
    'categoryRecommendation',
  );

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.autopilotTopic.create({
      data: {
        workingTitle,
        primaryKeyword,
        supportingKeywords,
        keywordVariants,
        userProblem,
        audience,
        market,
        language,
        location,
        source,
        proposedSlug,
        secondaryCategories: [],
        topicStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.topicStatus,
        decisionStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.decisionStatus,
        briefStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.briefStatus,
        draftStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.draftStatus,
        mediaStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.mediaStatus,
        publishingStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.publishingStatus,
        performanceStatus: AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.performanceStatus,
        searchIntent,
        serpEvidence,
        businessAlignment,
        contentArchitecture,
        riskAssessment,
        aiMetadata,
        categoryRecommendation,
        createdById: actor.id,
        updatedById: actor.id,
      },
    });

    await appendActivityLog(tx, {
      entityType: 'topic',
      entityId: String(row.id),
      eventType: 'topic_created',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      newValue: { workingTitle: row.workingTitle, primaryKeyword: row.primaryKeyword },
      metadata: { workingTitle: row.workingTitle },
      correlationId,
    });

    return row;
  });

  return serializeTopicRow(created as unknown as Record<string, unknown>);
}

/* -------------------------------------------------------------------------- */
/* List                                                                      */
/* -------------------------------------------------------------------------- */

export type ListAutopilotTopicsFilters = Record<string, unknown>;

export async function listAutopilotTopics(
  prisma: PrismaClient,
  filters: ListAutopilotTopicsFilters,
) {
  const { limit, offset } = parsePagination(filters, { defaultLimit: 20, maxLimit: 100 });

  const topicStatus = parseTopicStatusFilter(filters.topicStatus);
  const decisionStatus = parseDecisionStatusFilter(filters.decisionStatus);
  const primaryCategory = parseOptionalCategorySlug(filters.primaryCategory, 'primaryCategory');
  const scoreBand = parseScoreBandFilter(filters.scoreBand);
  const includeArchived = filters.includeArchived === true || filters.includeArchived === 'true';
  const q = optionalString(filters.q, 'q', 200);

  let assignedToId: number | undefined;
  if (
    filters.assignedToId !== undefined &&
    filters.assignedToId !== null &&
    filters.assignedToId !== ''
  ) {
    assignedToId = parsePositiveIntId(filters.assignedToId);
  }

  let minScore: number | undefined;
  if (filters.minScore !== undefined && filters.minScore !== null && filters.minScore !== '') {
    minScore = Number(filters.minScore);
    if (!Number.isFinite(minScore)) {
      throw validationError('Invalid minScore filter.', { field: 'minScore' });
    }
  }

  let maxScore: number | undefined;
  if (filters.maxScore !== undefined && filters.maxScore !== null && filters.maxScore !== '') {
    maxScore = Number(filters.maxScore);
    if (!Number.isFinite(maxScore)) {
      throw validationError('Invalid maxScore filter.', { field: 'maxScore' });
    }
  }

  const where: Prisma.AutopilotTopicWhereInput = {};

  if (!includeArchived) {
    where.archivedAt = null;
  }
  if (topicStatus) where.topicStatus = topicStatus;
  if (decisionStatus) where.decisionStatus = decisionStatus;
  if (primaryCategory) where.primaryCategory = primaryCategory;
  if (assignedToId !== undefined) where.assignedToId = assignedToId;
  if (q) {
    where.OR = [{ workingTitle: { contains: q } }, { primaryKeyword: { contains: q } }];
  }

  let scoreGte: number | undefined;
  let scoreLte: number | undefined;
  if (scoreBand) {
    const range = scoreBandRange(scoreBand);
    scoreGte = range.min;
    scoreLte = range.max;
  }
  if (minScore !== undefined) {
    scoreGte = scoreGte !== undefined ? Math.max(scoreGte, minScore) : minScore;
  }
  if (maxScore !== undefined) {
    scoreLte = scoreLte !== undefined ? Math.min(scoreLte, maxScore) : maxScore;
  }
  if (scoreGte !== undefined || scoreLte !== undefined) {
    where.totalScore = {
      ...(scoreGte !== undefined ? { gte: scoreGte } : {}),
      ...(scoreLte !== undefined ? { lte: scoreLte } : {}),
    };
  }

  const [items, total] = await Promise.all([
    prisma.autopilotTopic.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.autopilotTopic.count({ where }),
  ]);

  return {
    items: items.map((item) => serializeTopicRow(item as unknown as Record<string, unknown>)),
    total,
    limit,
    offset,
  };
}

/* -------------------------------------------------------------------------- */
/* Detail                                                                    */
/* -------------------------------------------------------------------------- */

export async function getAutopilotTopicDetail(prisma: PrismaClient, id: number) {
  const topic = await requireTopic(prisma, id);

  const recommendationBand = recommendationBandForTopic(topic.totalScore);

  const categoryValidation = validateAutopilotCategoryAssignment(
    {
      primaryCategory: topic.primaryCategory,
      secondaryCategories: asStringArray(topic.secondaryCategories),
    },
    { requirePrimary: false },
  );

  const decisionReadiness = validateAutopilotDecisionCardForApproval({
    workingTitle: topic.workingTitle,
    primaryKeyword: topic.primaryKeyword,
    userProblem: topic.userProblem,
    audience: topic.audience,
    market: topic.market,
    language: topic.language,
    primaryCategory: topic.primaryCategory,
    secondaryCategories: asStringArray(topic.secondaryCategories),
    decisionRationale: topic.decisionRationale,
  });

  const slugAdvisory = await buildAutopilotSlugAdvisory(prisma, topic.proposedSlug, {
    excludeTopicId: id,
  });

  const recentActivityRows = await prisma.autopilotActivityLog.findMany({
    where: { entityType: 'topic', entityId: String(id) },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return {
    topic: serializeTopicRow(topic as unknown as Record<string, unknown>),
    recommendationBand,
    categoryValidation,
    decisionReadiness,
    slugAdvisory,
    recentActivity: recentActivityRows.map((entry) => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Patch                                                                     */
/* -------------------------------------------------------------------------- */

export type PatchAutopilotTopicOptions = { canEditorial: boolean };

type ChangeEntry = { field: string; previous: unknown; next: unknown };

function parseScoreFieldValue(value: unknown, field: ScorePatchField): number | null {
  if (value === null) return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw validationError(`${field} must be a finite number or null.`, { field });
  }
  if (field === 'cannibalisationPenalty') {
    return clampAutopilotPenalty('cannibalisation', numeric);
  }
  if (field === 'unsupportedClaimRiskPenalty') {
    return clampAutopilotPenalty('unsupportedClaimRisk', numeric);
  }
  return clampAutopilotDimensionScore(numeric);
}

function applyOrdinaryPatchField(
  key: string,
  value: unknown,
  data: Prisma.AutopilotTopicUncheckedUpdateInput,
  topicRecord: Record<string, unknown>,
  changes: ChangeEntry[],
): void {
  switch (key) {
    case 'workingTitle': {
      const next = requireNonEmptyString(value, key, AUTOPILOT_MAX_TITLE_LENGTH);
      data.workingTitle = next;
      changes.push({ field: key, previous: topicRecord.workingTitle, next });
      break;
    }
    case 'primaryKeyword': {
      const next = requireNonEmptyString(value, key, AUTOPILOT_MAX_KEYWORD_LENGTH);
      data.primaryKeyword = next;
      changes.push({ field: key, previous: topicRecord.primaryKeyword, next });
      break;
    }
    case 'userProblem': {
      const next = requireNonEmptyString(value, key, AUTOPILOT_MAX_USER_PROBLEM_LENGTH);
      data.userProblem = next;
      changes.push({ field: key, previous: topicRecord.userProblem, next });
      break;
    }
    case 'audience': {
      const next = requireNonEmptyString(value, key, AUTOPILOT_MAX_AUDIENCE_LENGTH);
      data.audience = next;
      changes.push({ field: key, previous: topicRecord.audience, next });
      break;
    }
    case 'supportingKeywords': {
      const next = parseStringArray(value, key, { maxItemLen: AUTOPILOT_MAX_KEYWORD_LENGTH });
      data.supportingKeywords = next;
      changes.push({ field: key, previous: asStringArray(topicRecord.supportingKeywords), next });
      break;
    }
    case 'keywordVariants': {
      const next = parseStringArray(value, key, { maxItemLen: AUTOPILOT_MAX_KEYWORD_LENGTH });
      data.keywordVariants = next;
      changes.push({ field: key, previous: asStringArray(topicRecord.keywordVariants), next });
      break;
    }
    case 'market': {
      const next = requireNonEmptyString(value, key, AUTOPILOT_MAX_MARKET_LENGTH);
      data.market = next;
      changes.push({ field: key, previous: topicRecord.market, next });
      break;
    }
    case 'language': {
      const next = requireNonEmptyString(value, key, AUTOPILOT_MAX_LANGUAGE_LENGTH);
      data.language = next;
      changes.push({ field: key, previous: topicRecord.language, next });
      break;
    }
    case 'location': {
      const next = value === null ? null : optionalString(value, key, AUTOPILOT_MAX_LOCATION_LENGTH) ?? null;
      data.location = next;
      changes.push({ field: key, previous: topicRecord.location, next });
      break;
    }
    case 'source': {
      const next = requireNonEmptyString(value, key, AUTOPILOT_MAX_SOURCE_LENGTH);
      data.source = next;
      changes.push({ field: key, previous: topicRecord.source, next });
      break;
    }
    case 'proposedSlug': {
      const next = value === null ? null : optionalString(value, key, AUTOPILOT_MAX_SLUG_LENGTH) ?? null;
      data.proposedSlug = next;
      changes.push({ field: key, previous: topicRecord.proposedSlug, next });
      break;
    }
    case 'searchIntent':
    case 'serpEvidence':
    case 'businessAlignment':
    case 'contentArchitecture':
    case 'riskAssessment':
    case 'aiMetadata': {
      const next = normaliseJsonField(value, key);
      (data as Record<string, unknown>)[key] = next;
      changes.push({ field: key, previous: topicRecord[key] ?? null, next: value === null ? null : value });
      break;
    }
    default:
      break;
  }
}

export async function patchAutopilotTopic(
  prisma: PrismaClient,
  actor: AdminActor,
  id: number,
  body: Record<string, unknown>,
  correlationId: string,
  options: PatchAutopilotTopicOptions,
) {
  emptyPatchGuard(body);
  rejectUnknownKeys(body, PATCH_ALLOWED_KEYS);

  const privilegedPresent = PRIVILEGED_PATCH_FIELDS.filter((key) => key in body);
  if (privilegedPresent.length > 0) {
    throw validationError('Privileged fields cannot be modified via this endpoint.', {
      fields: privilegedPresent,
    });
  }

  const topic = await requireTopic(prisma, id);
  const topicRecord = topic as unknown as Record<string, unknown>;

  const reason = optionalString(body.reason, 'reason', AUTOPILOT_MAX_REASON_LENGTH);

  const touchesCategory = CATEGORY_PATCH_FIELDS.some((key) => key in body);
  const touchesScore = SCORE_PATCH_FIELDS.some((key) => key in body);
  const touchesAssignedTo = 'assignedToId' in body;

  if ((touchesCategory || touchesScore) && !options.canEditorial) {
    throw forbidden('Editorial permission is required to change category or score fields.');
  }
  if ((touchesCategory || touchesScore) && !reason) {
    throw validationError('A reason is required when changing category or score fields.', {
      field: 'reason',
    });
  }
  if (touchesAssignedTo && !options.canEditorial) {
    throw forbidden('Editorial permission is required to reassign a topic.');
  }

  const data: Prisma.AutopilotTopicUncheckedUpdateInput = {};
  const ordinaryChanges: ChangeEntry[] = [];
  const categoryChanges: ChangeEntry[] = [];
  const scoreChanges: ChangeEntry[] = [];

  for (const key of ORDINARY_PATCH_FIELDS) {
    if (key in body) {
      applyOrdinaryPatchField(key, body[key], data, topicRecord, ordinaryChanges);
    }
  }

  if (touchesCategory) {
    const nextPrimaryRaw = 'primaryCategory' in body ? body.primaryCategory : topic.primaryCategory;
    const nextSecondaryRaw =
      'secondaryCategories' in body
        ? parseStringArray(body.secondaryCategories, 'secondaryCategories', {
            maxItemLen: AUTOPILOT_MAX_CATEGORY_LENGTH,
          })
        : asStringArray(topic.secondaryCategories);

    const validation = validateAutopilotFinalCategoryAssignment({
      primaryCategory: nextPrimaryRaw as string | null | undefined,
      secondaryCategories: nextSecondaryRaw,
    });
    if (!validation.ok) {
      throw validationError('Invalid category assignment.', { errors: validation.errors });
    }

    const normalised = normaliseAutopilotCategoryAssignment({
      primaryCategory: nextPrimaryRaw as string | null | undefined,
      secondaryCategories: nextSecondaryRaw,
    });

    data.primaryCategory = normalised.primaryCategory ?? null;
    data.secondaryCategories = normalised.secondaryCategories;
    categoryChanges.push({
      field: 'primaryCategory',
      previous: topic.primaryCategory,
      next: data.primaryCategory,
    });
    categoryChanges.push({
      field: 'secondaryCategories',
      previous: asStringArray(topic.secondaryCategories),
      next: normalised.secondaryCategories,
    });
  }

  if (touchesScore) {
    for (const key of SCORE_PATCH_FIELDS) {
      if (key in body) {
        const numeric = parseScoreFieldValue(body[key], key);
        data[key] = toDecimalOrNull(numeric);
        scoreChanges.push({
          field: key,
          previous: decimalToNumber(topicRecord[key]),
          next: numeric,
        });
      }
    }
    // Overriding raw score inputs invalidates the previously calculated total.
    data.rawScore = null;
    data.totalScore = null;
    data.scoreBreakdown = Prisma.DbNull;
    data.scoringVersion = null;
  }

  if (touchesAssignedTo) {
    const rawAssignedTo = body.assignedToId;
    const nextAssignedToId = rawAssignedTo === null ? null : parsePositiveIntId(rawAssignedTo);
    data.assignedToId = nextAssignedToId;
    ordinaryChanges.push({
      field: 'assignedToId',
      previous: topic.assignedToId,
      next: nextAssignedToId,
    });
  }

  if (Object.keys(data).length === 0) {
    throw validationError('Patch did not result in any changes.');
  }

  data.updatedById = actor.id;

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.autopilotTopic.update({ where: { id }, data });

    if (categoryChanges.length > 0) {
      await appendActivityLog(tx, {
        entityType: 'topic',
        entityId: String(id),
        eventType: 'category_overridden',
        actorType: 'user',
        actorId: actor.id,
        actorDisplayName: actorDisplayName(actor),
        source: 'admin',
        previousValue: Object.fromEntries(categoryChanges.map((c) => [c.field, c.previous])),
        newValue: Object.fromEntries(categoryChanges.map((c) => [c.field, c.next])),
        reason,
        correlationId,
      });
    }

    if (scoreChanges.length > 0) {
      await appendActivityLog(tx, {
        entityType: 'topic',
        entityId: String(id),
        eventType: 'score_overridden',
        actorType: 'user',
        actorId: actor.id,
        actorDisplayName: actorDisplayName(actor),
        source: 'admin',
        previousValue: Object.fromEntries(scoreChanges.map((c) => [c.field, c.previous])),
        newValue: Object.fromEntries(scoreChanges.map((c) => [c.field, c.next])),
        reason,
        correlationId,
      });
    }

    if (ordinaryChanges.length > 0) {
      await appendActivityLog(tx, {
        entityType: 'topic',
        entityId: String(id),
        eventType: 'topic_updated',
        actorType: 'user',
        actorId: actor.id,
        actorDisplayName: actorDisplayName(actor),
        source: 'admin',
        previousValue: Object.fromEntries(ordinaryChanges.map((c) => [c.field, c.previous])),
        newValue: Object.fromEntries(ordinaryChanges.map((c) => [c.field, c.next])),
        correlationId,
      });
    }

    return row;
  });

  return serializeTopicRow(updated as unknown as Record<string, unknown>);
}

/* -------------------------------------------------------------------------- */
/* Category recommendation                                                  */
/* -------------------------------------------------------------------------- */

export type RecommendTopicCategoryInput = {
  primaryCategory?: string | null;
  secondaryCategories?: Array<string | null | undefined> | null;
  confidence?: number;
  reasoning?: string;
  source?: 'rules' | 'ai' | 'human' | 'import';
};

export async function recommendTopicCategory(
  prisma: PrismaClient,
  actor: AdminActor,
  id: number,
  input: RecommendTopicCategoryInput,
  correlationId: string,
) {
  const topic = await requireTopic(prisma, id);

  const validation = validateAutopilotCategoryRecommendation({
    primaryCategory: input.primaryCategory,
    secondaryCategories: input.secondaryCategories,
  });
  if (!validation.ok) {
    throw validationError('Invalid category recommendation.', { errors: validation.errors });
  }

  const normalised = normaliseAutopilotCategoryAssignment({
    primaryCategory: input.primaryCategory,
    secondaryCategories: input.secondaryCategories,
  });

  const recommendation: AutopilotCategoryRecommendation = {
    ...(normalised.primaryCategory ? { primaryCategory: normalised.primaryCategory } : {}),
    secondaryCategories: normalised.secondaryCategories,
    ...(typeof input.confidence === 'number' ? { confidence: input.confidence } : {}),
    ...(input.reasoning ? { reasoning: input.reasoning } : {}),
    recommendedAt: new Date().toISOString(),
    source: input.source ?? 'rules',
  };

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.autopilotTopic.update({
      where: { id },
      data: {
        categoryRecommendation: recommendation as unknown as Prisma.InputJsonValue,
        updatedById: actor.id,
      },
    });

    await appendActivityLog(tx, {
      entityType: 'topic',
      entityId: String(id),
      eventType: 'category_recommended',
      actorType: input.source === 'ai' ? 'ai' : 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue: topic.categoryRecommendation,
      newValue: recommendation,
      correlationId,
    });

    return row;
  });

  return {
    topic: serializeTopicRow(updated as unknown as Record<string, unknown>),
    categoryValidation: validation,
  };
}

/* -------------------------------------------------------------------------- */
/* Archive                                                                   */
/* -------------------------------------------------------------------------- */

export async function archiveAutopilotTopic(
  prisma: PrismaClient,
  actor: AdminActor,
  id: number,
  reason: unknown,
  correlationId: string,
) {
  const trimmedReason = requireNonEmptyString(reason, 'reason', AUTOPILOT_MAX_REASON_LENGTH);

  const topic = await requireTopic(prisma, id);

  if (topic.archivedAt) {
    return {
      topic: serializeTopicRow(topic as unknown as Record<string, unknown>),
      alreadyArchived: true,
    };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.autopilotTopic.update({
      where: { id },
      data: { archivedAt: new Date(), updatedById: actor.id },
    });

    await appendActivityLog(tx, {
      entityType: 'topic',
      entityId: String(id),
      eventType: 'topic_archived',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue: { archivedAt: null },
      newValue: { archivedAt: row.archivedAt },
      reason: trimmedReason,
      metadata: { workingTitle: row.workingTitle },
      correlationId,
    });

    return row;
  });

  return {
    topic: serializeTopicRow(updated as unknown as Record<string, unknown>),
    alreadyArchived: false,
  };
}
