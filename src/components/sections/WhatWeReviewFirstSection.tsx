import { motion } from 'motion/react';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import {
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  Search,
  Settings,
  ShieldCheck,
  Waypoints,
  type LucideIcon,
} from 'lucide-react';

const TEAL = '#087E8B';
const BORDER = '#D7E7EC';
const ICON_SURFACE = '#EAF7FA';
const SECTION_BG = '#FFFFFF';
const BODY = '#334155';

type ReviewCard = {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const reviewCards: ReviewCard[] = [
  {
    number: '01.',
    title: 'Search Readiness',
    description: 'Can search engines and AI discovery understand your pages clearly?',
    icon: Search,
  },
  {
    number: '02.',
    title: 'Trust Signals',
    description: 'Does the site show enough credibility, clarity and confidence for first-time visitors?',
    icon: ShieldCheck,
  },
  {
    number: '03.',
    title: 'Enquiry Path',
    description: 'Are the right calls-to-action, forms and booking routes easy to find and use?',
    icon: Waypoints,
  },
  {
    number: '04.',
    title: 'Tracking Basics',
    description: 'Can we see what is working through CTA clicks, submissions and source attribution?',
    icon: ChartNoAxesCombined,
  },
  {
    number: '05.',
    title: 'Technical Foundations',
    description: 'Are speed, structure, indexing and essential website basics in place?',
    icon: Settings,
  },
];

function ReviewCardItem({ number, title, description, icon: Icon }: ReviewCard) {
  return (
    <article
      className="flex min-h-[280px] flex-col rounded-[22px] border bg-white px-6 py-8 sm:min-h-[300px] sm:px-7"
      style={{ borderColor: BORDER }}
    >
      <div
        className="mx-auto flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full sm:h-20 sm:w-20"
        style={{ backgroundColor: ICON_SURFACE, color: '#000A2D' }}
      >
        <Icon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.7} aria-hidden />
      </div>

      <p className="mt-6 text-sm font-bold" style={{ color: TEAL }}>
        {number}
      </p>

      <h3 className="mt-2 text-xl font-bold leading-snug text-brand-navy sm:text-[1.35rem]">{title}</h3>

      <span className="mt-3 block h-0.5 w-10 rounded-full" style={{ backgroundColor: TEAL }} aria-hidden />

      <p className="mt-4 flex-1 text-sm leading-7 sm:text-base sm:leading-7" style={{ color: BODY }}>
        {description}
      </p>
    </article>
  );
}

export const WhatWeReviewFirstSection = () => {
  const reveal = useRevealMotion();

  return (
  <section
    id="what-we-review-first"
    className="py-20 md:py-24"
    style={{ backgroundColor: SECTION_BG }}
    aria-labelledby="what-we-review-first-heading"
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
          What we review first
        </p>

        <h2
          id="what-we-review-first-heading"
          className="mt-6 text-[2rem] font-bold leading-[1.12] tracking-[-0.04em] text-brand-navy sm:text-4xl md:text-5xl lg:text-[3.25rem]"
        >
          A practical review before any
          <br className="hidden sm:block" />
          <span className="sm:sr-only"> </span>
          monthly support work begins
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
          We look at the most important factors that influence visibility, trust and enquiries before
          deciding what to fix first.
        </p>
      </motion.div>

      <div className="mx-auto mt-12 grid max-w-[1040px] gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4 xl:gap-5">
        {reviewCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={reveal.initial({ opacity: 0, y: 20 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: index * 0.05 }}
          >
            <ReviewCardItem {...card} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={reveal.initial({ opacity: 0, y: 16 })}
        whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-10 rounded-[22px] border bg-[#FAFCFD] p-6 sm:mt-12 sm:p-8"
        style={{ borderColor: BORDER }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16"
            style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
            aria-hidden
          >
            <Check className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-brand-navy sm:text-2xl">Why this matters</h3>
            <p className="mt-2 text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
              Good monthly support starts with the right diagnosis. We review first so the most
              important actions get attention first.
            </p>
          </div>

          <span className="hidden h-20 w-px shrink-0 lg:block" style={{ backgroundColor: '#CBDDE3' }} aria-hidden />

          <a
            href="#audit-led-process"
            className="inline-flex shrink-0 items-center gap-2 border-b-2 pb-1 text-base font-bold transition hover:gap-3 sm:text-lg"
            style={{ color: TEAL, borderColor: TEAL }}
          >
            From review to prioritised action
            <ArrowRight className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          </a>
        </div>
      </motion.div>
    </div>
  </section>
  );
};
