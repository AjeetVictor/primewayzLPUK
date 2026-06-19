import type { AuditContext, AuditSignal, WebPresenceAuditReport } from '../types.ts';
import { scoreAudit } from '../scoring/scoreAudit.ts';
import { getScoreBand, summaryForScore } from '../scoreBands.ts';
import { buildAuditProfile } from './buildAuditProfile.ts';

export function buildAuditReport(signals: AuditSignal[], context: AuditContext): WebPresenceAuditReport {
  const { crawl } = context;
  const { score, checks } = scoreAudit(signals);
  const notVerified = signals
    .filter((signal) => signal.status === 'not_verified')
    .flatMap((signal) => signal.evidence.map((evidence) => evidence.label));

  return {
    score,
    label: getScoreBand(score).label,
    summary: summaryForScore(score),
    checks,
    notVerified: [...new Set(notVerified)],
    profile: buildAuditProfile(context),
    metadata: {
      auditedUrl: crawl.auditedUrl,
      pagesCrawled: crawl.pages.filter((page) => page.ok).length,
      pagesAttempted: crawl.pagesAttempted,
      generatedAt: new Date().toISOString(),
      version: 'web-presence-audit-v1',
    },
  };
}
