import { motion } from 'motion/react';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import { DigitalSystemsReviewCtaGroup } from './conversion/DigitalSystemsReviewCtaGroup';
import { HeroPromoJourney } from './hero/HeroPromoJourney';
import { brandTypography, shellClasses } from '../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../constants/siteLayout';
import { useRevealMotion } from '../hooks/useRevealMotion';

const heroChecklist = [
  'SEO basics',
  'Trust signals',
  'Mobile flow',
  'Enquiry path',
  'Technical readiness',
] as const;

export const Hero = () => {
  const reveal = useRevealMotion();

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-white pt-24 pb-[4.5rem]"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-8 h-56 w-56 rounded-full bg-brand-surface blur-3xl" />
        <div className="absolute -right-20 top-1/3 h-64 w-64 rounded-full bg-[#EAF4FB]/90 blur-3xl" />
      </div>

      <div className={`relative ${SITE_CONTAINER_CLASS}`}>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)] lg:gap-10 xl:gap-12">
          <motion.div
            initial={reveal.initial({ opacity: 0, y: 20 })}
            animate={reveal.animate({ opacity: 1, y: 0 })}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl lg:max-w-2xl"
          >
            <p className={`inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-2 ${brandTypography.eyebrow} text-brand-blue shadow-sm`}>
              <span className="h-2 w-2 rounded-full bg-brand-cyan" aria-hidden />
              Reliable digital systems for UK SMEs
            </p>
            <h1 className={`mt-5 ${shellClasses.heroTitle}`}>
              Reliable digital systems{' '}
              <br />
              for growing{' '}
              <span className="text-brand-cyan">UK businesses</span>
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:leading-8">
              Primewayz helps UK SMEs improve website visibility, connect CRM and workflows, build
              and modernise software, support live applications, and strengthen technical
              delivery—without the cost and complexity of building a large in-house team.
            </p>

            <DigitalSystemsReviewCtaGroup
              className="mt-7"
              sourceLocation="homepage"
              primaryPlacement="homepage_hero_primary"
              secondaryPlacement="homepage_hero_secondary"
              websiteCheckerPlacement="homepage_hero_website_checker"
              variant="hero"
            />

            <ul className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium leading-5 text-slate-600 sm:text-xs" aria-label="Promotional support areas">
              {heroChecklist.map((item, index) => (
                <li key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-cyan" strokeWidth={2.25} aria-hidden />
                  <span>{item}</span>
                  {index < heroChecklist.length - 1 ? (
                    <span className="ml-1.5 hidden h-4 w-px bg-brand-border sm:inline-block" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ul>

            <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-slate-500">
              <LockKeyhole className="h-4 w-4 text-slate-500" strokeWidth={2.1} aria-hidden />
              No obligation. Share context confidentially and get a clear recommended next step.
            </p>
          </motion.div>

          <HeroPromoJourney />
        </div>
      </div>
    </section>
  );
};
