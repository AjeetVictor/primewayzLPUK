import { motion } from 'motion/react';
import {
  ArrowRight,
  Eye,
  MousePointerClick,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { shellClasses } from '../../constants/designSystem';
import { SITE_CONTAINER_CLASS, SITE_SECTION_PANEL_CLASS, TRUST_STRIP_SURFACE } from '../../constants/siteLayout';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { trackConversionEvent } from '../../lib/analytics';

type ProblemCard = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const problemCards: ProblemCard[] = [
  {
    title: 'Visibility',
    description: 'Can customers and search systems discover the business?',
    icon: Eye,
  },
  {
    title: 'Trust',
    description: 'Do visitors see enough clarity, proof and confidence?',
    icon: ShieldCheck,
  },
  {
    title: 'Enquiry',
    description: 'Can an interested visitor contact, book or submit easily?',
    icon: MousePointerClick,
  },
];

export const WebsiteProblemSection = () => {
  const reveal = useRevealMotion();

  return (
    <section
      id="visibility-trust-enquiry"
      className="pb-10 pt-6"
      style={{ backgroundColor: TRUST_STRIP_SURFACE }}
      aria-labelledby="website-problem-heading"
    >
      <div className={SITE_CONTAINER_CLASS}>
        <div className={`${SITE_SECTION_PANEL_CLASS} px-5 py-10 sm:px-8 lg:px-12`}>
          <motion.div
            initial={reveal.initial({ opacity: 0, y: 20 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className={shellClasses.sectionEyebrow}>What may be holding your website back</p>
            <h2
              id="website-problem-heading"
              className={`mt-3 ${shellClasses.sectionHeading} text-[1.75rem] sm:text-[2rem] lg:text-[2.75rem]`}
            >
              Your website may be live, but is it helping people find, trust and contact you?
            </h2>
            <p className={`mx-auto mt-4 max-w-[640px] ${shellClasses.sectionLead} text-sm sm:text-base`}>
              Many UK businesses do not need a full redesign first. They need clearer discovery,
              stronger trust signals and a simpler path from interest to enquiry.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {problemCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <motion.article
                  key={card.title}
                  initial={reveal.initial({ opacity: 0, y: 24 })}
                  whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className={shellClasses.sectionCard}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-surface text-brand-blue ring-1 ring-brand-border">
                    <Icon className="h-5 w-5" strokeWidth={2.1} aria-hidden />
                  </div>
                  <h3 className="mt-5 text-lg font-bold leading-6 text-brand-navy">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                </motion.article>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              to={CANONICAL_ROUTES.websiteVisibilitySupport}
              onClick={() => {
                trackConversionEvent('visibility_support_link_click', {
                  cta_location: 'homepage_problem_section',
                  destination: CANONICAL_ROUTES.websiteVisibilitySupport,
                });
              }}
              className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-brand-blue transition hover:text-brand-navy"
            >
              Explore website visibility support
              <ArrowRight className="h-4 w-4" strokeWidth={2.15} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
