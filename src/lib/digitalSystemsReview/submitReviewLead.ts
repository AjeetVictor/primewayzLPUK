import type { PrismaClient } from '@prisma/client';
import {
  getInternalNotificationEmail,
  isEmailConfigured,
  sendEmail,
} from '../email/sendEmail.ts';
import {
  buildDigitalSystemsReviewNotificationEmail,
  redactNotificationErrorCode,
} from './reviewEmail.ts';
import {
  findReviewLeadBySubmissionId,
  isPrismaUniqueConstraintError,
  saveDigitalSystemsReviewLead,
  updateReviewNotificationStatus,
} from './saveReviewLead.ts';
import {
  DigitalSystemsReviewHoneypotError,
  DigitalSystemsReviewValidationError,
  validateAndNormalizeDigitalSystemsReviewLead,
  type NormalizedDigitalSystemsReviewLead,
} from './validateReviewLead.ts';
import type { ReviewResultCategory } from '../../constants/digitalSystemsReview.ts';

export type SubmitDigitalSystemsReviewSuccess = {
  success: true;
  resultCategory: Extract<ReviewResultCategory, 'created' | 'duplicate'>;
  /** Internal only — never expose in the public HTTP response. */
  id: number;
  /** Internal only — never expose in the public HTTP response. */
  submissionId: string;
  /** Internal only — never expose in the public HTTP response. */
  notificationStatus: 'sent' | 'failed' | 'pending';
};

export type SubmitDigitalSystemsReviewDeps = {
  prisma: PrismaClient;
  sendNotificationEmail?: typeof sendEmail;
  isEmailReady?: typeof isEmailConfigured;
  getReceiver?: typeof getInternalNotificationEmail;
};

/**
 * Attempt operational notification after a successful create.
 * Never throws to the caller — notification failures do not invalidate a stored lead.
 */
async function attemptNotification(
  deps: Required<
    Pick<SubmitDigitalSystemsReviewDeps, 'sendNotificationEmail' | 'isEmailReady' | 'getReceiver'>
  > & { prisma: PrismaClient },
  lead: NormalizedDigitalSystemsReviewLead,
  saved: { id: number; createdAt: Date },
): Promise<'sent' | 'failed' | 'pending'> {
  let outcome: 'sent' | 'failed' = 'failed';
  let errorCode: string | null = 'email_send_failed';

  try {
    let ready = false;
    let receiver: string | null = null;
    try {
      ready = deps.isEmailReady();
      receiver = deps.getReceiver();
    } catch {
      ready = false;
      receiver = null;
      errorCode = 'email_not_configured';
      console.error('[digital-systems-review] notification skipped', { code: errorCode });
    }

    if (ready && receiver) {
      try {
        const message = buildDigitalSystemsReviewNotificationEmail({
          ...lead,
          id: saved.id,
          createdAt: saved.createdAt,
        });
        await deps.sendNotificationEmail({
          to: receiver,
          subject: message.subject,
          html: message.html,
          text: message.text,
          replyTo: lead.workEmail,
        });
        outcome = 'sent';
        errorCode = null;
      } catch (error) {
        outcome = 'failed';
        errorCode = redactNotificationErrorCode(error);
        console.error('[digital-systems-review] notification email failed', { code: errorCode });
      }
    } else if (errorCode !== 'email_not_configured') {
      errorCode = 'email_not_configured';
      console.error('[digital-systems-review] notification skipped', { code: errorCode });
    }
  } catch {
    outcome = 'failed';
    errorCode = 'email_send_failed';
    console.error('[digital-systems-review] notification email failed', { code: errorCode });
  }

  try {
    await updateReviewNotificationStatus({ prisma: deps.prisma }, saved.id, {
      notificationStatus: outcome,
      notificationErrorCode: errorCode,
    });
  } catch {
    console.error('[digital-systems-review] notification status update failed', {
      code: 'notification_status_update_failed',
      leadId: saved.id,
    });
  }

  return outcome;
}

/**
 * Full review submission path: validate → persist → (create-only) notify → respond.
 * Duplicate submissionId returns idempotent success without notification or row updates.
 * Never touches ChatSession.
 */
export async function submitDigitalSystemsReviewLead(
  prismaOrDeps: PrismaClient | SubmitDigitalSystemsReviewDeps,
  body: unknown,
): Promise<SubmitDigitalSystemsReviewSuccess> {
  const deps: SubmitDigitalSystemsReviewDeps =
    'prisma' in (prismaOrDeps as SubmitDigitalSystemsReviewDeps)
      ? (prismaOrDeps as SubmitDigitalSystemsReviewDeps)
      : { prisma: prismaOrDeps as PrismaClient };

  const sendNotificationEmail = deps.sendNotificationEmail ?? sendEmail;
  const isEmailReady = deps.isEmailReady ?? isEmailConfigured;
  const getReceiver = deps.getReceiver ?? getInternalNotificationEmail;

  const lead = validateAndNormalizeDigitalSystemsReviewLead(body);

  const existing = await findReviewLeadBySubmissionId({ prisma: deps.prisma }, lead.submissionId);
  if (existing) {
    return {
      success: true,
      resultCategory: 'duplicate',
      id: existing.id,
      submissionId: existing.submissionId,
      notificationStatus: (existing.notificationStatus as 'sent' | 'failed' | 'pending') || 'pending',
    };
  }

  let saved;
  try {
    saved = await saveDigitalSystemsReviewLead({ prisma: deps.prisma }, lead);
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      const raced = await findReviewLeadBySubmissionId(
        { prisma: deps.prisma },
        lead.submissionId,
      );
      if (raced) {
        return {
          success: true,
          resultCategory: 'duplicate',
          id: raced.id,
          submissionId: raced.submissionId,
          notificationStatus: (raced.notificationStatus as 'sent' | 'failed' | 'pending') || 'pending',
        };
      }
    }
    throw error;
  }

  const notificationStatus = await attemptNotification(
    { prisma: deps.prisma, sendNotificationEmail, isEmailReady, getReceiver },
    lead,
    saved,
  );

  return {
    success: true,
    resultCategory: 'created',
    id: saved.id,
    submissionId: saved.submissionId,
    notificationStatus,
  };
}

/** Public HTTP success body — no internal notification or identifier fields. */
export function toPublicDigitalSystemsReviewResponse(
  result: SubmitDigitalSystemsReviewSuccess,
): { success: true; resultCategory: 'created' | 'duplicate' } {
  return {
    success: true,
    resultCategory: result.resultCategory,
  };
}

export {
  DigitalSystemsReviewValidationError,
  DigitalSystemsReviewHoneypotError,
};
