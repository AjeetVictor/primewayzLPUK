import { useId, useState } from 'react';
import { Info } from 'lucide-react';
import { trackEvent } from '../../lib/analytics';

type AuditInfoTooltipProps = {
  categoryId: string;
  title: string;
  checked: string;
  whyItMatters: string;
  goodLooksLike: string;
  notVerified: string;
  scoreBand?: string;
  scoreLabel?: string;
  ctaLocation?: string;
};

export function AuditInfoTooltip({
  categoryId,
  title,
  checked,
  whyItMatters,
  goodLooksLike,
  notVerified,
  scoreBand = 'unknown',
  scoreLabel = 'unknown',
  ctaLocation = 'audit_result_help',
}: AuditInfoTooltipProps) {
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);

  const openTooltip = () => {
    if (!isOpen) {
      trackEvent('audit_tooltip_opened', {
        category_id: categoryId,
        score_band: scoreBand,
        score_label: scoreLabel,
        cta_location: ctaLocation,
      });
    }
    setIsOpen(true);
  };

  return (
    <span
      className="relative inline-flex shrink-0"
      onMouseEnter={openTooltip}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label={`About ${title}`}
        aria-expanded={isOpen}
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openTooltip())}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <Info className="h-4 w-4" />
      </button>

      {isOpen ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-0 top-10 z-30 w-[min(19rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl sm:left-auto sm:right-0"
        >
          <span className="block text-sm font-black text-slate-950">{title}</span>
          <span className="mt-3 block text-xs font-bold uppercase tracking-[0.1em] text-blue-700">What is checked</span>
          <span className="mt-1 block text-sm leading-5 text-slate-600">{checked}</span>
          <span className="mt-3 block text-xs font-bold uppercase tracking-[0.1em] text-blue-700">Why it matters</span>
          <span className="mt-1 block text-sm leading-5 text-slate-600">{whyItMatters}</span>
          <span className="mt-3 block text-xs font-bold uppercase tracking-[0.1em] text-blue-700">What good looks like</span>
          <span className="mt-1 block text-sm leading-5 text-slate-600">{goodLooksLike}</span>
          <span className="mt-3 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Not verified here</span>
          <span className="mt-1 block text-sm leading-5 text-slate-600">{notVerified}</span>
        </span>
      ) : null}
    </span>
  );
}
