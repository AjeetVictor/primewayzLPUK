import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { ArrowRight, ClipboardCheck, FileText, Info, PoundSterling, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

const TEAL = '#087E8B';
const BORDER = '#D7E7EC';
const ICON_SURFACE = '#EAF7FA';
const SECTION_BG = '#FCFCFD';
const BODY = '#334155';

type ClarityCard = {
  title: string;
  description: string;
  icon: ReactNode;
};

const clarityCards: ClarityCard[] = [
  {
    title: 'Clear support scope',
    description:
      'We match the support route to your current priority instead of forcing a large package.',
    icon: <ClipboardCheck className="h-12 w-12 sm:h-14 sm:w-14" strokeWidth={1.5} aria-hidden />,
  },
  {
    title: 'Third-party costs separated',
    description:
      'Hosting, plugins, ad spend and external subscriptions are discussed separately and transparently.',
    icon: (
      <span className="relative inline-flex" aria-hidden>
        <FileText className="h-12 w-12 sm:h-14 sm:w-14" strokeWidth={1.5} />
        <span
          className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white"
          style={{ color: TEAL }}
        >
          <PoundSterling className="h-5 w-5" strokeWidth={2} />
        </span>
      </span>
    ),
  },
  {
    title: 'Practical next step',
    description:
      'Start with a focused sprint, monthly support or maintenance based on what your business needs now.',
    icon: <Target className="h-12 w-12 sm:h-14 sm:w-14" strokeWidth={1.5} aria-hidden />,
  },
];

function ClarityCardItem({ title, description, icon }: ClarityCard) {
  return (
    <article
      className="flex min-h-[280px] flex-col rounded-[22px] border bg-white px-7 py-9 sm:min-h-[300px] sm:px-8 sm:py-10"
      style={{ borderColor: BORDER }}
    >
      <div className="text-brand-navy" style={{ color: '#000A2D' }}>
        {icon}
      </div>

      <h3 className="mt-8 text-2xl font-bold leading-tight text-brand-navy">{title}</h3>

      <p className="mt-5 flex-1 text-base leading-7" style={{ color: BODY }}>
        {description}
      </p>
    </article>
  );
}

export const CommercialClaritySection = () => {
  const reveal = useRevealMotion();

  return (
  <section
    id="commercial-clarity"
    className="py-20 md:py-24"
    style={{ backgroundColor: SECTION_BG }}
    aria-labelledby="commercial-clarity-heading"
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
          Commercial clarity
        </p>

        <h2
          id="commercial-clarity-heading"
          className="mt-6 text-[2rem] font-bold leading-[1.12] tracking-[-0.04em] text-brand-navy sm:text-4xl md:text-5xl lg:text-[3.25rem]"
        >
          Simple support options,
          <br className="hidden sm:block" />
          <span className="sm:sr-only"> </span>
          with costs discussed clearly
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
          We keep the starting point simple and discuss additional tools or third-party costs before
          work begins.
        </p>
      </motion.div>

      <div className="mx-auto mt-12 grid max-w-[1040px] gap-5 md:grid-cols-3 lg:gap-6">
        {clarityCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={reveal.initial({ opacity: 0, y: 20 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
          >
            <ClarityCardItem {...card} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={reveal.initial({ opacity: 0, y: 16 })}
        whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mx-auto mt-10 max-w-[1040px] rounded-[22px] border bg-white p-6 sm:mt-12 sm:p-8"
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

          <div className="min-w-0 flex-1">
            <h3 className="text-xl font-bold text-brand-navy sm:text-2xl">Need the full breakdown?</h3>
            <p className="mt-2 text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
              Detailed inclusions, support models and commercial notes are available on the pricing
              page.
            </p>
          </div>

          <span className="hidden h-20 w-px shrink-0 lg:block" style={{ backgroundColor: '#CBDDE3' }} aria-hidden />

          <Link
            to="/pricing"
            className="inline-flex shrink-0 items-center gap-2 border-b-2 pb-1 text-base font-bold transition hover:gap-3 sm:text-lg"
            style={{ color: TEAL, borderColor: TEAL }}
          >
            View full pricing
            <ArrowRight className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          </Link>
        </div>
      </motion.div>
    </div>
  </section>
  );
};
