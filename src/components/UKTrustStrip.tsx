import { motion } from 'motion/react';
import { shellClasses } from '../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../constants/siteLayout';

const trustChips = [
  'Founders',
  'Consultants',
  'UK SMEs',
  'Service businesses',
  'Startup teams',
] as const;

export const UKTrustStrip = () => (
  <section className="border-y border-brand-border/80 bg-brand-surface py-12 sm:py-14">
    <div className={SITE_CONTAINER_CLASS}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-4xl text-center"
      >
        <p className="text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
          Built for UK founders, consultants, service businesses and growing SMEs who need
          practical digital visibility support.
        </p>

        <ul className="mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {trustChips.map((chip) => (
            <li key={chip}>
              <span className={shellClasses.trustChip}>{chip}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  </section>
);
