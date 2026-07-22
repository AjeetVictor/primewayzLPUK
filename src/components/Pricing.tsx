import { Link } from 'react-router-dom';
import { TrackedLink } from './common/TrackedLink';
import { motion } from 'motion/react';
import { BOOK_CALL_URL } from '../constants/contactBooking';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Coins,
  FileText,
  Info,
  PhoneCall,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';

type PriceCard = {
  number: string;
  name: string;
  description: string;
  priceLabel: string;
  price: string;
  originalPrice: string;
  discount: string;
  capacityLines: string[];
  bestFor: string[];
  cta: string;
  ctaHref: string;
  tone: 'cyan' | 'blue' | 'purple';
  recommended?: boolean;
  priceValue: number;
  originalPriceValue: number;
  billingPeriod: 'one_time' | 'monthly';
};

const infoItems: Array<{ label: string; icon: LucideIcon }> = [
  { label: 'Prices shown ex VAT', icon: FileText },
  { label: 'Third-party vendor costs billed separately', icon: Coins },
  { label: 'Flexible monthly capacity', icon: CalendarDays },
  { label: 'Move to maintenance anytime', icon: RefreshCw },
];

const pricingCards: PriceCard[] = [
  {
    number: '01',
    name: 'Foundation Sprint',
    description: 'A structured starting phase for discovery, planning, setup and launch readiness.',
    priceLabel: '2026 Launch Price',
    price: '\u00A3722.50',
    originalPrice: '\u00A3850 one-time',
    discount: '15% Launch Discount',
    capacityLines: ['2-4 week structured', 'launch phase'],
    bestFor: [
      'New website or platform starts',
      'CMS setup',
      'Technical SEO baseline',
      'Launch preparation',
    ],
    cta: 'Start here',
    ctaHref: BOOK_CALL_URL,
    tone: 'cyan',
    priceValue: 722.5,
    originalPriceValue: 850,
    billingPeriod: 'one_time',
  },
  {
    number: '02',
    name: 'Essential',
    description: 'Ongoing subscription delivery with proactive support and continuous progress.',
    priceLabel: 'Starting from',
    price: '\u00A3741/mo',
    originalPrice: '\u00A3950',
    discount: '22% Launch Discount',
    capacityLines: ['Up to 40 hrs/month', '1 active workstream'],
    bestFor: [
      'Core website and CMS work',
      'Light integrations & updates',
      'Technical SEO & performance',
      'Continuous improvements',
    ],
    cta: 'View plans',
    ctaHref: BOOK_CALL_URL,
    tone: 'blue',
    priceValue: 741,
    originalPriceValue: 950,
    billingPeriod: 'monthly',
  },
  {
    number: '03',
    name: 'Growth',
    description: 'Ongoing subscription delivery with proactive support and continuous progress.',
    priceLabel: 'Starting from',
    price: '\u00A31,189/mo',
    originalPrice: '\u00A31,450',
    discount: '18% Launch Discount',
    capacityLines: ['Up to 80 hrs/month', 'Multiple workstreams'],
    bestFor: [
      'Growing websites & platforms',
      'Enhancements & optimisations',
      'Landing pages & conversions',
      'CRM & light API integrations',
    ],
    cta: 'View plans',
    ctaHref: BOOK_CALL_URL,
    tone: 'blue',
    recommended: true,
    priceValue: 1189,
    originalPriceValue: 1450,
    billingPeriod: 'monthly',
  },
  {
    number: '04',
    name: 'Scale',
    description: 'Broader delivery capacity for structured digital operations and product work.',
    priceLabel: 'Starting from',
    price: '\u00A32,100/mo',
    originalPrice: '\u00A32,500',
    discount: '16% Launch Discount',
    capacityLines: ['Up to 120 hrs/month', 'Structured delivery capacity'],
    bestFor: [
      'Broader digital operations',
      'Portals and dashboards',
      'Workflow automation',
      'Backend/frontend coordination',
    ],
    cta: 'Book a call',
    ctaHref: BOOK_CALL_URL,
    tone: 'blue',
    priceValue: 2100,
    originalPriceValue: 2500,
    billingPeriod: 'monthly',
  },
  {
    number: '05',
    name: 'Maintenance Mode',
    description: 'Lower-capacity continuity support when priorities slow down.',
    priceLabel: 'Starting from',
    price: '\u00A3405/mo',
    originalPrice: '\u00A3450',
    discount: '10% Launch Discount',
    capacityLines: ['8-10 hrs/month', 'Focused continuity support'],
    bestFor: [
      'Stable websites & platforms',
      'Routine updates & fixes',
      'Security & performance',
      'Support without active delivery',
    ],
    cta: 'Move to maintenance',
    ctaHref: BOOK_CALL_URL,
    tone: 'purple',
    priceValue: 405,
    originalPriceValue: 450,
    billingPeriod: 'monthly',
  },
  {
    number: '06',
    name: 'Enterprise',
    description: 'Advanced delivery for larger programmes, multi-team environments and governance-heavy needs.',
    priceLabel: 'Starting from',
    price: '\u00A33,400/mo',
    originalPrice: '\u00A34,000',
    discount: '15% Launch Discount',
    capacityLines: ['Custom capacity', 'and engagement model'],
    bestFor: [
      'Complex integrations',
      'Multi-team programmes',
      'Governance & compliance',
      'Large-scale roadmaps',
    ],
    cta: 'Talk to us',
    ctaHref: BOOK_CALL_URL,
    tone: 'cyan',
    priceValue: 3400,
    originalPriceValue: 4000,
    billingPeriod: 'monthly',
  },
];

const toneClasses = {
  cyan: {
    number: 'text-brand-cyan',
    check: 'text-brand-cyan',
    badge: 'border-cyan-100 bg-cyan-50 text-cyan-700',
    button: 'border-brand-cyan text-brand-cyan hover:bg-brand-cyan hover:text-white',
  },
  blue: {
    number: 'text-blue-700',
    check: 'text-blue-700',
    badge: 'border-blue-100 bg-blue-50 text-blue-700',
    button: 'border-blue-700 bg-blue-700 text-white hover:bg-blue-800',
  },
  purple: {
    number: 'text-purple-700',
    check: 'text-purple-700',
    badge: 'border-purple-100 bg-purple-50 text-purple-700',
    button: 'border-purple-400 text-purple-700 hover:bg-purple-700 hover:text-white',
  },
} as const;

const getPlanTrackingParams = (plan: PriceCard) => ({
  plan_name: plan.name,
  plan_launch_price: plan.price,
  plan_original_price: plan.originalPrice,
  plan_price_value: plan.priceValue,
  plan_original_price_value: plan.originalPriceValue,
  currency: 'GBP',
  billing_period: plan.billingPeriod,
  plan_capacity: plan.capacityLines.join(' / '),
  plan_discount: plan.discount,
});

const rememberSelectedPlan = (plan: PriceCard) => {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(
    'primewayz_selected_plan',
    JSON.stringify({
      plan_name: plan.name,
      plan_launch_price: plan.price,
      plan_price_value: plan.priceValue,
      currency: 'GBP',
      billing_period: plan.billingPeriod,
    })
  );
};

const PricingCard = ({ plan }: { plan: PriceCard }) => {
  const tone = toneClasses[plan.tone];

  return (
    <article
      className={`flex h-full flex-col rounded-[22px] border bg-white p-6 shadow-[0_18px_46px_-38px_rgba(15,23,42,0.55)] ${
        plan.recommended ? 'border-blue-300 ring-1 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <div className="flex min-h-[24px] items-center justify-between gap-3">
        <p className={`text-sm font-black ${tone.number}`}>{plan.number}</p>
        {plan.recommended ? (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-blue-700">
            Recommended
          </span>
        ) : null}
      </div>

      <h2 className="mt-4 text-xl font-black uppercase leading-tight tracking-[0.04em] text-brand-navy">
        {plan.name}
      </h2>
      <p className="mt-4 min-h-[72px] text-sm leading-6 text-slate-600">{plan.description}</p>

      <div className="mt-5">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
          {plan.priceLabel}
        </p>
        <p className="mt-2 text-3xl font-black tracking-tight text-brand-navy">{plan.price}</p>
        <p className="mt-1 text-sm font-medium text-slate-500 line-through">{plan.originalPrice}</p>
        <span
          className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${tone.badge}`}
        >
          {plan.discount}
        </span>
      </div>

      <p className="mt-5 text-sm font-bold leading-6 text-brand-navy">
        {plan.capacityLines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </p>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">Best for</p>
        <ul className="mt-3 space-y-3">
          {plan.bestFor.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-5 text-slate-700">
              <Check className={`mt-0.5 h-4 w-4 shrink-0 ${tone.check}`} strokeWidth={2.2} aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <TrackedLink
        href={plan.ctaHref}
        ctaText={plan.cta}
        ctaLocation={plan.recommended ? 'pricing_recommended_plan' : 'pricing_plan'}
        eventType="pricing_plan_click"
        trackingParams={getPlanTrackingParams(plan)}
        onClick={() => rememberSelectedPlan(plan)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`mt-7 inline-flex min-h-[46px] w-full items-center justify-center rounded-xl border px-4 py-3 text-sm font-black transition ${tone.button}`}
      >
        {plan.cta}
        <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2} aria-hidden />
      </TrackedLink>
    </article>
  );
};

export const Pricing = () => {
  return (
    <main className="bg-[#FBFCFE] pb-20 pt-8 text-brand-navy sm:pb-24 sm:pt-10">
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <nav className="text-sm font-semibold text-slate-500" aria-label="Breadcrumb">
          <Link to="/" className="transition hover:text-brand-cyan">
            Home
          </Link>
          <span className="mx-2 text-slate-400" aria-hidden>
            &gt;
          </span>
          <span className="text-slate-700">Pricing</span>
        </nav>

        <section className="mx-auto mt-8 max-w-4xl text-center sm:mt-10">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black leading-[1.05] tracking-[-0.04em] text-brand-navy sm:text-5xl lg:text-6xl"
          >
            Simple, transparent pricing
            <br className="hidden sm:block" />
            <span className="sm:sr-only"> </span>
            for every stage of growth
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="mx-auto mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg"
          >
            Choose the engagement model and capacity that fit your roadmap. Start with a Foundation
            Sprint, progress through fixed-scope or structured monthly delivery, move to Maintenance
            Mode when priorities slow down, or add dedicated technical capacity when continuity matters.
          </motion.p>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-9 grid max-w-[980px] gap-0 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_18px_44px_-40px_rgba(15,23,42,0.6)] sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Pricing notes"
        >
          {infoItems.map((item, index) => (
            <div
              key={item.label}
              className={`flex min-h-[72px] items-center gap-4 px-5 py-4 ${
                index > 0 ? 'border-t border-slate-200 sm:border-l sm:border-t-0' : ''
              } ${index === 2 ? 'sm:border-l-0 lg:border-l' : ''}`}
            >
              <item.icon className="h-7 w-7 shrink-0 text-brand-cyan" strokeWidth={1.8} aria-hidden />
              <p className="text-sm font-black leading-5 text-slate-700">{item.label}</p>
            </div>
          ))}
        </motion.section>

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Pricing cards">
          {pricingCards.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.42, delay: index * 0.04 }}
            >
              <PricingCard plan={plan} />
            </motion.div>
          ))}
        </section>

        <section className="mt-9 rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_18px_44px_-40px_rgba(15,23,42,0.6)] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto_0.4fr] lg:items-center">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-brand-cyan text-brand-cyan">
                <Info className="h-5 w-5" strokeWidth={2} aria-hidden />
              </div>
              <p className="text-base leading-7 text-slate-700">
                <span className="font-black text-brand-navy">Clear commercial structure:</span>{' '}
                Primewayz delivery fees are separated from third-party costs such as hosting,
                domains, SSL, tools and ad spend.
              </p>
            </div>

            <span className="hidden h-16 w-px bg-slate-200 lg:block" aria-hidden />

            <p className="text-base font-bold leading-7 text-brand-navy">
              Same subscription model.
              <br />
              <span className="text-brand-cyan">Simplified for clarity.</span>
            </p>
          </div>
        </section>

        <section className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-5 text-center sm:flex-row sm:justify-center sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-brand-cyan">
            <PhoneCall className="h-7 w-7" strokeWidth={1.8} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-brand-navy">
              Not sure which plan fits best?
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Let's talk through your roadmap and priorities.
            </p>
          </div>
          <TrackedLink
            href={BOOK_CALL_URL}
            ctaText="Book a discovery call"
            ctaLocation="pricing_bottom_cta"
            eventType="book_call_click"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl bg-brand-navy px-6 py-3 text-sm font-black text-white transition hover:bg-brand-navy/90"
          >
            Book a discovery call
            <ArrowRight className="ml-2 h-4 w-4" strokeWidth={2} aria-hidden />
          </TrackedLink>
        </section>
      </div>
    </main>
  );
};
