import type { PrismaClient } from '@prisma/client';
import type { SharedWebPresenceAuditReport } from '../types.ts';
import { getInternalNotificationEmail, isEmailConfigured, sendEmail } from '../../email/sendEmail.ts';
import { createSharedReport, getSharedReport } from '../share/shareReportService.ts';
import { resolvePublicToken } from '../share/extractPublicToken.ts';
import { assertValidAuditPublicToken } from '../leads/auditLeadRecord.ts';
import {
  AuditLeadValidationError,
  extractSanitizedAuditLeadContext,
  logAuditLeadEmailDelivery,
  validateAndNormalizeAuditLeadSubmission,
  type SanitizedAuditLeadContext,
} from '../leads/auditLeadRecord.ts';
import { formatSafeUtmFieldsForEmail } from '../leads/safeUtmFields.ts';
import { saveAuditLead } from '../leads/saveAuditLead.ts';
import {
  buildInternalLeadNotificationEmail,
  buildUserAuditReportEmail,
} from './auditReportEmailTemplates.ts';

const IN_DEPTH_AUDIT_URL =
  'https://uk.primewayz.com/contact-us?utm_source=audit_email&utm_medium=email&utm_campaign=web_presence_audit_email&utm_content=in_depth_cta#book-call';

/** @deprecated Use AuditLeadValidationError */
export { AuditLeadValidationError as EmailReportValidationError } from '../leads/auditLeadRecord.ts';

export type EmailReportRequestBody = Record<string, unknown>;

export type EmailDeliveryStatus = 'sent' | 'partial' | 'skipped' | 'failed';

export type EmailReportResult = {
  success: true;
  shareUrl: string;
  publicToken: string;
  leadId: string;
  leadStorage: 'database' | 'file';
  emailsSent: {
    user: boolean;
    internal: boolean;
  };
  emailDeliveryStatus: EmailDeliveryStatus;
  emailDeliveryMessage: string;
};

async function resolveShareContext(
  body: EmailReportRequestBody,
  siteUrl: string,
): Promise<{ publicToken: string; shareUrl: string }> {
  let publicToken = resolvePublicToken({
    publicToken: body.publicToken,
    shareUrl: body.shareUrl,
  });

  if (!publicToken && body.report && typeof body.report === 'object') {
    const created = await createSharedReport(body.report, siteUrl);
    publicToken = created.publicToken;
    assertValidAuditPublicToken(publicToken);
    return {
      publicToken,
      shareUrl: created.shareUrl,
    };
  }

  if (!publicToken) {
    throw new AuditLeadValidationError('A valid shared report link is required.');
  }

  assertValidAuditPublicToken(publicToken);

  const existing = await getSharedReport(publicToken);
  if (!existing) {
    throw new AuditLeadValidationError('Shared report not found. Please create a share link first.');
  }

  const normalizedSiteUrl = siteUrl.replace(/\/$/, '');
  return {
    publicToken,
    shareUrl: `${normalizedSiteUrl}/web-presence-audit/report/${publicToken}`,
  };
}

function buildLeadContext(
  shareContext: { publicToken: string; shareUrl: string },
  report: SharedWebPresenceAuditReport,
): SanitizedAuditLeadContext {
  return extractSanitizedAuditLeadContext({
    publicToken: shareContext.publicToken,
    shareUrl: shareContext.shareUrl,
    websiteUrl: report.profile.websiteUrl?.trim() || report.metadata.auditedUrl,
    businessName: report.profile.businessName?.trim() || 'Unknown business',
    businessType: report.profile.businessType?.trim() || 'Not provided',
    score: typeof report.score === 'number' ? report.score : null,
    scoreLabel: report.label?.trim() || 'Unknown',
  });
}

async function deliverAuditEmails(input: {
  submission: ReturnType<typeof validateAndNormalizeAuditLeadSubmission>;
  shareUrl: string;
  report: SharedWebPresenceAuditReport;
}): Promise<{ user: boolean; internal: boolean; status: EmailDeliveryStatus; message: string }> {
  if (!isEmailConfigured()) {
    return {
      user: false,
      internal: false,
      status: 'skipped',
      message: 'Lead saved. Email delivery is not configured on this server.',
    };
  }

  const userEmail = buildUserAuditReportEmail({
    recipientName: input.submission.name,
    shareUrl: input.shareUrl,
    report: input.report,
    inDepthAuditUrl: IN_DEPTH_AUDIT_URL,
  });

  let userSent = false;
  let internalSent = false;

  try {
    await sendEmail({
      to: input.submission.email,
      subject: userEmail.subject,
      html: userEmail.html,
      text: userEmail.text,
      replyTo: getInternalNotificationEmail() || undefined,
    });
    userSent = true;
  } catch (error) {
    console.error('[audit-lead] user email delivery failed');
    return {
      user: false,
      internal: false,
      status: 'failed',
      message: 'Lead saved, but the report email could not be sent. Please try again later.',
    };
  }

  const internalRecipient = getInternalNotificationEmail();
  if (internalRecipient) {
    try {
      const internalEmail = buildInternalLeadNotificationEmail({
        name: input.submission.name,
        email: input.submission.email,
        phone: input.submission.phone,
        message: input.submission.message,
        reminderOptIn: input.submission.reminderOptIn,
        shareUrl: input.shareUrl,
        report: input.report,
        utmSummary: formatSafeUtmFieldsForEmail(input.submission.utm),
      });

      await sendEmail({
        to: internalRecipient,
        subject: internalEmail.subject,
        html: internalEmail.html,
        text: internalEmail.text,
        replyTo: input.submission.email,
      });
      internalSent = true;
    } catch (error) {
      console.error('[audit-lead] internal notification delivery failed');
      return {
        user: userSent,
        internal: false,
        status: 'partial',
        message: 'Lead saved and report emailed to you. Internal notification could not be sent.',
      };
    }
  }

  return {
    user: userSent,
    internal: internalSent,
    status: 'sent',
    message: internalSent
      ? 'Lead saved and report emailed successfully.'
      : 'Lead saved and report emailed to you.',
  };
}

export async function emailAuditReport(
  prisma: PrismaClient,
  body: EmailReportRequestBody,
  siteUrl: string,
): Promise<EmailReportResult> {
  const submission = validateAndNormalizeAuditLeadSubmission(body);
  const shareContext = await resolveShareContext(body, siteUrl);
  const sharedRecord = await getSharedReport(shareContext.publicToken);

  if (!sharedRecord) {
    throw new AuditLeadValidationError('Shared report not found.');
  }

  const report = sharedRecord.report;
  const leadContext = buildLeadContext(shareContext, report);

  const leadResult = await saveAuditLead(prisma, {
    submission,
    context: leadContext,
  });

  const emailDelivery = await deliverAuditEmails({
    submission,
    shareUrl: shareContext.shareUrl,
    report,
  });

  logAuditLeadEmailDelivery(emailDelivery.status, leadResult.id);

  return {
    success: true,
    shareUrl: shareContext.shareUrl,
    publicToken: shareContext.publicToken,
    leadId: leadResult.id,
    leadStorage: leadResult.storage,
    emailsSent: {
      user: emailDelivery.user,
      internal: emailDelivery.internal,
    },
    emailDeliveryStatus: emailDelivery.status,
    emailDeliveryMessage: emailDelivery.message,
  };
}
