import { motion } from 'motion/react';
import { ArrowRight, MousePointerClick, SearchX, ShieldAlert, type LucideIcon } from 'lucide-react';
import { TrackedLink } from '../common/TrackedLink';
import { ServiceNavIcon } from '../ui/ServiceNavIcon';
import { buildSelfAuditCtaUrl } from '../SelfAuditCta';
import { shellClasses, type ServiceIconTone } from '../../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../../constants/siteLayout';

type ProblemCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: ServiceIconTone;
};

const problemCards: ProblemCard[] = [
  {
    title: 'Live but not visible',
    description:
      'Your services exist, but search engines and AI discovery may not understand your pages clearly.',
    icon: SearchX,
    tone: 'blue',
  },
  {
    title: 'Visited but not trusted',
    description:
      'Visitors arrive, but your website may not give them enough confidence to take the next step.',
    icon: ShieldAlert,
    tone: 'magenta',
  },
  {
    title: 'Interested but not converting',
    description:
      'The offer may be good, but unclear CTAs, forms or contact paths reduce enquiries and opportunities.',
    icon: MousePointerClick,
    tone: 'navy',
  },
];

const auditHref = buildSelfAuditCtaUrl('homepage_problem_section');

export const WebsiteProblemSection = () => (
  <section
    className="bg-[#FBFAF8] py-20 sm:py-24"
    aria-labelledby="website-problem-heading"
  >
    <div className={SITE_CONTAINER_CLASS}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className={shellClasses.sectionEyebrow}>
          What may be holding your website back
        </p>
        <h2 id="website-problem-heading" className={`mt-4 ${shellClasses.sectionHeading}`}>
          Your website may be live, but is it helping people find, trust and contact you?
        </h2>
        <p className={`mt-6 ${shellClasses.sectionLead}`}>
          Many UK businesses do not need a full redesign first. They need to identify the digital
          gaps that quietly reduce visibility, confidence and enquiries.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {problemCards.map((card, index) => (
          <motion.article
            key={card.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={shellClasses.sectionCard}
          >
            <ServiceNavIcon icon={card.icon} tone={card.tone} size="md" />
            <h3 className="mt-5 text-lg font-semibold text-brand-navy">{card.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{card.description}</p>
          </motion.article>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="mt-12 flex justify-center"
      >
        <TrackedLink
          href={auditHref}
          ctaText="Start with a visibility audit"
          ctaLocation="homepage_problem_section"
          eventType="cta_click"
          trackingParams={{ destination: auditHref, lead_type: 'audit_cta' }}
          className={shellClasses.btnHeroPrimary}
        >
          Start with a visibility audit
          <ArrowRight className="h-4 w-4" aria-hidden />
        </TrackedLink>
      </motion.div>
    </div>
  </section>
);
