import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { shellClasses } from '../../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../../constants/siteLayout';
import {
  HOMEPAGE_PRICING_SECTION_NAME,
  HOMEPAGE_PRICING_SMALL_PRINT,
  homepagePricingPlans,
  type HomepagePricingPlan,
} from '../../content/homepagePricingPlans';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { trackConversionEvent } from '../../lib/analytics';
import { rememberHomepageSelectedPlan } from '../../lib/homepagePricingSelection';
import { cn } from '../../utils/cn';

function getPageAnalyticsContext() {
  if (typeof window === 'undefined') {
    return { page_location: undefined, page_path: '/' };
  }
  return {
    page_location: window.location.href,
    page_path: window.location.pathname || '/',
  };
}

function trackHomepagePricingPlanClick(plan: HomepagePricingPlan) {
  const page = getPageAnalyticsContext();
  trackConversionEvent('homepage_pricing_plan_click', {
    selected_plan: plan.id,
    displayed_price: plan.displayedPrice,
    billing_period: plan.billingPeriod,
    page_location: page.page_location,
    page_path: page.page_path,
    section_name: HOMEPAGE_PRICING_SECTION_NAME,
  });
}

function trackViewFullPricingClick() {
  const page = getPageAnalyticsContext();
  trackConversionEvent('view_full_pricing_click', {
    page_location: page.page_location,
    page_path: page.page_path,
    section_name: HOMEPAGE_PRICING_SECTION_NAME,
  });
}

function PricingPreviewCard({ plan }: { plan: HomepagePricingPlan }) {
  const handleCtaClick = () => {
    rememberHomepageSelectedPlan(plan.id);
    trackHomepagePricingPlanClick(plan);
  };

  return (
    <article
      className={`${shellClasses.sectionCard} ${
        plan.recommended
          ? 'border-brand-blue/40 bg-white ring-1 ring-brand-blue/15'
          : ''
      }`}
    >
      <div className="flex min-h-[28px] items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-snug text-brand-navy sm:text-xl">{plan.name}</h3>
        {plan.recommended ? (
          <span className="shrink-0 rounded-md border border-brand-blue/25 bg-brand-surface px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-blue">
            Recommended
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{plan.description}</p>

      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {plan.priceLabel}
        </p>
        <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-2xl font-bold tracking-tight text-brand-navy sm:text-[1.65rem]">
            {plan.price}
          </span>
          <span className="text-sm font-medium text-slate-500">{plan.billing}</span>
        </p>
      </div>

      <div className="mt-4 text-sm font-semibold leading-6 text-brand-navy">
        <p>{plan.capacity}</p>
        {plan.capacityDetail ? (
          <p className="mt-0.5 text-xs font-medium text-slate-500">{plan.capacityDetail}</p>
        ) : null}
      </div>

      <ul className="mt-5 space-y-2.5 border-t border-brand-border pt-5">
        {plan.inclusions.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-5 text-slate-700">
            <Check
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue"
              strokeWidth={2.2}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 text-xs font-medium leading-5 text-slate-500">{plan.bestFor}</p>

      <div className="mt-auto pt-6">
        <Link
          to={plan.href}
          onClick={handleCtaClick}
          className={cn(
            shellClasses.btnHeroSecondary,
            'w-full border-brand-navy text-brand-navy sm:w-full',
          )}
        >
          {plan.ctaLabel}
          <ArrowRight className="h-4 w-4" strokeWidth={1.9} aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export const CommercialClaritySection = () => {
  const reveal = useRevealMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    if (viewTrackedRef.current) return;

    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || viewTrackedRef.current) return;
        viewTrackedRef.current = true;
        const page = getPageAnalyticsContext();
        trackConversionEvent('homepage_pricing_view', {
          page_location: page.page_location,
          page_path: page.page_path,
          section_name: HOMEPAGE_PRICING_SECTION_NAME,
        });
        observer.disconnect();
      },
      { threshold: 0.35, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="scroll-mt-28 bg-brand-surface py-16 md:py-20"
      aria-labelledby="pricing-heading"
    >
      <div className={SITE_CONTAINER_CLASS}>
        <motion.div
          initial={reveal.initial({ opacity: 0, y: 20 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <p className={shellClasses.sectionEyebrow}>Pricing & engagement options</p>
          <h2 id="pricing-heading" className={`mt-5 ${shellClasses.sectionHeading}`}>
            Start with the level of support your priorities need
          </h2>
          <p className={`mt-5 max-w-2xl ${shellClasses.sectionLead}`}>
            Begin with a structured sprint, choose predictable monthly delivery, or move into
            lower-capacity maintenance when active priorities slow down.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base sm:leading-7">
            Clear starting points for discovery, monthly delivery and ongoing continuity.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {homepagePricingPlans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={reveal.initial({ opacity: 0, y: 20 })}
              whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="h-full"
            >
              <PricingPreviewCard plan={plan} />
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to={CANONICAL_ROUTES.pricing}
            onClick={trackViewFullPricingClick}
            className={`${shellClasses.btnHeroSecondary} border-brand-navy text-brand-navy`}
          >
            Compare all plans
            <ArrowRight className="h-4 w-4" strokeWidth={1.9} aria-hidden />
          </Link>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Need broader delivery capacity, complex integrations or multi-team governance?{' '}
            <Link
              to={CANONICAL_ROUTES.pricing}
              onClick={trackViewFullPricingClick}
              className="font-semibold text-brand-blue underline-offset-2 transition hover:text-brand-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
            >
              View Scale and Enterprise options.
            </Link>
          </p>
        </div>

        <p className="mt-6 max-w-3xl text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
          {HOMEPAGE_PRICING_SMALL_PRINT}
        </p>
      </div>
    </section>
  );
};
