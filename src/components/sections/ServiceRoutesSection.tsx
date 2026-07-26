import { motion } from 'motion/react';
import {
  ArrowRight,
  Code2,
  MonitorCog,
  SearchCheck,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { shellClasses } from '../../constants/designSystem';
import {
  SERVICE_ROUTES_CONTAINER_CLASS,
  SITE_CONTAINER_CLASS,
} from '../../constants/siteLayout';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { trackConversionEvent } from '../../lib/analytics';
import { ServiceNavIcon } from '../ui/ServiceNavIcon';

type ServiceRouteCard = {
  title: string;
  description: string;
  outcomes: string[];
  href: string;
  linkLabel: string;
  icon: LucideIcon;
  eventName: string;
};

const serviceRoutes: ServiceRouteCard[] = [
  {
    title: 'Website Visibility & Conversion',
    description:
      'Improve discovery, page clarity, trust signals, enquiry journeys and conversion barriers.',
    outcomes: ['Clearer search readiness', 'Stronger trust signals', 'Smoother enquiry paths'],
    href: CANONICAL_ROUTES.websiteVisibilitySupport,
    linkLabel: 'Explore website visibility support',
    icon: SearchCheck,
    eventName: 'service_card_click_website_visibility',
  },
  {
    title: 'CRM & Workflow Automation',
    description:
      'Connect website enquiries, CRM records, follow-up workflows and reporting so leads are handled consistently.',
    outcomes: ['Website-to-CRM capture', 'Consistent follow-up', 'Clearer lead routing'],
    href: CANONICAL_ROUTES.crmAutomationSupport,
    linkLabel: 'Explore CRM automation support',
    icon: Workflow,
    eventName: 'service_card_click_crm_automation',
  },
  {
    title: 'Software & Product Engineering',
    description:
      'Build, improve, integrate or modernise applications through structured monthly delivery capacity.',
    outcomes: ['Feature delivery', 'Integration work', 'Backlog reduction'],
    href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
    linkLabel: 'Explore software development subscription',
    icon: Code2,
    eventName: 'service_card_click_software_delivery',
  },
  {
    title: 'Managed Application & Website Support',
    description:
      'Keep live websites and applications stable with monitoring, fixes, updates and controlled improvements.',
    outcomes: ['Stability support', 'Security updates', 'Controlled changes'],
    href: CANONICAL_ROUTES.maintenance,
    linkLabel: 'Explore managed application support',
    icon: ShieldCheck,
    eventName: 'service_card_click_maintenance',
  },
  {
    title: 'Remote IT Team Extension',
    description:
      'Add dependable developers, QA, analysts and coordinators when your internal team needs extra capacity.',
    outcomes: ['Extra delivery capacity', 'Specialist support', 'Flexible team extension'],
    href: CANONICAL_ROUTES.remoteItResources,
    linkLabel: 'Explore remote IT team extension',
    icon: MonitorCog,
    eventName: 'service_card_click_remote_it',
  },
];

function trackServiceCardClick(eventName: string, destination: string, cardTitle: string) {
  trackConversionEvent(eventName, {
    cta_location: 'homepage_service_routes',
    destination_url: destination,
    card_title: cardTitle,
  });
}

function ServiceRouteCardItem({
  title,
  description,
  outcomes,
  href,
  linkLabel,
  icon,
  eventName,
  index,
}: ServiceRouteCard & { index: number }) {
  const reveal = useRevealMotion();

  return (
    <motion.article
      initial={reveal.initial({ opacity: 0, y: 24 })}
      whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className={`${shellClasses.sectionCard} min-h-[260px]`}
    >
      <ServiceNavIcon icon={icon} tone="teal" size="lg" />
      <h3 className="mt-6 text-xl font-bold leading-tight text-brand-navy sm:text-2xl">{title}</h3>
      <p className="mt-4 flex-1 text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
      <ul className="mt-4 space-y-1.5">
        {outcomes.map((outcome) => (
          <li key={outcome} className="text-xs font-medium leading-5 text-slate-500">
            {outcome}
          </li>
        ))}
      </ul>
      <Link
        to={href}
        onClick={() => trackServiceCardClick(eventName, href, title)}
        className="mt-6 inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-brand-blue transition hover:gap-3 hover:text-brand-navy sm:text-base"
      >
        {linkLabel}
        <ArrowRight className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} aria-hidden />
      </Link>
    </motion.article>
  );
}

export const ServiceRoutesSection = () => {
  const reveal = useRevealMotion();

  return (
    <section
      id="service-routes"
      className="bg-brand-surface py-16 sm:py-20 md:py-24"
      aria-labelledby="service-routes-heading"
    >
      <div className={SITE_CONTAINER_CLASS}>
        <div className={SERVICE_ROUTES_CONTAINER_CLASS}>
          <motion.div
            initial={reveal.initial({ opacity: 0, y: 20 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className={shellClasses.sectionEyebrow}>Service routes</p>
            <h2 id="service-routes-heading" className={`mt-5 ${shellClasses.sectionHeading}`}>
              Choose the support route that fits your current priority
            </h2>
            <p className={`mx-auto mt-6 max-w-3xl ${shellClasses.sectionLead}`}>
              Start with visibility, CRM workflows, software delivery, managed support or remote
              technical capacity—then organise the work through the engagement model that fits.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
            {serviceRoutes.map((route, index) => (
              <ServiceRouteCardItem key={route.title} {...route} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
