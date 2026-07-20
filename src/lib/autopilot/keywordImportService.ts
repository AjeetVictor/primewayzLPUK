/**
 * Keyword import persistence services (Phase 2A).
 */

import { createHash } from 'node:crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import {
  AUTOPILOT_KEYWORD_DUPLICATE_HANDLING,
  AUTOPILOT_KEYWORD_IMPORT_MAX_ROWS,
  AUTOPILOT_KEYWORD_IMPORT_SOURCE_TYPES,
  type AutopilotKeywordDuplicateHandling,
  type AutopilotKeywordImportSourceType,
} from '../../data/autopilot/keywordImportStatus.ts';
import { appendActivityLog, type PrismaLike } from './activityLogService.ts';
import { conflict, notFound, validationError } from './apiErrors.ts';
import {
  assertNoPrototypePollution,
  parsePagination,
  requireNonEmptyString,
} from './apiValidation.ts';
import {
  buildKeywordImportPreview,
  filterRowsForCommit,
  type PreviewRowInput,
  type PreviewRowResult,
} from './keywordImportPreview.ts';
import type { AutopilotColumnMapping } from './keywordImportMapping.ts';
import {
  createOrReuseWorkflowRun,
  markWorkflowRunFailed,
  markWorkflowRunRunning,
  markWorkflowRunSucceeded,
} from './workflowRunService.ts';
import {
  actorDisplayName,
  decimalToNumber,
  type AdminActor,
} from './topicHelpers.ts';

function isSourceType(value: unknown): value is AutopilotKeywordImportSourceType {
  return (
    typeof value === 'string' &&
    (AUTOPILOT_KEYWORD_IMPORT_SOURCE_TYPES as readonly string[]).includes(value)
  );
}

function parseDuplicateHandling(value: unknown): AutopilotKeywordDuplicateHandling {
  if (
    typeof value === 'string' &&
    (AUTOPILOT_KEYWORD_DUPLICATE_HANDLING as readonly string[]).includes(value)
  ) {
    return value as AutopilotKeywordDuplicateHandling;
  }
  return 'import_and_mark';
}

function serializeBatch(row: Record<string, unknown>) {
  return {
    ...row,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt:
      row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
    completedAt:
      row.completedAt instanceof Date
        ? row.completedAt.toISOString()
        : row.completedAt ?? null,
  };
}

export function serializeKeywordCandidate(row: Record<string, unknown>) {
  return {
    ...row,
    ctr: decimalToNumber(row.ctr),
    averagePosition: decimalToNumber(row.averagePosition),
    keywordDifficulty: decimalToNumber(row.keywordDifficulty),
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt:
      row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
    reviewedAt:
      row.reviewedAt instanceof Date
        ? row.reviewedAt.toISOString()
        : row.reviewedAt ?? null,
    convertedAt:
      row.convertedAt instanceof Date
        ? row.convertedAt.toISOString()
        : row.convertedAt ?? null,
  };
}

async function loadPreviewContext(prisma: PrismaClient) {
  const [candidates, topics, cmsPosts] = await Promise.all([
    prisma.autopilotKeywordCandidate
      .findMany({
        select: { id: true, normalisedKeyword: true },
        take: 5000,
        orderBy: { id: 'desc' },
      })
      .catch(() => [] as Array<{ id: number; normalisedKeyword: string }>),
    prisma.autopilotTopic
      .findMany({
        where: { archivedAt: null },
        select: { id: true, primaryKeyword: true },
        take: 5000,
      })
      .catch(() => [] as Array<{ id: number; primaryKeyword: string }>),
    prisma.cmsBlogPost
      .findMany({
        select: { title: true, slug: true },
        take: 5000,
      })
      .catch(() => [] as Array<{ title: string; slug: string }>),
  ]);

  return {
    existingCandidateKeywords: candidates,
    existingTopicKeywords: topics,
    cmsPosts,
  };
}

function parsePreviewRows(raw: unknown): PreviewRowInput[] {
  if (!Array.isArray(raw)) {
    throw validationError('rows must be an array of parsed objects.');
  }
  if (raw.length > AUTOPILOT_KEYWORD_IMPORT_MAX_ROWS) {
    throw validationError(
      `Import exceeds maximum of ${AUTOPILOT_KEYWORD_IMPORT_MAX_ROWS} rows.`,
      { maxRows: AUTOPILOT_KEYWORD_IMPORT_MAX_ROWS },
    );
  }

  return raw.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw validationError(`Row ${index + 1} must be an object.`);
    }
    const record = item as Record<string, unknown>;
    if (record.values && typeof record.values === 'object' && !Array.isArray(record.values)) {
      return {
        sourceRowNumber:
          typeof record.sourceRowNumber === 'number' ? record.sourceRowNumber : undefined,
        values: record.values as Record<string, unknown>,
      };
    }
    return { sourceRowNumber: index + 1, values: record };
  });
}

export async function previewKeywordImport(
  prisma: PrismaClient,
  body: Record<string, unknown>,
) {
  assertNoPrototypePollution(body);
  if (!isSourceType(body.sourceType)) {
    throw validationError('sourceType must be manual, csv, json, or gsc_export.');
  }

  const rows = parsePreviewRows(body.rows);
  const headers = Array.isArray(body.headers)
    ? body.headers.map((item) => String(item))
    : undefined;
  const columnMapping =
    body.columnMapping && typeof body.columnMapping === 'object'
      ? (body.columnMapping as AutopilotColumnMapping)
      : undefined;

  const context = await loadPreviewContext(prisma);
  const preview = buildKeywordImportPreview({
    sourceType: body.sourceType,
    rows,
    headers,
    columnMapping,
    context,
    duplicateHandling: parseDuplicateHandling(body.duplicateHandling),
  });

  return {
    sourceType: body.sourceType,
    sourceName: typeof body.sourceName === 'string' ? body.sourceName : null,
    originalFileName:
      typeof body.originalFileName === 'string' ? body.originalFileName : null,
    ...preview,
  };
}

function hashImportInput(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 64);
}

function candidateCreateData(
  batchId: number,
  sourceType: string,
  row: PreviewRowResult,
  duplicateOfCandidateId: number | null,
) {
  const isDuplicate = Boolean(row.duplicateReason);
  return {
    batchId,
    keyword: row.originalKeyword,
    normalisedKeyword: row.normalisedKeyword,
    sourceRowNumber: row.sourceRowNumber,
    sourceType,
    sourceData: row.sourceData as Prisma.InputJsonValue,
    impressions: row.impressions,
    clicks: row.clicks,
    ctr: row.ctr == null ? null : new Prisma.Decimal(row.ctr),
    averagePosition:
      row.averagePosition == null ? null : new Prisma.Decimal(row.averagePosition),
    searchVolume: row.searchVolume,
    keywordDifficulty:
      row.keywordDifficulty == null ? null : new Prisma.Decimal(row.keywordDifficulty),
    currentUrl: row.currentUrl,
    country: row.country,
    language: row.language,
    status: isDuplicate ? 'duplicate' : 'new',
    duplicateReason: row.duplicateReason,
    duplicateOfCandidateId,
    matchedTopicId:
      (row.matches.find((m) => m.matchType === 'exact_existing_topic_primary_keyword')
        ?.relatedId as number | undefined) ?? null,
  };
}

export async function commitKeywordImport(
  prisma: PrismaClient,
  actor: AdminActor,
  body: Record<string, unknown>,
  correlationId: string,
) {
  assertNoPrototypePollution(body);
  if (!isSourceType(body.sourceType)) {
    throw validationError('sourceType must be manual, csv, json, or gsc_export.');
  }

  const duplicateHandling = parseDuplicateHandling(body.duplicateHandling);
  const preview = await previewKeywordImport(prisma, body);

  if (!preview.hasKeywordColumn) {
    throw validationError('A keyword/query column must be mapped before import.');
  }
  if (preview.totalRows === 0) {
    throw validationError('Import contains no rows.');
  }

  const rowsToImport = filterRowsForCommit(preview, duplicateHandling);
  const inputHash = hashImportInput({
    sourceType: preview.sourceType,
    mapping: preview.mapping,
    rows: preview.rows.map((row) => ({
      keyword: row.normalisedKeyword,
      sourceRowNumber: row.sourceRowNumber,
    })),
    duplicateHandling,
    actorId: actor.id,
  });

  const batch = await prisma.autopilotKeywordImportBatch.create({
    data: {
      sourceType: preview.sourceType,
      sourceName: preview.sourceName,
      originalFileName: preview.originalFileName,
      status: 'importing',
      totalRows: preview.totalRows,
      validRows: 0,
      invalidRows: preview.invalidRows,
      duplicateRows: 0,
      createdTopicCount: 0,
      columnMapping: preview.mapping as Prisma.InputJsonValue,
      importOptions: {
        duplicateHandling,
        notes: typeof body.notes === 'string' ? body.notes : null,
      } as Prisma.InputJsonValue,
      createdById: actor.id,
    },
  });

  const workflow = await createOrReuseWorkflowRun(prisma, {
    workflowType: 'keyword_import',
    entityType: 'keyword_import_batch',
    entityId: String(batch.id),
    inputHash,
    createdById: actor.id,
    correlationId,
    totalSteps: 3,
  });

  if (!workflow.reused) {
    await markWorkflowRunRunning(prisma, workflow.run.id as number);
  }

  await appendActivityLog(prisma, {
    entityType: 'keyword_import_batch',
    entityId: String(batch.id),
    eventType: 'keyword_import_started',
    actorType: 'user',
    actorId: actor.id,
    actorDisplayName: actorDisplayName(actor),
    source: 'import',
    metadata: {
      sourceType: preview.sourceType,
      totalRows: preview.totalRows,
      workflowRunId: workflow.run.id,
    },
    correlationId,
  });

  const createdIds: number[] = [];
  const normalisedToId = new Map<string, number>();
  let importedValid = 0;
  let importedDuplicates = 0;
  let chunkError: string | null = null;

  try {
    const chunkSize = 50;
    for (let offset = 0; offset < rowsToImport.length; offset += chunkSize) {
      const chunk = rowsToImport.slice(offset, offset + chunkSize);
      await prisma.$transaction(async (tx: PrismaLike) => {
        for (const row of chunk) {
          let duplicateOfCandidateId: number | null = null;
          if (row.duplicateReason) {
            const existingMatch = row.matches.find(
              (match) =>
                match.matchType === 'exact_persisted_candidate' ||
                match.matchType === 'same_import_duplicate',
            );
            if (
              existingMatch?.matchType === 'same_import_duplicate' &&
              typeof existingMatch.relatedId === 'number'
            ) {
              // relatedId is source row number for same-import; resolve by normalised map
              duplicateOfCandidateId = normalisedToId.get(row.normalisedKeyword) ?? null;
            } else if (typeof existingMatch?.relatedId === 'number') {
              duplicateOfCandidateId = existingMatch.relatedId;
            } else {
              duplicateOfCandidateId = normalisedToId.get(row.normalisedKeyword) ?? null;
            }
          }

          const created = await tx.autopilotKeywordCandidate.create({
            data: candidateCreateData(
              batch.id,
              preview.sourceType,
              row,
              duplicateOfCandidateId,
            ),
          });
          createdIds.push(created.id);
          if (!normalisedToId.has(row.normalisedKeyword)) {
            normalisedToId.set(row.normalisedKeyword, created.id);
          }
          if (row.status === 'duplicate') importedDuplicates += 1;
          else importedValid += 1;
        }
      });
    }

    const finalStatus =
      preview.invalidRows > 0 || chunkError
        ? 'completed_with_errors'
        : 'completed';

    const updated = await prisma.autopilotKeywordImportBatch.update({
      where: { id: batch.id },
      data: {
        status: finalStatus,
        validRows: importedValid,
        duplicateRows: importedDuplicates,
        invalidRows: preview.invalidRows,
        summary: {
          importedCandidateCount: createdIds.length,
          skippedDuplicates:
            duplicateHandling === 'skip_exact_duplicates'
              ? preview.duplicateRows
              : 0,
          matchExamples: preview.examples,
        } as Prisma.InputJsonValue,
        errorSummary:
          preview.invalidRows > 0
            ? {
                invalidRows: preview.rows
                  .filter((row) => !row.valid)
                  .slice(0, 50)
                  .map((row) => ({
                    sourceRowNumber: row.sourceRowNumber,
                    errors: row.errors,
                  })),
              }
            : Prisma.DbNull,
        completedAt: new Date(),
      },
    });

    await appendActivityLog(prisma, {
      entityType: 'keyword_import_batch',
      entityId: String(batch.id),
      eventType:
        finalStatus === 'completed_with_errors'
          ? 'keyword_import_completed_with_errors'
          : 'keyword_import_completed',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'import',
      newValue: {
        validRows: importedValid,
        duplicateRows: importedDuplicates,
        invalidRows: preview.invalidRows,
        createdCandidateIds: createdIds.slice(0, 100),
      },
      correlationId,
    });

    await markWorkflowRunSucceeded(prisma, workflow.run.id as number, {
      progress: 100,
      providerMetadata: {
        importedCandidateCount: createdIds.length,
        sourceType: preview.sourceType,
      },
    });

    return {
      batch: serializeBatch(updated as unknown as Record<string, unknown>),
      previewSummary: {
        totalRows: preview.totalRows,
        validRows: importedValid,
        invalidRows: preview.invalidRows,
        duplicateRows: importedDuplicates,
        createdCandidateCount: createdIds.length,
      },
      workflowRunId: workflow.run.id,
    };
  } catch (error) {
    chunkError = error instanceof Error ? error.message : 'Import failed';
    await prisma.autopilotKeywordImportBatch.update({
      where: { id: batch.id },
      data: {
        status: 'failed',
        errorSummary: { message: 'Import failed during persistence.' } as Prisma.InputJsonValue,
        completedAt: new Date(),
        validRows: importedValid,
        duplicateRows: importedDuplicates,
      },
    });
    await appendActivityLog(prisma, {
      entityType: 'keyword_import_batch',
      entityId: String(batch.id),
      eventType: 'keyword_import_failed',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'import',
      metadata: { partialCreatedCount: createdIds.length },
      correlationId,
    });
    await markWorkflowRunFailed(prisma, workflow.run.id as number, {
      errorCode: 'AUTOPILOT_KEYWORD_IMPORT_FAILED',
      errorMessage: 'Keyword import failed during persistence.',
    });
    throw conflict('Keyword import failed during persistence.', {
      batchId: batch.id,
      partialCreatedCount: createdIds.length,
    });
  }
}

export async function listKeywordImportBatches(
  prisma: PrismaClient,
  query: Record<string, unknown>,
) {
  const { limit, offset } = parsePagination(query);
  const where: Prisma.AutopilotKeywordImportBatchWhereInput = {};

  if (typeof query.status === 'string' && query.status.trim()) {
    where.status = query.status.trim();
  }
  if (typeof query.sourceType === 'string' && query.sourceType.trim()) {
    where.sourceType = query.sourceType.trim();
  }
  if (typeof query.createdById === 'string' || typeof query.createdById === 'number') {
    const id = Number(query.createdById);
    if (Number.isInteger(id) && id > 0) where.createdById = id;
  }
  if (typeof query.q === 'string' && query.q.trim()) {
    const q = query.q.trim();
    where.OR = [
      { sourceName: { contains: q } },
      { originalFileName: { contains: q } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.autopilotKeywordImportBatch.count({ where }),
    prisma.autopilotKeywordImportBatch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ]);

  return {
    items: items.map((item) => serializeBatch(item as unknown as Record<string, unknown>)),
    total,
    limit,
    offset,
  };
}

export async function getKeywordImportBatch(prisma: PrismaClient, id: number) {
  const batch = await prisma.autopilotKeywordImportBatch.findUnique({ where: { id } });
  if (!batch) throw notFound('Keyword import batch not found.', { id });

  const candidates = await prisma.autopilotKeywordCandidate.findMany({
    where: { batchId: id },
    orderBy: [{ sourceRowNumber: 'asc' }, { id: 'asc' }],
    take: 500,
  });

  return {
    batch: serializeBatch(batch as unknown as Record<string, unknown>),
    candidates: candidates.map((item) =>
      serializeKeywordCandidate(item as unknown as Record<string, unknown>),
    ),
  };
}

export function requireNonEmptyImportNotes(value: unknown): string {
  return requireNonEmptyString(value, 'notes', 2000);
}
