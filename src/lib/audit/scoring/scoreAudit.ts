import { CATEGORY_CONFIG, CATEGORY_ORDER } from './scoringConfig.ts';
import type { AuditCategoryId, AuditCheck, AuditCheckStatus, AuditSignal } from '../types.ts';

const EXTERNAL_PRESENCE_DETECTED_EXPLANATION =
  'Some external presence signals were detected on the audited pages. Google, Bing, directory, and review-platform visibility are not verified in this free audit.';

const EXTERNAL_PRESENCE_NOT_DETECTED_EXPLANATION =
  'External links or presence signals were not detected on the audited pages. This does not confirm absence from Google, Bing, social platforms, or directories.';

const ANALYTICS_DETECTED_EXPLANATION =
  'Analytics technology was detected in the audited HTML. However, event accuracy, consent configuration and enquiry-conversion tracking could not be fully verified through this automated audit.';

const ANALYTICS_NOT_DETECTED_EXPLANATION =
  'Analytics or tracking tags were not detected in the audited HTML. Tags may still exist through consent tools, server-side tracking, or scripts not visible to this free checker.';

const ANALYTICS_PARTIAL_EXPLANATION =
  'Analytics technology was detected in the audited HTML. However, event accuracy, consent configuration and enquiry-conversion tracking could not be fully verified through this automated audit.';

const CATEGORY_EXPLANATIONS: Partial<Record<AuditCategoryId, Partial<Record<AuditCheckStatus, string>>>> = {
  'external-presence': {
    good: EXTERNAL_PRESENCE_DETECTED_EXPLANATION,
    partial: EXTERNAL_PRESENCE_DETECTED_EXPLANATION,
    gap: EXTERNAL_PRESENCE_NOT_DETECTED_EXPLANATION,
    not_verified: 'External search and directory visibility were not verified in this free audit.',
  },
  'reviews-reputation': {
    good: 'Review, testimonial, or reputation signals were detected on the audited pages.',
    partial: 'Some reputation signals were detected on the audited pages, but coverage is limited.',
    gap: 'Review, testimonial, case study, or social-proof signals were not detected on the audited pages.',
    not_verified: 'External review platforms were not verified in this free version.',
  },
  'analytics-readiness': {
    good: ANALYTICS_DETECTED_EXPLANATION,
    partial: ANALYTICS_PARTIAL_EXPLANATION,
    gap: ANALYTICS_NOT_DETECTED_EXPLANATION,
    not_verified: 'Analytics configuration was not verified beyond visible page HTML in this free audit.',
  },
  'local-visibility': {
    good: 'UK / local visibility signals are well represented across the audited pages.',
    partial: 'Some UK / local visibility signals were detected, but clearer city or service-area wording may help.',
    gap: 'No clear UK city or service-area signal was detected in the audited pages. This does not confirm whether the business serves a specific location.',
    not_verified: 'UK / local visibility could not be fully verified from the audited pages alone.',
  },
};

const CATEGORY_FALLBACK_RECOMMENDATIONS: Partial<Record<AuditCategoryId, string[]>> = {
  'external-presence': [
    'Add visible links to official social profiles or directory listings where relevant.',
    'Use a verified external search/provider audit to confirm Google, Bing, and directory visibility.',
  ],
  'reviews-reputation': [
    'Add visible testimonials, case studies, or review links if available.',
    'Connect review/profile sources later for external reputation verification.',
  ],
  'analytics-readiness': [
    'Verify that Google Analytics and key enquiry-conversion events are configured and recording correctly.',
    'Review cookie consent and consent-mode behaviour where applicable.',
    'Use a tag manager where multiple marketing tags require central governance.',
    'Add Meta Pixel only when Meta advertising is actively used.',
    'Add the LinkedIn Insight Tag only when LinkedIn campaigns or conversion audiences are in use.',
  ],
};

/** Natural good-state copy keyed by category — avoids awkward `${name} signals` duplication. */
const NATURAL_GOOD_EXPLANATIONS: Partial<Record<AuditCategoryId, string>> = {
  'website-basics': 'Core website and technical foundation signals are well represented across the audited pages.',
  'technical-seo': 'Technical SEO foundations are well represented across the audited pages.',
  'trust-signals': 'Trust signals are well represented across the audited pages.',
  'lead-capture': 'Lead-capture and enquiry-path signals are well represented across the audited pages.',
  'local-visibility': 'UK / local visibility signals are well represented across the audited pages.',
  'external-presence': EXTERNAL_PRESENCE_DETECTED_EXPLANATION,
  'reviews-reputation': 'Review, testimonial, or reputation signals were detected on the audited pages.',
  'performance-ux': 'Mobile and user-experience basics are well represented across the audited pages.',
  'analytics-readiness': ANALYTICS_DETECTED_EXPLANATION,
};

const NATURAL_PARTIAL_EXPLANATIONS: Partial<Record<AuditCategoryId, string>> = {
  'website-basics': 'Some core website foundation signals were detected, but several areas could be strengthened.',
  'technical-seo': 'Some technical SEO signals were detected on the audited pages, but several areas could be strengthened.',
  'trust-signals': 'Some trust signals were detected on the audited pages, but several areas could be strengthened.',
  'lead-capture': 'Some lead-capture signals were detected on the audited pages, but several areas could be strengthened.',
  'performance-ux': 'Some mobile and user-experience basics were detected, but several areas could be strengthened.',
};

function statusForSignals(signals: AuditSignal[], points: number, maxPoints: number): AuditCheckStatus {
  const verifiable = signals.filter((signal) => signal.status !== 'not_verified');
  if (!verifiable.length) return 'not_verified';
  const ratio = maxPoints > 0 ? points / maxPoints : 0;
  if (ratio >= 0.8) return 'good';
  if (ratio >= 0.45) return 'partial';
  return 'gap';
}

function hasDetectedCategorySignals(categorySignals: AuditSignal[]): boolean {
  return categorySignals.some((signal) => signal.points > 0 || signal.status === 'found' || signal.status === 'partial');
}

function explanationForStatus(
  categoryId: AuditCategoryId,
  name: string,
  status: AuditCheckStatus,
  categorySignals: AuditSignal[],
): string {
  const hasDetected = hasDetectedCategorySignals(categorySignals);

  if (categoryId === 'external-presence') {
    return hasDetected ? EXTERNAL_PRESENCE_DETECTED_EXPLANATION : EXTERNAL_PRESENCE_NOT_DETECTED_EXPLANATION;
  }

  if (categoryId === 'analytics-readiness') {
    if (!hasDetected) return ANALYTICS_NOT_DETECTED_EXPLANATION;
    if (status === 'good') return ANALYTICS_DETECTED_EXPLANATION;
    return ANALYTICS_PARTIAL_EXPLANATION;
  }

  const custom = CATEGORY_EXPLANATIONS[categoryId]?.[status];
  if (custom) return custom;
  if (status === 'good') {
    return NATURAL_GOOD_EXPLANATIONS[categoryId]
      || `${name} are well represented across the audited pages.`;
  }
  if (status === 'partial') {
    return NATURAL_PARTIAL_EXPLANATIONS[categoryId]
      || `Some ${name.toLowerCase()} signals were detected on the audited pages, but several areas could be strengthened.`;
  }
  if (status === 'not_verified') return `${name} was not verified in this free version.`;
  return `Limited ${name.toLowerCase()} signals were detected in the audited pages. This is based on visible website content only and does not confirm absence elsewhere.`;
}

function fallbackEvidenceLabel(categoryId: AuditCategoryId, name: string, categorySignals: AuditSignal[]): string {
  if (categoryId === 'external-presence') {
    return hasDetectedCategorySignals(categorySignals)
      ? 'External presence signals were detected in the audited pages.'
      : 'No visible external presence signals were detected in the audited pages.';
  }
  if (categoryId === 'reviews-reputation') {
    return 'No visible review or reputation signals were detected in the audited pages.';
  }
  if (categoryId === 'analytics-readiness') {
    return hasDetectedCategorySignals(categorySignals)
      ? 'Analytics technology was detected in the audited HTML.'
      : 'No analytics or tracking tags were detected in the audited HTML.';
  }
  return `No positive ${name.toLowerCase()} signals were detected in the audited pages.`;
}

function resolveRecommendations(
  categoryId: AuditCategoryId,
  status: AuditCheckStatus,
  signalRecommendations: string[],
): string[] {
  // Tracking readiness always uses the ordered canonical action set so GA
  // verification and consent review lead Meta/LinkedIn tips when the category is weak.
  if (categoryId === 'analytics-readiness' && (status === 'gap' || status === 'partial')) {
    return [...(CATEGORY_FALLBACK_RECOMMENDATIONS['analytics-readiness'] || [])];
  }

  // Keep related tips grouped on the category — never flatten into separate findings here.
  const recommendations = [...new Set(signalRecommendations.map((item) => item.trim()).filter(Boolean))];
  if (recommendations.length === 0 && (status === 'gap' || status === 'partial')) {
    recommendations.push(...(CATEGORY_FALLBACK_RECOMMENDATIONS[categoryId] || []));
  }
  return recommendations;
}

/**
 * Optional advertising tags (maxPoints 0) must not influence scored totals.
 * Core analytics score comes only from scored signals such as GA / tag manager.
 */
function scoredPointsForCategory(categorySignals: AuditSignal[], maxPoints: number): number {
  const scored = categorySignals.reduce((total, signal) => {
    if (signal.maxPoints <= 0) return total;
    return total + signal.points;
  }, 0);
  return Math.min(maxPoints, scored);
}

export function scoreAudit(signals: AuditSignal[]): { score: number; checks: AuditCheck[] } {
  const checks = CATEGORY_ORDER.map((category) => {
    const config = CATEGORY_CONFIG[category];
    const categorySignals = signals.filter((signal) => signal.category === category);
    const points = scoredPointsForCategory(categorySignals, config.maxPoints);
    const status = statusForSignals(categorySignals, points, config.maxPoints);
    const evidence = categorySignals.flatMap((signal) => signal.evidence).slice(0, 12);

    return {
      id: category,
      name: config.name,
      status,
      points,
      maxPoints: config.maxPoints,
      explanation: explanationForStatus(category, config.name, status, categorySignals),
      evidence: evidence.length
        ? evidence
        : [{
            source: 'website' as const,
            label: fallbackEvidenceLabel(category, config.name, categorySignals),
          }],
      recommendations: resolveRecommendations(
        category,
        status,
        categorySignals.flatMap((signal) => signal.recommendations),
      ),
    };
  });

  return {
    score: Math.round(checks.reduce((total, check) => total + check.points, 0)),
    checks,
  };
}
