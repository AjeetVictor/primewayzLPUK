import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { HOMEPAGE_PRICING_SECTION_NAME } from '../../content/homepagePricingPlans';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { trackConversionEvent } from '../../lib/analytics';
import './CommercialClaritySection.css';

type CommercialFeatureIcon = 'scope' | 'costs' | 'next-step';
type CommercialTagIcon = 'check' | 'shield' | 'rocket';

type CommercialClarityFeature = {
  id: string;
  title: string;
  description: string;
  tag: string;
  icon: CommercialFeatureIcon;
  tagIcon: CommercialTagIcon;
};

const COMMERCIAL_CLARITY_FEATURES: CommercialClarityFeature[] = [
  {
    id: 'scope',
    title: 'Clear support scope',
    description:
      'We match the support route to your current priority instead of forcing a large package.',
    tag: 'Right support, not more than you need',
    icon: 'scope',
    tagIcon: 'check',
  },
  {
    id: 'third-party',
    title: 'Third-party costs separated',
    description:
      'Hosting, plugins, ad spend and external subscriptions are discussed separately and transparently.',
    tag: 'No surprises. Clear commercial view',
    icon: 'costs',
    tagIcon: 'shield',
  },
  {
    id: 'next-step',
    title: 'Practical next step',
    description:
      'Start with a focused sprint, monthly support or maintenance based on what your business needs now.',
    tag: 'Start focused. Scale with confidence',
    icon: 'next-step',
    tagIcon: 'rocket',
  },
];

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

function CommercialFeatureIconGraphic({ icon }: { icon: CommercialFeatureIcon }) {
  if (icon === 'scope') {
    return (
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <rect x="17" y="12" width="30" height="40" rx="4" />
        <path d="M25 12V8h14v4" />
        <polyline points="24,31 29,36 40,24" />
      </svg>
    );
  }

  if (icon === 'costs') {
    return (
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <path d="M17 9h24l8 8v38H17Z" />
        <path d="M41 9v10h8" />
        <path d="M29 39h10" />
        <path d="M30 27c0-4 2-6 6-6 3 0 5 2 5 5" />
        <path d="M34 25v15" />
        <path d="M29 32h10" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
      <circle cx="29" cy="34" r="17" />
      <circle cx="29" cy="34" r="10" />
      <circle cx="29" cy="34" r="4" />
      <path d="m32 31 20-20" />
      <path d="M43 11h9v9" />
    </svg>
  );
}

function CommercialTagIconGraphic({ icon }: { icon: CommercialTagIcon }) {
  if (icon === 'check') {
    return (
      <svg className="commercial-card__tag-icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" />
        <polyline points="6,10 9,13 14,7" />
      </svg>
    );
  }

  if (icon === 'shield') {
    return (
      <svg className="commercial-card__tag-icon" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 2 17 5v5c0 4-2.5 6.5-7 8-4.5-1.5-7-4-7-8V5Z" />
      </svg>
    );
  }

  return (
    <svg className="commercial-card__tag-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M12 3c3 0 5 0 5 0s0 2-1 5l-6 6-4-4Z" />
      <path d="m6 10-3 1-1 4 4-1" />
      <path d="m10 14-1 3-4 1 1-4" />
      <circle cx="13" cy="7" r="1.5" />
    </svg>
  );
}

function PricingSymbol() {
  return (
    <svg viewBox="0 0 48 48" focusable="false" aria-hidden="true">
      <path d="M24 5 40 11v13c0 10-5.5 16.5-16 21C13.5 40.5 8 34 8 24V11Z" />
      <path d="M18 31h12" />
      <path d="M19 20c0-4 2-6 6-6 3 0 5 2 5 5" />
      <path d="M23 18v14" />
      <path d="M18 25h12" />
    </svg>
  );
}

function PricingModelIcon({ model }: { model: 'sprint' | 'monthly' | 'maintenance' }) {
  if (model === 'sprint') {
    return (
      <svg viewBox="0 0 32 32" focusable="false" aria-hidden="true">
        <polyline points="18,3 9,17 16,17 13,29 24,13 17,13 18,3" />
      </svg>
    );
  }

  if (model === 'monthly') {
    return (
      <svg viewBox="0 0 32 32" focusable="false" aria-hidden="true">
        <rect x="5" y="7" width="22" height="20" rx="3" />
        <line x1="5" y1="12" x2="27" y2="12" />
        <line x1="10" y1="4" x2="10" y2="9" />
        <line x1="22" y1="4" x2="22" y2="9" />
        <rect x="10" y="16" width="5" height="5" rx="1" />
        <rect x="18" y="16" width="5" height="5" rx="1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 32 32" focusable="false" aria-hidden="true">
      <path d="M16 3 27 7v8c0 7-3.5 11-11 14C8.5 26 5 22 5 15V7Z" />
      <polyline points="10,16 14,20 22,11" />
    </svg>
  );
}

function TrustIcon({ icon }: { icon: 'costs' | 'extras' | 'discuss' | 'clarity' }) {
  if (icon === 'costs') {
    return (
      <svg className="commercial-trust__icon" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M14 2 24 6v8c0 6-3 10-10 13C7 24 4 20 4 14V6Z" />
      </svg>
    );
  }

  if (icon === 'extras') {
    return (
      <svg className="commercial-trust__icon" viewBox="0 0 28 28" aria-hidden="true">
        <rect x="6" y="12" width="16" height="12" rx="2" />
        <path d="M9 12V8c0-4 2-6 5-6s5 2 5 6v4" />
      </svg>
    );
  }

  if (icon === 'discuss') {
    return (
      <svg className="commercial-trust__icon" viewBox="0 0 28 28" aria-hidden="true">
        <path d="M4 5h20v14H11l-6 5v-5H4Z" />
      </svg>
    );
  }

  return (
    <svg className="commercial-trust__icon" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="11" />
      <polyline points="8,14 12,18 20,9" />
    </svg>
  );
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
      className="commercial-clarity scroll-mt-28"
      aria-labelledby="pricing-heading"
    >
      <div className="commercial-clarity__container">
        <motion.header
          initial={reveal.initial({ opacity: 0, y: 20 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="commercial-clarity__header"
        >
          <p className="commercial-clarity__eyebrow">Commercial Clarity</p>

          <h2 id="pricing-heading" className="commercial-clarity__title">
            Simple support options, with costs discussed clearly
          </h2>

          <div className="commercial-clarity__accent" aria-hidden="true" />

          <p className="commercial-clarity__intro">
            We keep the starting point simple and discuss additional tools or third-party costs
            before work begins.
          </p>
        </motion.header>

        <div className="commercial-clarity__cards">
          {COMMERCIAL_CLARITY_FEATURES.map((feature, index) => (
            <motion.article
              key={feature.id}
              initial={reveal.initial({ opacity: 0, y: 20 })}
              whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
              viewport={{ once: true, margin: '-60px' }}
              transition={{
                duration: 0.45,
                delay: index * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="commercial-card"
            >
              <div className="commercial-card__icon" aria-hidden="true">
                <CommercialFeatureIconGraphic icon={feature.icon} />
              </div>
              <div className="commercial-card__rule" aria-hidden="true" />
              <h3 className="commercial-card__title">{feature.title}</h3>
              <p className="commercial-card__description">{feature.description}</p>
              <div className="commercial-card__tag">
                <span className="commercial-card__tag-inner">
                  <CommercialTagIconGraphic icon={feature.tagIcon} />
                  <span>{feature.tag}</span>
                </span>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={reveal.initial({ opacity: 0, y: 16 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.45, delay: 0.15 }}
          className="commercial-pricing"
        >
          <div className="commercial-pricing__intro">
            <div className="commercial-pricing__symbol-wrap" aria-hidden="true">
              <div className="commercial-pricing__symbol">
                <PricingSymbol />
              </div>
            </div>
            <div>
              <h3 className="commercial-pricing__heading">Need the full breakdown?</h3>
              <p className="commercial-pricing__copy">
                Detailed inclusions, support models and commercial notes are available on the
                pricing page.
              </p>
            </div>
          </div>

          <div className="commercial-pricing__models" aria-label="Available support models">
            <div className="commercial-pricing__model">
              <div className="commercial-pricing__model-icon" aria-hidden="true">
                <PricingModelIcon model="sprint" />
              </div>
              <span className="commercial-pricing__model-title">Sprint</span>
              <span className="commercial-pricing__model-copy">Focused delivery</span>
            </div>

            <div className="commercial-pricing__model">
              <div className="commercial-pricing__model-icon" aria-hidden="true">
                <PricingModelIcon model="monthly" />
              </div>
              <span className="commercial-pricing__model-title">Monthly</span>
              <span className="commercial-pricing__model-copy">Ongoing support</span>
            </div>

            <div className="commercial-pricing__model">
              <div className="commercial-pricing__model-icon" aria-hidden="true">
                <PricingModelIcon model="maintenance" />
              </div>
              <span className="commercial-pricing__model-title">Maintenance</span>
              <span className="commercial-pricing__model-copy">Keep things running</span>
            </div>
          </div>

          <div className="commercial-pricing__cta-wrap">
            <Link
              className="commercial-pricing__cta"
              to={CANONICAL_ROUTES.pricing}
              aria-label="View full pricing and commercial details"
              onClick={trackViewFullPricingClick}
            >
              <span className="commercial-pricing__cta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M7 17 17 7" />
                  <polyline points="10,7 17,7 17,14" />
                </svg>
              </span>

              <span className="commercial-pricing__cta-text">
                <strong>View full pricing</strong>
                <span>Transparent pricing. No hidden extras.</span>
              </span>

              <svg
                className="commercial-pricing__cta-arrow"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M4 12h15" />
                <polyline points="14,6 20,12 14,18" />
              </svg>
            </Link>
          </div>
        </motion.div>

        <ul className="commercial-trust" aria-label="Commercial commitments">
          <li className="commercial-trust__item">
            <TrustIcon icon="costs" />
            <span>Transparent costs</span>
          </li>
          <li className="commercial-trust__item">
            <TrustIcon icon="extras" />
            <span>No hidden extras</span>
          </li>
          <li className="commercial-trust__item">
            <TrustIcon icon="discuss" />
            <span>Discuss before we begin</span>
          </li>
          <li className="commercial-trust__item">
            <TrustIcon icon="clarity" />
            <span>Commercial clarity from day one</span>
          </li>
        </ul>
      </div>
    </section>
  );
};
