import { Link } from 'react-router-dom';
import {
  CANONICAL_ROUTES,
  SDAAS_MONTHLY_CAPACITY_HREF,
} from '../../constants/canonicalRoutes';
import { trackConversionEvent } from '../../lib/analytics';
import './ServiceRoutesSection.css';

type ServiceRouteTone = 'blue' | 'teal' | 'purple' | 'amber';
type ServiceRouteIcon = 'visibility' | 'crm' | 'software' | 'managed' | 'remote';

type ServiceRouteCard = {
  title: string;
  description: string;
  outcomes: string[];
  href: string;
  linkLabel: string;
  icon: ServiceRouteIcon;
  tone: ServiceRouteTone;
  eventName: string;
};

type ServiceRouteBenefit = {
  title: string;
  copy: string;
  icon: 'priority' | 'integrated' | 'outcomes' | 'secure' | 'scalable';
  tone: ServiceRouteTone;
};

const serviceRoutes: ServiceRouteCard[] = [
  {
    title: 'Website Visibility & Conversion',
    description:
      'Improve discovery, page clarity, trust signals, enquiry journeys and conversion barriers.',
    outcomes: ['Clearer search readiness', 'Stronger trust signals', 'Smoother enquiry paths'],
    href: CANONICAL_ROUTES.websiteVisibilitySupport,
    linkLabel: 'Explore website visibility support',
    icon: 'visibility',
    tone: 'blue',
    eventName: 'service_card_click_website_visibility',
  },
  {
    title: 'CRM & Workflow Automation',
    description:
      'Connect website enquiries, CRM records, follow-up workflows and reporting so leads are handled consistently.',
    outcomes: ['Website-to-CRM capture', 'Consistent follow-up', 'Clear lead routing'],
    href: CANONICAL_ROUTES.crmAutomationSupport,
    linkLabel: 'Explore CRM automation support',
    icon: 'crm',
    tone: 'teal',
    eventName: 'service_card_click_crm_automation',
  },
  {
    title: 'Software & Product Engineering',
    description:
      'Build, improve, integrate or modernise applications through structured monthly delivery capacity.',
    outcomes: ['Feature delivery', 'Integration work', 'Backlog reduction'],
    href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
    linkLabel: 'Explore software development subscription',
    icon: 'software',
    tone: 'purple',
    eventName: 'service_card_click_software_delivery',
  },
  {
    title: 'Managed Application & Website Support',
    description:
      'Keep live websites and applications stable with monitoring, fixes, updates and controlled improvements.',
    outcomes: ['Stability support', 'Security updates', 'Controlled changes'],
    href: CANONICAL_ROUTES.maintenance,
    linkLabel: 'Explore managed application support',
    icon: 'managed',
    tone: 'amber',
    eventName: 'service_card_click_maintenance',
  },
  {
    title: 'Remote IT Team Extension',
    description:
      'Add dependable developers, QA, analysts and coordinators when your internal team needs extra capacity.',
    outcomes: ['Extra delivery capacity', 'Specialist support', 'Flexible team extension'],
    href: CANONICAL_ROUTES.remoteItResources,
    linkLabel: 'Explore remote IT team extension',
    icon: 'remote',
    tone: 'blue',
    eventName: 'service_card_click_remote_it',
  },
];

const serviceRouteBenefits: ServiceRouteBenefit[] = [
  {
    title: 'Focus on your priority',
    copy: 'Start where it matters most.',
    icon: 'priority',
    tone: 'blue',
  },
  {
    title: 'Integrated by design',
    copy: 'Routes work together seamlessly.',
    icon: 'integrated',
    tone: 'teal',
  },
  {
    title: 'Measurable outcomes',
    copy: 'Track impact and drive continuous improvement.',
    icon: 'outcomes',
    tone: 'purple',
  },
  {
    title: 'Secure & reliable',
    copy: 'Built with enterprise-grade standards.',
    icon: 'secure',
    tone: 'amber',
  },
  {
    title: 'Scalable with you',
    copy: 'Right-sized support that grows with your goals.',
    icon: 'scalable',
    tone: 'blue',
  },
];

function trackServiceCardClick(eventName: string, destination: string, cardTitle: string) {
  trackConversionEvent(eventName, {
    cta_location: 'homepage_service_routes',
    destination_url: destination,
    card_title: cardTitle,
  });
}

function trackCapacityGuideClick() {
  trackConversionEvent('homepage_capacity_guide_click', {
    cta_location: 'homepage_service_routes',
    destination_url: SDAAS_MONTHLY_CAPACITY_HREF,
    article_title: 'How Monthly Software Development Capacity Works',
  });
}

function ServiceRouteIconGraphic({ icon }: { icon: ServiceRouteIcon }) {
  if (icon === 'visibility') {
    return (
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <circle cx="28" cy="28" r="16" />
        <line x1="39.5" y1="39.5" x2="55" y2="55" />
        <polyline points="19,31 25,25 30,30 38,21" />
        <polyline points="34,21 38,21 38,25" />
      </svg>
    );
  }

  if (icon === 'crm') {
    return (
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <rect x="8" y="10" width="17" height="17" rx="3" />
        <rect x="39" y="37" width="17" height="17" rx="3" />
        <path d="M16.5 27v9.5c0 4 3 7 7 7H39" />
        <rect x="26" y="24" width="13" height="13" rx="3" />
      </svg>
    );
  }

  if (icon === 'software') {
    return (
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <polyline points="23,18 10,32 23,46" />
        <polyline points="41,18 54,32 41,46" />
        <line x1="37" y1="12" x2="27" y2="52" />
      </svg>
    );
  }

  if (icon === 'managed') {
    return (
      <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
        <path d="M32 7 50 14v14c0 12-7 21-18 27C21 49 14 40 14 28V14l18-7Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" focusable="false" aria-hidden="true">
      <rect x="8" y="10" width="42" height="29" rx="4" />
      <line x1="29" y1="39" x2="29" y2="47" />
      <line x1="20" y1="47" x2="36" y2="47" />
      <circle cx="47" cy="42" r="6" />
      <path d="M38 57c0-6 3-9 9-9s9 3 9 9" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="service-route-card__check" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="7" />
      <polyline points="5.5,9 8,11.5 12.5,6.5" />
    </svg>
  );
}

function CtaArrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 12h15M14 6l6 6-6 6" />
    </svg>
  );
}

function BenefitIcon({ icon }: { icon: ServiceRouteBenefit['icon'] }) {
  if (icon === 'priority') {
    return (
      <svg viewBox="0 0 54 54" focusable="false" aria-hidden="true">
        <circle cx="24" cy="30" r="17" />
        <circle cx="24" cy="30" r="10" />
        <circle cx="24" cy="30" r="4" />
        <line x1="27" y1="27" x2="49" y2="5" />
        <polyline points="40,5 49,5 49,14" />
      </svg>
    );
  }

  if (icon === 'integrated') {
    return (
      <svg viewBox="0 0 54 54" focusable="false" aria-hidden="true">
        <path d="M21 5h12v10c4-4 11-1 11 5s-7 9-11 5v10H23c4 4 1 11-5 11s-9-7-5-11H5V23h10c-4-4-1-11 5-11s9 7 5 11h8" />
      </svg>
    );
  }

  if (icon === 'outcomes') {
    return (
      <svg viewBox="0 0 54 54" focusable="false" aria-hidden="true">
        <line x1="6" y1="48" x2="49" y2="48" />
        <rect x="11" y="31" width="8" height="17" />
        <rect x="25" y="20" width="8" height="28" />
        <rect x="39" y="9" width="8" height="39" />
      </svg>
    );
  }

  if (icon === 'secure') {
    return (
      <svg viewBox="0 0 54 54" focusable="false" aria-hidden="true">
        <path d="M27 5 44 12v13c0 11-6 19-17 25C16 44 10 36 10 25V12l17-7Z" />
        <rect x="20" y="25" width="14" height="13" rx="2" />
        <path d="M23 25v-4c0-3 2-5 4-5s4 2 4 5v4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 54 54" focusable="false" aria-hidden="true">
      <circle cx="18" cy="17" r="6" />
      <circle cx="36" cy="17" r="6" />
      <circle cx="27" cy="14" r="7" />
      <path d="M5 44c0-8 4-12 13-12" />
      <path d="M49 44c0-8-4-12-13-12" />
      <path d="M12 46c0-11 5-17 15-17s15 6 15 17" />
    </svg>
  );
}

function ServiceRouteCardItem({
  title,
  description,
  outcomes,
  href,
  linkLabel,
  icon,
  tone,
  eventName,
}: ServiceRouteCard) {
  const toneClass = tone === 'blue' ? '' : ` service-route-card--${tone}`;

  return (
    <article className={`service-route-card${toneClass}`}>
      <div className="service-route-card__icon" aria-hidden="true">
        <ServiceRouteIconGraphic icon={icon} />
      </div>

      <h3 className="service-route-card__title">{title}</h3>

      <p className="service-route-card__description">{description}</p>

      <div className="service-route-card__divider" aria-hidden="true" />

      <ul className="service-route-card__list">
        {outcomes.map((outcome) => (
          <li key={outcome}>
            <CheckIcon />
            <span>{outcome}</span>
          </li>
        ))}
      </ul>

      <Link
        className="service-route-card__cta"
        to={href}
        aria-label={linkLabel}
        onClick={() => trackServiceCardClick(eventName, href, title)}
      >
        <span>{linkLabel}</span>
        <CtaArrow />
      </Link>
    </article>
  );
}

export const ServiceRoutesSection = () => {
  return (
    <section
      id="service-routes"
      className="service-routes"
      aria-labelledby="service-routes-title"
    >
      <div className="service-routes__container">
        <header className="service-routes__header">
          <p className="service-routes__eyebrow">Service Routes</p>

          <h2 id="service-routes-title" className="service-routes__title">
            Choose the support route that fits your current priority
          </h2>

          <p className="service-routes__intro">
            Start with visibility, CRM workflows, software delivery, managed support or remote
            technical capacity, then organise the work through the engagement model that fits.
          </p>
        </header>

        <div className="service-routes__grid">
          {serviceRoutes.map((route) => (
            <ServiceRouteCardItem key={route.title} {...route} />
          ))}
        </div>

        <Link
          className="service-routes__insight"
          to={SDAAS_MONTHLY_CAPACITY_HREF}
          aria-label="Read the guide: How Monthly Software Development Capacity Works"
          data-homepage-capacity-guide="true"
          onClick={trackCapacityGuideClick}
        >
          <div className="service-routes__insight-copy">
            <span className="service-routes__insight-label">Practical guide</span>

            <h3 className="service-routes__insight-title">
              How Monthly Software Development Capacity Works
            </h3>

            <p className="service-routes__insight-description">
              Understand backlog intake, prioritisation, QA, releases and what happens when
              requests exceed the available monthly allocation.
            </p>
          </div>

          <span className="service-routes__insight-cta" aria-hidden="true">
            <span>Read the guide</span>
            <CtaArrow />
          </span>
        </Link>

        <ul className="service-routes__benefits" role="list">
          {serviceRouteBenefits.map((benefit) => {
            const toneClass =
              benefit.tone === 'blue' ? '' : ` service-routes__benefit--${benefit.tone}`;

            return (
              <li
                key={benefit.title}
                className={`service-routes__benefit${toneClass}`}
              >
                <div className="service-routes__benefit-icon" aria-hidden="true">
                  <BenefitIcon icon={benefit.icon} />
                </div>

                <div>
                  <h3 className="service-routes__benefit-title">{benefit.title}</h3>
                  <p className="service-routes__benefit-copy">{benefit.copy}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
