import { CATEGORY_CONFIG, CATEGORY_ORDER } from './scoringConfig.ts';
import type { AuditCategoryId, AuditCheck, AuditCheckStatus, AuditSignal } from '../types.ts';

const CATEGORY_EXPLANATIONS: Partial<Record<AuditCategoryId, Partial<Record<AuditCheckStatus, string>>>> = {
  'external-presence': {
    good: 'External presence signals are visible on the audited pages.',
    partial: 'Some external links were detected on the audited pages, but coverage is limited. Google and Bing search visibility were not verified in this free version.',
    gap: 'External links or presence signals were not detected on the audited pages. This does not confirm whether the business is absent from Google, Bing, social platforms, or directories.',
    not_verified: 'External search and directory visibility were not verified in this free version.',
  },
  'reviews-reputation': {
    good: 'Review, testimonial, or reputation signals were detected on the audited pages.',
    partial: 'Some reputation signals were detected on the audited pages, but coverage is limited.',
    gap: 'Review, testimonial, case study, or social-proof signals were not detected on the audited pages.',
    not_verified: 'External review platforms were not verified in this free version.',
  },
  'analytics-readiness': {
    good: 'Analytics or tracking tags were detected in the audited HTML.',
    partial: 'Some analytics or tracking signals were detected, but setup may be incomplete or partially hidden.',
    gap: 'Analytics or tracking tags were not detected in the audited HTML. Tags may still exist through consent tools, server-side tracking, or scripts not visible to this free checker.',
    not_verified: 'Analytics configuration was not verified beyond visible page HTML.',
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
    'Install GA4 or an equivalent analytics platform if tracking is not already configured.',
    'Use a tag manager where multiple marketing tags need governance.',
    'Verify analytics in GA4/GTM directly for confirmation.',
  ],
};

function statusForSignals(signals: AuditSignal[], points: number, maxPoints: number): AuditCheckStatus {
  const verifiable = signals.filter((signal) => signal.status !== 'not_verified');
  if (!verifiable.length) return 'not_verified';
  const ratio = maxPoints > 0 ? points / maxPoints : 0;
  if (ratio >= 0.8) return 'good';
  if (ratio >= 0.45) return 'partial';
  return 'gap';
}

function explanationForStatus(categoryId: AuditCategoryId, name: string, status: AuditCheckStatus): string {
  const custom = CATEGORY_EXPLANATIONS[categoryId]?.[status];
  if (custom) return custom;
  if (status === 'good') return `${name} signals are well represented across the audited pages.`;
  if (status === 'partial') {
    return `Some ${name.toLowerCase()} signals were detected on the audited pages, but several areas could be strengthened.`;
  }
  if (status === 'not_verified') return `${name} was not verified in this free version.`;
  return `Limited ${name.toLowerCase()} signals were detected in the audited pages. This is based on visible website content only and does not confirm absence elsewhere.`;
}

function fallbackEvidenceLabel(categoryId: AuditCategoryId, name: string): string {
  if (categoryId === 'external-presence') {
    return 'No visible external presence signals were detected in the audited pages.';
  }
  if (categoryId === 'reviews-reputation') {
    return 'No visible review or reputation signals were detected in the audited pages.';
  }
  if (categoryId === 'analytics-readiness') {
    return 'No analytics or tracking tags were detected in the audited HTML.';
  }
  return `No positive ${name.toLowerCase()} signals were detected in the audited pages.`;
}

function resolveRecommendations(
  categoryId: AuditCategoryId,
  status: AuditCheckStatus,
  signalRecommendations: string[],
): string[] {
  const recommendations = [...new Set(signalRecommendations)];
  if (recommendations.length === 0 && (status === 'gap' || status === 'partial')) {
    recommendations.push(...(CATEGORY_FALLBACK_RECOMMENDATIONS[categoryId] || []));
  }
  return recommendations;
}

export function scoreAudit(signals: AuditSignal[]): { score: number; checks: AuditCheck[] } {
  const checks = CATEGORY_ORDER.map((category) => {
    const config = CATEGORY_CONFIG[category];
    const categorySignals = signals.filter((signal) => signal.category === category);
    const points = Math.min(
      config.maxPoints,
      categorySignals.reduce((total, signal) => total + signal.points, 0),
    );
    const status = statusForSignals(categorySignals, points, config.maxPoints);
    const evidence = categorySignals.flatMap((signal) => signal.evidence).slice(0, 12);

    return {
      id: category,
      name: config.name,
      status,
      points,
      maxPoints: config.maxPoints,
      explanation: explanationForStatus(category, config.name, status),
      evidence: evidence.length
        ? evidence
        : [{
            source: 'website' as const,
            label: fallbackEvidenceLabel(category, config.name),
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
