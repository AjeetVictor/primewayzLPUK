import { ArrowRight, Check } from 'lucide-react';
import type { PricingPlanDefinition } from '../../data/pricing/types';
import {
  getPricingGridBadgeClass,
  getPricingGridConfig,
  type PricingGridPlanConfig,
} from '../../data/pricing/gridConfig';
import { cn } from '../../utils/cn';

const CTA_VARIANT_CLASSES: Record<PricingGridPlanConfig['ctaVariant'], string> = {
  outline:
    'border border-brand-navy bg-white text-brand-navy hover:border-brand-blue/35 hover:bg-brand-surface',
  primary: 'border border-brand-navy bg-brand-navy text-white hover:bg-brand-navy/90',
  featured: 'border border-teal-600 bg-teal-600 text-white hover:bg-teal-700',
  'purple-outline':
    'border border-violet-300 bg-white text-brand-navy hover:border-violet-400 hover:bg-violet-50/60',
  'teal-outline':
    'border border-teal-300 bg-white text-brand-navy hover:border-teal-400 hover:bg-teal-50/60',
};

export function PricingGridCard({
  plan,
  highlighted = false,
  onOpenDetail,
}: {
  plan: PricingPlanDefinition;
  highlighted?: boolean;
  onOpenDetail: (slug: PricingPlanDefinition['slug']) => void;
}) {
  const config = getPricingGridConfig(plan.slug);
  const Icon = config.icon;

  return (
    <article
      id={`pricing-plan-${plan.slug}`}
      className={cn(
        'flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition sm:p-6',
        config.featured || highlighted
          ? 'border-teal-500 ring-2 ring-teal-500/15'
          : 'border-brand-border hover:border-brand-blue/25 hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]',
            getPricingGridBadgeClass(config.badgeTone),
          )}
        >
          {config.badge}
        </span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-navy">
          <Icon className="h-4.5 w-4.5" aria-hidden />
        </span>
      </div>

      <h3 className="mt-4 text-lg font-bold leading-snug text-brand-navy sm:text-xl">{plan.name}</h3>
      <p className="mt-2 min-h-[3rem] text-sm leading-6 text-slate-600">{plan.shortDescription}</p>

      <div className="mt-5">
        <p className="flex flex-wrap items-baseline gap-x-1">
          <span className="text-2xl font-bold tracking-tight text-brand-navy sm:text-[1.65rem]">
            {plan.displayedPrice}
          </span>
          {plan.billingPeriod === 'monthly' ? (
            <span className="text-sm font-medium text-slate-500">/mo</span>
          ) : null}
        </p>
        {plan.referencePriceLabel ? (
          <p className="mt-1 text-sm text-slate-500 line-through">{plan.referencePriceLabel}</p>
        ) : null}
        {plan.launchDiscountLabel ? (
          <span className="mt-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-800">
            {plan.launchDiscountLabel}
          </span>
        ) : null}
      </div>

      {plan.capacityLabel ? (
        <p className="mt-4 text-sm font-semibold leading-6 text-brand-navy">
          {plan.capacityLabel}
          {config.capacityDetail ? (
            <span className="mt-0.5 block text-xs font-medium text-slate-500">
              {config.capacityDetail}
            </span>
          ) : null}
        </p>
      ) : null}

      <div className="mt-5 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Best for</p>
        <ul className="mt-2.5 space-y-2">
          {config.cardBullets.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-5 text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" strokeWidth={2.2} aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => onOpenDetail(plan.slug)}
        className={cn(
          'mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40',
          CTA_VARIANT_CLASSES[config.ctaVariant],
        )}
      >
        {config.ctaLabel}
        <ArrowRight className="h-4 w-4" strokeWidth={1.9} aria-hidden />
      </button>
    </article>
  );
}
