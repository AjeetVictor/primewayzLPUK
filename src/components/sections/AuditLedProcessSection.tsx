import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import type { ComponentType } from 'react';
import { shellClasses } from '../../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../../constants/siteLayout';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import {
  ImproveAuditIcon,
  PrioritiseAuditIcon,
  ReviewAuditIcon,
  TrackAuditIcon,
} from '../icons/AuditLedProcessIcons';

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
    description: 'Understand current systems, constraints and priorities.',
    icon: ReviewAuditIcon,
  },
  {
    number: '2',
    title: 'Prioritise',
    description: 'Identify the highest-value and lowest-risk next actions.',
    icon: PrioritiseAuditIcon,
  },
  {
    number: '3',
    title: 'Improve',
    description: 'Deliver agreed changes through the appropriate engagement model.',
    icon: ImproveAuditIcon,
  },
  {
    number: '4',
    title: 'Track',
    description: 'Measure progress, risks and next-stage opportunities.',
    icon: TrackAuditIcon,
  },
];

function AuditStepCard({ number, title, description, icon: Icon }: AuditStep) {
  return (
    <article className={`${shellClasses.sectionCard} relative items-center px-6 pb-8 pt-10 text-center`}>
      <span className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy text-base font-bold text-white">
        {number}
      </span>
      <Icon className="h-20 w-20 text-brand-navy sm:h-24 sm:w-24" aria-hidden />
      <h3 className="mt-6 text-2xl font-bold leading-tight text-brand-navy sm:text-3xl">{title}</h3>
      <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
    </article>
  );
}

export const AuditLedProcessSection = () => {
  const reveal = useRevealMotion();

  return (
    <section
      id="delivery-process"
      className="bg-white py-20 md:py-24"
      aria-labelledby="delivery-process-heading"
    >
      <div className={SITE_CONTAINER_CLASS}>
        <motion.div
          initial={reveal.initial({ opacity: 0, y: 20 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <p className={shellClasses.sectionEyebrow}>One delivery process</p>
          <h2 id="delivery-process-heading" className={`mx-auto mt-6 max-w-3xl ${shellClasses.sectionHeading}`}>
            Review → Prioritise → Improve → Track
          </h2>
          <p className={`mx-auto mt-6 max-w-2xl ${shellClasses.sectionLead}`}>
            One clear process for website, CRM, software and support work—so priorities stay
            practical and progress stays visible.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4 lg:items-center lg:gap-3">
          {auditSteps.map((step, index) => (
            <div key={step.title} className="contents lg:flex lg:items-center lg:gap-3">
              <motion.div
                initial={reveal.initial({ opacity: 0, y: 20 })}
                whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="min-w-0 flex-1"
              >
                <AuditStepCard {...step} />
              </motion.div>
              {index < auditSteps.length - 1 ? (
                <ArrowRight
                  className="mx-auto hidden h-7 w-7 shrink-0 text-brand-navy lg:block"
                  strokeWidth={1.8}
                  aria-hidden
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
