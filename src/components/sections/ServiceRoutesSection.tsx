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
import { ServiceNavIcon } from '../ui/ServiceNavIcon';
import { trackConversionEvent } from '../../lib/analytics';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import {
  SERVICE_ROUTES_CONTAINER_CLASS,
  SITE_CONTAINER_CLASS,
} from '../../constants/siteLayout';

const TEAL = '#087E8B';
const BORDER = '#D7E7EC';
const SECTION_BG = '#FAFAF7';
const BODY = '#334155';

type ServiceRouteCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  eventName: string;
};

const serviceRoutes: ServiceRouteCard[] = [
  {
    title: 'Website & Visibility Support',
    description:
      'Website improvements, SEO foundations, AEO/GEO content structure, speed, trust signals and enquiry flow.',
    href: '/website-visibility-support',
    icon: SearchCheck,
    eventName: 'service_card_click_website_visibility',
  },
  {
    title: 'CRM & Automation Support',
    description:
      'Lead capture, CRM cleanup, forms, workflows, notifications, reporting and follow-up processes.',
    href: '/crm-automation-support',
    icon: Workflow,
    eventName: 'service_card_click_crm_automation',
  },
  {
    title: 'Software Development as a Subscription',
    description:
      'Ongoing monthly development capacity for businesses with evolving digital needs.',
    href: '/software-development-subscription-uk',
    icon: Code2,
    eventName: 'service_card_click_software_delivery',
  },
  {
    title: 'Remote IT Resources',
    description:
      'Flexible technical capacity for ongoing or project-based delivery needs.',
    href: '/remote-it-resources',
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

function ServiceRouteCard({
  title,
  description,
  href,
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
      className="group flex min-h-[260px] min-w-0 flex-col rounded-3xl border bg-white p-7 shadow-[0_10px_28px_-24px_rgba(0,10,45,0.12)] transition duration-200 hover:-translate-y-1 hover:border-[#31A1D3]/50 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:min-h-[270px] sm:p-8 md:min-w-[360px]"
      style={{ borderColor: BORDER }}
    >
      <ServiceNavIcon icon={icon} tone="teal" size="lg" />

      <h3 className="mt-6 text-xl font-bold leading-tight text-brand-navy sm:text-2xl">{title}</h3>

      <p className="mt-4 max-w-[22.5rem] flex-1 text-sm leading-7 sm:text-base" style={{ color: BODY }}>
        {description}
      </p>

      <Link
        to={href}
        onClick={() => trackServiceCardClick(eventName, href, title)}
        className="mt-6 inline-flex items-center gap-2 text-sm font-bold transition group-hover:gap-3 group-hover:underline sm:text-base"
        style={{ color: TEAL }}
      >
        Explore
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
    className="py-16 sm:py-20 md:py-24"
    style={{ backgroundColor: SECTION_BG }}
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
          <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
            Service routes
          </p>

          <h2
            id="service-routes-heading"
            className="mt-5 text-[2rem] font-bold leading-tight tracking-[-0.04em] text-brand-navy sm:text-4xl md:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
          >
            Choose the support route that
            <br className="hidden sm:block" />
            <span className="sm:sr-only"> </span>
            fits your current priority
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
            Start with visibility, CRM, software delivery or remote technical capacity — then move
            forward with a structured monthly support rhythm.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-6">
          {serviceRoutes.map((route, index) => (
            <ServiceRouteCard key={route.title} {...route} index={index} />
          ))}
        </div>

        <motion.div
          initial={reveal.initial({ opacity: 0, y: 12 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-6 rounded-2xl border bg-white px-5 py-5 shadow-sm sm:px-6"
          style={{ borderColor: BORDER }}
        >
          <div className="flex flex-col items-start justify-between gap-4 text-brand-navy sm:flex-row sm:items-center sm:gap-6">
            <div className="flex items-center gap-4">
              <ServiceNavIcon icon={ShieldCheck} tone="teal" size="md" className="!h-10 !w-10" />
              <p className="text-sm leading-6 sm:text-base" style={{ color: BODY }}>
                Need only stability, fixes and monitoring?
              </p>
            </div>

            <Link
              to="/maintenance"
              onClick={() =>
                trackConversionEvent('maintenance_link_click', {
                  cta_location: 'homepage_service_routes',
                  destination_url: '/maintenance',
                })
              }
              className="inline-flex items-center gap-2 text-sm font-bold transition hover:gap-3 hover:underline sm:text-base"
              style={{ color: TEAL }}
            >
              View maintenance support
              <ArrowRight className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} aria-hidden />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
  );
};
