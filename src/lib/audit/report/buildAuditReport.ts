import type { AuditCrawlResult, AuditSignal, WebPresenceAuditReport } from '../types.ts';
import { scoreAudit } from '../scoring/scoreAudit.ts';

function labelForScore(score: number): string {
  if (score >= 80) return 'Strong web presence';
  if (score >= 60) return 'Moderate web presence';
  if (score >= 40) return 'Visibility gaps need attention';
  return 'High-risk web presence';
}

function summaryForScore(score: number): string {
  if (score >= 80) return 'The audited website has a strong foundation. Focus on the remaining evidence-based recommendations.';
  if (score >= 60) return 'The website has a workable foundation, with several opportunities to improve trust, visibility, and lead capture.';
  if (score >= 40) return 'The audit found meaningful gaps that may make the business harder to discover or trust online.';
  return 'The website has high-priority gaps across core visibility, trust, or enquiry signals.';
}

export function buildAuditReport(signals: AuditSignal[], crawl: AuditCrawlResult): WebPresenceAuditReport {
  const { score, checks } = scoreAudit(signals);
  const notVerified = signals
    .filter((signal) => signal.status === 'not_verified')
    .flatMap((signal) => signal.evidence.map((evidence) => evidence.label));

  return {
    score,
    label: labelForScore(score),
    summary: summaryForScore(score),
    checks,
    notVerified: [...new Set(notVerified)],
    metadata: {
      auditedUrl: crawl.auditedUrl,
      pagesCrawled: crawl.pages.filter((page) => page.ok).length,
      pagesAttempted: crawl.pagesAttempted,
      generatedAt: new Date().toISOString(),
      version: 'web-presence-audit-v1',
    },
  };
}
