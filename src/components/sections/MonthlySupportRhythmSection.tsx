import { motion } from 'motion/react';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import {
  ArrowRight,
  ChartNoAxesCombined,
  ClipboardCheck,
  Settings2,
  ShieldCheck,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ServiceNavIcon } from '../ui/ServiceNavIcon';
import { trackConversionEvent } from '../../lib/analytics';
import { SUPPORT_RHYTHM_INNER_CLASS } from '../../constants/siteLayout';

const TEAL = '#087E8B';
const CYAN = '#31A1D3';
const BORDER = '#D7E7EC';
const SECTION_BG = '#FAFAF7';
const BODY = '#526072';
const BADGE = '#13AFC0';
const MAINTENANCE_BORDER = '#BDEFF4';
const MAINTENANCE_BG = '#F0FBFD';

type RhythmStep = {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
};

const rhythmSteps: RhythmStep[] = [
  {
    number: 1,
    title: 'Review',
    description: 'We assess your website, systems or delivery priorities.',
    icon: ClipboardCheck,
  },
  {
    number: 2,
    title: 'Prioritise',
    description: 'We identify the highest-impact work first.',
    icon: Target,
  },
  {
    number: 3,
    title: 'Improve',
    description: 'We implement focused changes with clear delivery.',
    icon: Settings2,
  },
  {
    number: 4,
    title: 'Track',
    description: 'We monitor progress, enquiries and next actions.',
    icon: ChartNoAxesCombined,
  },
];

function RhythmStepCard({ number, title, description, icon }: RhythmStep) {
  return (
    <article
      className="flex min-h-[300px] min-w-0 flex-col rounded-3xl border bg-white p-6 text-center shadow-[0_10px_28px_-24px_rgba(0,10,45,0.12)] transition duration-200 hover:-translate-y-1 hover:border-[#31A1D3]/50 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:min-h-[310px] sm:p-7 md:min-w-[210px]"
      style={{ borderColor: BORDER }}
    >
      <div className="mx-auto">
        <ServiceNavIcon icon={icon} tone="teal" size="xl" />
      </div>

      <span
        className="mx-auto mt-5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: BADGE }}
        aria-hidden
      >
        {number}
      </span>

      <h3 className="mt-5 text-xl font-bold text-brand-navy sm:text-2xl">{title}</h3>

      <p className="mx-auto mt-4 max-w-[11.875rem] flex-1 text-sm leading-7 sm:text-base" style={{ color: BODY }}>
        {description}
      </p>
    </article>
  );
}

export const MonthlySupportRhythmSection = () => {
  const reveal = useRevealMotion();

  return (
  <section
    id="support-model"
    className="py-20 md:py-24"
    style={{ backgroundColor: SECTION_BG }}
    aria-labelledby="monthly-support-rhythm-heading"
  >
    <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={reveal.initial({ opacity: 0, y: 20 })}
        whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
            After you choose a route
          </p>

          <h2
            id="monthly-support-rhythm-heading"
            className="mt-5 text-[2rem] font-bold leading-tight tracking-[-0.04em] text-brand-navy sm:text-4xl md:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
          >
            Move forward with a structured
            <br className="hidden sm:block" />
            <span className="sm:sr-only"> </span>
            monthly support rhythm
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
            Whichever support path you start with, we help you review, prioritise, improve and track
            progress in a practical monthly rhythm.
          </p>
        </div>

        <div className={`${SUPPORT_RHYTHM_INNER_CLASS} mt-10 sm:mt-12`}>
          <div className="grid gap-5 md:grid-cols-2 lg:hidden">
            {rhythmSteps.map((step) => (
              <RhythmStepCard key={step.title} {...step} />
            ))}
          </div>

          <div className="hidden gap-3 lg:grid lg:grid-cols-[minmax(210px,1fr)_auto_minmax(210px,1fr)_auto_minmax(210px,1fr)_auto_minmax(210px,1fr)] lg:items-center">
            {rhythmSteps.map((step, index) => (
              <div key={step.title} className="contents">
                <RhythmStepCard {...step} />
                {index < rhythmSteps.length - 1 ? (
                  <ArrowRight
                    className="mx-auto h-[1.625rem] w-[1.625rem] shrink-0"
                    style={{ color: CYAN }}
                    strokeWidth={1.8}
                    aria-hidden
                  />
                ) : null}
              </div>
            ))}
          </div>

          <motion.div
            initial={reveal.initial({ opacity: 0, y: 12 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="mt-8 rounded-3xl border px-5 py-6 sm:mt-9 sm:px-7 sm:py-7 md:px-9"
            style={{ borderColor: MAINTENANCE_BORDER, backgroundColor: MAINTENANCE_BG }}
          >
            <div className="grid gap-6 lg:grid-cols-[auto_auto_minmax(0,1fr)_auto] lg:items-center lg:gap-8">
              <div className="flex items-start gap-5 sm:items-center sm:gap-6 lg:contents">
                <div
                  className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full border bg-white sm:h-20 sm:w-20"
                  style={{ borderColor: MAINTENANCE_BORDER, color: TEAL }}
                  aria-hidden
                >
                  <ShieldCheck className="h-9 w-9 sm:h-11 sm:w-11" strokeWidth={1.75} />
                </div>

                <span
                  className="hidden h-20 w-px lg:block"
                  style={{ backgroundColor: '#C7E7EE' }}
                  aria-hidden
                />

                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-brand-navy sm:text-2xl">
                    Need ongoing stability only?
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-7 sm:text-base" style={{ color: BODY }}>
                    Maintenance Support covers fixes, updates, monitoring and technical continuity.
                  </p>
                </div>
              </div>

              <Link
                to="/maintenance"
                onClick={() =>
                  trackConversionEvent('maintenance_link_click', {
                    cta_location: 'monthly_support_rhythm',
                    destination_url: '/maintenance',
                  })
                }
                className="inline-flex items-center gap-2 text-sm font-bold transition hover:gap-3 hover:underline sm:text-base lg:justify-self-end"
                style={{ color: TEAL }}
              >
                View maintenance support
                <ArrowRight className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} aria-hidden />
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  </section>
  );
};
