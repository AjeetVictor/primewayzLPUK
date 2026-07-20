/**
 * Article Autopilot 2.0 — topic decision workflow service (Phase 1C).
 * Approval never touches publishingStatus or CmsBlogPost — that remains a later phase.
 */

import type { PrismaClient } from '@prisma/client';
import type { AutopilotDecisionStatus } from '../../data/autopilot/status.ts';
import { appendActivityLog } from './activityLogService.ts';
import {
  AUTOPILOT_ERROR_CODES,
  conflict,
  forbidden,
  validationError,
} from './apiErrors.ts';
import type { AutopilotDecisionAction } from './apiValidation.ts';
import { AUTOPILOT_MAX_REASON_LENGTH } from './apiValidation.ts';
import { canEditorialAutopilot } from './autopilotPermissions.ts';
import {
  validateAutopilotDecisionCardForApproval,
  validateAutopilotDecisionStatusTransition,
} from './transitionGuards.ts';
import {
  actorDisplayName,
  asStringArray,
  requireTopic,
  serializeTopicRow,
  type AdminActor,
} from './topicHelpers.ts';

export type AutopilotDecisionActionInput = {
  action: AutopilotDecisionAction;
  rationale?: string | null;
};

const DECISION_TARGET_STATUS: Record<
  Exclude<AutopilotDecisionAction, 'submit'>,
  AutopilotDecisionStatus
> = {
  approve: 'APPROVED',
  reject: 'REJECTED',
  defer: 'DEFERRED',
  needs_more_research: 'NEEDS_MORE_RESEARCH',
};

const DECISION_EVENT_TYPE: Record<AutopilotDecisionAction, string> = {
  submit: 'decision_submitted',
  approve: 'decision_approved',
  reject: 'decision_rejected',
  defer: 'decision_deferred',
  needs_more_research: 'more_research_requested',
};

function targetStatusForAction(action: AutopilotDecisionAction): AutopilotDecisionStatus {
  if (action === 'submit') return 'PENDING_REVIEW';
  return DECISION_TARGET_STATUS[action];
}

function requireRationale(rationale: string | null | undefined): string {
  const trimmed = typeof rationale === 'string' ? rationale.trim() : '';
  if (!trimmed) {
    throw validationError('A rationale is required for this decision action.', {
      field: 'rationale',
    });
  }
  if (trimmed.length > AUTOPILOT_MAX_REASON_LENGTH) {
    throw validationError('Rationale exceeds maximum length.', {
      field: 'rationale',
      maxLen: AUTOPILOT_MAX_REASON_LENGTH,
    });
  }
  return trimmed;
}

function throwIllegalTransition(from: string, to: string): never {
  throw conflict(
    `Illegal decision status transition: ${from} → ${to}.`,
    { from, to },
    AUTOPILOT_ERROR_CODES.ILLEGAL_TRANSITION,
  );
}

/**
 * Apply a decision-card action to an Autopilot topic.
 * `submit` permission is enforced at the route layer (contribute+); every other
 * action requires editorial permission and a non-empty rationale.
 */
export async function applyTopicDecision(
  prisma: PrismaClient,
  topicId: number,
  actor: AdminActor,
  input: AutopilotDecisionActionInput,
  correlationId: string,
) {
  const topic = await requireTopic(prisma, topicId);
  const from = topic.decisionStatus as AutopilotDecisionStatus;
  const targetStatus = targetStatusForAction(input.action);

  if (input.action !== 'submit' && !canEditorialAutopilot(actor.role)) {
    throw forbidden('Editorial permission is required for this decision action.', {
      action: input.action,
    });
  }

  const transitionResult = validateAutopilotDecisionStatusTransition(from, targetStatus);
  if (!transitionResult.ok) {
    throwIllegalTransition(from, targetStatus);
  }

  let rationale: string | undefined;
  if (input.action !== 'submit') {
    rationale = requireRationale(input.rationale);
  }

  if (input.action === 'approve') {
    const cardResult = validateAutopilotDecisionCardForApproval({
      workingTitle: topic.workingTitle,
      primaryKeyword: topic.primaryKeyword,
      userProblem: topic.userProblem,
      audience: topic.audience,
      market: topic.market,
      language: topic.language,
      primaryCategory: topic.primaryCategory,
      secondaryCategories: asStringArray(topic.secondaryCategories),
    });
    if (!cardResult.ok) {
      throw validationError('Topic is not ready for decision approval.', {
        errors: cardResult.errors,
      });
    }
  }

  const eventType = DECISION_EVENT_TYPE[input.action];

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.autopilotTopic.update({
      where: { id: topicId },
      data: {
        decisionStatus: targetStatus,
        updatedById: actor.id,
        ...(input.action === 'approve'
          ? { decidedById: actor.id, decidedAt: new Date(), decisionRationale: rationale }
          : rationale !== undefined
            ? { decisionRationale: rationale }
            : {}),
      },
    });

    await appendActivityLog(tx, {
      entityType: 'topic',
      entityId: String(topicId),
      eventType,
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      previousValue: { decisionStatus: from },
      newValue: { decisionStatus: targetStatus },
      reason: rationale ?? null,
      correlationId,
    });

    return row;
  });

  return serializeTopicRow(updated as unknown as Record<string, unknown>);
}
