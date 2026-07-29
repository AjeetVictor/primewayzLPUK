import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { shellClasses } from '../../constants/designSystem';
import { DISCOVERY_CALL_DESTINATION, DISCOVERY_CALL_CTA_LABEL } from '../../constants/conversionCta';
import {
  getPricingGridBadgeClass,
  getPricingGridConfig,
} from '../../data/pricing/gridConfig';
import { PRICING_COMMERCIAL_POLICY } from '../../data/pricing/helpers';
import type { PricingPlanDefinition } from '../../data/pricing/types';
import { buildPricingReviewUrl } from '../../lib/pricing/buildPricingReviewUrl';
import { trackPricingCtaClick } from '../../lib/pricing/analytics';
import type { StoredPricingSelectionV1 } from '../../lib/pricing/pricingSelection';
import { cn } from '../../utils/cn';

function FoundationSprintDetail() {
  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Produces</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {PRICING_COMMERCIAL_POLICY.foundationSprintIncludes.map((item) => (
            <li key={item} className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
          Does not automatically include
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {PRICING_COMMERCIAL_POLICY.foundationSprintExcludes.slice(0, 6).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RecurringCapacityDetail() {
  return (
    <div className="mt-4 rounded-xl border border-brand-border bg-brand-surface p-4 text-sm leading-7 text-slate-700">
      <p>{PRICING_COMMERCIAL_POLICY.capacityDefinition}</p>
      <p className="mt-3">
        Work is prioritised with you each month. Capacity is not unlimited and additional capacity
        requires approval. {PRICING_COMMERCIAL_POLICY.rolloverPolicy}
      </p>
    </div>
  );
}

export function PricingPlanDetailModal({
  plan,
  selection,
  open,
  onOpenChange,
}: {
  plan: PricingPlanDefinition | null;
  selection: StoredPricingSelectionV1 | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!plan) return null;

  const config = getPricingGridConfig(plan.slug);
  const reviewUrl = buildPricingReviewUrl(plan.slug);
  const isFoundation = plan.slug === 'foundation-sprint';
  const isRecurring = plan.engagementType === 'recurring_delivery';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-950/55 backdrop-blur-[2px]" />
        <Dialog.Content
          ref={contentRef}
          tabIndex={-1}
          onOpenAutoFocus={(event) => {
            event.preventDefault();

            const content = contentRef.current;
            if (!content) return;

            content.scrollTop = 0;
            content.focus({ preventScroll: true });

            requestAnimationFrame(() => {
              content.scrollTop = 0;
            });
          }}
          className={cn(
            'fixed inset-x-0 bottom-0 z-[101] max-h-[92vh] overflow-y-auto rounded-t-[1.75rem] bg-white p-5 shadow-2xl focus:outline-none',
            'sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.75rem] sm:p-7',
          )}
        >
          <Dialog.Title className="sr-only">{plan.name} plan details</Dialog.Title>
          <Dialog.Description className="sr-only">
            Detailed pricing, inclusions and commercial notes for {plan.name}.
          </Dialog.Description>

          <Dialog.Close
            className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-border bg-white text-slate-600 transition hover:bg-brand-surface hover:text-brand-navy"
            aria-label="Close plan details"
          >
            <X className="h-5 w-5" />
          </Dialog.Close>

          <div className="pr-10">
            <span
              className={cn(
                'inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em]',
                getPricingGridBadgeClass(config.badgeTone),
              )}
            >
              {config.badge}
            </span>

            <h2 className="mt-4 text-2xl font-bold text-brand-navy sm:text-3xl">{plan.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{plan.shortDescription}</p>

            <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-3xl font-bold tracking-tight text-brand-navy">
                {plan.displayedPrice}
              </span>
              {plan.billingPeriod === 'monthly' ? (
                <span className="text-base font-medium text-slate-500">/month</span>
              ) : (
                <span className="text-base font-medium text-slate-500">one-time</span>
              )}
              {plan.referencePriceLabel ? (
                <span className="text-sm text-slate-500 line-through">{plan.referencePriceLabel}</span>
              ) : null}
            </div>

            {plan.capacityLabel ? (
              <p className="mt-3 text-sm font-semibold text-brand-navy">
                {plan.capacityLabel}
                {config.capacityDetail ? (
                  <span className="mt-0.5 block text-xs font-medium text-slate-500">
                    {config.capacityDetail}
                  </span>
                ) : null}
              </p>
            ) : null}

            {isFoundation ? <FoundationSprintDetail /> : null}

            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
                What&apos;s included
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {plan.inclusions.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {plan.bestFor.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Best for</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {plan.bestFor.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {plan.exclusions.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">Boundaries</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {plan.exclusions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {plan.importantBoundary ? (
              <p className="mt-5 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 text-sm leading-6 text-slate-700">
                <strong className="text-brand-navy">Important:</strong> {plan.importantBoundary}
              </p>
            ) : null}

            {isRecurring ? (
              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
                  How capacity works
                </h3>
                <RecurringCapacityDetail />
              </div>
            ) : null}

            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
                Commercial notes
              </h3>
              <dl className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
                <div>
                  <dt className="font-semibold text-brand-navy">VAT</dt>
                  <dd>{PRICING_COMMERCIAL_POLICY.vatTreatment}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-brand-navy">Third-party costs</dt>
                  <dd>{PRICING_COMMERCIAL_POLICY.thirdPartyCostPolicy}</dd>
                </div>
                {plan.engagementType !== 'foundation' ? (
                  <>
                    <div>
                      <dt className="font-semibold text-brand-navy">Commitment</dt>
                      <dd>{PRICING_COMMERCIAL_POLICY.minimumCommitment}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-brand-navy">Cancellation</dt>
                      <dd>{PRICING_COMMERCIAL_POLICY.cancellationPolicy}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to={reviewUrl}
                onClick={() =>
                  trackPricingCtaClick({
                    cta_text: 'Continue with this plan',
                    cta_location: 'pricing_plan_detail_modal',
                    page_path: '/pricing',
                    selection,
                    journey_type: 'pricing_selected_plan',
                  })
                }
                className={cn(shellClasses.btnHeroPrimary, 'sm:w-auto')}
              >
                Continue with this plan
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                to={DISCOVERY_CALL_DESTINATION}
                className={cn(shellClasses.btnHeroSecondary, 'sm:w-auto')}
              >
                {DISCOVERY_CALL_CTA_LABEL}
              </Link>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
