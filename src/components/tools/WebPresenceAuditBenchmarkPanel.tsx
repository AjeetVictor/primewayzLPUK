import { useState } from 'react';
import { ArrowUpRight, BarChart3, Check, Copy, TrendingDown, TrendingUp } from 'lucide-react';
import type { WebPresenceAuditBenchmark } from '../../lib/audit/types';
import { getScoreBand } from '../../lib/audit/scoreBands';
import { VERIFIED_VISIBILITY_AUDIT_CTA_URL } from '../../lib/audit/benchmark/constants';
import { trackEvent } from '../../lib/analytics';
import { AuditInfoTooltip } from './AuditInfoTooltip';

type WebPresenceAuditBenchmarkPanelProps = {
  benchmark: WebPresenceAuditBenchmark;
  businessType?: string;
  ctaLocation: string;
  score: number;
};

export function WebPresenceAuditBenchmarkPanel({
  benchmark,
  businessType,
  ctaLocation,
  score,
}: WebPresenceAuditBenchmarkPanelProps) {
  const [copied, setCopied] = useState(false);
  const scoreBand = getScoreBand(score);

  const copyBenchmarkSummary = async () => {
    try {
      await navigator.clipboard.writeText(benchmark.shareSummary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);

      trackEvent('web_presence_audit_benchmark_copied', {
        score_band: `${scoreBand.min}-${scoreBand.max}`,
        score_label: scoreBand.label,
        business_type: businessType || 'unknown',
        cta_location: ctaLocation,
      });
    } catch {
      // Clipboard unavailable — user can copy manually from the panel.
    }
  };

  return (
    <section className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Public-signal benchmark</p>
            <div className="mt-2 flex items-center gap-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-950">How your website compares</h2>
              <AuditInfoTooltip
                categoryId="benchmark"
                title="Public-signal benchmark"
                checked="The overall score band and visible strengths or gaps produced by the audit framework."
                whyItMatters="A consistent framework helps organise the public signals into a practical starting point."
                goodLooksLike="Important website signals are clearly visible across the audited pages."
                notVerified="Competitor performance, market averages, rankings, traffic, and authenticated platform data."
                scoreBand={`${scoreBand.min}-${scoreBand.max}`}
                scoreLabel={scoreBand.label}
                ctaLocation={ctaLocation}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">{benchmark.frameworkName}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={copyBenchmarkSummary}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy benchmark summary
            </>
          )}
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Benchmark band</p>
            <p className="mt-2 text-xl font-black text-slate-950">{benchmark.label}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{benchmark.helper}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:max-w-xs">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Sector context</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{benchmark.sector}</p>
          </div>
        </div>

        <p className="mt-5 text-sm leading-7 text-slate-600">{benchmark.sectorInsight}</p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-black uppercase tracking-[0.12em] text-emerald-800">Visible strengths</h3>
          </div>
          <ul className="mt-4 space-y-3">
            {benchmark.strengths.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-amber-700" />
            <h3 className="text-sm font-black uppercase tracking-[0.12em] text-amber-800">Improvement areas</h3>
          </div>
          <ul className="mt-4 space-y-3">
            {benchmark.improvementAreas.map((item) => (
              <li key={item} className="text-sm leading-6 text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-slate-700">
        {benchmark.disclaimer}
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h3 className="text-lg font-black text-slate-950">Need verified Google, Bing, GBP, and social platform insights?</h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          This free report checks visible public website signals. For deeper clarity, request an in-depth digital
          visibility audit with verified platform access, manual review, and business-specific recommendations.
        </p>
        <a
          href={VERIFIED_VISIBILITY_AUDIT_CTA_URL}
          className="mt-5 inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#000A2D] px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-950"
        >
          Request verified digital visibility audit
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
