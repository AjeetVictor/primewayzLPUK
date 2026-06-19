import type { AuditContext, AuditSignal, WebPresenceAuditReport } from '../types.ts';
import { buildAuditBenchmark } from '../benchmark/buildAuditBenchmark.ts';
import { buildAuditDiagnostics } from './buildAuditDiagnostics.ts';
import { scoreAudit } from '../scoring/scoreAudit.ts';
import { getScoreBand, summaryForScore } from '../scoreBands.ts';
import { buildAuditProfile } from './buildAuditProfile.ts';

export function buildAuditReport(signals: AuditSignal[], context: AuditContext): WebPresenceAuditReport {
  const { crawl, input } = context;
  const { score, checks } = scoreAudit(signals);
  const notVerified = signals
    .filter((signal) => signal.status === 'not_verified')
    .flatMap((signal) => signal.evidence.map((evidence) => evidence.label));

  const label = getScoreBand(score).label;
  const profile = buildAuditProfile(context);
  const diagnostics = buildAuditDiagnostics(context);

  return {
    score,
    label,
    summary: summaryForScore(score),
    checks,
    notVerified: [...new Set(notVerified)],
    profile,
    metadata: {
      auditedUrl: crawl.auditedUrl,
      pagesCrawled: crawl.pages.filter((page) => page.ok).length,
      pagesAttempted: crawl.pagesAttempted,
      generatedAt: new Date().toISOString(),
      version: 'web-presence-audit-v1',
    },
    benchmark: buildAuditBenchmark({
      score,
      label,
      checks,
      businessType: input.businessType,
      targetCountry: input.targetCountry,
      location: input.location,
      businessName: input.businessName,
      websiteUrl: input.websiteUrl,
    }),
    ...diagnostics,
  };
}
