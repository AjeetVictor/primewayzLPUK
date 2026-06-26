import { TrackedLink } from './common/TrackedLink';
import { motion } from 'motion/react';
import { BOOK_CALL_URL, CONTACT_ENQUIRY_URL } from '../constants/contactBooking';
import {
  ArrowRight,
  Check,
  Cloud,
  MonitorCog,
  Minus,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
} from 'lucide-react';

type PlanCard = {
  name: string;
  launchPrice: string;
  originalPrice: string;
  launchDiscount: string;
  priceValue: number;
  originalPriceValue: number;
  currency: 'GBP';
  billingPeriod: 'one_time' | 'monthly';
  capacity: string;
  description: string;
  bestFor: string[];
  included: string[];
  limitations?: string[];
  note?: string;
  cta: string;
  ctaHref: string;
  highlight?: boolean;
};

const clarityBadges = [
  'Prices shown ex VAT',
  'Third-party vendor costs billed separately',
  'Flexible monthly capacity',
  'Move to maintenance anytime',
] as const;

const foundationSprint: PlanCard = {
  name: 'Foundation Sprint',
  launchPrice: '£722.50',
  originalPrice: '£850 one-time',
  launchDiscount: '15% Launch Discount',
  priceValue: 722.5,
  originalPriceValue: 850,
  currency: 'GBP',
  billingPeriod: 'one_time',
  capacity: '2-4 week structured launch phase',
  description:
    'A structured starting phase for discovery, planning, setup, and launch readiness.',
  bestFor: [
    'New website or platform starts',
    'Redesign foundations',
    'CMS setup',
    'Launch preparation',
    'Technical SEO baseline',
    'Roadmap alignment',
  ],
  included: [
    'Discovery and requirement alignment',
    'Content and structure planning',
    'UX direction',
    'CMS / environment setup',
    'Analytics baseline',
    'Technical SEO foundation',
    'Delivery roadmap for next phase',
  ],
  limitations: ['Not designed for ongoing monthly feature delivery'],
  cta: 'Start with Foundation Sprint',
  ctaHref: CONTACT_ENQUIRY_URL,
};

const activePlans: PlanCard[] = [
  {
    name: 'Essential',
    launchPrice: '£741/mo',
    originalPrice: '£950/mo',
    launchDiscount: '22% Launch Discount',
    priceValue: 741,
    originalPriceValue: 950,
    currency: 'GBP',
    billingPeriod: 'monthly',
    capacity: 'Up to 40 hrs/month • 1 active workstream',
    description:
      'For websites, CMS improvements, light integrations, technical upkeep, and technical SEO foundation.',
    bestFor: [
      'Stable monthly execution for core website and CMS delivery',
      'Light integrations and technical upkeep',
      'Technical SEO foundation support',
    ],
    included: [
      'Monthly planning and prioritisation',
      'Website and CMS improvements',
      'Bug fixes and refinement',
      'Light integrations',
      'Technical SEO foundation upkeep',
      'Staging, QA, and deployment support',
    ],
    limitations: [
      'No complex ecommerce ecosystems',
      'No multi-stream delivery',
      'No advanced automation',
    ],
    cta: 'Book a call for Essential',
    ctaHref: BOOK_CALL_URL,
  },
  {
    name: 'Growth',
    launchPrice: '£1,189/mo',
    originalPrice: '£1,450/mo',
    launchDiscount: '18% Launch Discount',
    priceValue: 1189,
    originalPriceValue: 1450,
    currency: 'GBP',
    billingPeriod: 'monthly',
    capacity: 'Up to 80 hrs/month',
    description:
      'For growing businesses that need ongoing digital improvement, landing pages, CRM integrations, and conversion-focused work.',
    bestFor: [
      'Teams needing broader delivery capacity',
      'Landing pages and digital improvement',
      'CRM and light API integrations',
      'Conversion-focused work',
    ],
    included: [
      'Everything in Essential',
      'Broader design and development coverage',
      'Landing page system support',
      'CRM and light API integrations',
      'SEO growth support',
      'Analytics and conversion improvements',
    ],
    limitations: [
      'Not ideal for highly complex operational platforms',
      'Not ideal for governance-heavy delivery',
    ],
    cta: 'Book a call for Growth',
    ctaHref: BOOK_CALL_URL,
    highlight: true,
  },
  {
    name: 'Scale',
    launchPrice: '£2,100/mo',
    originalPrice: '£2,500/mo',
    launchDiscount: '16% Launch Discount',
    priceValue: 2100,
    originalPriceValue: 2500,
    currency: 'GBP',
    billingPeriod: 'monthly',
    capacity: 'Up to 120 hrs/month',
    description:
      'For portals, dashboards, workflow automation, backend/frontend coordination, and structured digital scale-up.',
    bestFor: [
      'Businesses running broader digital operations',
      'Portals and dashboards',
      'Workflow automation',
      'Backend/frontend coordination',
    ],
    included: [
      'Everything in Growth',
      'Custom workflows and admin systems',
      'Automation and process improvement',
      'Backend + frontend + QA coordination',
      'Structured release rhythm',
    ],
    limitations: [
      'Architecture-led transformation should move to Enterprise',
      'Complex governance needs Enterprise engagement',
    ],
    cta: 'Book a call for Scale',
    ctaHref: BOOK_CALL_URL,
  },
];

const maintenancePlan: PlanCard = {
  name: 'Maintenance Mode',
  launchPrice: '£405/mo',
  originalPrice: '£450/mo',
  launchDiscount: '10% Launch Discount',
  priceValue: 405,
  originalPriceValue: 450,
  currency: 'GBP',
  billingPeriod: 'monthly',
  capacity: '8-10 hrs/month focused continuity support',
  description:
    'For continuity, support, and stability between active build phases.',
  bestFor: [
    'Teams focused on stable operations between active build phases',
    'Routine upkeep and minor fixes',
    'Continuity without active monthly feature delivery',
  ],
  included: [
    'Minor bug fixes',
    'Routine upkeep',
    'Limited content/config updates',
    'Small support requests',
  ],
  limitations: ['No active redesign', 'No major new features', 'No deeper integrations'],
  cta: 'Move to Maintenance Mode',
  ctaHref: CONTACT_ENQUIRY_URL,
};

const enterprisePlan: PlanCard = {
  name: 'Enterprise',
  launchPrice: '£3,400/mo',
  originalPrice: '£4,000/mo',
  launchDiscount: '15% Launch Discount',
  priceValue: 3400,
  originalPriceValue: 4000,
  currency: 'GBP',
  billingPeriod: 'monthly',
  capacity: 'Custom pod / advanced delivery capacity',
  description:
    'For advanced platforms, architect-led delivery, and governance-heavy engagements.',
  bestFor: [
    'Complex integration-heavy systems',
    'Architect-led delivery',
    'Compliance or governance-heavy work',
    'Large-scale roadmap execution',
  ],
  included: [
    'Custom team shape',
    'Architecture support',
    'Stronger governance',
    'Advanced integration work',
    'Compliance-ready delivery support',
  ],
  limitations: ['Not required for standard website/CMS monthly delivery'],
  note: 'Custom scope after discovery may apply for advanced cases.',
    cta: 'Talk to us about Enterprise',
    ctaHref: BOOK_CALL_URL,
};

const transparencyColumns = [
  {
    title: 'Third-party vendor costs',
    icon: Cloud,
    items: [
      'Cloud hosting (AWS, GCP, Azure)',
      'Domain registration & SSL',
      'SaaS tool subscriptions',
    ],
  },
  {
    title: 'Optional Primewayz add-ons',
    icon: MonitorCog,
    items: [
      'Technical specialists',
      'Specialized UX/UI support',
      'Complex DevOps engineering',
    ],
  },
] as const;

const whySubscriptionItems = [
  {
    title: 'Flexibility',
    description:
      'Adjust your capacity monthly based on your roadmap and current priorities.',
    icon: SlidersHorizontal,
  },
  {
    title: 'Total transparency',
    description:
      'Clear pricing with vendor costs handled separately where applicable.',
    icon: ShieldCheck,
  },
  {
    title: 'Roadmap continuity',
    description:
      'Maintain delivery momentum without restarting procurement or project cycles.',
    icon: Route,
  },
  {
    title: 'Seamless maintenance',
    description:
      'Scale down when priorities slow, then restart active delivery when needed.',
    icon: Wrench,
  },
] as const;

const GroupLabel = ({ label }: { label: string }) => (
  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
    {label}
  </p>
);

const rememberSelectedPlan = (plan: PlanCard) => {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(
    'primewayz_selected_plan',
    JSON.stringify({
      plan_name: plan.name,
      plan_launch_price: plan.launchPrice,
      plan_price_value: plan.priceValue,
      currency: plan.currency,
      billing_period: plan.billingPeriod,
    })
  );
};

const getPlanTrackingParams = (plan: PlanCard) => ({
  plan_name: plan.name,
  plan_launch_price: plan.launchPrice,
  plan_original_price: plan.originalPrice,
  plan_price_value: plan.priceValue,
  plan_original_price_value: plan.originalPriceValue,
  currency: plan.currency,
  billing_period: plan.billingPeriod,
  plan_capacity: plan.capacity,
  plan_discount: plan.launchDiscount,
});

const FoundationFeaturedCard = ({ plan }: { plan: PlanCard }) => (
  <article className="rounded-3xl border border-emerald-300 bg-white p-6 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.55)] ring-1 ring-emerald-200 sm:p-7 lg:p-8">
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
      <div>
        <div className="mb-4 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
          START HERE
        </div>

        <h3 className="text-3xl font-semibold tracking-tight text-zinc-900">{plan.name}</h3>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            2026 Launch Price
          </p>
          <p className="mt-1 text-3xl font-bold text-zinc-900">{plan.launchPrice}</p>
          <p className="mt-1 text-sm text-zinc-500 line-through">{plan.originalPrice}</p>
          <p className="mt-2 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
            {plan.launchDiscount}
          </p>
        </div>

        <p className="mt-3 text-sm font-semibold text-zinc-700">{plan.capacity}</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">{plan.description}</p>

        <div className="mt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Best for
          </p>
          <ul className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            {plan.bestFor.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-zinc-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-4 sm:p-5">
        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-700">
          Included in Foundation Sprint
        </h4>
        <ul className="mt-3 space-y-2.5">
          {plan.included.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-zinc-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </aside>
    </div>

    <div className="mt-5 flex flex-col gap-3 border-t border-zinc-200/80 pt-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
          Limitations / not ideal for
        </p>
        <p className="mt-1 text-sm text-zinc-700">{plan.limitations?.[0]}</p>
      </div>

      <TrackedLink
        href={plan.ctaHref}
        ctaText={plan.cta}
        ctaLocation="pricing_featured_plan"
        eventType="pricing_plan_click"
        trackingParams={getPlanTrackingParams(plan)}
        onClick={() => rememberSelectedPlan(plan)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 sm:w-auto"
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4" />
      </TrackedLink>
    </div>
  </article>
);

const PlanCardBlock = ({ plan, featured }: { plan: PlanCard; featured?: boolean }) => (
  <article
    className={`rounded-3xl border bg-white p-6 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.55)] sm:p-7 ${
      plan.highlight
        ? 'border-blue-300 ring-1 ring-blue-200'
        : featured
          ? 'border-emerald-300 ring-1 ring-emerald-200'
          : 'border-zinc-200/90'
    }`}
  >
    {(plan.highlight || featured) && (
      <div
        className={`mb-4 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
          plan.highlight
            ? 'bg-blue-50 text-blue-700'
            : 'bg-emerald-50 text-emerald-700'
        }`}
      >
        {plan.highlight ? 'RECOMMENDED' : 'START HERE'}
      </div>
    )}

    <h3 className="text-2xl font-semibold tracking-tight text-zinc-900">{plan.name}</h3>

    <div className="mt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        2026 Launch Price
      </p>
      <p className="mt-1 text-3xl font-bold text-zinc-900">{plan.launchPrice}</p>
      <p className="mt-1 text-sm text-zinc-500 line-through">{plan.originalPrice}</p>
      <p
        className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] ${
          plan.highlight
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : featured
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-zinc-200 bg-zinc-100 text-zinc-700'
        }`}
      >
        {plan.launchDiscount}
      </p>
    </div>

    <p className="mt-3 text-sm font-semibold text-zinc-700">{plan.capacity}</p>
    <p className="mt-3 text-sm leading-6 text-zinc-600">{plan.description}</p>

    {plan.note && <p className="mt-2 text-xs font-medium text-zinc-500">{plan.note}</p>}

    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Best for</p>
      <ul className="mt-2 space-y-2">
        {plan.bestFor.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-zinc-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>

    <details className="mt-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4">
      <summary className="cursor-pointer list-none text-sm font-semibold text-zinc-800">
        Included scope details
      </summary>
      <ul className="mt-3 space-y-2">
        {plan.included.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-zinc-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </details>

    {plan.limitations && (
      <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-700">
          Limitations / not ideal for
        </p>
        <ul className="mt-2 space-y-2">
          {plan.limitations.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-zinc-700">
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    )}

    <TrackedLink
      href={plan.ctaHref}
      ctaText={plan.cta}
      ctaLocation={plan.highlight ? 'pricing_recommended_plan' : 'pricing_plan'}
      eventType="pricing_plan_click"
      trackingParams={getPlanTrackingParams(plan)}
      onClick={() => rememberSelectedPlan(plan)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
        plan.highlight
          ? 'bg-blue-700 text-white hover:bg-blue-800'
          : 'bg-zinc-900 text-white hover:bg-zinc-800'
      }`}
    >
      {plan.cta}
      <ArrowRight className="h-4 w-4" />
    </TrackedLink>
  </article>
);

export const Pricing = () => {
  return (
    <section id="pricing" className="bg-zinc-50 py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl"
          >
            Flexible delivery plans for every stage of growth
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="mx-auto mt-4 max-w-3xl text-base leading-7 text-zinc-600 md:text-lg"
          >
            Choose the capacity that fits your current roadmap. Start with a Foundation Sprint,
            scale through active delivery plans, or move to Maintenance Mode when priorities
            slow down.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 }}
          className="mx-auto mt-8 flex max-w-5xl flex-wrap justify-center gap-2.5"
        >
          {clarityBadges.map((rule) => (
            <div
              key={rule}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-zinc-700"
            >
              {rule}
            </div>
          ))}
        </motion.div>

        <div className="mt-12 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <FoundationFeaturedCard plan={foundationSprint} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-3"
          >
            <GroupLabel label="ACTIVE MONTHLY DELIVERY" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {activePlans.map((plan) => (
                <PlanCardBlock key={plan.name} plan={plan} />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
          >
            <div>
              <GroupLabel label="PAUSE OR CONTINUITY" />
              <PlanCardBlock plan={maintenancePlan} />
            </div>
            <div>
              <GroupLabel label="ADVANCED DELIVERY" />
              <PlanCardBlock plan={enterprisePlan} />
            </div>
          </motion.div>
        </div>

        <section className="mt-10 rounded-3xl border border-slate-700/95 bg-slate-900 p-7 text-slate-100 shadow-[0_28px_60px_-34px_rgba(2,6,23,0.85)] sm:mt-12 sm:p-9">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.3fr] lg:items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200/90">
                COMMERCIAL CLARITY
              </p>
              <h3 className="mt-3 text-[1.72rem] font-semibold tracking-tight text-white">
                Transparency first
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                All plans cover Primewayz delivery capacity. To ensure you always own your
                infrastructure and maintain full control, we separate our delivery fees from
                third-party vendor and operational costs.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {transparencyColumns.map((column) => (
                <div
                  key={column.title}
                  className="rounded-2xl border border-slate-600/90 bg-slate-800/70 p-4 shadow-[0_14px_28px_-24px_rgba(15,23,42,0.95)]"
                >
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                    <column.icon className="h-4 w-4 text-blue-200" />
                    {column.title}
                  </h4>
                  <ul className="mt-3 space-y-2">
                    {column.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-700">
              Why Subscription Works Better
            </p>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              Clear reasons UK teams choose capacity-based delivery
            </h3>
            <p className="mt-4 text-base leading-7 text-zinc-600">
              Instead of restarting projects whenever priorities change, your monthly support can
              scale, pause, continue, and restart around the roadmap your business actually needs.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {[
              {
                title: 'Flexibility',
                image: '/images/subscription-flexibility.webp',
                alt: 'Minimal dashboard showing monthly delivery capacity adjusted up or down based on roadmap priorities.',
                description:
                  'Adjust your capacity monthly based on your roadmap and current priorities.',
                points: [
                  'Scale delivery up when campaigns, fixes, or new features need momentum.',
                  'Reduce capacity when the roadmap slows down or internal priorities shift.',
                  'Keep support aligned with real business demand instead of fixed project cycles.',
                ],
                label: 'Capacity control',
              },
              {
                title: 'Total transparency',
                image: '/images/subscription-total-transparency.webp',
                alt: 'Transparent subscription pricing breakdown with Primewayz service fee separated from vendor costs.',
                description:
                  'Clear pricing with vendor costs handled separately where applicable.',
                points: [
                  'See what is part of Primewayz delivery and support.',
                  'Keep third-party costs like hosting, domain, SSL, and tools separate.',
                  'Avoid bundled pricing confusion and keep infrastructure ownership clear.',
                ],
                label: 'Clear commercial model',
              },
              {
                title: 'Roadmap continuity',
                image: '/images/subscription-roadmap-continuity.webp',
                alt: 'Continuous roadmap timeline showing steady delivery phases without restarting project cycles.',
                description:
                  'Maintain delivery momentum without restarting procurement or project cycles.',
                points: [
                  'Continue from foundation to scale, optimisation, and improvements.',
                  'Keep context, backlog, and delivery knowledge within one aligned team.',
                  'Build compound value over time instead of repeatedly starting from zero.',
                ],
                label: 'Continuous delivery',
              },
              {
                title: 'Seamless maintenance',
                image: '/images/subscription-seamless-maintenance.webp',
                alt: 'Workflow showing active delivery moving into maintenance mode and restarting active delivery when needed.',
                description:
                  'Scale down when priorities slow, then restart active delivery when needed.',
                points: [
                  'Move into maintenance mode when active delivery is not required.',
                  'Keep essential checks, updates, monitoring, and small improvements running.',
                  'Restart active delivery quickly when new priorities return.',
                ],
                label: 'Stay ready',
              },
            ].map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10"
              >
                <div className="aspect-[16/9] overflow-hidden bg-blue-50">
                  <img
                    src={item.image}
                    alt={item.alt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="p-6 lg:p-7">
                  <div className="mb-4 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                    {item.label}
                  </div>

                  <h4 className="text-2xl font-black tracking-tight text-zinc-950">
                    {item.title}
                  </h4>

                  <p className="mt-3 text-sm leading-7 text-zinc-600">
                    {item.description}
                  </p>

                  <ul className="mt-5 space-y-3">
                    {item.points.map((point) => (
                      <li key={point} className="flex gap-3 text-sm leading-6 text-zinc-600">
                        <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
                          ✓
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};
