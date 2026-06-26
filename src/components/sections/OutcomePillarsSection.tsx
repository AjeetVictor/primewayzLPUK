import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  MessageSquareText,
  SearchCheck,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ServiceNavIcon } from '../ui/ServiceNavIcon';
import { shellClasses, type ServiceIconTone } from '../../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../../constants/siteLayout';

type Pillar = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: ServiceIconTone;
  diagram: ReactNode;
};

function VisibilityDiagram() {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      <span className="h-2 w-2 rounded-full bg-brand-cyan/70" />
      <span className="h-px w-8 bg-brand-cyan/30" />
      <SearchCheck className="h-5 w-5 text-brand-blue" strokeWidth={2} />
      <span className="h-px w-8 bg-brand-cyan/30" />
      <span className="rounded-md border border-brand-border bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-blue">
        Found
      </span>
    </div>
  );
}

function TrustDiagram() {
  return (
    <div className="flex items-center justify-center gap-3" aria-hidden>
      <div className="flex flex-col items-center gap-1">
        <span className="h-1.5 w-10 rounded-full bg-brand-border" />
        <span className="h-1.5 w-8 rounded-full bg-brand-border/70" />
      </div>
      <ShieldCheck className="h-6 w-6 text-brand-magenta" strokeWidth={2} />
      <div className="flex flex-col items-center gap-1">
        <span className="h-1.5 w-8 rounded-full bg-brand-magenta/20" />
        <span className="h-1.5 w-10 rounded-full bg-brand-magenta/30" />
      </div>
    </div>
  );
}

function EnquiriesDiagram() {
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden>
      <span className="rounded-full border border-brand-border bg-brand-surface px-2.5 py-1 text-[10px] font-medium text-slate-500">
        Visit
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-brand-blue/50" />
      <MessageSquareText className="h-5 w-5 text-brand-navy" strokeWidth={2} />
      <ArrowRight className="h-3.5 w-3.5 text-brand-blue/50" />
      <span className="rounded-full bg-brand-navy px-2.5 py-1 text-[10px] font-semibold text-white">
        Enquiry
      </span>
    </div>
  );
}

const pillars: Pillar[] = [
  {
    title: 'Visibility',
    description:
      'We improve the technical and content foundations that help your website become easier to discover through search and AI-assisted discovery.',
    href: '/website-visibility-support',
    icon: SearchCheck,
    tone: 'blue',
    diagram: <VisibilityDiagram />,
  },
  {
    title: 'Trust',
    description:
      'We strengthen the signals that help visitors feel confident enough to engage with your business.',
    href: '/how-it-works',
    icon: ShieldCheck,
    tone: 'magenta',
    diagram: <TrustDiagram />,
  },
  {
    title: 'Enquiries',
    description:
      'We improve the journey from first visit to contact, booking, audit request or sales conversation.',
    href: '/crm-automation-support',
    icon: MessageSquareText,
    tone: 'navy',
    diagram: <EnquiriesDiagram />,
  },
];

export const OutcomePillarsSection = () => (
  <section className="bg-white py-20 sm:py-24" aria-labelledby="outcome-pillars-heading">
    <div className={SITE_CONTAINER_CLASS}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className={shellClasses.sectionEyebrow}>
          Outcome pillars
        </p>
        <h2 id="outcome-pillars-heading" className={`mt-4 ${shellClasses.sectionHeading}`}>
          We focus on the digital gaps that impact your growth
        </h2>
        <p className={`mt-6 ${shellClasses.sectionLead}`}>
          Three focused improvement areas help your website become easier to discover, easier to
          trust and easier to convert from.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {pillars.map((pillar, index) => (
          <motion.article
            key={pillar.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={shellClasses.sectionCard}
          >
            <ServiceNavIcon icon={pillar.icon} tone={pillar.tone} size="md" />
            <h3 className="mt-5 text-xl font-semibold text-brand-navy">{pillar.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{pillar.description}</p>

            <div className="mt-6 rounded-xl border border-brand-border/80 bg-brand-surface/60 px-4 py-5">
              {pillar.diagram}
            </div>

            <Link
              to={pillar.href}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue transition hover:text-brand-navy"
            >
              Explore {pillar.title.toLowerCase()}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </motion.article>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45, delay: 0.12 }}
        className="mx-auto mt-14 max-w-2xl text-center text-base font-medium leading-7 text-brand-navy sm:text-lg"
      >
        Visibility builds discovery. Trust builds confidence. Enquiries build momentum.
      </motion.p>
    </div>
  </section>
);
