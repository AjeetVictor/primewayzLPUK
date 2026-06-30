import { motion } from 'motion/react';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { ArrowRight } from 'lucide-react';
import type { ComponentType } from 'react';
import {
  ImproveAuditIcon,
  PrioritiseAuditIcon,
  ReviewAuditIcon,
  TrackAuditIcon,
} from '../icons/AuditLedProcessIcons';

const TEAL = '#087E8B';
const BORDER = '#D7E7EC';
const BODY = '#475569';
const SECTION_BG = '#FCFCFD';

type AuditStep = {
  number: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const auditSteps: AuditStep[] = [
  {
    number: '1',
    title: 'Review',
    description:
      'We check the website, search readiness, trust signals, enquiry path, tracking and technical basics.',
    icon: ReviewAuditIcon,
  },
  {
    number: '2',
    title: 'Prioritise',
    description:
      'We separate urgent fixes from nice-to-have improvements, so effort goes where impact is highest.',
    icon: PrioritiseAuditIcon,
  },
  {
    number: '3',
    title: 'Improve',
    description:
      'We update pages, forms, SEO foundations, CRM flow, content structure or technical issues in a controlled way.',
    icon: ImproveAuditIcon,
  },
  {
    number: '4',
    title: 'Track',
    description:
      'We monitor enquiries, audit submissions, CTA clicks, traffic sources and improvement opportunities.',
    icon: TrackAuditIcon,
  },
];

function AuditStepCard({ number, title, description, icon: Icon }: AuditStep) {
  return (
    <article
      className="relative flex min-h-[280px] flex-col items-center rounded-[22px] border bg-white px-6 pb-8 pt-10 text-center shadow-[0_16px_42px_-34px_rgba(0,10,45,0.24)] sm:min-h-[300px] sm:px-7 lg:min-h-[322px]"
      style={{ borderColor: BORDER }}
    >
      <span className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy text-base font-bold text-white">
        {number}
      </span>

      <Icon className="h-20 w-20 text-brand-navy sm:h-24 sm:w-24" />

      <h3 className="mt-6 text-3xl font-bold leading-tight text-brand-navy">{title}</h3>
      <p className="mt-4 text-base leading-7" style={{ color: BODY }}>
        {description}
      </p>
    </article>
  );
}

function DesktopArrow() {
  return (
    <ArrowRight
      className="hidden h-8 w-8 shrink-0 text-brand-navy lg:block"
      strokeWidth={1.8}
      aria-hidden
    />
  );
}

export const AuditLedProcessSection = () => {
  const reveal = useRevealMotion();

  return (
  <section
    id="audit-led-process"
    className="py-20 md:py-24"
    style={{ backgroundColor: SECTION_BG }}
    aria-labelledby="audit-led-process-heading"
  >
    <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={reveal.initial({ opacity: 0, y: 20 })}
        whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
          Audit-led process
        </p>

        <h2
          id="audit-led-process-heading"
          className="mx-auto mt-6 max-w-[900px] text-[2.25rem] font-bold leading-[1.12] tracking-[-0.04em] text-brand-navy sm:text-5xl md:text-6xl lg:text-[4rem]"
        >
          We do not start with a redesign.
          <br />
          We start with what is blocking
          <br />
          visibility, trust and enquiries.
        </h2>

        <p className="mx-auto mt-7 max-w-[720px] text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
          Our process helps you review what matters first, prioritise the right fixes, improve in a
          controlled way and track progress over time.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-center lg:gap-4 xl:gap-5">
        {auditSteps.map((step, index) => (
          <div key={step.title} className="contents">
            <AuditStepCard {...step} />
            {index < auditSteps.length - 1 ? <DesktopArrow /> : null}
          </div>
        ))}
      </div>

      <div className="mx-auto mt-11 flex max-w-[1040px] items-center gap-5" aria-hidden>
        <span className="h-px flex-1 bg-[#D7DEE3]" />
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TEAL }} />
        <span className="h-px flex-1 bg-[#D7DEE3]" />
      </div>

      <div className="mt-8 text-center">
        <a
          href="#support-model"
          className="inline-flex items-center gap-2 border-b-2 pb-1 text-xl font-bold text-brand-navy transition hover:gap-3 sm:text-2xl"
          style={{ borderColor: TEAL }}
        >
          See how monthly support works
          <ArrowRight className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </a>
      </div>
    </div>
  </section>
  );
};
