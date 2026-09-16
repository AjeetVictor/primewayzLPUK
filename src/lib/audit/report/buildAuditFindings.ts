import type {
  AuditCategoryId,
  AuditFinding,
  AuditFindingSeverity,
  AuditSignal,
} from '../types.ts';

const CATEGORY_PURPOSE: Record<AuditCategoryId, string> = {
  'website-basics': 'A reachable, secure website is the foundation for discovery and enquiries.',
  'technical-seo': 'Search engines need clear, indexable page structure to understand the site.',
  'trust-signals': 'Visible identity and credential signals help visitors judge whether the business is credible.',
  'lead-capture': 'Clear calls to action and usable contact paths turn visits into enquiries.',
  'local-visibility': 'Consistent location and service-area signals support relevant local discovery.',
  'external-presence': 'Search rankings and third-party profiles require an authorised external data source.',
  'reviews-reputation': 'Specific proof reduces perceived risk and supports buying decisions.',
  'performance-ux': 'Mobile-ready, lightweight pages reduce friction for visitors.',
  'analytics-readiness': 'Measurement is needed to understand which activity produces enquiries.',
};

function titleFromKey(key: string): string {
  return key
    .replace(/^[^-]+-/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function severityFor(signal: AuditSignal): AuditFindingSeverity {
  if (signal.status === 'not_verified') return 'advisory';
  const impact = Math.max(0, signal.maxPoints - signal.points);
  if (signal.status === 'missing' && impact >= 3) return 'critical';
  if (signal.status === 'missing' && impact >= 2) return 'high';
  if (signal.status === 'missing') return 'medium';
  if (signal.status === 'partial') return impact >= 2 ? 'high' : 'medium';
  return 'low';
}

export function buildAuditFindings(signals: AuditSignal[]): AuditFinding[] {
  return signals.map((signal) => ({
    checkId: signal.key,
    category: signal.category,
    finding: signal.evidence[0]?.label || `${titleFromKey(signal.key)} was not detected in the audited pages.`,
    result: signal.status,
    severity: severityFor(signal),
    scoreImpact: Number(Math.max(0, signal.maxPoints - signal.points).toFixed(1)),
    whyItMatters: CATEGORY_PURPOSE[signal.category],
    evidence: signal.evidence,
    recommendation: signal.recommendations[0],
  }));
}
