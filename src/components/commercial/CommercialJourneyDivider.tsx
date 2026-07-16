import { cn } from '../../utils/cn';

type CommercialJourneyDividerProps = {
  step: number;
  label: string;
  className?: string;
};

/**
 * Subtle timeline accent connecting sections into one continuous delivery journey.
 */
export function CommercialJourneyDivider({ step, label, className }: CommercialJourneyDividerProps) {
  return (
    <div
      className={cn('mb-10 flex items-center gap-4', className)}
      aria-hidden="true"
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
      <div className="flex shrink-0 flex-col items-center gap-1 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-600/80">
          Monthly delivery journey
        </span>
        <span className="text-xs font-semibold text-slate-500">
          {step}. {label}
        </span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
    </div>
  );
}
