import { motion } from 'motion/react';
import { ArrowRight, Eye, MessageSquareText, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { outcomePillarImages } from '../../constants/outcomePillarImages';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { SITE_CONTAINER_CLASS } from '../../constants/siteLayout';
import { OutcomePillarCardVisual } from './outcomePillars/OutcomePillarCardVisual';

const OUTCOME_PILLARS_SURFACE = '#F9FAFB';
const PILLAR_LINK_COLOR = '#0D9488';

type Pillar = {
  title: string;
  description: string;
  href: string;
  pathLabel: string;
  icon: LucideIcon;
  iconWrapClass: string;
  image: (typeof outcomePillarImages)[keyof typeof outcomePillarImages];
};

const pillars: Pillar[] = [
  {
    title: 'Visibility',
    description:
      'We improve the technical and content foundations that help your website become easier to discover through search and AI-assisted discovery.',
    href: '/website-visibility-support',
    pathLabel: '/website-visibility-support',
    icon: Eye,
    iconWrapClass: 'bg-[#0D9488] text-white',
    image: outcomePillarImages.visibility,
  },
  {
    title: 'Trust',
    description:
      'We strengthen the signals that help visitors feel confident enough to engage with your business.',
    href: '/how-it-works',
    pathLabel: '/how-it-works',
    icon: ShieldCheck,
    iconWrapClass: 'bg-[#7B8FC7] text-white',
    image: outcomePillarImages.trust,
  },
  {
    title: 'Enquiries',
    description:
      'We improve the journey from first visit to contact, booking, audit request or sales conversation.',
    href: '/crm-automation-support',
    pathLabel: '/crm-automation-support',
    icon: MessageSquareText,
    iconWrapClass: 'bg-[#F59E0B] text-white',
    image: outcomePillarImages.enquiries,
  },
];

export const OutcomePillarsSection = () => {
  const reveal = useRevealMotion();

  return (
  <section
    className="py-16 sm:py-20"
    style={{ backgroundColor: OUTCOME_PILLARS_SURFACE }}
    aria-labelledby="outcome-pillars-heading"
  >
    <div className={SITE_CONTAINER_CLASS}>
      <motion.div
        initial={reveal.initial({ opacity: 0, y: 20 })}
        whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-3xl text-center"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0D9488]">
          Outcome pillars
        </p>
        <h2
          id="outcome-pillars-heading"
          className="mt-3 text-[1.75rem] font-bold tracking-tight text-brand-navy sm:text-[2rem] sm:leading-[1.18]"
        >
          We focus on the digital gaps that impact your growth
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
          Three focused improvement areas help your website become easier to discover, easier to
          trust and easier to convert from.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3 lg:gap-6">
        {pillars.map((pillar, index) => {
          const Icon = pillar.icon;

          return (
            <motion.article
              key={pillar.title}
              initial={reveal.initial({ opacity: 0, y: 24 })}
              whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white"
            >
              <OutcomePillarCardVisual
                basePath={pillar.image.basePath}
                width={pillar.image.width}
                height={pillar.image.height}
                alt={pillar.image.alt}
              />

              <div className="flex flex-1 flex-col px-6 py-5">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${pillar.iconWrapClass}`}
                  >
                    <Icon className="h-[17px] w-[17px]" strokeWidth={2.1} aria-hidden />
                  </span>
                  <h3 className="text-[17px] font-bold leading-6 text-brand-navy">{pillar.title}</h3>
                </div>

                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{pillar.description}</p>

                <div className="mt-5 border-t border-[#E5E7EB] pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      to={pillar.href}
                      className="inline-flex items-center gap-1 text-sm font-semibold transition hover:opacity-80"
                      style={{ color: PILLAR_LINK_COLOR }}
                    >
                      Learn more
                      <ArrowRight className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                    </Link>
                    <span className="truncate text-[11px] text-slate-400">{pillar.pathLabel}</span>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      <motion.p
        initial={reveal.initial({ opacity: 0, y: 12 })}
        whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.45, delay: 0.12 }}
        className="mx-auto mt-12 max-w-2xl text-center text-base font-semibold leading-7 text-brand-navy sm:text-lg"
      >
        Visibility builds discovery. Trust builds confidence. Enquiries build momentum.
      </motion.p>
    </div>
  </section>
  );
};
