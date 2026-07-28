import { formatAttributionSummary } from './attribution.ts';
import type { NormalizedDigitalSystemsReviewLead } from './validateReviewLead.ts';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type ReviewEmailLead = NormalizedDigitalSystemsReviewLead & {
  id?: number;
  createdAt?: Date;
  validationOutcome?: string | null;
  validationScore?: number | null;
  validationFlags?: string[] | null;
  duplicateConfidence?: string | null;
  duplicateOfLeadId?: number | null;
  slaDueAt?: Date | null;
};

function formatLondonDateTime(value: Date | null | undefined): string {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function buildSubject(lead: ReviewEmailLead): string {
  const parts: string[] = [];

  if (lead.validationOutcome === 'invalid_test') {
    parts.push('[Test/review required]');
  } else if (lead.validationOutcome === 'needs_review') {
    parts.push('[Review required]');
  } else {
    parts.push('[Valid lead]');
  }

  if (lead.duplicateConfidence === 'high' || lead.duplicateConfidence === 'possible') {
    parts.push('[Possible duplicate]');
  }

  if (lead.selectedPlanName) {
    parts.push(`[${lead.selectedPlanName}]`);
  }

  parts.push('Digital systems review request');
  return parts.join(' ');
}

export function buildDigitalSystemsReviewNotificationEmail(
  lead: ReviewEmailLead,
): { subject: string; html: string; text: string } {
  const subject = buildSubject(lead);
  const createdAt = lead.createdAt ?? new Date();
  const leadRef = lead.submissionId;
  const attribution = formatAttributionSummary(
    lead.firstTouchAttribution,
    lead.latestTouchAttribution,
  );

  const validationBadge =
    lead.validationOutcome === 'valid'
      ? 'Valid'
      : lead.validationOutcome === 'needs_review'
        ? 'Needs review'
        : lead.validationOutcome === 'invalid_test'
          ? 'Likely test/invalid'
          : 'Unassessed';

  const adminLink = `https://uk.primewayz.com/admin?tab=conversion`;

  const lines = [
    subject,
    '',
    `Validation: ${validationBadge}`,
    `Lead reference: ${leadRef}`,
    lead.id ? `Lead id: ${lead.id}` : null,
    `Name: ${lead.name}`,
    `Work email: ${lead.workEmail}`,
    `Company: ${lead.company}`,
    lead.website ? `Website: ${lead.website}` : null,
    `Service interest: ${lead.serviceInterest ?? lead.serviceArea}`,
    lead.selectedPlanName
      ? `Selected plan: ${lead.selectedPlanName} (${lead.selectedPlanSlug})`
      : null,
    lead.displayedPrice ? `Displayed price: ${lead.displayedPrice}` : null,
    lead.billingPeriod ? `Billing period: ${lead.billingPeriod}` : null,
    lead.pricingPolicyVersion ? `Pricing policy version: ${lead.pricingPolicyVersion}` : null,
    lead.recommendedNextStepCommercial
      ? `Recommended next step: ${lead.recommendedNextStepCommercial}`
      : `Preferred next step: ${lead.preferredNextStep}`,
    lead.journeyType ? `Journey type: ${lead.journeyType}` : null,
    `Source form/location: ${lead.sourceLocation}`,
    lead.sourcePagePath ? `Source page: ${lead.sourcePagePath}` : null,
    lead.sourceSection ? `Source section: ${lead.sourceSection}` : null,
    lead.landingPage ? `Landing page: ${lead.landingPage}` : null,
    lead.referrer ? `Referrer: ${lead.referrer}` : null,
    `Created (Europe/London): ${formatLondonDateTime(createdAt)}`,
    lead.slaDueAt ? `SLA due (Europe/London): ${formatLondonDateTime(lead.slaDueAt)}` : null,
    lead.chatSessionId ? `Chat journey reference: ${lead.chatSessionId}` : null,
    lead.journeyReference ? `Journey reference: ${lead.journeyReference}` : null,
    lead.duplicateConfidence && lead.duplicateConfidence !== 'none'
      ? `Duplicate warning: ${lead.duplicateConfidence}${lead.duplicateOfLeadId ? ` (linked to lead #${lead.duplicateOfLeadId})` : ''}`
      : null,
    lead.validationFlags?.length
      ? `Validation flags: ${lead.validationFlags.join(', ')}`
      : null,
    lead.validationScore != null ? `Validation score: ${lead.validationScore}` : null,
    '',
    'Attribution summary:',
    attribution,
    '',
    'Context:',
    lead.context,
    '',
    `Lead management: ${adminLink}`,
  ].filter((line): line is string => line !== null);

  const text = lines.join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.5;">
  <h1 style="font-size:18px;">${escapeHtml(subject)}</h1>
  <p><strong>Validation:</strong> ${escapeHtml(validationBadge)}</p>
  <p><strong>Lead reference:</strong> ${escapeHtml(leadRef)}</p>
  ${lead.id ? `<p><strong>Lead id:</strong> ${lead.id}</p>` : ''}
  <p><strong>Name:</strong> ${escapeHtml(lead.name)}</p>
  <p><strong>Work email:</strong> ${escapeHtml(lead.workEmail)}</p>
  <p><strong>Company:</strong> ${escapeHtml(lead.company)}</p>
  ${lead.website ? `<p><strong>Website:</strong> ${escapeHtml(lead.website)}</p>` : ''}
  <p><strong>Service interest:</strong> ${escapeHtml(lead.serviceInterest ?? lead.serviceArea)}</p>
  ${lead.selectedPlanName ? `<p><strong>Selected plan:</strong> ${escapeHtml(lead.selectedPlanName)} (${escapeHtml(lead.selectedPlanSlug ?? '')})</p>` : ''}
  ${lead.displayedPrice ? `<p><strong>Displayed price:</strong> ${escapeHtml(lead.displayedPrice)}</p>` : ''}
  ${lead.billingPeriod ? `<p><strong>Billing period:</strong> ${escapeHtml(lead.billingPeriod)}</p>` : ''}
  ${lead.pricingPolicyVersion ? `<p><strong>Pricing policy version:</strong> ${escapeHtml(lead.pricingPolicyVersion)}</p>` : ''}
  <p><strong>Recommended next step:</strong> ${escapeHtml(lead.recommendedNextStepCommercial ?? lead.preferredNextStep)}</p>
  ${lead.journeyType ? `<p><strong>Journey type:</strong> ${escapeHtml(lead.journeyType)}</p>` : ''}
  <p><strong>Source location:</strong> ${escapeHtml(lead.sourceLocation)}</p>
  ${lead.sourcePagePath ? `<p><strong>Source page:</strong> ${escapeHtml(lead.sourcePagePath)}</p>` : ''}
  ${lead.sourceSection ? `<p><strong>Source section:</strong> ${escapeHtml(lead.sourceSection)}</p>` : ''}
  ${lead.landingPage ? `<p><strong>Landing page:</strong> ${escapeHtml(lead.landingPage)}</p>` : ''}
  ${lead.referrer ? `<p><strong>Referrer:</strong> ${escapeHtml(lead.referrer)}</p>` : ''}
  <p><strong>Created (Europe/London):</strong> ${escapeHtml(formatLondonDateTime(createdAt))}</p>
  ${lead.slaDueAt ? `<p><strong>SLA due (Europe/London):</strong> ${escapeHtml(formatLondonDateTime(lead.slaDueAt))}</p>` : ''}
  ${lead.chatSessionId ? `<p><strong>Chat journey reference:</strong> ${escapeHtml(lead.chatSessionId)}</p>` : ''}
  ${lead.duplicateConfidence && lead.duplicateConfidence !== 'none'
    ? `<p style="color:#b45309;"><strong>Duplicate warning:</strong> ${escapeHtml(lead.duplicateConfidence)}${lead.duplicateOfLeadId ? ` (linked to lead #${lead.duplicateOfLeadId})` : ''}</p>`
    : ''}
  ${lead.validationFlags?.length
    ? `<p><strong>Validation flags:</strong> ${escapeHtml(lead.validationFlags.join(', '))}</p>`
    : ''}
  <p><strong>Attribution summary:</strong></p>
  <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(attribution)}</pre>
  <p><strong>Context:</strong></p>
  <p style="white-space:pre-wrap;">${escapeHtml(lead.context)}</p>
  <p><a href="${escapeHtml(adminLink)}">Open lead management dashboard</a></p>
</body>
</html>`;

  return { subject, html, text };
}

/** Map raw email errors to a short non-sensitive operational code. */
export function redactNotificationErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lower = message.toLowerCase();

  if (lower.includes('not configured')) return 'email_not_configured';
  if (lower.includes('timeout') || lower.includes('etimedout')) return 'email_timeout';
  if (lower.includes('econnrefused') || lower.includes('connect')) return 'email_connection';
  if (lower.includes('auth') || lower.includes('credentials')) return 'email_auth';
  if (lower.includes('recipient') || lower.includes('envelope')) return 'email_recipient';
  return 'email_send_failed';
}

export const DIGITAL_SYSTEMS_REVIEW_EMAIL_SUBJECT = 'Digital systems review request' as const;
