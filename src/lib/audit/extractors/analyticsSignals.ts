import type { AuditContext, AuditSignal } from '../types.ts';

const TRACKING_VERIFY_GA =
  'Verify that Google Analytics and key enquiry-conversion events are configured and recording correctly.';
const TRACKING_TAG_MANAGER =
  'Use a tag manager where multiple marketing tags require central governance.';
const TRACKING_META =
  'Add Meta Pixel only when Meta advertising is actively used.';
const TRACKING_LINKEDIN =
  'Add the LinkedIn Insight Tag only when LinkedIn campaigns or conversion audiences are in use.';

function coreTrackingSignal(
  key: string,
  pattern: RegExp,
  maxPoints: number,
  foundLabel: string,
  missingRecommendation: string,
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
    evidence: found ? [{ source: 'website', url: context.homepage?.finalUrl, label: foundLabel }] : [],
    recommendations: found ? [] : [missingRecommendation],
  };
}

/**
 * Optional advertising pixels are evidence-only.
 * Their absence must not reduce the analytics score unless the audit has
 * positive evidence that those advertising platforms are being used.
 */
function optionalAdPlatformSignal(
  key: string,
  pattern: RegExp,
  foundLabel: string,
  conditionalRecommendation: string,
  context: AuditContext,
): AuditSignal {
  const found = pattern.test(context.combinedHtml);
  return {
    key,
    category: 'analytics-readiness',
    status: found ? 'found' : 'missing',
    confidence: 0.9,
    points: 0,
    maxPoints: 0,
    evidence: found ? [{ source: 'website', url: context.homepage?.finalUrl, label: foundLabel }] : [],
    // Conditional tip only — never score-critical on its own.
    recommendations: found ? [] : [conditionalRecommendation],
  };
}

export function extractAnalyticsSignals(context: AuditContext): AuditSignal[] {
  const coreSignals = [
    coreTrackingSignal(
      'analytics-ga',
      /googletagmanager\.com\/gtag\/js|google-analytics\.com|gtag\s*\(/i,
      3,
      'Google Analytics or gtag was detected in the audited HTML.',
      TRACKING_VERIFY_GA,
      context,
    ),
    coreTrackingSignal(
      'analytics-gtm',
      /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/i,
      2,
      'Google Tag Manager was detected in the audited HTML.',
      TRACKING_TAG_MANAGER,
      context,
    ),
  ];

  const optionalSignals = [
    optionalAdPlatformSignal(
      'analytics-meta',
      /connect\.facebook\.net|fbq\s*\(/i,
      'Meta Pixel was detected in the audited HTML.',
      TRACKING_META,
      context,
    ),
    optionalAdPlatformSignal(
      'analytics-linkedin',
      /snap\.licdn\.com|linkedin insight|_linkedin_partner_id/i,
      'LinkedIn Insight Tag was detected in the audited HTML.',
      TRACKING_LINKEDIN,
      context,
    ),
  ];

  const hasCoreGap = coreSignals.some((signal) => signal.status === 'missing');
  // Keep optional platform tips grouped with a weak analytics finding only.
  // Do not surface them when core analytics signals already look complete.
  // scoreAudit owns the final ordered canonical analytics action list for gap/partial.
  if (!hasCoreGap) {
    return [
      ...coreSignals,
      ...optionalSignals.map((signal) => ({ ...signal, recommendations: [] as string[] })),
    ];
  }

  return [...coreSignals, ...optionalSignals];
}
