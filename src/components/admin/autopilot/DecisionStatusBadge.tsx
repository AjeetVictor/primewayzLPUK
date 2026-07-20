import { getDecisionStatusLabel } from '../../../lib/autopilot/adminAutopilotLabels';

type DecisionStatusBadgeProps = {
  status: string | null | undefined;
  className?: string;
};

function toneClass(status: string | null | undefined): string {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'PENDING_REVIEW':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'NOT_READY':
      return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    case 'NEEDS_MORE_RESEARCH':
    case 'DEFERRED':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    default:
      return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  }
}

export function DecisionStatusBadge({ status, className = '' }: DecisionStatusBadgeProps) {
  const label = getDecisionStatusLabel(status);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${toneClass(status)} ${className}`}
      title={`Decision status: ${label}`}
    >
      <span className="sr-only">Decision status: </span>
      {label}
    </span>
  );
}
