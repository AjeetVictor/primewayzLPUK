import { CheckCircle2 } from 'lucide-react';

const reassuranceItems = [
  'No-obligation consultation',
  'Capacity recommendation based on your backlog',
  'Honest advice—even if a subscription is not the right fit',
];

export function CapacityReassuranceStrip() {
  return (
    <div
      className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 sm:p-6"
      role="note"
      aria-label="What to expect from a capacity recommendation request"
    >
      <ul className="grid gap-3 sm:grid-cols-3">
        {reassuranceItems.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm font-medium leading-6 text-slate-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
