import { useState } from 'react';
import { CheckCircle2, ChevronDown, ListOrdered } from 'lucide-react';
import { cn } from '../../utils/cn';
import { trackSdaasEvent } from '../../lib/sdaasAnalytics';

const SNAPSHOT_ROWS = [
  { label: 'Backlog reviewed', value: 'Complete', status: 'done' as const },
  { label: 'Current priority', value: 'CRM integration' },
  { label: 'Next in queue', value: 'Reporting dashboard' },
  { label: 'QA this week', value: 'Performance optimisation' },
  { label: 'Monthly capacity', value: '72% allocated' },
];

function SnapshotCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/8',
        compact ? 'p-4' : 'p-5',
      )}
      role="complementary"
      aria-label="Illustrative monthly delivery snapshot example"
    >
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <ListOrdered className="h-4 w-4 text-emerald-600" aria-hidden />
        <p className="text-sm font-bold text-slate-950">Monthly delivery snapshot</p>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">Illustrative example—not a live client dashboard.</p>

      <dl className="mt-4 space-y-3">
        {SNAPSHOT_ROWS.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 text-sm">
            <dt className="font-medium text-slate-600">{row.label}</dt>
            <dd className="flex items-center gap-1.5 text-right font-semibold text-slate-900">
              {row.status === 'done' ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              ) : null}
              <span className="capitalize">{row.value}</span>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium leading-5 text-emerald-900">
        This is not buying hours. It is buying a managed delivery system.
      </p>
    </div>
  );
}

/** Sticky illustrative delivery snapshot — desktop fixed, mobile collapsible. */
export function MonthlyDeliverySnapshot() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sticky */}
      <aside
        className="pointer-events-none fixed right-4 top-28 z-30 hidden w-[272px] xl:block 2xl:right-8"
        aria-hidden={false}
      >
        <div className="pointer-events-auto">
          <SnapshotCard />
        </div>
      </aside>

      {/* Mobile collapsed */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur xl:hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={mobileOpen}
          onClick={() => {
            const next = !mobileOpen;
            setMobileOpen(next);
            trackSdaasEvent('sdaas_snapshot_toggle', {
              cta_location: 'mobile_snapshot',
              snapshot_state: next ? 'open' : 'closed',
            });
          }}
        >
          <span className="text-sm font-bold text-slate-900">Monthly delivery snapshot (example)</span>
          <ChevronDown
            className={cn('h-5 w-5 text-slate-500 transition-transform', mobileOpen && 'rotate-180')}
            aria-hidden
          />
        </button>
        {mobileOpen ? (
          <div className="border-t border-slate-100 px-4 pb-4 pt-2">
            <SnapshotCard compact />
          </div>
        ) : null}
      </div>
    </>
  );
}
