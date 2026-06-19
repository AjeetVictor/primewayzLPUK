import { Layers3, Sparkles } from 'lucide-react';
import type { WebPresenceAuditClassification } from '../../lib/audit/types';

type WebPresenceAuditClassificationPanelProps = {
  classification: WebPresenceAuditClassification;
};

const confidenceStyles: Record<WebPresenceAuditClassification['confidence'], string> = {
  high: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  medium: 'bg-blue-50 text-blue-800 border-blue-200',
  low: 'bg-amber-50 text-amber-800 border-amber-200',
};

export function WebPresenceAuditClassificationPanel({ classification }: WebPresenceAuditClassificationPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
          <Layers3 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Website classification</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Website type detected</h2>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${confidenceStyles[classification.confidence]}`}>
          {classification.confidence} confidence
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Likely type</p>
        <p className="mt-2 text-xl font-black text-slate-950">{classification.detectedType}</p>
        <p className="mt-3 text-sm leading-7 text-slate-600">{classification.reason}</p>
      </div>

      {classification.detectedSignals.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Detected signals</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {classification.detectedSignals.map((signal) => (
              <li
                key={signal}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                {signal}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {classification.recommendationFocus.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-700" />
            <p className="text-sm font-black uppercase tracking-[0.12em] text-violet-800">Recommendation focus</p>
          </div>
          <ul className="mt-4 space-y-2">
            {classification.recommendationFocus.map((item) => (
              <li key={item} className="text-sm leading-6 text-slate-700">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
