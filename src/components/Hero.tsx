import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { TrackedLink } from './common/TrackedLink';
import { HeroPromoJourney } from './hero/HeroPromoJourney';
import { buildSelfAuditCtaUrl } from './SelfAuditCta';
import { BOOK_CALL_URL } from '../constants/contactBooking';
import { shellClasses } from '../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../constants/siteLayout';

const auditHref = buildSelfAuditCtaUrl('homepage_hero');

export const Hero = () => (
  <section
    id="hero"
    className="relative overflow-hidden bg-white pt-24 pb-16 sm:pt-28 sm:pb-20 lg:pb-24"
  >
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-brand-surface blur-3xl" />
      <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-emerald-50/80 blur-3xl" />
    </div>

    <div className={`relative ${SITE_CONTAINER_CLASS}`}>
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <h1 className={shellClasses.heroTitle}>
            Make your UK website easier to find, trust and enquire from.
          </h1>
          <p className={`mt-6 max-w-xl ${shellClasses.heroLead}`}>
            Primewayz UK helps founders, consultants and growing SMEs improve website clarity,
            SEO readiness, trust signals, enquiry flow, CRM support and ongoing digital delivery.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <TrackedLink
              href={auditHref}
              ctaText="Free website audit"
              ctaLocation="homepage_hero"
              eventType="cta_click"
              trackingParams={{ destination: auditHref, lead_type: 'audit_cta' }}
              className={shellClasses.btnHeroPrimary}
            >
              Free website audit
              <ArrowRight className="h-4 w-4" aria-hidden />
            </TrackedLink>
            <TrackedLink
              href={BOOK_CALL_URL}
              ctaText="Book a discovery call"
              ctaLocation="homepage_hero"
              eventType="book_call_click_home"
              className={shellClasses.btnHeroSecondary}
            >
              Book a discovery call
            </TrackedLink>
          </div>
        </motion.div>

        <HeroPromoJourney />
      </div>
    </div>
  </section>
);
