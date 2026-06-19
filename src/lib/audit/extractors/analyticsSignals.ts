import type { AuditContext, AuditSignal } from '../types.ts';

function trackingSignal(
  key: string,
  pattern: RegExp,
  maxPoints: number,
  label: string,
  recommendation: string,
  context: AuditContext,
): AuditSignal {
  const found = pattern.test(context.combinedHtml);
  return {
    key,
    category: 'analytics-readiness',
    status: found ? 'found' : 'missing',
    confidence: 0.98,
    points: found ? maxPoints : 0,
    maxPoints,
    evidence: found ? [{ source: 'website', url: context.homepage?.finalUrl, label }] : [],
    recommendations: found ? [] : [recommendation],
  };
}

export function extractAnalyticsSignals(context: AuditContext): AuditSignal[] {
  return [
    trackingSignal('analytics-ga', /googletagmanager\.com\/gtag\/js|google-analytics\.com|gtag\s*\(/i, 2, 'Google Analytics or gtag was detected in the audited HTML.', 'Install GA4 or an equivalent analytics platform if tracking is not already configured.', context),
    trackingSignal('analytics-gtm', /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/i, 1, 'Google Tag Manager was detected in the audited HTML.', 'Use a tag manager where multiple marketing tags need governance.', context),
    trackingSignal('analytics-meta', /connect\.facebook\.net|fbq\s*\(/i, 1, 'Meta Pixel was detected in the audited HTML.', 'Add Meta Pixel only if Meta advertising is actively measured.', context),
    trackingSignal('analytics-linkedin', /snap\.licdn\.com|linkedin insight|_linkedin_partner_id/i, 1, 'LinkedIn Insight Tag was detected in the audited HTML.', 'Add the LinkedIn Insight Tag if LinkedIn campaigns are in use.', context),
  ];
}
