import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ClipboardCheck, PoundSterling, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { shellClasses } from '../../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../../constants/siteLayout';
import { HOMEPAGE_PRICING_SECTION_NAME } from '../../content/homepagePricingPlans';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { trackConversionEvent } from '../../lib/analytics';
import { cn } from '../../utils/cn';

const COMMERCIAL_CLARITY_FEATURES = [
  {
    id: 'scope',
    title: 'Clear support scope',
    description:
      'We match the support route to your current priority instead of forcing a large package.',
    icon: ClipboardCheck,
  },
  {
    id: 'third-party',
    title: 'Third-party costs separated',
    description:
      'Hosting, plugins, ad spend and external subscriptions are discussed separately and transparently.',
    icon: PoundSterling,
  },
  {
    id: 'next-step',
    title: 'Practical next step',
    description:
      'Start with a focused sprint, monthly support or maintenance based on what your business needs now.',
    icon: Target,
  },
] as const;

function getPageAnalyticsContext() {
  if (typeof window === 'undefined') {
    return { page_location: undefined, page_path: '/' };
  }
  return {
    page_location: window.location.href,
    page_path: window.location.pathname || '/',
  };
}

function trackViewFullPricingClick() {
  const page = getPageAnalyticsContext();
  trackConversionEvent('view_full_pricing_click', {
    page_location: page.page_location,
    page_path: page.page_path,
    section_name: HOMEPAGE_PRICING_SECTION_NAME,
  });
}

export const CommercialClaritySection = () => {
  const reveal = useRevealMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    if (viewTrackedRef.current) return;

    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || viewTrackedRef.current) return;
        viewTrackedRef.current = true;
        const page = getPageAnalyticsContext();
        trackConversionEvent('homepage_pricing_view', {
          page_location: page.page_location,
          page_path: page.page_path,
          section_name: HOMEPAGE_PRICING_SECTION_NAME,
        });
        observer.disconnect();
      },
      { threshold: 0.35, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="scroll-mt-28 bg-brand-surface py-16 md:py-20"
      aria-labelledby="pricing-heading"
    >
      <div className={SITE_CONTAINER_CLASS}>
        <motion.div
          initial={reveal.initial({ opacity: 0, y: 20 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className={cn(shellClasses.sectionEyebrow, 'text-brand-cyan')}>Commercial clarity</p>
          <h2 id="pricing-heading" className={`mt-5 ${shellClasses.sectionHeading}`}>
            Simple support options, with costs discussed clearly
          </h2>
          <p className={`mx-auto mt-5 max-w-2xl ${shellClasses.sectionLead}`}>
            We keep the starting point simple and discuss additional tools or third-party costs before
            work begins.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {COMMERCIAL_CLARITY_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.id}
                initial={reveal.initial({ opacity: 0, y: 20 })}
                whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className={cn(shellClasses.sectionCard, 'text-left')}
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-brand-surface text-brand-navy">
                  <Icon className="h-5 w-5 text-brand-blue" aria-hidden />
                </span>
                <h3 className="mt-5 text-xl font-bold text-brand-navy">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  {feature.description}
                </p>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={reveal.initial({ opacity: 0, y: 16 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="mt-8 flex flex-col gap-4 rounded-2xl border border-brand-border bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"
        >
          <div className="flex items-start gap-4">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal-200 bg-teal-50 text-teal-700">
              <span className="text-sm font-bold">i</span>
            </span>
            <div>
              <p className="font-bold text-brand-navy">Need the full breakdown?</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Detailed inclusions, support models and commercial notes are available on the pricing
                page.
              </p>
            </div>
          </div>
          <Link
            to={CANONICAL_ROUTES.pricing}
            onClick={trackViewFullPricingClick}
            className="inline-flex shrink-0 items-center gap-2 border-l-0 border-brand-border pl-0 text-base font-semibold text-teal-700 underline-offset-4 transition hover:text-teal-800 hover:underline sm:border-l sm:pl-6"
          >
            View full pricing
            <ArrowRight className="h-4 w-4" strokeWidth={1.9} aria-hidden />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
