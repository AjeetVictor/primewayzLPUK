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
const SECTION_BG = '#FCFCFD';
const BODY = '#334155';

type ModelCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const modelCards: ModelCard[] = [
  {
    title: 'Foundation Sprint',
    description: 'One-time starting phase for discovery, structure and launch readiness.',
    icon: Rocket,
  },
  {
    title: 'Monthly Delivery',
    description: 'Ongoing subscription support for improvements, CRM, SEO foundations and delivery work.',
    icon: TrendingUp,
  },
  {
    title: 'Maintenance Mode',
    description: 'Lower-capacity continuity support when active delivery is not required.',
    icon: Wrench,
  },
  {
    title: 'Enterprise',
    description: 'Advanced delivery support for larger programmes, integrations and governance-heavy needs.',
    icon: Building2,
  },
];

function ModelCardItem({ title, description, icon: Icon }: ModelCard) {
  return (
    <article
      className="flex min-h-[212px] flex-col rounded-[18px] border bg-white px-5 py-6 shadow-sm shadow-slate-950/[0.03] sm:px-6"
      style={{ borderColor: BORDER }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
      >
        <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden />
      </div>

      <h3 className="mt-5 text-lg font-bold leading-snug text-brand-navy sm:text-xl">{title}</h3>

      <span className="mt-3 block h-0.5 w-10 rounded-full" style={{ backgroundColor: TEAL }} aria-hidden />

      <p className="mt-4 flex-1 text-sm leading-6" style={{ color: BODY }}>
        {description}
      </p>
    </article>
  );
}

export const CommercialClaritySection = () => {
  const reveal = useRevealMotion();

  return (
  <section
    id="pricing"
    className="scroll-mt-28 py-16 md:py-20"
    style={{ backgroundColor: SECTION_BG }}
    aria-labelledby="pricing-heading"
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
          Pricing & support model
        </p>

        <h2
          id="pricing-heading"
          className="mt-5 text-[2rem] font-bold leading-[1.12] tracking-[-0.04em] text-brand-navy sm:text-4xl md:text-5xl lg:text-[3.1rem]"
        >
          Simple support options,
          <br className="hidden sm:block" />
          <span className="sm:sr-only"> </span>
          with clear pricing routes
        </h2>

        <p className="mt-5 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
          Start with a foundation sprint, move into monthly delivery, switch to maintenance when
          priorities slow down, or discuss enterprise support for larger needs.
        </p>
      </motion.div>

      <div className="mx-auto mt-10 grid max-w-[1040px] gap-4 md:grid-cols-2 lg:grid-cols-4">
        {modelCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={reveal.initial({ opacity: 0, y: 20 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: index * 0.05 }}
          >
            <ModelCardItem {...card} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={reveal.initial({ opacity: 0, y: 14 })}
        whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mx-auto mt-8 max-w-[1040px] rounded-[18px] border bg-white p-5 sm:p-6"
        style={{ borderColor: BORDER }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
            aria-hidden
          >
            <Info className="h-5 w-5" strokeWidth={1.9} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-brand-navy">Commercial clarity</h3>
            <p className="mt-2 text-sm leading-6 sm:text-base sm:leading-7" style={{ color: BODY }}>
              Primewayz delivery fees are separated from third-party costs such as hosting,
              domains, SSL, tools, subscriptions and ad spend.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="mx-auto mt-7 flex max-w-[1040px] flex-col items-stretch gap-3 sm:flex-row">
        <Link
          to="/pricing"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-brand-navy px-6 py-3 text-sm font-bold text-brand-navy transition hover:bg-brand-navy hover:text-white"
        >
          View full pricing
          <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.9} aria-hidden />
        </Link>
        <Link
          to={BOOK_CALL_URL}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-brand-navy px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-navy/90"
        >
          Book a discovery call
          <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.9} aria-hidden />
        </Link>
      </div>
    </div>
  </section>
  );
};
