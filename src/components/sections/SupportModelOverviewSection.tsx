import { motion } from 'motion/react';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import {
  ArrowRight,
  Building2,
  Info,
  Rocket,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BOOK_CALL_URL } from '../../constants/contactBooking';

const TEAL = '#087E8B';
const BORDER = '#D7E7EC';
const ICON_SURFACE = '#EAF7FA';
const SECTION_BG = '#FFFFFF';
const BODY = '#334155';
const CHIP_BG = '#E6F7F9';

type ModelCard = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  chips?: string[];
};

const modelCards: ModelCard[] = [
  {
    number: '01',
    title: 'Foundation Sprint',
    description: 'One-time starting phase focused on discovery, structure and launch-readiness.',
    icon: Rocket,
  },
  {
    number: '02',
    title: 'Active Monthly Delivery',
    description: 'Ongoing subscription delivery with proactive support and continuous progress.',
    icon: TrendingUp,
    chips: ['Essential', 'Growth', 'Scale'],
  },
  {
    number: '03',
    title: 'Maintenance Mode',
    description: 'Lower-capacity continuity support when priorities slow down.',
    icon: Wrench,
  },
  {
    number: '04',
    title: 'Enterprise',
    description:
      'Advanced delivery for larger programs, multi-team environments and governance-heavy needs.',
    icon: Building2,
  },
];

function SolidConnector() {
  return (
    <div className="hidden items-center justify-center lg:flex" aria-hidden>
      <ArrowRight className="h-7 w-7 text-brand-navy" strokeWidth={2} />
    </div>
  );
}

function DashedSplitConnector() {
  return (
    <div className="relative hidden w-8 items-center justify-center lg:flex" aria-hidden>
      <svg viewBox="0 0 32 80" className="h-20 w-8" fill="none">
        <path
          d="M4 40 H20 M20 40 L28 24 M20 40 L28 56"
          stroke={TEAL}
          strokeWidth="1.75"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        <path d="M28 24 L32 24 M28 56 L32 56" stroke={TEAL} strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function ModelCardItem({ number, title, description, icon: Icon, chips }: ModelCard) {
  return (
    <article
      className="flex min-h-[300px] flex-col rounded-[22px] border bg-white px-6 py-8 sm:min-h-[320px] sm:px-7"
      style={{ borderColor: BORDER }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
      >
        <Icon className="h-7 w-7" strokeWidth={1.7} aria-hidden />
      </div>

      <p className="mt-5 text-sm font-bold" style={{ color: TEAL }}>
        {number}
      </p>

      <h3 className="mt-2 text-xl font-bold leading-snug text-brand-navy sm:text-[1.35rem]">{title}</h3>

      <span className="mt-3 block h-0.5 w-10 rounded-full" style={{ backgroundColor: TEAL }} aria-hidden />

      <p className="mt-4 flex-1 text-sm leading-7 sm:text-base" style={{ color: BODY }}>
        {description}
      </p>

      {chips ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: CHIP_BG, color: TEAL }}
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export const SupportModelOverviewSection = () => {
  const reveal = useRevealMotion();

  return (
  <section
    id="pricing"
    className="py-20 md:py-24"
    style={{ backgroundColor: SECTION_BG }}
    aria-labelledby="support-model-overview-heading"
  >
    <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={reveal.initial({ opacity: 0, y: 20 })}
        whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl"
      >
        <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
          Support model overview
        </p>

        <h2
          id="support-model-overview-heading"
          className="mt-6 text-[2rem] font-bold leading-[1.12] tracking-[-0.04em] text-brand-navy sm:text-4xl md:text-5xl lg:text-[3.25rem]"
        >
          Our subscription model stays —
          <br className="hidden sm:block" />
          <span className="sm:sr-only"> </span>
          this section simply makes it easier to understand.
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
          The full plan details and pricing are still on the pricing page.
          <br className="hidden sm:block" />
          This overview helps you quickly choose the right route for your priorities.
        </p>
      </motion.div>

      <div className="mx-auto mt-12 max-w-[1040px]">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr_auto_1fr_1fr] lg:items-stretch lg:gap-3 xl:gap-4">
          <ModelCardItem {...modelCards[0]} />
          <SolidConnector />
          <ModelCardItem {...modelCards[1]} />
          <DashedSplitConnector />
          <ModelCardItem {...modelCards[2]} />
          <ModelCardItem {...modelCards[3]} />
        </div>
      </div>

      <motion.div
        initial={reveal.initial({ opacity: 0, y: 16 })}
        whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mx-auto mt-10 max-w-[1040px] rounded-[22px] border bg-[#FAFCFD] p-6 sm:mt-12 sm:p-8"
        style={{ borderColor: BORDER }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16"
            style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
            aria-hidden
          >
            <Info className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.8} />
          </div>

          <p className="min-w-0 flex-1 text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
            <span className="font-bold text-brand-navy">Clear commercial structure:</span>{' '}
            Primewayz delivery fees are separated from third-party costs such as hosting, domains,
            SSL, tools and ad spend.
          </p>

          <span className="hidden h-20 w-px shrink-0 lg:block" style={{ backgroundColor: '#CBDDE3' }} aria-hidden />

          <p className="shrink-0 text-base font-medium leading-7 sm:text-lg" style={{ color: BODY }}>
            Same subscription model.
            <br />
            <span className="font-bold" style={{ color: TEAL }}>
              Simplified for clarity.
            </span>
          </p>
        </div>
      </motion.div>

      <div className="mx-auto mt-8 flex max-w-[1040px] flex-col items-stretch justify-end gap-4 sm:flex-row sm:justify-end">
        <Link
          to="/pricing"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 bg-white px-6 py-3 text-base font-bold text-brand-navy transition hover:bg-slate-50"
          style={{ borderColor: '#000A2D' }}
        >
          View full pricing
          <ArrowRight className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </Link>
        <a
          href={BOOK_CALL_URL}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-base font-bold text-white transition hover:bg-brand-navy/90"
        >
          Book a discovery call
          <ArrowRight className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </a>
      </div>
    </div>
  </section>
  );
};
