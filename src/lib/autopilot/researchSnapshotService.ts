/**
 * Article Autopilot 2.0 — Phase 2B research snapshot lifecycle service.
 * Human-led, deterministic. No external providers, scoring, or auto-approval.
 */

import { createHash } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import {
  AUTOPILOT_OVERLAP_ANALYSIS_VERSION,
  AUTOPILOT_RESEARCH_LIMITS,
  AUTOPILOT_RESEARCH_READY_MIN_COMPLETENESS,
} from '../../data/autopilot/researchConfig.ts';
import {
  isAutopilotResearchEditableStatus,
  isAutopilotResearchImmutableStatus,
} from '../../data/autopilot/researchStatus.ts';
import type {
  AutopilotOverlapAnalysisResult,
  AutopilotResearchCompletenessResult,
  AutopilotResearchReadinessResult,
} from '../../data/autopilot/types.ts';
import type { AutopilotTopicStatus } from '../../data/autopilot/status.ts';
import { appendActivityLog, type PrismaLike } from './activityLogService.ts';
import { AutopilotError, conflict, notFound, validationError } from './apiErrors.ts';
import { buildContentInventory } from './contentInventoryService.ts';
import { analyseContentOverlap } from './overlapAnalysisService.ts';
import { calculateResearchCompleteness } from './researchCompleteness.ts';
import {
  parseBusinessAlignment,
  parseContentArchitecture,
  parseEvidenceQuality,
  parseResearchSourceType,
  parseRiskAssessment,
  parseSearchIntent,
  parseSerpEvidence,
  RESEARCH_SNAPSHOT_UPDATE_ALLOWLIST,
} from './researchValidation.ts';
import {
  actorDisplayName,
  decimalToNumber,
  serializeTopicRow,
  type AdminActor,
} from './topicHelpers.ts';
import {
  canTransitionAutopilotTopicStatus,
  validateAutopilotTopicStatusTransition,
} from './transitionGuards.ts';
import { requireNonEmptyString } from './apiValidation.ts';

type Db = PrismaClient | Prisma.TransactionClient;

function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value === null || value === undefined) return Prisma.DbNull;
  return value as Prisma.InputJsonValue;
}

function optionalText(
  value: unknown,
  field: string,
  maxLen: number,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string.`, { field });
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLen) {
    throw validationError(`${field} exceeds maximum length of ${maxLen}.`, {
      field,
      maxLen,
    });
  }
  return trimmed.length ? trimmed : null;
}

export function serializeResearchSnapshot(row: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...row };
  out.evidenceCompleteness = decimalToNumber(out.evidenceCompleteness);
  for (const key of [
    'confirmedAt',
    'supersededAt',
    'createdAt',
    'updatedAt',
  ] as const) {
    const value = out[key];
    if (value instanceof Date) out[key] = value.toISOString();
  }
  return out;
}

export function evaluateResearchReadiness(input: {
  snapshot: {
    query?: string | null;
    sourceType?: string | null;
    searchIntent?: unknown;
    serpEvidence?: unknown;
    businessAlignment?: unknown;
    contentArchitecture?: unknown;
    riskAssessment?: unknown;
    overlapAnalysis?: unknown;
  };
  completeness?: AutopilotResearchCompletenessResult;
}): AutopilotResearchReadinessResult {
  const completeness =
    input.completeness ||
    calculateResearchCompleteness({
      searchIntent: input.snapshot.searchIntent as never,
      serpEvidence: input.snapshot.serpEvidence as never,
      businessAlignment: input.snapshot.businessAlignment as never,
      contentArchitecture: input.snapshot.contentArchitecture as never,
      riskAssessment: input.snapshot.riskAssessment as never,
    });

  const blockers: Array<{ code: string; message: string }> = [];
  const warnings: Array<{ code: string; message: string }> = [];

  if (!input.snapshot.query || !String(input.snapshot.query).trim()) {
    blockers.push({
      code: 'AUTOPILOT_RESEARCH_QUERY_REQUIRED',
      message: 'Research query is required before confirmation.',
    });
  }
  if (!input.snapshot.sourceType || !String(input.snapshot.sourceType).trim()) {
    blockers.push({
      code: 'AUTOPILOT_RESEARCH_SOURCE_REQUIRED',
      message: 'Research source/provenance is required.',
    });
  }

  if (completeness.completeness < AUTOPILOT_RESEARCH_READY_MIN_COMPLETENESS) {
    blockers.push({
      code: 'AUTOPILOT_RESEARCH_COMPLETENESS_INSUFFICIENT',
      message: `Research completeness ${completeness.completeness} is below the minimum of ${AUTOPILOT_RESEARCH_READY_MIN_COMPLETENESS}.`,
    });
  }

  const overlap = input.snapshot.overlapAnalysis as AutopilotOverlapAnalysisResult | null;
  if (!overlap || !overlap.version || !Array.isArray(overlap.findings)) {
    blockers.push({
      code: 'AUTOPILOT_OVERLAP_ANALYSIS_REQUIRED',
      message: 'Deterministic overlap analysis must be run before confirmation.',
    });
  }

  const risk = input.snapshot.riskAssessment as { evidenceLimitations?: string; notes?: string } | null;
  const serp = input.snapshot.serpEvidence as { evidenceLimitation?: string } | null;
  const hasLimitation =
    (typeof risk?.evidenceLimitations === 'string' && risk.evidenceLimitations.trim()) ||
    (typeof serp?.evidenceLimitation === 'string' && serp.evidenceLimitation.trim());
  if (!hasLimitation) {
    blockers.push({
      code: 'AUTOPILOT_RESEARCH_EVIDENCE_LIMITATION_REQUIRED',
      message: 'An evidence limitation statement is required before confirmation.',
    });
  }

  for (const item of completeness.missingItems) {
    warnings.push({
      code: 'AUTOPILOT_RESEARCH_SECTION_INCOMPLETE',
      message: `Missing research item: ${item}`,
    });
  }
  for (const warning of completeness.warnings) {
    warnings.push({
      code: 'AUTOPILOT_RESEARCH_COMPLETENESS_WARNING',
      message: warning,
    });
  }

  if (overlap?.summary?.exactConflictCount && overlap.summary.exactConflictCount > 0) {
    warnings.push({
      code: 'AUTOPILOT_RESEARCH_EXACT_CONFLICT_ADVISORY',
      message: `${overlap.summary.exactConflictCount} exact-match conflict advisory finding(s) require editorial review.`,
    });
  }
  if (overlap?.summary?.highOverlapCount && overlap.summary.highOverlapCount > 0) {
    warnings.push({
      code: 'AUTOPILOT_RESEARCH_HIGH_OVERLAP_ADVISORY',
      message: `${overlap.summary.highOverlapCount} high lexical-overlap advisory finding(s). Lexical overlap does not prove cannibalisation.`,
    });
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings,
    completeness,
  };
}

async function requireTopic(db: Db, topicId: number) {
  const topic = await db.autopilotTopic.findUnique({ where: { id: topicId } });
  if (!topic) {
    throw notFound('Autopilot topic not found.', { topicId });
  }
  if (topic.archivedAt) {
    throw conflict(
      'Cannot research an archived topic.',
      { topicId },
      'AUTOPILOT_RESEARCH_TOPIC_ARCHIVED',
    );
  }
  return topic;
}

async function requireSnapshot(db: Db, snapshotId: number) {
  const snapshot = await db.autopilotResearchSnapshot.findUnique({
    where: { id: snapshotId },
  });
  if (!snapshot) {
    throw new AutopilotError(
      'AUTOPILOT_RESEARCH_SNAPSHOT_NOT_FOUND',
      'Research snapshot not found.',
      404,
      { snapshotId },
    );
  }
  return snapshot;
}

function assertEditable(snapshot: { status: string; id: number }) {
  if (isAutopilotResearchImmutableStatus(snapshot.status)) {
    throw new AutopilotError(
      'AUTOPILOT_RESEARCH_SNAPSHOT_IMMUTABLE',
      'Confirmed or superseded research snapshots cannot be modified. Create a new version instead.',
      409,
      { snapshotId: snapshot.id, status: snapshot.status },
    );
  }
  if (!isAutopilotResearchEditableStatus(snapshot.status)) {
    throw new AutopilotError(
      'AUTOPILOT_RESEARCH_ILLEGAL_TRANSITION',
      `Snapshot status ${snapshot.status} cannot be updated.`,
      409,
      { snapshotId: snapshot.id, status: snapshot.status },
    );
  }
}

function compactChangedFields(
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
): string[] {
  const changed: string[] = [];
  for (const key of Object.keys(next)) {
    if (JSON.stringify(previous[key] ?? null) !== JSON.stringify(next[key] ?? null)) {
      changed.push(key);
    }
  }
  return changed;
}

export async function listResearchSnapshotsForTopic(
  prisma: PrismaClient,
  topicId: number,
  query?: { limit?: number | string; offset?: number | string },
) {
  await requireTopic(prisma, topicId);
  const limit =
    typeof query?.limit === 'number'
      ? query.limit
      : typeof query?.limit === 'string'
        ? Number.parseInt(query.limit, 10) || 25
        : 25;
  const offset =
    typeof query?.offset === 'number'
      ? query.offset
      : typeof query?.offset === 'string'
        ? Number.parseInt(query.offset, 10) || 0
        : 0;
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = Math.max(offset, 0);

  const [items, total] = await Promise.all([
    prisma.autopilotResearchSnapshot.findMany({
      where: { topicId },
      orderBy: { version: 'desc' },
      take,
      skip,
    }),
    prisma.autopilotResearchSnapshot.count({ where: { topicId } }),
  ]);

  return {
    items: items.map((row) => serializeResearchSnapshot(row as unknown as Record<string, unknown>)),
    total,
    limit: take,
    offset: skip,
  };
}

export async function getResearchSnapshot(prisma: PrismaClient, snapshotId: number) {
  const snapshot = await requireSnapshot(prisma, snapshotId);
  const completeness = calculateResearchCompleteness({
    searchIntent: snapshot.searchIntent as never,
    serpEvidence: snapshot.serpEvidence as never,
    businessAlignment: snapshot.businessAlignment as never,
    contentArchitecture: snapshot.contentArchitecture as never,
    riskAssessment: snapshot.riskAssessment as never,
  });
  const readiness = evaluateResearchReadiness({ snapshot, completeness });
  return {
    snapshot: serializeResearchSnapshot(snapshot as unknown as Record<string, unknown>),
    completeness,
    readiness,
  };
}

export async function getCurrentConfirmedSnapshot(prisma: PrismaClient, topicId: number) {
  const snapshot = await prisma.autopilotResearchSnapshot.findFirst({
    where: { topicId, status: 'confirmed' },
    orderBy: { version: 'desc' },
  });
  return snapshot
    ? serializeResearchSnapshot(snapshot as unknown as Record<string, unknown>)
    : null;
}

export async function createResearchSnapshot(
  prisma: PrismaClient,
  actor: AdminActor,
  topicId: number,
  body: Record<string, unknown>,
  correlationId: string,
) {
  const topic = await requireTopic(prisma, topicId);
  const createNewVersion = body.createNewVersion === true;
  const prefillFromConfirmed = body.prefillFromConfirmed === true;

  const existingDraft = await prisma.autopilotResearchSnapshot.findFirst({
    where: {
      topicId,
      status: { in: ['draft', 'ready_for_confirmation'] },
    },
    orderBy: { version: 'desc' },
  });

  if (existingDraft && !createNewVersion) {
    const completeness = calculateResearchCompleteness({
      searchIntent: existingDraft.searchIntent as never,
      serpEvidence: existingDraft.serpEvidence as never,
      businessAlignment: existingDraft.businessAlignment as never,
      contentArchitecture: existingDraft.contentArchitecture as never,
      riskAssessment: existingDraft.riskAssessment as never,
    });
    return {
      snapshot: serializeResearchSnapshot(existingDraft as unknown as Record<string, unknown>),
      completeness,
      readiness: evaluateResearchReadiness({ snapshot: existingDraft, completeness }),
      reusedExistingDraft: true,
    };
  }

  let prefill: Record<string, unknown> = {};
  if (prefillFromConfirmed) {
    const confirmed = await prisma.autopilotResearchSnapshot.findFirst({
      where: { topicId, status: 'confirmed' },
      orderBy: { version: 'desc' },
    });
    if (confirmed) {
      prefill = {
        searchIntent: confirmed.searchIntent,
        serpEvidence: confirmed.serpEvidence,
        businessAlignment: confirmed.businessAlignment,
        contentArchitecture: confirmed.contentArchitecture,
        riskAssessment: confirmed.riskAssessment,
        researchNotes: confirmed.researchNotes,
        evidenceQuality: confirmed.evidenceQuality,
        query: confirmed.query,
        market: confirmed.market,
        language: confirmed.language,
        location: confirmed.location,
      };
    }
  }

  const sourceType = parseResearchSourceType(body.sourceType ?? 'manual');
  const query =
    optionalText(body.query, 'query', AUTOPILOT_RESEARCH_LIMITS.maxQueryLength) ??
    (typeof prefill.query === 'string' ? prefill.query : topic.primaryKeyword);

  const result = await prisma.$transaction(async (tx) => {
    const aggregate = await tx.autopilotResearchSnapshot.aggregate({
      where: { topicId },
      _max: { version: true },
    });
    const version = (aggregate._max.version ?? 0) + 1;

    const snapshot = await tx.autopilotResearchSnapshot.create({
      data: {
        topicId,
        version,
        status: 'draft',
        sourceType,
        query,
        market:
          optionalText(body.market, 'market', 120) ??
          (typeof prefill.market === 'string' ? prefill.market : topic.market),
        language:
          optionalText(body.language, 'language', 32) ??
          (typeof prefill.language === 'string' ? prefill.language : topic.language),
        location:
          optionalText(body.location, 'location', 120) ??
          (typeof prefill.location === 'string'
            ? prefill.location
            : topic.location),
        searchIntent: toJson(prefill.searchIntent ?? null),
        serpEvidence: toJson(prefill.serpEvidence ?? null),
        businessAlignment: toJson(prefill.businessAlignment ?? null),
        contentArchitecture: toJson(prefill.contentArchitecture ?? null),
        riskAssessment: toJson(prefill.riskAssessment ?? null),
        researchNotes:
          typeof prefill.researchNotes === 'string' ? prefill.researchNotes : null,
        evidenceQuality:
          typeof prefill.evidenceQuality === 'string'
            ? prefill.evidenceQuality
            : 'not_assessed',
        createdById: actor.id,
        updatedById: actor.id,
      },
    });

    const topicStatus = topic.topicStatus as AutopilotTopicStatus;
    let topicUpdated = topic;
    if (topicStatus === 'DISCOVERED' && canTransitionAutopilotTopicStatus(topicStatus, 'RESEARCHING')) {
      topicUpdated = await tx.autopilotTopic.update({
        where: { id: topicId },
        data: {
          topicStatus: 'RESEARCHING',
          updatedById: actor.id,
        },
      });
      await appendActivityLog(tx, {
        entityType: 'topic',
        entityId: String(topicId),
        eventType: 'research_started',
        actorType: 'user',
        actorId: actor.id,
        actorDisplayName: actorDisplayName(actor),
        source: 'admin',
        previousValue: { topicStatus },
        newValue: { topicStatus: 'RESEARCHING', snapshotId: snapshot.id, version },
        metadata: { workingTitle: topic.workingTitle },
        correlationId,
      });
    }

    await appendActivityLog(tx, {
      entityType: 'research_snapshot',
      entityId: String(snapshot.id),
      eventType: 'research_snapshot_created',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue: null,
      newValue: {
        snapshotId: snapshot.id,
        topicId,
        version,
        sourceType,
        prefillFromConfirmed: Boolean(prefillFromConfirmed),
      },
      metadata: { workingTitle: topic.workingTitle },
      correlationId,
    });

    return { snapshot, topicUpdated };
  });

  const completeness = calculateResearchCompleteness({
    searchIntent: result.snapshot.searchIntent as never,
    serpEvidence: result.snapshot.serpEvidence as never,
    businessAlignment: result.snapshot.businessAlignment as never,
    contentArchitecture: result.snapshot.contentArchitecture as never,
    riskAssessment: result.snapshot.riskAssessment as never,
  });

  return {
    snapshot: serializeResearchSnapshot(
      result.snapshot as unknown as Record<string, unknown>,
    ),
    completeness,
    readiness: evaluateResearchReadiness({
      snapshot: result.snapshot,
      completeness,
    }),
    reusedExistingDraft: false,
    topic: serializeTopicRow(result.topicUpdated as unknown as Record<string, unknown>),
  };
}

export async function updateResearchSnapshot(
  prisma: PrismaClient,
  actor: AdminActor,
  snapshotId: number,
  body: Record<string, unknown>,
  correlationId: string,
) {
  const snapshot = await requireSnapshot(prisma, snapshotId);
  assertEditable(snapshot);
  await requireTopic(prisma, snapshot.topicId);

  const unknownKeys = Object.keys(body).filter(
    (key) =>
      !(RESEARCH_SNAPSHOT_UPDATE_ALLOWLIST as readonly string[]).includes(key),
  );
  if (unknownKeys.length) {
    throw validationError('Unknown or disallowed research snapshot fields.', {
      fields: unknownKeys,
    });
  }

  // Reject client-authoritative computed/actor fields if smuggled somehow
  for (const forbidden of [
    'version',
    'topicId',
    'status',
    'evidenceCompleteness',
    'completeness',
    'overlapAnalysis',
    'clusterHints',
    'internalLinkHints',
    'createdById',
    'updatedById',
    'confirmedById',
    'confirmedAt',
    'supersededAt',
    'createdAt',
    'updatedAt',
  ]) {
    if (forbidden in body) {
      throw validationError(`Field ${forbidden} cannot be set by the client.`, {
        field: forbidden,
      });
    }
  }

  const data: Prisma.AutopilotResearchSnapshotUpdateInput = {
    updatedBy: { connect: { id: actor.id } },
  };
  const nextValues: Record<string, unknown> = {};

  if ('query' in body) {
    data.query = optionalText(body.query, 'query', AUTOPILOT_RESEARCH_LIMITS.maxQueryLength) ?? null;
    nextValues.query = data.query;
  }
  if ('market' in body) {
    data.market = optionalText(body.market, 'market', 120) ?? null;
    nextValues.market = data.market;
  }
  if ('language' in body) {
    data.language = optionalText(body.language, 'language', 32) ?? null;
    nextValues.language = data.language;
  }
  if ('location' in body) {
    data.location = optionalText(body.location, 'location', 120) ?? null;
    nextValues.location = data.location;
  }
  if ('researchNotes' in body) {
    data.researchNotes =
      optionalText(
        body.researchNotes,
        'researchNotes',
        AUTOPILOT_RESEARCH_LIMITS.maxResearchNotesLength,
      ) ?? null;
    nextValues.researchNotes = data.researchNotes;
  }
  if ('evidenceQuality' in body) {
    data.evidenceQuality = parseEvidenceQuality(body.evidenceQuality);
    nextValues.evidenceQuality = data.evidenceQuality;
  }
  if ('sourceType' in body) {
    data.sourceType = parseResearchSourceType(body.sourceType);
    nextValues.sourceType = data.sourceType;
  }
  if ('searchIntent' in body) {
    data.searchIntent = toJson(parseSearchIntent(body.searchIntent));
    nextValues.searchIntent = 'updated';
  }
  if ('serpEvidence' in body) {
    data.serpEvidence = toJson(parseSerpEvidence(body.serpEvidence));
    nextValues.serpEvidence = 'updated';
  }
  if ('businessAlignment' in body) {
    data.businessAlignment = toJson(parseBusinessAlignment(body.businessAlignment));
    nextValues.businessAlignment = 'updated';
  }
  if ('contentArchitecture' in body) {
    data.contentArchitecture = toJson(parseContentArchitecture(body.contentArchitecture));
    nextValues.contentArchitecture = 'updated';
  }
  if ('riskAssessment' in body) {
    data.riskAssessment = toJson(parseRiskAssessment(body.riskAssessment));
    nextValues.riskAssessment = 'updated';
  }

  // Returning to draft from ready_for_confirmation when edited
  const returnToDraft = snapshot.status === 'ready_for_confirmation';
  if (returnToDraft) {
    data.status = 'draft';
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.autopilotResearchSnapshot.update({
      where: { id: snapshotId },
      data,
    });

    const completeness = calculateResearchCompleteness({
      searchIntent: row.searchIntent as never,
      serpEvidence: row.serpEvidence as never,
      businessAlignment: row.businessAlignment as never,
      contentArchitecture: row.contentArchitecture as never,
      riskAssessment: row.riskAssessment as never,
    });

    await tx.autopilotResearchSnapshot.update({
      where: { id: snapshotId },
      data: {
        evidenceCompleteness: new Prisma.Decimal(completeness.completeness),
      },
    });

    const changedFields = compactChangedFields(
      {
        query: snapshot.query,
        market: snapshot.market,
        language: snapshot.language,
        location: snapshot.location,
        researchNotes: snapshot.researchNotes,
        evidenceQuality: snapshot.evidenceQuality,
        sourceType: snapshot.sourceType,
        searchIntent: snapshot.searchIntent,
        serpEvidence: snapshot.serpEvidence,
        businessAlignment: snapshot.businessAlignment,
        contentArchitecture: snapshot.contentArchitecture,
        riskAssessment: snapshot.riskAssessment,
        status: snapshot.status,
      },
      {
        query: row.query,
        market: row.market,
        language: row.language,
        location: row.location,
        researchNotes: row.researchNotes,
        evidenceQuality: row.evidenceQuality,
        sourceType: row.sourceType,
        searchIntent: row.searchIntent,
        serpEvidence: row.serpEvidence,
        businessAlignment: row.businessAlignment,
        contentArchitecture: row.contentArchitecture,
        riskAssessment: row.riskAssessment,
        status: returnToDraft ? 'draft' : row.status,
      },
    );

    await appendActivityLog(tx, {
      entityType: 'research_snapshot',
      entityId: String(snapshotId),
      eventType: 'research_snapshot_updated',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue: { changedFields, status: snapshot.status },
      newValue: {
        changedFields,
        status: returnToDraft ? 'draft' : row.status,
        completeness: completeness.completeness,
        version: row.version,
      },
      correlationId,
    });

    if (returnToDraft) {
      await appendActivityLog(tx, {
        entityType: 'research_snapshot',
        entityId: String(snapshotId),
        eventType: 'research_returned_to_draft',
        actorType: 'user',
        actorId: actor.id,
        actorDisplayName: actorDisplayName(actor),
        source: 'admin',
        previousValue: { status: snapshot.status },
        newValue: { status: 'draft' },
        correlationId,
      });
    }

    const finalRow = await tx.autopilotResearchSnapshot.findUniqueOrThrow({
      where: { id: snapshotId },
    });
    return { row: finalRow, completeness };
  });

  return {
    snapshot: serializeResearchSnapshot(
      updated.row as unknown as Record<string, unknown>,
    ),
    completeness: updated.completeness,
    readiness: evaluateResearchReadiness({
      snapshot: updated.row,
      completeness: updated.completeness,
    }),
  };
}

function hashOverlapInput(parts: Record<string, unknown>): string {
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 32);
}

export async function analyseResearchSnapshotOverlap(
  prisma: PrismaClient,
  actor: AdminActor,
  snapshotId: number,
  correlationId: string,
) {
  const snapshot = await requireSnapshot(prisma, snapshotId);
  assertEditable(snapshot);
  const topic = await requireTopic(prisma, snapshot.topicId);

  const inventory = await buildContentInventory(prisma, {
    excludeTopicId: topic.id,
    includeKeywordCandidates: true,
  });

  const analysis = analyseContentOverlap(
    {
      id: topic.id,
      workingTitle: topic.workingTitle,
      primaryKeyword: topic.primaryKeyword,
      proposedSlug: topic.proposedSlug,
      primaryCategory: topic.primaryCategory,
    },
    inventory,
  );

  const inputHash = hashOverlapInput({
    analysisVersion: AUTOPILOT_OVERLAP_ANALYSIS_VERSION,
    topic: {
      id: topic.id,
      keyword: topic.primaryKeyword,
      title: topic.workingTitle,
      slug: topic.proposedSlug,
      category: topic.primaryCategory,
    },
    snapshot: {
      id: snapshot.id,
      version: snapshot.version,
      query: snapshot.query,
      searchIntent: snapshot.searchIntent,
      serpEvidence: snapshot.serpEvidence,
      businessAlignment: snapshot.businessAlignment,
      contentArchitecture: snapshot.contentArchitecture,
      riskAssessment: snapshot.riskAssessment,
    },
    inventoryIdentity: inventory.identitySignal,
  });

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.autopilotResearchSnapshot.update({
      where: { id: snapshotId },
      data: {
        overlapAnalysis: toJson(analysis),
        clusterHints: toJson(analysis.clusterHints),
        internalLinkHints: toJson(analysis.internalLinkHints),
        updatedById: actor.id,
      },
    });

    await appendActivityLog(tx, {
      entityType: 'research_snapshot',
      entityId: String(snapshotId),
      eventType: 'research_overlap_analysed',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue: null,
      newValue: {
        version: analysis.version,
        findingCount: analysis.findings.length,
        exactConflictCount: analysis.summary.exactConflictCount,
        highOverlapCount: analysis.summary.highOverlapCount,
        inputHash,
      },
      metadata: { inventoryCounts: analysis.inventoryCounts },
      correlationId,
    });

    return row;
  });

  const completeness = calculateResearchCompleteness({
    searchIntent: updated.searchIntent as never,
    serpEvidence: updated.serpEvidence as never,
    businessAlignment: updated.businessAlignment as never,
    contentArchitecture: updated.contentArchitecture as never,
    riskAssessment: updated.riskAssessment as never,
  });

  return {
    snapshot: serializeResearchSnapshot(updated as unknown as Record<string, unknown>),
    analysis: {
      version: analysis.version,
      inventoryCounts: analysis.inventoryCounts,
      findings: analysis.findings,
      summary: analysis.summary,
      clusterHints: analysis.clusterHints,
      internalLinkHints: analysis.internalLinkHints,
      inputHash,
    },
    completeness,
  };
}

export async function markResearchSnapshotReady(
  prisma: PrismaClient,
  actor: AdminActor,
  snapshotId: number,
  correlationId: string,
) {
  const snapshot = await requireSnapshot(prisma, snapshotId);
  assertEditable(snapshot);
  await requireTopic(prisma, snapshot.topicId);

  const completeness = calculateResearchCompleteness({
    searchIntent: snapshot.searchIntent as never,
    serpEvidence: snapshot.serpEvidence as never,
    businessAlignment: snapshot.businessAlignment as never,
    contentArchitecture: snapshot.contentArchitecture as never,
    riskAssessment: snapshot.riskAssessment as never,
  });
  const readiness = evaluateResearchReadiness({ snapshot, completeness });
  if (!readiness.ready) {
    throw new AutopilotError(
      'AUTOPILOT_RESEARCH_NOT_READY',
      'Research snapshot is not ready for confirmation.',
      409,
      { blockers: readiness.blockers, warnings: readiness.warnings },
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.autopilotResearchSnapshot.update({
      where: { id: snapshotId },
      data: {
        status: 'ready_for_confirmation',
        evidenceCompleteness: new Prisma.Decimal(completeness.completeness),
        updatedById: actor.id,
      },
    });

    await appendActivityLog(tx, {
      entityType: 'research_snapshot',
      entityId: String(snapshotId),
      eventType: 'research_marked_ready',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue: { status: snapshot.status },
      newValue: {
        status: 'ready_for_confirmation',
        completeness: completeness.completeness,
        warningCount: readiness.warnings.length,
      },
      correlationId,
    });

    return row;
  });

  return {
    snapshot: serializeResearchSnapshot(updated as unknown as Record<string, unknown>),
    completeness,
    readiness: { ...readiness, ready: true },
  };
}

export async function confirmResearchSnapshot(
  prisma: PrismaClient,
  actor: AdminActor,
  snapshotId: number,
  body: Record<string, unknown>,
  correlationId: string,
) {
  const confirmationNote = requireNonEmptyString(
    body.confirmationNote ?? body.note ?? body.reason,
    'confirmationNote',
    AUTOPILOT_RESEARCH_LIMITS.maxConfirmationNoteLength,
  );

  const snapshot = await requireSnapshot(prisma, snapshotId);
  if (snapshot.status === 'confirmed') {
    throw conflict(
      'Research snapshot is already confirmed.',
      { snapshotId },
      'AUTOPILOT_RESEARCH_SNAPSHOT_ALREADY_EXISTS',
    );
  }
  if (isAutopilotResearchImmutableStatus(snapshot.status)) {
    throw new AutopilotError(
      'AUTOPILOT_RESEARCH_SNAPSHOT_IMMUTABLE',
      'This research snapshot cannot be confirmed.',
      409,
      { snapshotId, status: snapshot.status },
    );
  }

  const topic = await requireTopic(prisma, snapshot.topicId);
  const completeness = calculateResearchCompleteness({
    searchIntent: snapshot.searchIntent as never,
    serpEvidence: snapshot.serpEvidence as never,
    businessAlignment: snapshot.businessAlignment as never,
    contentArchitecture: snapshot.contentArchitecture as never,
    riskAssessment: snapshot.riskAssessment as never,
  });
  const readiness = evaluateResearchReadiness({ snapshot, completeness });
  if (!readiness.ready) {
    throw new AutopilotError(
      'AUTOPILOT_RESEARCH_NOT_READY',
      'Research snapshot is not ready for confirmation.',
      409,
      { blockers: readiness.blockers, warnings: readiness.warnings },
    );
  }

  const fromStatus = topic.topicStatus as AutopilotTopicStatus;
  const transition = validateAutopilotTopicStatusTransition(fromStatus, 'RESEARCH_COMPLETE');
  if (!transition.ok && fromStatus !== 'RESEARCH_COMPLETE') {
    throw new AutopilotError(
      'AUTOPILOT_RESEARCH_ILLEGAL_TRANSITION',
      `Cannot move topic from ${fromStatus} to RESEARCH_COMPLETE.`,
      409,
      { fromStatus, errors: transition.errors },
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const previousConfirmed = await tx.autopilotResearchSnapshot.findFirst({
      where: {
        topicId: topic.id,
        status: 'confirmed',
        id: { not: snapshotId },
      },
      orderBy: { version: 'desc' },
    });

    let supersededSnapshotId: number | null = null;
    if (previousConfirmed) {
      await tx.autopilotResearchSnapshot.update({
        where: { id: previousConfirmed.id },
        data: {
          status: 'superseded',
          supersededAt: new Date(),
        },
      });
      supersededSnapshotId = previousConfirmed.id;
      await appendActivityLog(tx, {
        entityType: 'research_snapshot',
        entityId: String(previousConfirmed.id),
        eventType: 'research_snapshot_superseded',
        actorType: 'user',
        actorId: actor.id,
        actorDisplayName: actorDisplayName(actor),
        source: 'admin',
        previousValue: { status: 'confirmed', version: previousConfirmed.version },
        newValue: {
          status: 'superseded',
          supersededBySnapshotId: snapshotId,
          supersededByVersion: snapshot.version,
        },
        reason: confirmationNote,
        correlationId,
      });
    }

    const confirmed = await tx.autopilotResearchSnapshot.update({
      where: { id: snapshotId },
      data: {
        status: 'confirmed',
        confirmedById: actor.id,
        confirmedAt: new Date(),
        evidenceCompleteness: new Prisma.Decimal(completeness.completeness),
        updatedById: actor.id,
      },
    });

    const updatedTopic = await tx.autopilotTopic.update({
      where: { id: topic.id },
      data: {
        topicStatus: 'RESEARCH_COMPLETE',
        searchIntent: toJson(snapshot.searchIntent),
        serpEvidence: toJson(snapshot.serpEvidence),
        businessAlignment: toJson(snapshot.businessAlignment),
        contentArchitecture: toJson(snapshot.contentArchitecture),
        riskAssessment: toJson(snapshot.riskAssessment),
        updatedById: actor.id,
        // decisionStatus intentionally unchanged
      },
    });

    await appendActivityLog(tx, {
      entityType: 'research_snapshot',
      entityId: String(snapshotId),
      eventType: 'research_snapshot_confirmed',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue: { status: snapshot.status, version: snapshot.version },
      newValue: {
        status: 'confirmed',
        completeness: completeness.completeness,
        topicStatus: 'RESEARCH_COMPLETE',
        decisionStatus: topic.decisionStatus,
        supersededSnapshotId,
      },
      reason: confirmationNote,
      correlationId,
    });

    await appendActivityLog(tx, {
      entityType: 'topic',
      entityId: String(topic.id),
      eventType: 'research_completed',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue: { topicStatus: topic.topicStatus },
      newValue: {
        topicStatus: 'RESEARCH_COMPLETE',
        snapshotId,
        version: snapshot.version,
      },
      reason: confirmationNote,
      metadata: { workingTitle: topic.workingTitle },
      correlationId,
    });

    return { confirmed, updatedTopic, supersededSnapshotId };
  });

  return {
    snapshot: serializeResearchSnapshot(
      result.confirmed as unknown as Record<string, unknown>,
    ),
    topic: serializeTopicRow(result.updatedTopic as unknown as Record<string, unknown>),
    supersededSnapshotId: result.supersededSnapshotId,
  };
}

export async function listResearchQueue(
  prisma: PrismaClient,
  query: Record<string, unknown>,
) {
  const limit =
    typeof query.limit === 'string'
      ? Number.parseInt(query.limit, 10)
      : typeof query.limit === 'number'
        ? query.limit
        : 25;
  const offset =
    typeof query.offset === 'string'
      ? Number.parseInt(query.offset, 10)
      : typeof query.offset === 'number'
        ? query.offset
        : 0;
  const take = Math.min(Math.max(Number.isFinite(limit) ? limit : 25, 1), 100);
  const skip = Math.max(Number.isFinite(offset) ? offset : 0, 0);

  const topicWhere: Prisma.AutopilotTopicWhereInput = {
    archivedAt: null,
  };

  if (typeof query.topicStatus === 'string' && query.topicStatus.trim()) {
    topicWhere.topicStatus = query.topicStatus.trim();
  }
  if (typeof query.primaryCategory === 'string' && query.primaryCategory.trim()) {
    topicWhere.primaryCategory = query.primaryCategory.trim();
  }
  if (typeof query.assignedToId === 'string' && query.assignedToId.trim()) {
    const id = Number.parseInt(query.assignedToId, 10);
    if (Number.isInteger(id) && id > 0) topicWhere.assignedToId = id;
  }
  if (typeof query.q === 'string' && query.q.trim()) {
    const q = query.q.trim();
    topicWhere.OR = [
      { workingTitle: { contains: q } },
      { primaryKeyword: { contains: q } },
      { proposedSlug: { contains: q } },
    ];
  }

  if (query.needsMoreResearch === 'true' || query.needsMoreResearch === true) {
    topicWhere.OR = [
      ...(topicWhere.OR || []),
      { decisionStatus: 'NEEDS_MORE_RESEARCH' },
      { topicStatus: { in: ['DISCOVERED', 'RESEARCHING'] } },
    ];
  }

  const topics = await prisma.autopilotTopic.findMany({
    where: topicWhere,
    orderBy: { updatedAt: 'desc' },
    take: 500,
  });

  const topicIds = topics.map((t) => t.id);
  let snapshots: Array<Record<string, unknown>> = [];
  try {
    const rows = await prisma.autopilotResearchSnapshot.findMany({
      where: { topicId: { in: topicIds } },
      orderBy: [{ topicId: 'asc' }, { version: 'desc' }],
    });
    snapshots = rows as unknown as Array<Record<string, unknown>>;
  } catch {
    snapshots = [];
  }

  const latestByTopic = new Map<number, Record<string, unknown>>();
  for (const snap of snapshots) {
    const topicId = Number(snap.topicId);
    if (!latestByTopic.has(topicId)) latestByTopic.set(topicId, snap);
  }

  let items = topics.map((topic) => {
    const snap = latestByTopic.get(topic.id) || null;
    const overlap = (snap?.overlapAnalysis || null) as AutopilotOverlapAnalysisResult | null;
    const completeness =
      snap != null
        ? decimalToNumber(snap.evidenceCompleteness) ??
          calculateResearchCompleteness({
            searchIntent: snap.searchIntent as never,
            serpEvidence: snap.serpEvidence as never,
            businessAlignment: snap.businessAlignment as never,
            contentArchitecture: snap.contentArchitecture as never,
            riskAssessment: snap.riskAssessment as never,
          }).completeness
        : null;

    return {
      topic: serializeTopicRow(topic as unknown as Record<string, unknown>),
      currentSnapshot: snap
        ? serializeResearchSnapshot(snap)
        : null,
      snapshotStatus: snap ? String(snap.status) : null,
      snapshotVersion: snap ? Number(snap.version) : null,
      completeness,
      exactConflictCount: overlap?.summary?.exactConflictCount ?? 0,
      highOverlapCount: overlap?.summary?.highOverlapCount ?? 0,
      updatedAt: snap
        ? snap.updatedAt instanceof Date
          ? snap.updatedAt.toISOString()
          : String(snap.updatedAt)
        : topic.updatedAt.toISOString(),
    };
  });

  if (typeof query.snapshotStatus === 'string' && query.snapshotStatus.trim()) {
    const status = query.snapshotStatus.trim();
    items = items.filter((item) => item.snapshotStatus === status);
  }
  if (query.hasExactConflict === 'true' || query.hasExactConflict === true) {
    items = items.filter((item) => item.exactConflictCount > 0);
  }
  if (query.hasHighOverlap === 'true' || query.hasHighOverlap === true) {
    items = items.filter((item) => item.highOverlapCount > 0);
  }
  if (typeof query.minCompleteness === 'string' || typeof query.minCompleteness === 'number') {
    const min = Number(query.minCompleteness);
    if (Number.isFinite(min)) {
      items = items.filter(
        (item) => item.completeness != null && item.completeness >= min,
      );
    }
  }
  if (typeof query.maxCompleteness === 'string' || typeof query.maxCompleteness === 'number') {
    const max = Number(query.maxCompleteness);
    if (Number.isFinite(max)) {
      items = items.filter(
        (item) => item.completeness != null && item.completeness <= max,
      );
    }
  }

  const total = items.length;
  const page = items.slice(skip, skip + take);

  return {
    items: page,
    total,
    limit: take,
    offset: skip,
  };
}

/** Safe dashboard research metrics — empty when table unavailable. */
export async function getResearchDashboardStats(prisma: PrismaClient) {
  try {
    const [
      topicsResearching,
      readyForConfirmation,
      confirmedSnapshots,
      topicsNeedingResearch,
    ] = await Promise.all([
      prisma.autopilotTopic.count({
        where: { archivedAt: null, topicStatus: 'RESEARCHING' },
      }),
      prisma.autopilotResearchSnapshot.count({
        where: { status: 'ready_for_confirmation' },
      }),
      prisma.autopilotResearchSnapshot.count({
        where: { status: 'confirmed' },
      }),
      prisma.autopilotTopic.count({
        where: {
          archivedAt: null,
          OR: [
            { decisionStatus: 'NEEDS_MORE_RESEARCH' },
            { topicStatus: { in: ['DISCOVERED', 'RESEARCHING'] } },
          ],
        },
      }),
    ]);

    // Bounded advisory counts from recent confirmed/ready snapshots
    const recent = await prisma.autopilotResearchSnapshot.findMany({
      where: { status: { in: ['confirmed', 'ready_for_confirmation', 'draft'] } },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: { overlapAnalysis: true, topicId: true, status: true },
    });

    let topicsWithExactConflicts = 0;
    let topicsWithHighOverlap = 0;
    const seenExact = new Set<number>();
    const seenHigh = new Set<number>();
    for (const row of recent) {
      const overlap = row.overlapAnalysis as AutopilotOverlapAnalysisResult | null;
      if (!overlap?.summary) continue;
      if (overlap.summary.exactConflictCount > 0 && !seenExact.has(row.topicId)) {
        seenExact.add(row.topicId);
        topicsWithExactConflicts += 1;
      }
      if (overlap.summary.highOverlapCount > 0 && !seenHigh.has(row.topicId)) {
        seenHigh.add(row.topicId);
        topicsWithHighOverlap += 1;
      }
    }

    const recentResearchActivity = await prisma.autopilotActivityLog.findMany({
      where: {
        eventType: {
          in: [
            'research_snapshot_created',
            'research_snapshot_updated',
            'research_overlap_analysed',
            'research_marked_ready',
            'research_snapshot_confirmed',
            'research_snapshot_superseded',
            'research_started',
            'research_completed',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    return {
      researchStats: {
        topicsResearching,
        readyForConfirmation,
        confirmedSnapshots,
        topicsNeedingResearch,
        topicsWithExactConflicts,
        topicsWithHighOverlap,
      },
      recentResearchActivity: recentResearchActivity.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  } catch {
    return {
      researchStats: null,
      recentResearchActivity: [],
    };
  }
}

// Re-export for tests that mock transactions
export type { PrismaLike };
