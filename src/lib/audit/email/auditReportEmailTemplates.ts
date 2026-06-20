import type { SharedWebPresenceAuditReport } from '../types.ts';
import { AUDIT_SHARE_SHORT_DISCLAIMER } from '../share/disclaimers.ts';

export type AuditReportEmailContext = {
  recipientName: string;
  shareUrl: string;
  report: SharedWebPresenceAuditReport;
  inDepthAuditUrl: string;
};

export type AuditLeadNotificationContext = {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  reminderOptIn: boolean;
  shareUrl: string;
  report: SharedWebPresenceAuditReport;
  utmSummary: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBusinessLine(report: SharedWebPresenceAuditReport): string {
  const parts = [
    report.profile.businessName?.trim(),
    report.profile.websiteUrl?.trim(),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : 'Your audited website';
}

function buildEmailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#000A2D;padding:20px 24px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">Primewayz UK</p>
              <p style="margin:6px 0 0;font-size:13px;color:#cbd5e1;">Web Presence Audit</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildUserAuditReportEmail(context: AuditReportEmailContext): { subject: string; html: string; text: string } {
  const { recipientName, shareUrl, report, inDepthAuditUrl } = context;
  const businessLine = formatBusinessLine(report);
  const score = report.score ?? 0;
  const label = report.label?.trim() || 'Web presence score';

  const subject = 'Your Primewayz UK Web Presence Audit Report';

  const text = [
    `Hello ${recipientName},`,
    '',
    'Thank you for using the Primewayz UK Web Presence Audit.',
    '',
    businessLine,
    `Score: ${score}/100 — ${label}`,
    '',
    `View your shared report: ${shareUrl}`,
    '',
    AUDIT_SHARE_SHORT_DISCLAIMER,
    '',
    `Request an in-depth audit: ${inDepthAuditUrl}`,
    '',
    'Primewayz UK',
  ].join('\n');

  const html = buildEmailShell(subject, `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hello ${escapeHtml(recipientName)},</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#334155;">
      Thank you for using the Primewayz UK Web Presence Audit. Here is a summary of your result.
    </p>
    <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(businessLine)}</p>
    <p style="margin:0 0 20px;font-size:28px;font-weight:800;color:#000A2D;line-height:1.2;">
      ${escapeHtml(String(score))}<span style="font-size:16px;color:#64748b;">/100</span>
    </p>
    <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#047857;">${escapeHtml(label)}</p>
    <p style="margin:0 0 24px;">
      <a href="${escapeHtml(shareUrl)}" style="display:inline-block;background:#000A2D;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:10px;">
        Open your shared report
      </a>
    </p>
    <p style="margin:0 0 20px;font-size:13px;line-height:1.7;color:#64748b;border-left:3px solid #cbd5e1;padding-left:12px;">
      ${escapeHtml(AUDIT_SHARE_SHORT_DISCLAIMER)}
    </p>
    <p style="margin:0;font-size:14px;line-height:1.7;color:#334155;">
      Want a deeper review with verified access and business-specific context?
      <a href="${escapeHtml(inDepthAuditUrl)}" style="color:#1d4ed8;font-weight:700;">Request an in-depth audit</a>.
    </p>
  `);

  return { subject, html, text };
}

export function buildInternalLeadNotificationEmail(context: AuditLeadNotificationContext): { subject: string; html: string; text: string } {
  const {
    name,
    email,
    phone,
    message,
    reminderOptIn,
    shareUrl,
    report,
    utmSummary,
  } = context;

  const websiteUrl = report.profile.websiteUrl?.trim() || report.metadata.auditedUrl;
  const score = report.score ?? 0;
  const label = report.label?.trim() || 'Unknown';
  const businessType = report.profile.businessType?.trim() || 'Not provided';

  const subject = 'New Web Presence Audit Lead';

  const text = [
    'New Web Presence Audit lead',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    phone ? `Phone: ${phone}` : null,
    `Website: ${websiteUrl}`,
    `Score: ${score}/100 — ${label}`,
    `Business type: ${businessType}`,
    `Share report: ${shareUrl}`,
    `30-day re-audit reminder: ${reminderOptIn ? 'Yes' : 'No'}`,
    message ? `Message: ${message}` : null,
    '',
    'Attribution:',
    utmSummary,
  ].filter(Boolean).join('\n');

  const html = buildEmailShell(subject, `
    <p style="margin:0 0 16px;font-size:18px;font-weight:800;color:#0f172a;">New Web Presence Audit Lead</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;line-height:1.7;color:#334155;">
      <tr><td style="padding:4px 0;font-weight:700;width:160px;">Name</td><td>${escapeHtml(name)}</td></tr>
      <tr><td style="padding:4px 0;font-weight:700;">Email</td><td><a href="mailto:${escapeHtml(email)}" style="color:#1d4ed8;">${escapeHtml(email)}</a></td></tr>
      ${phone ? `<tr><td style="padding:4px 0;font-weight:700;">Phone</td><td>${escapeHtml(phone)}</td></tr>` : ''}
      <tr><td style="padding:4px 0;font-weight:700;">Website</td><td>${escapeHtml(websiteUrl)}</td></tr>
      <tr><td style="padding:4px 0;font-weight:700;">Score</td><td>${escapeHtml(String(score))}/100 — ${escapeHtml(label)}</td></tr>
      <tr><td style="padding:4px 0;font-weight:700;">Business type</td><td>${escapeHtml(businessType)}</td></tr>
      <tr><td style="padding:4px 0;font-weight:700;">Share report</td><td><a href="${escapeHtml(shareUrl)}" style="color:#1d4ed8;">${escapeHtml(shareUrl)}</a></td></tr>
      <tr><td style="padding:4px 0;font-weight:700;">30-day reminder</td><td>${reminderOptIn ? 'Yes' : 'No'}</td></tr>
      ${message ? `<tr><td style="padding:4px 0;font-weight:700;vertical-align:top;">Message</td><td>${escapeHtml(message)}</td></tr>` : ''}
    </table>
    <p style="margin:20px 0 8px;font-size:13px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;">Attribution</p>
    <pre style="margin:0;font-size:13px;line-height:1.6;color:#475569;white-space:pre-wrap;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(utmSummary)}</pre>
  `);

  return { subject, html, text };
}
