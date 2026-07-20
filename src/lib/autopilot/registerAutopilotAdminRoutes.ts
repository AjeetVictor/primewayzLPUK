/**
 * Thin Express registration for Article Autopilot admin APIs (Phase 1C).
 * Business logic lives in src/lib/autopilot/* services.
 */

import type { Express, NextFunction, Request, Response } from 'express';
import type { PrismaClient } from '@prisma/client';
import { AutopilotError, serializeAutopilotError } from './apiErrors.ts';
import {
  assertNoPrototypePollution,
  parseDecisionAction,
  parsePagination,
  parsePositiveIntId,
  requireNonEmptyString,
  AUTOPILOT_MAX_REASON_LENGTH,
} from './apiValidation.ts';
import {
  canContributeTopics,
  canEditorialAutopilot,
  canManageAutopilotSettings,
  canReadAutopilot,
} from './autopilotPermissions.ts';
import { resolveCorrelationId } from './correlation.ts';
import { listActivityLogs } from './activityLogService.ts';
import { getAutopilotDashboard } from './dashboardService.ts';
import { applyTopicDecision } from './decisionService.ts';
import { recalculateAndPersistTopicScore } from './scorePersistenceService.ts';
import { listAutopilotSettings, updateAutopilotSetting } from './settingService.ts';
import {
  archiveAutopilotTopic,
  createAutopilotTopic,
  getAutopilotTopicDetail,
  listAutopilotTopics,
  patchAutopilotTopic,
  recommendTopicCategory,
} from './topicService.ts';
import { getWorkflowRunById } from './workflowRunService.ts';
import type { AdminActor } from './topicHelpers.ts';
import { conflict } from './apiErrors.ts';
import {
  commitKeywordImport,
  getKeywordImportBatch,
  listKeywordImportBatches,
  previewKeywordImport,
} from './keywordImportService.ts';
import {
  convertKeywordCandidateToTopic,
  getKeywordCandidate,
  listKeywordCandidates,
  patchKeywordCandidate,
} from './keywordCandidateService.ts';
import {
  analyseResearchSnapshotOverlap,
  confirmResearchSnapshot,
  createResearchSnapshot,
  getResearchSnapshot,
  listResearchQueue,
  listResearchSnapshotsForTopic,
  markResearchSnapshotReady,
  updateResearchSnapshot,
} from './researchSnapshotService.ts';

type AdminRequest = Request & {
  adminUser?: {
    id: number;
    email: string;
    role: string;
  };
};

type AuthMiddleware = (req: AdminRequest, res: Response, next: NextFunction) => void;
type RoleMiddleware = (canAccess: (role?: string) => boolean) => AuthMiddleware;

export type RegisterAutopilotAdminRoutesOptions = {
  app: Express;
  prisma: PrismaClient;
  requireAdmin: AuthMiddleware;
  requireRole: RoleMiddleware;
};

function toActor(req: AdminRequest): AdminActor {
  const user = req.adminUser;
  if (!user) {
    throw new AutopilotError('AUTOPILOT_FORBIDDEN', 'Not authenticated', 403);
  }
  return { id: user.id, email: user.email, role: user.role };
}

function correlationFrom(req: Request): string {
  const header =
    (typeof req.headers['x-correlation-id'] === 'string'
      ? req.headers['x-correlation-id']
      : undefined) ||
    (typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : undefined);
  return resolveCorrelationId(header);
}

function sendAutopilotError(res: Response, error: unknown, correlationId: string) {
  const payload = serializeAutopilotError(error, correlationId);
  const status = error instanceof AutopilotError ? error.status : 500;
  if (status >= 500) {
    console.error('[autopilot]', correlationId, error instanceof Error ? error.message : 'unknown');
  }
  res.setHeader('x-correlation-id', correlationId);
  return res.status(status).json(payload);
}

function withAutopilotHandler(
  handler: (req: AdminRequest, res: Response, correlationId: string) => Promise<void>,
) {
  return async (req: AdminRequest, res: Response) => {
    const correlationId = correlationFrom(req);
    try {
      await handler(req, res, correlationId);
    } catch (error) {
      sendAutopilotError(res, error, correlationId);
    }
  };
}

export function registerAutopilotAdminRoutes(options: RegisterAutopilotAdminRoutesOptions) {
  const { app, prisma, requireAdmin, requireRole } = options;

  app.get(
    '/api/admin/autopilot/dashboard',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (_req, res, correlationId) => {
      const dashboard = await getAutopilotDashboard(prisma);
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...dashboard, correlationId });
    }),
  );

  app.get(
    '/api/admin/autopilot/topics',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const result = await listAutopilotTopics(prisma, {
        q: typeof req.query.q === 'string' ? req.query.q : undefined,
        topicStatus: typeof req.query.topicStatus === 'string' ? req.query.topicStatus : undefined,
        decisionStatus:
          typeof req.query.decisionStatus === 'string' ? req.query.decisionStatus : undefined,
        primaryCategory:
          typeof req.query.primaryCategory === 'string' ? req.query.primaryCategory : undefined,
        assignedToId:
          typeof req.query.assignedToId === 'string' ? req.query.assignedToId : undefined,
        includeArchived:
          typeof req.query.includeArchived === 'string' ? req.query.includeArchived : undefined,
        scoreBand: typeof req.query.scoreBand === 'string' ? req.query.scoreBand : undefined,
        minScore: typeof req.query.minScore === 'string' ? req.query.minScore : undefined,
        maxScore: typeof req.query.maxScore === 'string' ? req.query.maxScore : undefined,
        limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
        offset: typeof req.query.offset === 'string' ? req.query.offset : undefined,
      });
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.post(
    '/api/admin/autopilot/topics',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      assertNoPrototypePollution(req.body);
      const topic = await createAutopilotTopic(prisma, toActor(req), req.body ?? {}, correlationId);
      res.setHeader('x-correlation-id', correlationId);
      res.status(201).json({ topic, correlationId });
    }),
  );

  app.get(
    '/api/admin/autopilot/topics/:id',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const id = parsePositiveIntId(req.params.id);
      const detail = await getAutopilotTopicDetail(prisma, id);
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...detail, correlationId });
    }),
  );

  app.patch(
    '/api/admin/autopilot/topics/:id',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      assertNoPrototypePollution(req.body);
      const id = parsePositiveIntId(req.params.id);
      const actor = toActor(req);
      const topic = await patchAutopilotTopic(prisma, actor, id, req.body ?? {}, correlationId, {
        canEditorial: canEditorialAutopilot(actor.role),
      });
      res.setHeader('x-correlation-id', correlationId);
      res.json({ topic, correlationId });
    }),
  );

  app.post(
    '/api/admin/autopilot/topics/:id/archive',
    requireAdmin,
    requireRole(canEditorialAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const id = parsePositiveIntId(req.params.id);
      const reason = requireNonEmptyString(req.body?.reason, 'reason', AUTOPILOT_MAX_REASON_LENGTH);
      const result = await archiveAutopilotTopic(prisma, toActor(req), id, reason, correlationId);
      res.setHeader('x-correlation-id', correlationId);
      res.json({
        topic: result.topic,
        alreadyArchived: result.alreadyArchived,
        correlationId,
      });
    }),
  );

  app.post(
    '/api/admin/autopilot/topics/:id/score',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      const id = parsePositiveIntId(req.params.id);
      const result = await recalculateAndPersistTopicScore(
        prisma,
        id,
        toActor(req),
        correlationId,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.post(
    '/api/admin/autopilot/topics/:id/recommend-category',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      assertNoPrototypePollution(req.body);
      const id = parsePositiveIntId(req.params.id);
      const result = await recommendTopicCategory(
        prisma,
        toActor(req),
        id,
        req.body ?? {},
        correlationId,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.json({
        topic: result.topic,
        categoryValidation: result.categoryValidation,
        correlationId,
      });
    }),
  );

  app.post(
    '/api/admin/autopilot/topics/:id/decision',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      assertNoPrototypePollution(req.body);
      const id = parsePositiveIntId(req.params.id);
      const action = parseDecisionAction(req.body?.action);
      // Non-submit actions need editorial — enforced again inside decisionService.
      if (action !== 'submit' && !canEditorialAutopilot(req.adminUser?.role)) {
        throw new AutopilotError(
          'AUTOPILOT_FORBIDDEN',
          'Editorial permission is required for this decision action.',
          403,
          { action },
        );
      }
      const topic = await applyTopicDecision(
        prisma,
        id,
        toActor(req),
        { action, rationale: req.body?.rationale },
        correlationId,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.json({ topic, correlationId });
    }),
  );

  app.post(
    '/api/admin/autopilot/topics/:id/research',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      parsePositiveIntId(req.params.id);
      throw conflict(
        'Automated provider-based research is not enabled. Use the manual research-snapshot workflow: POST /api/admin/autopilot/topics/:id/research-snapshots. Live external research begins in a later phase.',
        {
          phase: '2C',
          manualWorkflow: 'research-snapshots',
        },
        'AUTOPILOT_RESEARCH_NOT_ENABLED',
      );
    }),
  );

  /* -------------------------------------------------------------------------- */
  /* Phase 2B — Research snapshots                                              */
  /* -------------------------------------------------------------------------- */

  app.get(
    '/api/admin/autopilot/topics/:id/research-snapshots',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const id = parsePositiveIntId(req.params.id);
      const result = await listResearchSnapshotsForTopic(prisma, id, {
        limit: typeof req.query.limit === 'string' ? req.query.limit : undefined,
        offset: typeof req.query.offset === 'string' ? req.query.offset : undefined,
      });
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.post(
    '/api/admin/autopilot/topics/:id/research-snapshots',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      assertNoPrototypePollution(req.body);
      const id = parsePositiveIntId(req.params.id);
      const result = await createResearchSnapshot(
        prisma,
        toActor(req),
        id,
        req.body ?? {},
        correlationId,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.status(result.reusedExistingDraft ? 200 : 201).json({ ...result, correlationId });
    }),
  );

  app.get(
    '/api/admin/autopilot/research-snapshots/:snapshotId',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const snapshotId = parsePositiveIntId(req.params.snapshotId);
      const result = await getResearchSnapshot(prisma, snapshotId);
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.patch(
    '/api/admin/autopilot/research-snapshots/:snapshotId',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      assertNoPrototypePollution(req.body);
      const snapshotId = parsePositiveIntId(req.params.snapshotId);
      const result = await updateResearchSnapshot(
        prisma,
        toActor(req),
        snapshotId,
        req.body ?? {},
        correlationId,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.post(
    '/api/admin/autopilot/research-snapshots/:snapshotId/analyse-overlap',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      const snapshotId = parsePositiveIntId(req.params.snapshotId);
      const result = await analyseResearchSnapshotOverlap(
        prisma,
        toActor(req),
        snapshotId,
        correlationId,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.post(
    '/api/admin/autopilot/research-snapshots/:snapshotId/mark-ready',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      const snapshotId = parsePositiveIntId(req.params.snapshotId);
      const result = await markResearchSnapshotReady(
        prisma,
        toActor(req),
        snapshotId,
        correlationId,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.post(
    '/api/admin/autopilot/research-snapshots/:snapshotId/confirm',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      assertNoPrototypePollution(req.body);
      const snapshotId = parsePositiveIntId(req.params.snapshotId);
      const result = await confirmResearchSnapshot(
        prisma,
        toActor(req),
        snapshotId,
        req.body ?? {},
        correlationId,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.get(
    '/api/admin/autopilot/research-queue',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const result = await listResearchQueue(prisma, req.query as Record<string, unknown>);
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.get(
    '/api/admin/autopilot/topics/:id/activity',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const id = parsePositiveIntId(req.params.id);
      const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const result = await listActivityLogs(prisma, {
        entityType: 'topic',
        entityId: String(id),
        limit,
        offset,
      });
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.get(
    '/api/admin/autopilot/activity',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
      const result = await listActivityLogs(prisma, {
        entityType: typeof req.query.entityType === 'string' ? req.query.entityType : undefined,
        entityId: typeof req.query.entityId === 'string' ? req.query.entityId : undefined,
        eventType: typeof req.query.eventType === 'string' ? req.query.eventType : undefined,
        limit,
        offset,
      });
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.get(
    '/api/admin/autopilot/workflow-runs/:id',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const id = parsePositiveIntId(req.params.id);
      const run = await getWorkflowRunById(prisma, id);
      res.setHeader('x-correlation-id', correlationId);
      res.json({ run, correlationId });
    }),
  );

  app.get(
    '/api/admin/autopilot/settings',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (_req, res, correlationId) => {
      const settings = await listAutopilotSettings(prisma);
      res.setHeader('x-correlation-id', correlationId);
      res.json({ settings, correlationId });
    }),
  );

  app.patch(
    '/api/admin/autopilot/settings',
    requireAdmin,
    requireRole(canManageAutopilotSettings),
    withAutopilotHandler(async (req, res, correlationId) => {
      assertNoPrototypePollution(req.body);
      const setting = await updateAutopilotSetting(
        prisma,
        toActor(req),
        {
          key: req.body?.key,
          value: req.body?.value,
          description: req.body?.description,
        },
        correlationId,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.json({ setting, correlationId });
    }),
  );

  /* -------------------------------------------------------------------------- */
  /* Phase 2A — Keyword imports                                                 */
  /* -------------------------------------------------------------------------- */

  app.post(
    '/api/admin/autopilot/keyword-imports/preview',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      assertNoPrototypePollution(req.body);
      const preview = await previewKeywordImport(prisma, req.body ?? {});
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...preview, correlationId });
    }),
  );

  app.post(
    '/api/admin/autopilot/keyword-imports',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      assertNoPrototypePollution(req.body);
      const result = await commitKeywordImport(
        prisma,
        toActor(req),
        req.body ?? {},
        correlationId,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.status(201).json({ ...result, correlationId });
    }),
  );

  app.get(
    '/api/admin/autopilot/keyword-imports',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const result = await listKeywordImportBatches(
        prisma,
        req.query as Record<string, unknown>,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.get(
    '/api/admin/autopilot/keyword-imports/:id',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const id = parsePositiveIntId(req.params.id);
      const result = await getKeywordImportBatch(prisma, id);
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.get(
    '/api/admin/autopilot/keyword-candidates',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const result = await listKeywordCandidates(
        prisma,
        req.query as Record<string, unknown>,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.get(
    '/api/admin/autopilot/keyword-candidates/:id',
    requireAdmin,
    requireRole(canReadAutopilot),
    withAutopilotHandler(async (req, res, correlationId) => {
      const id = parsePositiveIntId(req.params.id);
      const result = await getKeywordCandidate(prisma, id);
      res.setHeader('x-correlation-id', correlationId);
      res.json({ ...result, correlationId });
    }),
  );

  app.patch(
    '/api/admin/autopilot/keyword-candidates/:id',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      assertNoPrototypePollution(req.body);
      const id = parsePositiveIntId(req.params.id);
      const candidate = await patchKeywordCandidate(
        prisma,
        toActor(req),
        id,
        req.body ?? {},
        correlationId,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.json({ candidate, correlationId });
    }),
  );

  app.post(
    '/api/admin/autopilot/keyword-candidates/:id/convert-to-topic',
    requireAdmin,
    requireRole(canContributeTopics),
    withAutopilotHandler(async (req, res, correlationId) => {
      assertNoPrototypePollution(req.body);
      const id = parsePositiveIntId(req.params.id);
      const result = await convertKeywordCandidateToTopic(
        prisma,
        toActor(req),
        id,
        req.body ?? {},
        correlationId,
      );
      res.setHeader('x-correlation-id', correlationId);
      res.status(201).json({ ...result, correlationId });
    }),
  );
}
