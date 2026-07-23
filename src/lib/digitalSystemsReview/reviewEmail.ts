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
};

export const DIGITAL_SYSTEMS_REVIEW_EMAIL_SUBJECT =
  'New digital systems review request' as const;

export function buildDigitalSystemsReviewNotificationEmail(
  lead: ReviewEmailLead,
): { subject: string; html: string; text: string } {
  const subject = DIGITAL_SYSTEMS_REVIEW_EMAIL_SUBJECT;
  const createdAt = lead.createdAt ? lead.createdAt.toISOString() : new Date().toISOString();
  const leadRef = lead.submissionId;
  const attribution = formatAttributionSummary(
    lead.firstTouchAttribution,
    lead.latestTouchAttribution,
  );

  const lines = [
    subject,
    '',
    `Lead reference: ${leadRef}`,
    `Name: ${lead.name}`,
    `Work email: ${lead.workEmail}`,
    `Company: ${lead.company}`,
    lead.website ? `Website: ${lead.website}` : null,
    `Service area: ${lead.serviceArea}`,
    `Preferred next step: ${lead.preferredNextStep}`,
    `Source location: ${lead.sourceLocation}`,
    lead.landingPage ? `Landing page: ${lead.landingPage}` : null,
    lead.referrer ? `Referrer: ${lead.referrer}` : null,
    `Created at: ${createdAt}`,
    lead.chatSessionId ? `Chat journey reference: ${lead.chatSessionId}` : null,
    '',
    'Attribution summary:',
    attribution,
    '',
    'Context:',
    lead.context,
  ].filter((line): line is string => line !== null);

  const text = lines.join('\n');

  const chatRow = lead.chatSessionId
    ? `<p style="margin:0 0 12px;"><strong>Chat journey reference:</strong> ${escapeHtml(lead.chatSessionId)}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>${escapeHtml(subject)}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.5;">
  <h1 style="font-size:18px;">${escapeHtml(subject)}</h1>
  <p><strong>Lead reference:</strong> ${escapeHtml(leadRef)}</p>
  <p><strong>Name:</strong> ${escapeHtml(lead.name)}</p>
  <p><strong>Work email:</strong> ${escapeHtml(lead.workEmail)}</p>
  <p><strong>Company:</strong> ${escapeHtml(lead.company)}</p>
  ${lead.website ? `<p><strong>Website:</strong> ${escapeHtml(lead.website)}</p>` : ''}
  <p><strong>Service area:</strong> ${escapeHtml(lead.serviceArea)}</p>
  <p><strong>Preferred next step:</strong> ${escapeHtml(lead.preferredNextStep)}</p>
  <p><strong>Source location:</strong> ${escapeHtml(lead.sourceLocation)}</p>
  ${lead.landingPage ? `<p><strong>Landing page:</strong> ${escapeHtml(lead.landingPage)}</p>` : ''}
  ${lead.referrer ? `<p><strong>Referrer:</strong> ${escapeHtml(lead.referrer)}</p>` : ''}
  <p><strong>Created at:</strong> ${escapeHtml(createdAt)}</p>
  ${chatRow}
  <p><strong>Attribution summary:</strong></p>
  <pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(attribution)}</pre>
  <p><strong>Context:</strong></p>
  <p style="white-space:pre-wrap;">${escapeHtml(lead.context)}</p>
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
