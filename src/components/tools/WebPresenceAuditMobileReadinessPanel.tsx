import { AlertTriangle, CheckCircle2, Smartphone } from 'lucide-react';
import type { WebPresenceAuditMobileReadiness } from '../../lib/audit/types';
import { AuditInfoTooltip } from './AuditInfoTooltip';

type WebPresenceAuditMobileReadinessPanelProps = {
  mobileReadiness: WebPresenceAuditMobileReadiness;
  scoreBand?: string;
  scoreLabel?: string;
  ctaLocation?: string;
};

const statusStyles: Record<WebPresenceAuditMobileReadiness['status'], string> = {
  strong: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  workable: 'bg-blue-50 text-blue-800 border-blue-200',
  needs_review: 'bg-amber-50 text-amber-800 border-amber-200',
  not_verified: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function WebPresenceAuditMobileReadinessPanel({
  mobileReadiness,
  scoreBand,
  scoreLabel,
  ctaLocation,
}: WebPresenceAuditMobileReadinessPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Mobile readiness</p>
            <div className="mt-2 flex items-center gap-1">
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Mobile-readiness indicators</h2>
              <AuditInfoTooltip
                categoryId="mobile-readiness"
                title="Mobile-readiness indicators"
                checked="Responsive viewport and visible mobile-oriented page signals available in public HTML."
                whyItMatters="A usable mobile foundation helps visitors understand the page and reach an enquiry action."
                goodLooksLike="Responsive content, clear navigation, readable layouts, and accessible enquiry routes."
                notVerified="Real-device rendering, interaction testing, Core Web Vitals, and accessibility compliance."
                scoreBand={scoreBand}
                scoreLabel={scoreLabel}
                ctaLocation={ctaLocation}
              />
            </div>
            <p className="mt-2 text-sm text-slate-600">{mobileReadiness.label}</p>
          </div>
        </div>
        <span className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${statusStyles[mobileReadiness.status]}`}>
          {mobileReadiness.status.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {mobileReadiness.signals.length > 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              Detected mobile signals
            </p>
            <ul className="mt-4 space-y-3">
              {mobileReadiness.signals.map((item) => (
                <li key={item} className="text-sm leading-6 text-slate-700">{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {mobileReadiness.concerns.length > 0 ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Concerns
            </p>
            <ul className="mt-4 space-y-3">
              {mobileReadiness.concerns.map((item) => (
                <li key={item} className="text-sm leading-6 text-slate-700">{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {mobileReadiness.recommendations.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Recommendations</p>
          <ul className="mt-3 space-y-2">
            {mobileReadiness.recommendations.map((item) => (
              <li key={item} className="text-sm leading-6 text-slate-700">{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        {mobileReadiness.disclaimer}
      </p>
    </section>
  );
}
