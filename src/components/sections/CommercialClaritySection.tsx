import { motion } from 'motion/react';
import {
  ArrowRight,
  Building2,
  Rocket,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { shellClasses } from '../../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../../constants/siteLayout';
import { useRevealMotion } from '../../hooks/useRevealMotion';

type ModelCard = {
  title: string;
  description: string;
  bestFit: string;
  icon: LucideIcon;
};

const modelCards: ModelCard[] = [
  {
    title: 'Foundation Sprint',
    description: 'A structured starting phase for discovery, priorities and launch readiness.',
    bestFit: 'Best when requirements, risks or the first delivery path still need clarity.',
    icon: Rocket,
  },
  {
    title: 'Monthly Delivery',
    description: 'Ongoing capacity for improvements, CRM work, software delivery and digital support.',
    bestFit: 'Best when priorities continue month to month and need steady progress.',
    icon: TrendingUp,
  },
  {
    title: 'Maintenance Mode',
    description: 'Lower-capacity continuity support when active delivery is not required.',
    bestFit: 'Best when systems need stability, monitoring and light updates.',
    icon: Wrench,
  },
  {
    title: 'Enterprise or Complex Delivery',
    description: 'Support for larger programmes, integrations and governance-heavy needs.',
    bestFit: 'Best when multiple systems, stakeholders or controls need coordinated delivery.',
    icon: Building2,
  },
];

function ModelCardItem({ title, description, bestFit, icon: Icon }: ModelCard) {
  return (
    <article className={shellClasses.sectionCard}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-surface text-brand-blue">
        <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden />
      </div>
      <h3 className="mt-5 text-lg font-bold leading-snug text-brand-navy sm:text-xl">{title}</h3>
      <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-4 text-xs font-medium leading-5 text-slate-500">{bestFit}</p>
      <Link
        to={CANONICAL_ROUTES.pricing}
        className="mt-5 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-brand-blue transition hover:text-brand-navy"
      >
        View pricing
        <ArrowRight className="h-4 w-4" strokeWidth={1.9} aria-hidden />
      </Link>
    </article>
  );
}

export const CommercialClaritySection = () => {
  const reveal = useRevealMotion();

  return (
    <section
      id="engagement-options"
      className="scroll-mt-28 bg-brand-surface py-16 md:py-20"
      aria-labelledby="engagement-options-heading"
    >
      <div className={SITE_CONTAINER_CLASS}>
        <motion.div
          initial={reveal.initial({ opacity: 0, y: 20 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <p className={shellClasses.sectionEyebrow}>Engagement options</p>
          <h2 id="engagement-options-heading" className={`mt-5 ${shellClasses.sectionHeading}`}>
            Choose the engagement model that fits the work
          </h2>
          <p className={`mt-5 max-w-2xl ${shellClasses.sectionLead}`}>
            Start with a foundation sprint, move into monthly delivery, switch to maintenance when
            priorities slow down, or discuss complex delivery for larger needs.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {modelCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={reveal.initial({ opacity: 0, y: 20 })}
              whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
            >
              <ModelCardItem {...card} />
            </motion.div>
          ))}
        </div>

        <div className="mt-8">
          <Link
            to={CANONICAL_ROUTES.pricing}
            className={`${shellClasses.btnHeroSecondary} border-brand-navy text-brand-navy`}
          >
            View full pricing & engagement options
            <ArrowRight className="h-4 w-4" strokeWidth={1.9} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
};
