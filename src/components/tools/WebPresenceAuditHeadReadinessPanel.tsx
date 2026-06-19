import { FileCode2 } from 'lucide-react';
import type { WebPresenceAuditHeadReadiness } from '../../lib/audit/types';

type WebPresenceAuditHeadReadinessPanelProps = {
  headReadiness: WebPresenceAuditHeadReadiness;
};

type StatusCard = {
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'neutral' | 'missing';
};

function toneClass(tone: StatusCard['tone']): string {
  switch (tone) {
    case 'good':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800';
    case 'warn':
      return 'border-amber-200 bg-amber-50 text-amber-800';
    case 'missing':
      return 'border-red-200 bg-red-50 text-red-800';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

function formatStatus(value: string): string {
  return value.replace(/_/g, ' ');
}

function cardToneForValue(value: string): StatusCard['tone'] {
  if (value === 'found' || value === 'accessible' || value === 'detected' || value === 'indexable') return 'good';
  if (value === 'partial' || value === 'not_detected' || value === 'needs_review') return 'warn';
  if (value === 'missing' || value === 'noindex_detected') return value === 'noindex_detected' ? 'warn' : 'missing';
  return 'neutral';
}

export function WebPresenceAuditHeadReadinessPanel({ headReadiness }: WebPresenceAuditHeadReadinessPanelProps) {
  const cards: StatusCard[] = [
    { label: 'Title tag', value: headReadiness.title, tone: cardToneForValue(headReadiness.title) },
    { label: 'Meta description', value: headReadiness.metaDescription, tone: cardToneForValue(headReadiness.metaDescription) },
    { label: 'Canonical', value: headReadiness.canonical, tone: cardToneForValue(headReadiness.canonical) },
    { label: 'Robots meta', value: headReadiness.robotsMeta, tone: cardToneForValue(headReadiness.robotsMeta) },
    { label: 'Open Graph', value: headReadiness.openGraph, tone: cardToneForValue(headReadiness.openGraph) },
    { label: 'Twitter card', value: headReadiness.twitterCard, tone: cardToneForValue(headReadiness.twitterCard) },
    { label: 'Structured data', value: headReadiness.structuredData, tone: cardToneForValue(headReadiness.structuredData) },
    { label: 'robots.txt', value: headReadiness.robotsTxt, tone: cardToneForValue(headReadiness.robotsTxt) },
    { label: 'sitemap.xml', value: headReadiness.sitemapXml, tone: cardToneForValue(headReadiness.sitemapXml) },
    {
      label: 'Google verification tag',
      value: headReadiness.googleSiteVerificationMeta,
      tone: cardToneForValue(headReadiness.googleSiteVerificationMeta),
    },
    {
      label: 'Bing verification tag',
      value: headReadiness.bingSiteVerificationMeta,
      tone: cardToneForValue(headReadiness.bingSiteVerificationMeta),
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
          <FileCode2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-700">Technical head signals</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Head &amp; indexing readiness</h2>
          <p className="mt-2 text-sm text-slate-600">
            Statuses below are based on visible HTML and accessibility checks only. Platform performance is not verified in this free audit.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-xl border px-4 py-3 ${toneClass(card.tone)}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-80">{card.label}</p>
            <p className="mt-1 text-sm font-black capitalize">{formatStatus(card.value)}</p>
          </div>
        ))}
      </div>

      {headReadiness.notes.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Notes</p>
          <ul className="mt-3 space-y-2">
            {headReadiness.notes.map((note) => (
              <li key={note} className="text-sm leading-6 text-slate-700">{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {headReadiness.recommendations.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-indigo-800">Recommendations</p>
          <ul className="mt-3 space-y-2">
            {headReadiness.recommendations.map((item) => (
              <li key={item} className="text-sm leading-6 text-slate-700">{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
