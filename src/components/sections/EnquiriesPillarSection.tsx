import { motion } from 'motion/react';
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  CheckCircle2,
  ClipboardCheck,
  Database,
  Mail,
  MousePointerClick,
  UserRound,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { SITE_CONTAINER_CLASS } from '../../constants/siteLayout';

const TEAL = '#087E8B';
const BORDER = '#D7E7EC';
const ICON_SURFACE = '#EAF7FA';
const SECTION_BG = '#FCFCFD';
const BODY = '#334155';

type EnquiryItem = {
  icon: LucideIcon;
  title: string;
  text: string;
};

const enquiryItems: EnquiryItem[] = [
  {
    icon: MousePointerClick,
    title: 'Clear Calls-to-Action',
    text: 'Strong next-step prompts such as Book a call, Request an audit or Get in touch.',
  },
  {
    icon: ClipboardCheck,
    title: 'Simple Forms',
    text: 'Short, low-friction forms that are easy to complete on desktop and mobile.',
  },
  {
    icon: CalendarDays,
    title: 'Booking Paths',
    text: 'Straightforward booking journeys for consultations, audits and discovery calls.',
  },
  {
    icon: Workflow,
    title: 'CRM Flow',
    text: 'Lead capture routed into CRM or workflow systems without getting lost.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Tracking & Attribution',
    text: 'Track enquiries, CTA clicks, source attribution and conversion points.',
  },
  {
    icon: Mail,
    title: 'Follow-up Journeys',
    text: 'Timely email, call or workflow follow-up that keeps momentum moving.',
  },
];

const journeyItems = [
  {
    icon: UserRound,
    title: 'Interest',
    text: 'A visitor is interested in your services.',
  },
  {
    icon: MousePointerClick,
    title: 'Click CTA',
    text: 'They click a clear call-to-action.',
  },
  {
    icon: ClipboardCheck,
    title: 'Submit / Book',
    text: 'They complete a form or book a time.',
  },
  {
    icon: Database,
    title: 'Captured in CRM',
    text: 'Their details are captured and routed instantly.',
  },
  {
    icon: Mail,
    title: 'Follow-up',
    text: 'They receive a timely and helpful follow-up.',
  },
] as const;

const connectorPaths = [
  'M 390 108 C 435 108, 462 108, 494 150',
  'M 390 260 C 438 260, 462 260, 486 260',
  'M 390 412 C 435 412, 462 412, 494 370',
  'M 850 108 C 805 108, 778 108, 746 150',
  'M 850 260 C 802 260, 778 260, 754 260',
  'M 850 412 C 805 412, 778 412, 746 370',
] as const;

function EnquiryConnectorLines() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full lg:block"
      viewBox="0 0 1240 520"
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
        [494, 150],
        [486, 260],
        [494, 370],
        [746, 150],
        [754, 260],
        [746, 370],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill={TEAL} fillOpacity={0.85} />
      ))}
    </svg>
  );
}

function EnquiryCard({
  icon: Icon,
  number,
  title,
  text,
}: EnquiryItem & { number: number }) {
  return (
    <article
      className="relative z-20 flex min-h-[128px] rounded-[22px] border bg-white p-5 shadow-[0_14px_34px_-30px_rgba(0,10,45,0.22)] sm:p-6 lg:min-h-[128px]"
      style={{ borderColor: BORDER }}
    >
      <div className="flex gap-4 sm:gap-5">
        <div
          className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
        >
          <Icon className="h-8 w-8" strokeWidth={1.7} aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug text-brand-navy">
            {number}. {title}
          </h3>
          <p className="mt-2 text-sm leading-6" style={{ color: BODY }}>
            {text}
          </p>
        </div>
      </div>
    </article>
  );
}

function EnquiriesHub() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[22rem] flex-col items-center justify-center text-center lg:max-w-[360px]">
      <img
        src="/images/chat-bubble-icon.png"
        alt=""
        className="h-auto w-[250px] object-contain sm:w-[280px] lg:w-[320px]"
        loading="lazy"
      />

      <h3 className="-mt-4 text-2xl font-bold uppercase tracking-tight text-brand-navy sm:text-3xl">
        Enquiries
      </h3>
      <p className="mt-2 max-w-[15rem] text-sm leading-6" style={{ color: BODY }}>
        Make it simple to reach you.
        <br />
        Make it easy to respond.
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
    <div className="text-center">
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
      >
        <Icon className="h-[1.625rem] w-[1.625rem]" strokeWidth={1.8} aria-hidden />
      </div>
      <h4 className="mt-3 text-sm font-bold text-brand-navy sm:text-base">{title}</h4>
      <p className="mx-auto mt-1 max-w-[10rem] text-xs leading-5 sm:max-w-[9.5rem]" style={{ color: BODY }}>
        {text}
      </p>
    </div>
  );
}

function EnquiryFormPreview() {
  return (
    <img
      src="/images/confirmation-icon.png"
      alt=""
      className="hidden h-auto w-[200px] shrink-0 object-contain lg:block"
      loading="lazy"
      aria-hidden
    />
  );
}

export const EnquiriesPillarSection = () => {
  const reveal = useRevealMotion();

  return (
  <section
    className="py-16 sm:py-20 md:py-24"
    style={{ backgroundColor: SECTION_BG }}
    aria-labelledby="enquiries-pillar-heading"
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
          Enquiries pillar
        </p>
        <span
          className="mx-auto mt-3 block h-1 w-16 rounded-full"
          style={{ backgroundColor: TEAL }}
          aria-hidden
        />

        <h2
          id="enquiries-pillar-heading"
          className="mt-6 text-[2rem] font-bold leading-tight tracking-[-0.04em] text-brand-navy sm:text-4xl md:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
        >
          Make it easier for interested
          <br className="hidden sm:block" />
          <span className="sm:sr-only"> </span>
          visitors to take the next step
        </h2>

        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
          Enquiries improve when calls-to-action, forms, booking paths, CRM flow, tracking and
          follow-up journeys work together clearly.
        </p>
      </motion.div>

      <div className="mx-auto max-w-[1240px]">
        <div className="relative mt-12 lg:mt-10">
          <EnquiryConnectorLines />

          <div className="relative z-10 grid items-center gap-4 sm:gap-5 lg:grid-cols-[390px_360px_390px] lg:gap-8">
            <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1 lg:flex lg:flex-col lg:gap-5">
              {enquiryItems.slice(0, 3).map((item, index) => (
                <EnquiryCard key={item.title} number={index + 1} {...item} />
              ))}
            </div>

            <div className="order-1 mb-5 lg:order-2 lg:mb-0">
              <EnquiriesHub />
            </div>

            <div className="order-3 grid gap-4 sm:grid-cols-2 lg:flex lg:flex-col lg:gap-5">
              {enquiryItems.slice(3).map((item, index) => (
                <EnquiryCard key={item.title} number={index + 4} {...item} />
              ))}
            </div>
          </div>
        </div>

        <motion.div
          initial={reveal.initial({ opacity: 0, y: 16 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="mt-10 rounded-[22px] border bg-[#F6FBFD] p-5 shadow-[0_16px_36px_-32px_rgba(0,10,45,0.22)] sm:p-6"
          style={{ borderColor: BORDER }}
        >
          <div className="flex flex-col gap-6 md:hidden">
            {journeyItems.map((item) => (
              <JourneyStep key={item.title} {...item} />
            ))}
          </div>

          <div className="hidden overflow-x-auto pb-1 md:block lg:hidden">
            <div className="flex min-w-[44rem] items-start gap-3 px-1">
              {journeyItems.map((item, index) => (
                <div key={item.title} className="flex flex-1 items-start gap-3">
                  <JourneyStep {...item} />
                  {index < journeyItems.length - 1 ? (
                    <ArrowRight
                      className="mt-5 h-5 w-5 shrink-0"
                      style={{ color: TEAL }}
                      strokeWidth={1.9}
                      aria-hidden
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-start">
            {journeyItems.map((item, index) => (
              <div key={item.title} className="contents">
                <JourneyStep {...item} />
                {index < journeyItems.length - 1 ? (
                  <ArrowRight
                    className="mx-auto mt-5 h-7 w-7 shrink-0 self-start"
                    style={{ color: TEAL }}
                    strokeWidth={1.75}
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
          className="mt-6 rounded-[22px] border bg-gradient-to-r from-white to-[#F1FBFD] p-6 sm:mt-8 sm:p-8"
          style={{ borderColor: BORDER }}
        >
          <div className="grid gap-6 lg:grid-cols-[80px_auto_minmax(0,1fr)_200px] lg:items-center">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 bg-white sm:h-20 sm:w-20"
              style={{ borderColor: TEAL, color: TEAL }}
              aria-hidden
            >
              <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.7} />
            </div>
            <span
              className="hidden h-20 w-px lg:block"
              style={{ backgroundColor: '#CBDDE3' }}
              aria-hidden
            />
            <div>
              <h3 className="text-xl font-bold text-brand-navy sm:text-2xl">Why this matters</h3>
              <p className="mt-2 max-w-[46rem] text-base leading-7 text-brand-navy sm:text-lg sm:leading-8">
                When the path from interest to contact is clear and connected, more visitors become
                real enquiries and more enquiries turn into conversations.
              </p>
            </div>
            <EnquiryFormPreview />
          </div>
        </motion.div>
      </div>
    </div>
  </section>
  );
};
