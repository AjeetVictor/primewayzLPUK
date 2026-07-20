/**
 * Article Autopilot 2.0 — workflow run orchestration service (Phase 1C).
 * Idempotent by (workflowType, entityType, entityId, inputHash) while a prior
 * run is queued/running/succeeded — callers should not spawn duplicate work.
 */

import { Prisma, type PrismaClient } from '@prisma/client';
import { appendActivityLog, redactSensitive } from './activityLogService.ts';
import { notFound } from './apiErrors.ts';

export type AutopilotWorkflowRunStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled';

export const AUTOPILOT_WORKFLOW_RUN_STATUSES: readonly AutopilotWorkflowRunStatus[] = [
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
];

/** Statuses that make a prior run reusable instead of starting duplicate work. */
const REUSABLE_WORKFLOW_RUN_STATUSES: readonly AutopilotWorkflowRunStatus[] = [
  'queued',
  'running',
  'succeeded',
];

export type CreateOrReuseWorkflowRunInput = {
  workflowType: string;
  entityType: string;
  entityId: string;
  inputHash: string;
  createdById?: number | null;
  correlationId?: string | null;
  totalSteps?: number | null;
};

export type CreateOrReuseWorkflowRunResult = {
  run: ReturnType<typeof serializeWorkflowRun>;
  reused: boolean;
};

function serializeWorkflowRun(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...row };
  for (const key of ['startedAt', 'completedAt', 'createdAt', 'updatedAt'] as const) {
    const value = out[key];
    if (value instanceof Date) out[key] = value.toISOString();
  }
  out.providerMetadata = redactSensitive(out.providerMetadata ?? null);
  return out;
}

export async function createOrReuseWorkflowRun(
  prisma: PrismaClient,
  input: CreateOrReuseWorkflowRunInput,
): Promise<CreateOrReuseWorkflowRunResult> {
  const existing = await prisma.autopilotWorkflowRun.findFirst({
    where: {
      workflowType: input.workflowType,
      entityType: input.entityType,
      entityId: input.entityId,
      inputHash: input.inputHash,
      status: { in: [...REUSABLE_WORKFLOW_RUN_STATUSES] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existing) {
    return { run: serializeWorkflowRun(existing), reused: true };
  }

  const created = await prisma.$transaction(async (tx) => {
    const run = await tx.autopilotWorkflowRun.create({
      data: {
        workflowType: input.workflowType,
        entityType: input.entityType,
        entityId: input.entityId,
        inputHash: input.inputHash,
        status: 'queued',
        progress: 0,
        attempt: 1,
        totalSteps: input.totalSteps ?? null,
        createdById: input.createdById ?? null,
        correlationId: input.correlationId ?? null,
      },
    });

    await appendActivityLog(tx, {
      entityType: 'workflow_run',
      entityId: String(run.id),
      eventType: 'workflow_queued',
      actorType: input.createdById ? 'user' : 'system',
      actorId: input.createdById ?? null,
      source: 'api',
      newValue: { status: run.status },
      metadata: {
        workflowType: run.workflowType,
        entityType: run.entityType,
        entityId: run.entityId,
        attempt: run.attempt,
      },
      correlationId: input.correlationId ?? null,
    });

    return run;
  });

  return { run: serializeWorkflowRun(created), reused: false };
}

export async function getWorkflowRunById(prisma: PrismaClient, id: number) {
  const run = await prisma.autopilotWorkflowRun.findUnique({ where: { id } });
  if (!run) throw notFound('Autopilot workflow run not found.', { id });
  return serializeWorkflowRun(run);
}

export async function markWorkflowRunRunning(
  prisma: PrismaClient,
  id: number,
  correlationId?: string | null,
) {
  const existing = await prisma.autopilotWorkflowRun.findUnique({ where: { id } });
  if (!existing) throw notFound('Autopilot workflow run not found.', { id });

  const updated = await prisma.$transaction(async (tx) => {
    const run = await tx.autopilotWorkflowRun.update({
      where: { id },
      data: {
        status: 'running',
        startedAt: existing.startedAt ?? new Date(),
      },
    });

    await appendActivityLog(tx, {
      entityType: 'workflow_run',
      entityId: String(id),
      eventType: 'workflow_started',
      actorType: 'system',
      source: 'worker',
      previousValue: { status: existing.status },
      newValue: { status: run.status },
      correlationId: correlationId ?? existing.correlationId,
    });

    return run;
  });

  return serializeWorkflowRun(updated);
}

export type MarkWorkflowRunSucceededInput = {
  providerMetadata?: unknown;
  progress?: number;
};

export async function markWorkflowRunSucceeded(
  prisma: PrismaClient,
  id: number,
  input: MarkWorkflowRunSucceededInput = {},
  correlationId?: string | null,
) {
  const existing = await prisma.autopilotWorkflowRun.findUnique({ where: { id } });
  if (!existing) throw notFound('Autopilot workflow run not found.', { id });

  const updated = await prisma.$transaction(async (tx) => {
    const run = await tx.autopilotWorkflowRun.update({
      where: { id },
      data: {
        status: 'succeeded',
        progress: input.progress ?? 100,
        completedAt: new Date(),
        providerMetadata:
          input.providerMetadata === undefined
            ? undefined
            : (redactSensitive(input.providerMetadata) as Prisma.InputJsonValue),
      },
    });

    await appendActivityLog(tx, {
      entityType: 'workflow_run',
      entityId: String(id),
      eventType: 'workflow_succeeded',
      actorType: 'system',
      source: 'worker',
      previousValue: { status: existing.status },
      newValue: { status: run.status, progress: run.progress },
      correlationId: correlationId ?? existing.correlationId,
    });

    return run;
  });

  return serializeWorkflowRun(updated);
}

export type MarkWorkflowRunFailedInput = {
  errorCode?: string | null;
  errorMessage?: string | null;
  providerMetadata?: unknown;
};

export async function markWorkflowRunFailed(
  prisma: PrismaClient,
  id: number,
  input: MarkWorkflowRunFailedInput,
  correlationId?: string | null,
) {
  const existing = await prisma.autopilotWorkflowRun.findUnique({ where: { id } });
  if (!existing) throw notFound('Autopilot workflow run not found.', { id });

  const updated = await prisma.$transaction(async (tx) => {
    const run = await tx.autopilotWorkflowRun.update({
      where: { id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        errorCode: input.errorCode ?? null,
        errorMessage: input.errorMessage ?? null,
        providerMetadata:
          input.providerMetadata === undefined
            ? undefined
            : (redactSensitive(input.providerMetadata) as Prisma.InputJsonValue),
      },
    });

    await appendActivityLog(tx, {
      entityType: 'workflow_run',
      entityId: String(id),
      eventType: 'workflow_failed',
      actorType: 'system',
      source: 'worker',
      previousValue: { status: existing.status },
      newValue: { status: run.status, errorCode: run.errorCode },
      reason: input.errorMessage ?? null,
      correlationId: correlationId ?? existing.correlationId,
    });

    return run;
  });

  return serializeWorkflowRun(updated);
}

export type MarkWorkflowRunCancelledInput = {
  reason?: string | null;
};

export async function markWorkflowRunCancelled(
  prisma: PrismaClient,
  id: number,
  input: MarkWorkflowRunCancelledInput = {},
  correlationId?: string | null,
) {
  const existing = await prisma.autopilotWorkflowRun.findUnique({ where: { id } });
  if (!existing) throw notFound('Autopilot workflow run not found.', { id });

  const updated = await prisma.$transaction(async (tx) => {
    const run = await tx.autopilotWorkflowRun.update({
      where: { id },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
        errorCode: 'CANCELLED',
      },
    });

    // No dedicated "workflow_cancelled" event exists in the controlled vocabulary yet;
    // reuse workflow_failed with metadata.cancelled to keep to the approved event list.
    await appendActivityLog(tx, {
      entityType: 'workflow_run',
      entityId: String(id),
      eventType: 'workflow_failed',
      actorType: 'system',
      source: 'worker',
      previousValue: { status: existing.status },
      newValue: { status: run.status },
      reason: input.reason ?? null,
      metadata: { cancelled: true },
      correlationId: correlationId ?? existing.correlationId,
    });

    return run;
  });

  return serializeWorkflowRun(updated);
}

export async function listRecentFailedWorkflowRuns(prisma: PrismaClient, limit = 5) {
  const runs = await prisma.autopilotWorkflowRun.findMany({
    where: { status: 'failed' },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
  return runs.map((run) => serializeWorkflowRun(run));
}

export type CreateRetryWorkflowRunInput = {
  createdById?: number | null;
  correlationId?: string | null;
};

export async function createRetryWorkflowRun(
  prisma: PrismaClient,
  parentRunId: number,
  input: CreateRetryWorkflowRunInput = {},
) {
  const parent = await prisma.autopilotWorkflowRun.findUnique({ where: { id: parentRunId } });
  if (!parent) throw notFound('Autopilot workflow run not found.', { id: parentRunId });

  const created = await prisma.$transaction(async (tx) => {
    const run = await tx.autopilotWorkflowRun.create({
      data: {
        workflowType: parent.workflowType,
        entityType: parent.entityType,
        entityId: parent.entityId,
        inputHash: parent.inputHash,
        status: 'queued',
        progress: 0,
        attempt: parent.attempt + 1,
        totalSteps: parent.totalSteps,
        createdById: input.createdById ?? parent.createdById ?? null,
        correlationId: input.correlationId ?? parent.correlationId ?? null,
        retryOfRunId: parent.id,
      },
    });

    await appendActivityLog(tx, {
      entityType: 'workflow_run',
      entityId: String(run.id),
      eventType: 'workflow_queued',
      actorType: input.createdById ? 'user' : 'system',
      actorId: input.createdById ?? null,
      source: 'api',
      newValue: { status: run.status, attempt: run.attempt },
      metadata: {
        workflowType: run.workflowType,
        retryOfRunId: parent.id,
        attempt: run.attempt,
      },
      correlationId: input.correlationId ?? parent.correlationId ?? null,
    });

    return run;
  });

  return serializeWorkflowRun(created);
}
