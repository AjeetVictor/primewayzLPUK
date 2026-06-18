import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  FileSearch,
  Lightbulb,
} from 'lucide-react';
import type {
  AuditCheck,
  AuditCheckStatus,
  AuditEvidence,
  WebPresenceAuditReport,
} from '../../lib/audit/types';
import { TrackedLink } from '../common/TrackedLink';

type WebPresenceAuditResultProps = {
  report: Partial<WebPresenceAuditReport>;
};

const statusStyles: Record<AuditCheckStatus, { label: string; badge: string; icon: string }> = {
  good: {
    label: 'Good',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: 'text-emerald-600',
  },
  partial: {
    label: 'Partial',
    badge: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: 'text-amber-600',
  },
  gap: {
    label: 'Gap',
    badge: 'border-red-200 bg-red-50 text-red-800',
    icon: 'text-red-600',
  },
  not_verified: {
    label: 'Not verified',
    badge: 'border-slate-200 bg-slate-100 text-slate-700',
    icon: 'text-slate-500',
  },
};

function safeStatus(status?: string): AuditCheckStatus {
  if (status === 'good' || status === 'partial' || status === 'gap' || status === 'not_verified') {
    return status;
  }
  return 'not_verified';
}

function EvidenceList({ evidence }: { evidence?: AuditEvidence[] }) {
  if (!Array.isArray(evidence) || evidence.length === 0) return null;

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        <FileSearch className="h-4 w-4" />
        Evidence
      </p>
      <ul className="mt-3 space-y-2">
        {evidence.map((item, index) => (
          <li key={`${item.label}-${index}`} className="text-sm leading-6 text-slate-600">
            <span className="font-semibold text-slate-800">{item.label}</span>
            {item.value ? `: ${item.value}` : ''}
            {item.snippet ? <span className="mt-1 block text-xs text-slate-500">{item.snippet}</span> : null}
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                Source page
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendationList({ recommendations }: { recommendations?: string[] }) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) return null;

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        <Lightbulb className="h-4 w-4" />
        Recommendations
      </p>
      <ul className="mt-3 space-y-2">
        {recommendations.map((recommendation) => (
          <li key={recommendation} className="flex gap-2 text-sm leading-6 text-slate-600">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{recommendation}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CategoryCard({ check }: { check: Partial<AuditCheck> }) {
  const status = safeStatus(check.status);
  const styles = statusStyles[status];
  const points = Number.isFinite(check.points) ? Number(check.points) : 0;
  const maxPoints = Number.isFinite(check.maxPoints) ? Number(check.maxPoints) : 0;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-950">{check.name || 'Audit category'}</h3>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {points} / {maxPoints} points
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${styles.badge}`}>
          {styles.label}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {check.explanation || 'This category did not include an explanation.'}
      </p>

      <EvidenceList evidence={check.evidence} />
      <RecommendationList recommendations={check.recommendations} />
    </article>
  );
}

export function WebPresenceAuditResult({ report }: WebPresenceAuditResultProps) {
  const score = Math.max(0, Math.min(100, Number(report.score) || 0));
  const checks = Array.isArray(report.checks) ? report.checks : [];
  const notVerified = Array.isArray(report.notVerified) ? report.notVerified : [];
  const metadata = report.metadata;
  const generatedAt = metadata?.generatedAt ? new Date(metadata.generatedAt) : null;
  const validGeneratedAt = generatedAt && !Number.isNaN(generatedAt.getTime());

  return (
    <div className="mt-12 space-y-8" aria-live="polite">
      <section className="grid gap-6 border-y border-slate-200 py-8 lg:grid-cols-[0.34fr_0.66fr] lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Overall audit score</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-6xl font-black tracking-tight text-slate-950">{score}</span>
            <span className="pb-2 text-lg font-bold text-slate-400">/ 100</span>
          </div>
          <p className="mt-3 text-lg font-black text-slate-900">{report.label || 'Web presence audit'}</p>
        </div>

        <div>
          <p className="text-base leading-7 text-slate-600">
            {report.summary || 'The audit completed, but no summary was returned.'}
          </p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-[width] duration-500"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </section>

      {checks.length > 0 ? (
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">Audit categories</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Each category is rendered directly from the audit response, including its evidence and practical recommendations.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {checks.map((check, index) => (
              <CategoryCard key={check.id || `${check.name}-${index}`} check={check} />
            ))}
          </div>
        </section>
      ) : null}

      {notVerified.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <p className="flex items-center gap-2 text-sm font-black text-slate-900">
            <CircleHelp className="h-5 w-5 text-slate-500" />
            Not verified in this free version
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            {notVerified.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {metadata ? (
        <section className="grid gap-4 border-t border-slate-200 pt-6 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-bold text-slate-900">Audited URL</p>
            <p className="mt-1 break-all">{metadata.auditedUrl || 'Not returned'}</p>
          </div>
          <div>
            <p className="font-bold text-slate-900">Pages crawled</p>
            <p className="mt-1">{metadata.pagesCrawled ?? 0}</p>
          </div>
          <div>
            <p className="font-bold text-slate-900">Pages attempted</p>
            <p className="mt-1">{metadata.pagesAttempted ?? 0}</p>
          </div>
          <div>
            <p className="font-bold text-slate-900">Generated</p>
            <p className="mt-1">{validGeneratedAt ? generatedAt.toLocaleString('en-GB') : 'Not returned'}</p>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg bg-[#000A2D] px-6 py-8 text-white sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Practical next step</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Need help improving this score?</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              Primewayz UK can help you fix visibility, trust, SEO, and lead capture gaps found in this audit.
            </p>
          </div>
          <TrackedLink
            href="/#contact"
            ctaText="Book a free consultation"
            ctaLocation="web_presence_audit_result"
            eventType="book_call_click"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#000A2D] transition hover:bg-emerald-50"
          >
            Book a free consultation
          </TrackedLink>
        </div>
      </section>

      {checks.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          No category checks were returned by the audit.
        </p>
      ) : null}
    </div>
  );
}
