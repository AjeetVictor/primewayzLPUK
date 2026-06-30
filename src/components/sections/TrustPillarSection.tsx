import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  FileCheck2,
  Landmark,
  LockKeyhole,
  Mail,
  MessageSquareQuote,
  ShieldCheck,
  Star,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { SITE_CONTAINER_CLASS } from '../../constants/siteLayout';

const TEAL = '#087E8B';
const BORDER = '#D7E7EC';
const ICON_SURFACE = '#EAF7FA';
const SECTION_BG = '#F8F9FC';
const BODY = '#334155';

type TrustItem = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const trustItems: TrustItem[] = [
  {
    icon: Building2,
    title: 'Credibility Signals',
    text: 'Clear company details, service clarity and contact confidence.',
  },
  {
    icon: LockKeyhole,
    title: 'Privacy & Security',
    text: 'Privacy policy, secure forms and responsible data handling.',
  },
  {
    icon: MessageSquareQuote,
    title: 'Proof & Testimonials',
    text: 'Client feedback, outcomes and social validation.',
  },
  {
    icon: UserRound,
    title: 'Founder Story',
    text: 'Human context that helps visitors understand who is behind the business.',
  },
  {
    icon: FileCheck2,
    title: 'Product-Stage Clarity',
    text: 'Clear explanation of what is available now and what is planned.',
  },
  {
    icon: Landmark,
    title: 'Compliance-Aware Messaging',
    text: 'Careful wording for finance, healthcare or other trust-sensitive sectors.',
  },
];

const journeySteps = [
  {
    icon: UserRound,
    title: 'First Visit',
    text: 'A visitor lands on your site and forms an impression.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust Built',
    text: 'They see proof, clarity and credibility across key areas.',
  },
  {
    icon: Mail,
    title: 'Enquiry Confidence',
    text: 'They feel confident to get in touch and start a conversation.',
  },
] as const;

/** Decorative curved connectors — desktop only */
const connectorPaths = [
  'M 390 112 C 440 112, 462 112, 506 164',
  'M 390 280 C 455 280, 475 280, 506 280',
  'M 390 448 C 440 448, 462 448, 506 396',
  'M 850 112 C 800 112, 778 112, 734 164',
  'M 850 280 C 785 280, 765 280, 734 280',
  'M 850 448 C 800 448, 778 448, 734 396',
] as const;

function TrustConnectorLines() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20 hidden h-full w-full lg:block"
      viewBox="0 0 1240 560"
      preserveAspectRatio="none"
      aria-hidden
    >
      {connectorPaths.map((path) => (
        <path
          key={path}
          d={path}
          fill="none"
          stroke={TEAL}
          strokeOpacity={0.35}
          strokeWidth="1.5"
          strokeDasharray="4 5"
        />
      ))}
      {[
        [506, 164],
        [506, 280],
        [506, 396],
        [734, 164],
        [734, 280],
        [734, 396],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill={TEAL} fillOpacity={0.8} />
      ))}
    </svg>
  );
}

function TrustCard({
  icon: Icon,
  number,
  title,
  text,
}: TrustItem & { number: number }) {
  return (
    <article className="relative z-30 flex min-h-[148px] rounded-[22px] border bg-white p-5 sm:min-h-[156px] sm:p-6 lg:min-h-[148px] xl:p-7" style={{ borderColor: BORDER }}>
      <div className="flex gap-4 sm:gap-5">
        <div
          className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-full sm:h-20 sm:w-20"
          style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
        >
          <Icon className="h-8 w-8 sm:h-[2.375rem] sm:w-[2.375rem]" strokeWidth={1.7} aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug text-brand-navy sm:text-xl">
            {number}. {title}
          </h3>
          <p className="mt-2 text-sm leading-6 sm:text-base sm:leading-7" style={{ color: BODY }}>
            {text}
          </p>
        </div>
      </div>
    </article>
  );
}

function TrustHub() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[22rem] flex-col items-center justify-center text-center lg:max-w-[360px]">
      <img
        src="/images/shield-trust.png"
        alt=""
        className="relative z-10 h-auto w-[240px] object-contain mix-blend-multiply [mask-image:radial-gradient(circle_at_center,black_58%,rgba(0,0,0,0.72)_68%,transparent_82%)] sm:w-[270px] lg:w-[300px]"
        loading="lazy"
      />

      <h3 className="relative z-30 -mt-3 text-2xl font-bold uppercase tracking-tight text-brand-navy sm:text-3xl">
        Trust
      </h3>
      <p className="relative z-30 mt-2 max-w-[15rem] text-sm leading-6 sm:max-w-[16rem]" style={{ color: BODY }}>
        The foundation that gives visitors confidence to take the next step.
      </p>
    </div>
  );
}

function JourneyStep({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16"
        style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
      >
        <Icon className="h-7 w-7 sm:h-[1.875rem] sm:w-[1.875rem]" strokeWidth={1.8} aria-hidden />
      </div>
      <div>
        <h4 className="text-lg font-bold text-brand-navy sm:text-xl">{title}</h4>
        <p className="mt-1 text-sm leading-6" style={{ color: BODY }}>
          {text}
        </p>
      </div>
    </div>
  );
}

export const TrustPillarSection = () => {
  const reveal = useRevealMotion();

  return (
  <section
    className="scroll-mt-28 py-20 md:py-24"
    style={{ backgroundColor: SECTION_BG }}
    aria-labelledby="trust-pillar-heading"
  >
    <div className={SITE_CONTAINER_CLASS}>
      <motion.div
        initial={reveal.initial({ opacity: 0, y: 20 })}
        whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
          Trust pillar
        </p>
        <span
          className="mx-auto mt-3 block h-1 w-16 rounded-full"
          style={{ backgroundColor: TEAL }}
          aria-hidden
        />

        <h2
          id="trust-pillar-heading"
          className="mt-6 text-[2rem] font-bold leading-tight tracking-[-0.04em] text-brand-navy sm:text-4xl md:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
        >
          Build the confidence that
          <br className="hidden sm:block" />
          <span className="sm:sr-only"> </span>
          turns visitors into enquiries
        </h2>

        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
          Trust is not one element. It is the combination of credibility, clarity, proof and
          responsible communication.
        </p>
      </motion.div>

      <div className="mx-auto max-w-[1240px]">
        <div className="relative mt-12 lg:mt-14">
          <TrustConnectorLines />

          <div className="relative z-10 grid items-center gap-4 sm:gap-5 lg:grid-cols-[minmax(300px,390px)_minmax(280px,360px)_minmax(300px,390px)] lg:gap-6 xl:gap-8">
            <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1 lg:flex lg:flex-col lg:gap-5">
              {trustItems.slice(0, 3).map((item, index) => (
                <TrustCard key={item.title} number={index + 1} {...item} />
              ))}
            </div>

            <div className="order-1 mb-5 lg:order-2 lg:mb-0">
              <TrustHub />
            </div>

            <div className="order-3 grid gap-4 sm:grid-cols-2 lg:flex lg:flex-col lg:gap-5">
              {trustItems.slice(3).map((item, index) => (
                <TrustCard key={item.title} number={index + 4} {...item} />
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={reveal.initial({ opacity: 0, y: 16 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-8 rounded-[22px] border bg-white/80 p-5 sm:mt-10 sm:p-6"
          style={{ borderColor: BORDER }}
        >
          <div className="grid gap-6 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
            {journeySteps.map((step, index) => (
              <div key={step.title} className="contents">
                <JourneyStep {...step} />
                {index < journeySteps.length - 1 ? (
                  <ArrowRight
                    className="mx-auto hidden h-8 w-8 shrink-0 md:block"
                    style={{ color: TEAL }}
                    strokeWidth={1.7}
                    aria-hidden
                  />
                ) : null}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={reveal.initial({ opacity: 0, y: 16 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-6 rounded-[22px] border bg-gradient-to-r from-white to-[#F0FBFD] p-6 sm:mt-8 sm:p-8"
          style={{ borderColor: BORDER }}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-white sm:h-16 sm:w-16"
              style={{ borderColor: TEAL, color: TEAL }}
              aria-hidden
            >
              <Star className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.8} />
            </div>
            <span
              className="hidden h-20 w-px md:block"
              style={{ backgroundColor: '#CBDDE3' }}
              aria-hidden
            />
            <div>
              <h3 className="text-xl font-bold text-brand-navy sm:text-2xl">Why this matters</h3>
              <p className="mt-2 text-base leading-7 text-brand-navy sm:text-lg sm:leading-8 md:text-xl">
                When visitors understand who you are, what you do, and why they can trust you, they
                are far more likely to enquire.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
  );
};
