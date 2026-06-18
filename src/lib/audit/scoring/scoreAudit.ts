import { CATEGORY_CONFIG, CATEGORY_ORDER } from './scoringConfig.ts';
import type { AuditCheck, AuditCheckStatus, AuditSignal } from '../types.ts';

function statusForSignals(signals: AuditSignal[], points: number, maxPoints: number): AuditCheckStatus {
  const verifiable = signals.filter((signal) => signal.status !== 'not_verified');
  if (!verifiable.length) return 'not_verified';
  const ratio = maxPoints > 0 ? points / maxPoints : 0;
  if (ratio >= 0.8) return 'good';
  if (ratio >= 0.45) return 'partial';
  return 'gap';
}

function explanationForStatus(name: string, status: AuditCheckStatus): string {
  if (status === 'good') return `${name} signals are well represented across the audited pages.`;
  if (status === 'partial') return `${name} has a useful base, but several signals need improvement.`;
  if (status === 'not_verified') return `${name} could not be verified in this audit.`;
  return `${name} has important gaps that may reduce visibility, trust, or enquiries.`;
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
      explanation: explanationForStatus(config.name, status),
      evidence: evidence.length
        ? evidence
        : [{
            source: 'website' as const,
            label: `No positive ${config.name.toLowerCase()} signals were detected in the audited pages.`,
          }],
      recommendations: [...new Set(categorySignals.flatMap((signal) => signal.recommendations))],
    };
  });

  return {
    score: Math.round(checks.reduce((total, check) => total + check.points, 0)),
    checks,
  };
}
