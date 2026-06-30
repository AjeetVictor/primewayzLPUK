import { motion } from 'motion/react';
import {
  BriefcaseBusiness,
  Building2,
  ShieldCheck,
  TrendingUp,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import { useRevealMotion } from '../hooks/useRevealMotion';
import { SITE_CONTAINER_CLASS, SITE_SECTION_PANEL_CLASS, TRUST_STRIP_SURFACE } from '../constants/siteLayout';

type TrustChip = {
  label: string;
  icon: LucideIcon;
};

const trustChips: TrustChip[] = [
  { label: 'Founders', icon: UserRound },
  { label: 'Consultants', icon: BriefcaseBusiness },
  { label: 'UK SMEs', icon: Building2 },
  { label: 'Service businesses', icon: UsersRound },
  { label: 'Startup teams', icon: TrendingUp },
];

export const UKTrustStrip = () => {
  const reveal = useRevealMotion();

  return (
  <section className="py-6 md:py-7" style={{ backgroundColor: TRUST_STRIP_SURFACE }}>
    <div className={SITE_CONTAINER_CLASS}>
      <motion.div
        initial={reveal.initial({ opacity: 0, y: 8 })}
        whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="text-center"
      >
        <p className="text-[11px] font-bold uppercase leading-5 tracking-[0.18em] text-brand-navy/70">
          Built for UK founders, consultants, service businesses and growing SMEs
        </p>

        <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 md:gap-x-7">
          {trustChips.map((chip, index) => {
            const Icon = chip.icon;

            return (
              <li key={chip.label} className="flex items-center gap-5">
                <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-brand-navy">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-brand-blue ring-1 ring-cyan-100">
                    <Icon className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                  </span>
                  {chip.label}
                </span>
                {index < trustChips.length - 1 ? (
                  <span className="hidden h-7 w-px bg-brand-border md:inline-block" aria-hidden />
                ) : null}
              </li>
            );
          })}
        </ul>

        <div
          className={`mt-7 ${SITE_SECTION_PANEL_CLASS} border-[#DDEAF5] px-7 py-6 shadow-[0_12px_34px_-28px_rgba(0,10,45,0.24)] md:px-9`}
          style={{ backgroundColor: TRUST_STRIP_SURFACE }}
        >
          <div className="grid items-center gap-7 md:grid-cols-[minmax(0,0.78fr)_1px_minmax(0,1.22fr)]">
            <div className="flex items-center gap-7 text-left">
              <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[#E4F7FC] text-brand-blue ring-1 ring-[#D2EEF8]">
                <ShieldCheck className="h-9 w-9" strokeWidth={2} aria-hidden />
              </span>
              <div>
                <h2 className="max-w-[26rem] text-xl font-bold leading-tight text-brand-navy">
                  Built for UK founders, consultants,
                  <br className="hidden xl:block" />
                  service businesses and growing SMEs
                </h2>
                <p className="mt-3 max-w-[28rem] text-base leading-6 text-slate-600">
                  Practical digital support that helps you get found,
                  <br className="hidden xl:block" />
                  trusted and chosen.
                </p>
              </div>
            </div>

            <span className="hidden h-28 w-px bg-brand-border md:block" aria-hidden />

            <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
              {trustChips.map((chip) => {
                const Icon = chip.icon;

                return (
                  <li key={`card-${chip.label}`} className="flex flex-col items-center text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E4F7FC] text-brand-blue ring-1 ring-[#D2EEF8]">
                      <Icon className="h-7 w-7" strokeWidth={2} aria-hidden />
                    </span>
                    <span className="mt-3 text-sm font-semibold leading-5 text-brand-navy">{chip.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
  );
};
