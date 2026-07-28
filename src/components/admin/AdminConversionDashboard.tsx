import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiUrl } from '../../utils/apiUrl';

type DashboardSummary = {
  leadCounts: {
    total: number;
    validLeads: number;
    qualifiedLeads: number;
    proposals: number;
    won: number;
  };
  commercial: {
    proposalCount: number;
    proposalValueMinor: number;
    wonCount: number;
    wonValueMinor: number;
    winRate: number;
  };
  operational: Record<string, number>;
  breakdowns: {
    status: Record<string, number>;
    selectedPlan: Record<string, number>;
    validationOutcome: Record<string, number>;
  };
  dataSources: Record<string, string>;
  pricingFunnelNote: string;
  auditFunnelNote: string;
};

const PRESETS = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
] as const;

export function AdminConversionDashboard() {
  const [preset, setPreset] = useState<(typeof PRESETS)[number]['id']>('30d');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(apiUrl(`/api/admin/conversion-dashboard?preset=${preset}`), { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load dashboard');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [preset]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Loading conversion dashboard…
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800" role="alert">
        {error ?? 'Dashboard unavailable'}
      </div>
    );
  }

  const formatGbp = (minor: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(minor / 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Product & conversion dashboard</h2>
          <p className="mt-1 text-sm text-slate-600">
            CRM measures from lead database. Web funnel steps require GA4 reporting — not person-level matched here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreset(item.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                preset === item.id
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Total leads', summary.leadCounts.total],
          ['Valid leads', summary.leadCounts.validLeads],
          ['Qualified', summary.leadCounts.qualifiedLeads],
          ['Proposals', summary.leadCounts.proposals],
          ['Won', summary.leadCounts.won],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900">Commercial measures</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt>Proposal pipeline value</dt><dd className="font-semibold">{formatGbp(summary.commercial.proposalValueMinor)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Won value</dt><dd className="font-semibold">{formatGbp(summary.commercial.wonValueMinor)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Win rate (proposal → won)</dt><dd className="font-semibold">{(summary.commercial.winRate * 100).toFixed(1)}%</dd></div>
          </dl>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900">Operational queue</h3>
          <dl className="mt-4 space-y-2 text-sm">
            {Object.entries(summary.operational).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4">
                <dt className="text-slate-600">{key.replace(/([A-Z])/g, ' $1')}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['By status', summary.breakdowns.status],
          ['By selected plan', summary.breakdowns.selectedPlan],
          ['By validation', summary.breakdowns.validationOutcome],
        ].map(([title, data]) => (
          <div key={title as string} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">{title as string}</h3>
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {Object.entries(data as Record<string, number>).map(([key, count]) => (
                <li key={key} className="flex justify-between gap-3">
                  <span>{key}</span>
                  <span className="font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p><strong>Pricing funnel (GA4):</strong> {summary.pricingFunnelNote}</p>
        <p className="mt-2"><strong>Audit funnel (GA4):</strong> {summary.auditFunnelNote}</p>
      </div>
    </div>
  );
}
