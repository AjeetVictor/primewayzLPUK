import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Coins,
  Headphones,
  Info,
  Receipt,
  RefreshCw,
} from 'lucide-react';
import { useEffect } from 'react';
import { DISCOVERY_CALL_DESTINATION, DISCOVERY_CALL_CTA_LABEL } from '../../constants/conversionCta';
import { shellClasses } from '../../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../../constants/siteLayout';
import {
  getPrimaryPricingGridPlans,
  getSecondaryPricingGridPlan,
  PRICING_COMMERCIAL_CLARITY_ITEMS,
} from '../../data/pricing/gridConfig';
import { PRICING_COMMERCIAL_POLICY } from '../../data/pricing/helpers';
import { usePricingSelection } from '../../hooks/usePricingSelection';
import { trackPricingComparisonView, trackPricingCtaClick } from '../../lib/pricing/analytics';
import { cn } from '../../utils/cn';
import { PricingGridCard } from './PricingGridCard';
import { PricingPlanDetailModal } from './PricingPlanDetailModal';

const CLARITY_ICONS = {
  receipt: Receipt,
  coins: Coins,
  calendar: CalendarDays,
  refresh: RefreshCw,
} as const;

export function PricingPageContent() {
  const primaryPlans = getPrimaryPricingGridPlans();
  const scalePlan = getSecondaryPricingGridPlan();
  const {
    selection,
    invalidQueryPlan,
    hydrated,
    detailPlan,
    detailOpen,
    openPlanDetail,
    closePlanDetail,
  } = usePricingSelection();

  useEffect(() => {
    trackPricingComparisonView({ page_path: '/pricing' });
  }, []);

  return (
    <div className={cn(SITE_CONTAINER_CLASS, 'pb-20 pt-8 sm:pb-24 sm:pt-10')}>
      <nav className="text-sm font-semibold text-slate-500" aria-label="Breadcrumb">
        <Link to="/" className="transition hover:text-brand-cyan">
          Home
        </Link>
        <span className="mx-2 text-slate-400" aria-hidden>
          &gt;
        </span>
        <span className="text-slate-700">Pricing</span>
      </nav>

      <section className="mx-auto mt-8 max-w-4xl text-center" aria-labelledby="pricing-hero-title">
        <h1 id="pricing-hero-title" className={shellClasses.sectionHeading}>
          Simple, transparent pricing for every stage of growth
        </h1>
        <p className={cn(shellClasses.sectionLead, 'mx-auto mt-5 max-w-3xl')}>
          Choose the capacity that matches your current priorities. Start with a structured sprint,
          move into monthly delivery, or step down to maintenance when active development slows.
        </p>
        {hydrated && invalidQueryPlan ? (
          <p className="mt-4 text-sm text-amber-700">
            That plan link is not recognised — browse the options below.
          </p>
        ) : null}
      </section>

      <section
        className="mx-auto mt-8 max-w-5xl rounded-2xl border border-brand-border bg-white px-4 py-4 shadow-sm sm:px-6"
        aria-label="Commercial clarity"
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_COMMERCIAL_CLARITY_ITEMS.map((item) => {
            const Icon = CLARITY_ICONS[item.icon];
            return (
              <li key={item.id} className="flex items-center gap-3 text-sm font-semibold text-brand-navy">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand-border bg-brand-surface text-brand-blue">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                {item.label}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10" aria-label="Pricing plans">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {primaryPlans.map((plan) => (
            <PricingGridCard
              key={plan.slug}
              plan={plan}
              highlighted={selection?.planSlug === plan.slug}
              onOpenDetail={openPlanDetail}
            />
          ))}
        </div>

        {scalePlan ? (
          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-dashed border-brand-border bg-brand-surface/70 px-5 py-4 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-sm font-semibold text-brand-navy">
                Need broader delivery capacity between Growth and Enterprise?
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {scalePlan.name} — {scalePlan.displayedPrice}/month · {scalePlan.capacityLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => openPlanDetail(scalePlan.slug, 'pricing_scale_secondary')}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border border-brand-navy bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy transition hover:bg-white/80"
            >
              View Scale
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </section>

      <section
        className="mt-10 rounded-2xl border border-sky-100 bg-sky-50/70 px-5 py-5 sm:px-7 sm:py-6"
        aria-label="Commercial structure note"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-white text-brand-blue">
              <Info className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-sm leading-7 text-slate-700">
              <strong className="text-brand-navy">Clear commercial structure:</strong> Primewayz
              delivery fees are separated from third-party costs such as hosting, domains, SSL, tools,
              plugins and ad spend.
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold text-teal-700 lg:text-right">
            Same subscription model.{' '}
            <span className="text-teal-600">Simplified for clarity.</span>
          </p>
        </div>
      </section>

      <section
        className="mt-8 rounded-2xl border border-brand-border bg-white px-5 py-5 sm:px-7 sm:py-6"
        aria-labelledby="pricing-final-cta-title"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-border bg-brand-surface text-brand-blue">
              <Headphones className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="pricing-final-cta-title" className="text-lg font-bold text-brand-navy sm:text-xl">
                Not sure which plan fits best?
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Let&apos;s talk through your roadmap and priorities.
              </p>
            </div>
          </div>
          <Link
            to={DISCOVERY_CALL_DESTINATION}
            onClick={() =>
              trackPricingCtaClick({
                cta_text: DISCOVERY_CALL_CTA_LABEL,
                cta_location: 'pricing_final_cta',
                page_path: '/pricing',
                selection,
                journey_type: 'pricing_discovery_call',
              })
            }
            className={cn(shellClasses.btnHeroPrimary, 'shrink-0 sm:w-auto')}
          >
            {DISCOVERY_CALL_CTA_LABEL}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500 sm:text-sm">
          {PRICING_COMMERCIAL_POLICY.vatTreatment} {PRICING_COMMERCIAL_POLICY.thirdPartyCostPolicy}
        </p>
      </section>

      <PricingPlanDetailModal
        plan={detailPlan}
        selection={selection}
        open={detailOpen}
        onOpenChange={(open) => {
          if (!open) closePlanDetail();
        }}
      />
    </div>
  );
}
