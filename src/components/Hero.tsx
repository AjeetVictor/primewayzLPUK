import { type FormEvent, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CalendarDays, CheckCircle2, Globe2, LockKeyhole } from 'lucide-react';
import { TrackedLink } from './common/TrackedLink';
import { HeroPromoJourney } from './hero/HeroPromoJourney';
import { buildSelfAuditCtaUrl } from './SelfAuditCta';
import { BOOK_CALL_URL } from '../constants/contactBooking';
import { brandTypography, shellClasses } from '../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../constants/siteLayout';
import { useRevealMotion } from '../hooks/useRevealMotion';
import { trackEvent } from '../lib/analytics';
import { normaliseWebsiteUrl } from '../utils/normalizeWebsiteUrl';

const auditHref = buildSelfAuditCtaUrl('homepage_hero');

const heroChecklist = [
  'SEO basics',
  'Trust signals',
  'Mobile flow',
  'Enquiry path',
  'Technical readiness',
] as const;

export const Hero = () => {
  const reveal = useRevealMotion();
  const [websiteUrl, setWebsiteUrl] = useState('');

  const handleAuditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedWebsite = websiteUrl.trim();
    const destination = new URL(auditHref, window.location.origin);

    if (trimmedWebsite) {
      destination.searchParams.set('website', normaliseWebsiteUrl(trimmedWebsite));
    }

    trackEvent('audit_url_submit_hero', {
      cta_location: 'homepage_hero_url_entry',
      destination: destination.pathname,
      has_website_url: Boolean(trimmedWebsite),
      website_url_entered: Boolean(trimmedWebsite),
    });

    window.location.assign(`${destination.pathname}${destination.search}`);
  };

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
              Free UK website visibility check
            </p>
            <h1 className={`mt-5 ${shellClasses.heroTitle}`}>
              Make your UK website
              <br />
              easier to find, trust and
              <br />
              <span className="text-brand-cyan">enquire</span> from.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600 sm:leading-8">
              Primewayz UK helps founders, consultants and growing SMEs improve website clarity,
              SEO readiness, trust signals, enquiry flow and ongoing digital delivery.
            </p>

            <form
              className="mt-7 flex flex-col gap-3 rounded-lg border border-brand-border bg-white p-2 shadow-[0_14px_36px_-24px_rgba(0,10,45,0.32)] sm:flex-row sm:items-center"
              onSubmit={handleAuditSubmit}
            >
              <label htmlFor="hero-website-url" className="sr-only">
                Enter your website URL
              </label>
              <div className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 px-3">
                <Globe2 className="h-5 w-5 shrink-0 text-slate-500" strokeWidth={2.1} aria-hidden />
                <input
                  id="hero-website-url"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://yourbusiness.co.uk"
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-brand-navy outline-none placeholder:text-slate-500"
                />
              </div>
              <button
                type="submit"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-brand-navy px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy sm:min-w-[170px]"
              >
                Run quick audit
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </form>

            <ul className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium leading-5 text-slate-600 sm:text-xs" aria-label="Promotional support areas">
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

            <div className="mt-6 flex flex-col gap-3 text-sm font-semibold sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
              <TrackedLink
                href={BOOK_CALL_URL}
                ctaText="Book a discovery call"
                ctaLocation="homepage_hero_secondary"
                eventType="book_call_click_home"
                className="inline-flex items-center gap-2 text-brand-navy transition hover:text-brand-blue"
              >
                <CalendarDays className="h-5 w-5 text-brand-blue" strokeWidth={2.1} aria-hidden />
                Book a discovery call
              </TrackedLink>
              <span className="hidden h-6 w-px bg-brand-border sm:inline-block" aria-hidden />
              <TrackedLink
                href="/contact-us"
                ctaText="Talk to a UK support specialist"
                ctaLocation="homepage_hero_secondary"
                eventType="cta_click"
                className="inline-flex items-center gap-2 text-brand-navy transition hover:text-brand-blue"
              >
                Talk to a UK support specialist
                <ArrowRight className="h-4 w-4 text-brand-cyan" strokeWidth={2.1} aria-hidden />
              </TrackedLink>
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-slate-500">
              <LockKeyhole className="h-4 w-4 text-slate-500" strokeWidth={2.1} aria-hidden />
              No login required. Get practical insights in under 60 seconds.
            </p>
          </motion.div>

          <HeroPromoJourney />
        </div>
      </div>
    </section>
  );
};
