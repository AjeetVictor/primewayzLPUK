import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Code2,
  Globe2,
  MonitorCheck,
  ShieldCheck,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { BOOK_CALL_URL } from '../../constants/contactBooking';
import { shellClasses, type ServiceIconTone } from '../../constants/designSystem';
import { getDataLayerUtmPayload, pushDataLayer } from '../../lib/dataLayer';
import { cn } from '../../utils/cn';
import { ServiceNavIcon } from '../ui/ServiceNavIcon';

type ServiceRoute = {
  title: string;
  summary: string;
  href: string;
  icon: LucideIcon;
  tone: ServiceIconTone;
  badge?: string;
  description: string;
  checklist: string[];
};

type ServicesMegaMenuProps = {
  variant: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

const serviceRoutes: ServiceRoute[] = [
  {
    title: 'Website & Visibility Support',
    summary: 'SEO, AEO/GEO, speed, content and trust',
    href: '/website-visibility-support',
    icon: Globe2,
    tone: 'teal',
    badge: 'Popular',
    description:
      'Improve how your website is found, understood and trusted. We strengthen your SEO foundations, content structure, technical health and enquiry flow.',
    checklist: [
      'SEO foundations & on-page',
      'AEO / GEO readiness',
      'Technical health & speed',
      'Content & service page clarity',
      'Trust signals & compliance',
      'Enquiry flow optimisation',
    ],
  },
  {
    title: 'CRM & Automation Support',
    summary: 'Leads, CRM, workflows, integrations',
    href: '/crm-automation-support',
    icon: Workflow,
    tone: 'magenta',
    description:
      'Clean up lead capture, CRM handoffs, workflow automation and reporting so enquiries are easier to follow and convert.',
    checklist: [
      'Lead capture review',
      'CRM cleanup & fields',
      'Workflow automation',
      'Attribution support',
      'Integration planning',
      'Follow-up visibility',
    ],
  },
  {
    title: 'Software & Product Delivery',
    summary: 'Web apps, portals, APIs, integrations',
    href: '/software-product-delivery',
    icon: Code2,
    tone: 'navy',
    description:
      'Plan and deliver practical product improvements, portals, dashboards, APIs and integrations through a steady monthly rhythm.',
    checklist: [
      'Web app delivery',
      'Customer portals',
      'API integrations',
      'Product improvements',
      'QA and release support',
      'Technical planning',
    ],
  },
  {
    title: 'Remote IT Resources',
    summary: 'Flexible technical capacity and support',
    href: '/remote-it-resources',
    icon: Users,
    tone: 'blue',
    description:
      'Add flexible technical capacity for website support, QA, development coordination and ongoing digital delivery.',
    checklist: [
      'Flexible monthly capacity',
      'Website support',
      'QA assistance',
      'Delivery coordination',
      'Technical task support',
      'Remote team extension',
    ],
  },
  {
    title: 'Maintenance Support',
    summary: 'Updates, fixes, monitoring and stability',
    href: '/maintenance',
    icon: ShieldCheck,
    tone: 'teal',
    description:
      'Keep your website stable, current and conversion-ready with updates, fixes, monitoring and practical improvements.',
    checklist: [
      'Website updates',
      'Bug fixes',
      'Monitoring checks',
      'Security basics',
      'Content support',
      'Stability reviews',
    ],
  },
];

function trackServiceNavClick(service: ServiceRoute, location: string): void {
  pushDataLayer({
    event: 'nav_service_click',
    nav_group: 'Services',
    service_name: service.title,
    destination_url: service.href,
    cta_location: location,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '/',
    ...getDataLayerUtmPayload(),
  });
}

function ActiveServicePanel({
  service,
  onNavigate,
  location,
}: {
  service: ServiceRoute;
  onNavigate?: () => void;
  location: string;
}) {
  return (
    <div className="h-full rounded-2xl border border-cyan-100 bg-gradient-to-br from-brand-surface via-white to-cyan-50/60 p-6">
      {service.badge ? (
        <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-blue">
          {service.badge}
        </span>
      ) : null}
      <h3 className="mt-5 text-xl font-bold tracking-tight text-brand-navy">{service.title}</h3>
      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{service.description}</p>

      <ul className="mt-6 grid gap-x-5 gap-y-3 sm:grid-cols-2">
        {service.checklist.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs font-medium leading-5 text-brand-ink">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" strokeWidth={2.2} aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <Link
        to={service.href}
        onClick={() => {
          trackServiceNavClick(service, location);
          onNavigate?.();
        }}
        className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue transition hover:text-brand-navy"
      >
        Explore this service
        <ArrowRight className="h-4 w-4" strokeWidth={2.15} aria-hidden />
      </Link>
    </div>
  );
}

export function ServicesMegaMenu({ variant, onNavigate }: ServicesMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const activeService = serviceRoutes[activeIndex] ?? serviceRoutes[0];

  useEffect(() => {
    if (variant !== 'desktop' || !open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, variant]);

  if (variant === 'mobile') {
    return (
      <div className="border-b border-brand-border/80 pb-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 py-3 text-[15px] font-medium text-brand-ink"
          aria-expanded={open}
          aria-controls={menuId}
        >
          Services
          <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} aria-hidden />
        </button>

        {open ? (
          <div id={menuId} className="space-y-2 px-1 pb-3">
            {serviceRoutes.map((service, index) => {
              const isActive = activeIndex === index;
              const Icon = service.icon;

              return (
                <div key={service.title} className="rounded-xl border border-brand-border bg-white">
                  <button
                    type="button"
                    onClick={() => setActiveIndex(isActive ? 0 : index)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left"
                    aria-expanded={isActive}
                  >
                    <ServiceNavIcon icon={Icon} tone={service.tone} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-brand-navy">{service.title}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-slate-500">{service.summary}</span>
                    </span>
                    <ChevronDown className={cn('h-4 w-4 shrink-0 transition', isActive && 'rotate-180')} aria-hidden />
                  </button>
                  {isActive ? (
                    <div className="border-t border-brand-border/70 px-3 pb-3 pt-1">
                      <p className="py-3 text-xs leading-5 text-slate-600">{service.description}</p>
                      <Link
                        to={service.href}
                        onClick={() => {
                          trackServiceNavClick(service, 'mobile_services_menu');
                          onNavigate?.();
                        }}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue"
                      >
                        Explore this service
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })}
            <Link
              to={BOOK_CALL_URL}
              onClick={onNavigate}
              className="mt-3 flex items-center justify-between rounded-xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm font-semibold text-brand-navy"
            >
              Need help choosing the right service?
              <span className="inline-flex items-center gap-1 text-brand-blue">
                Book a call
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="true"
        className={cn(shellClasses.navLink, 'inline-flex items-center gap-1', open && 'bg-brand-surface text-brand-navy')}
      >
        Services
        <ChevronDown className={cn('h-3.5 w-3.5 transition', open && 'rotate-180')} aria-hidden />
      </button>

      {open ? (
        <div
          id={menuId}
          className="absolute left-1/2 top-full z-50 mt-3 w-[min(92vw,52rem)] -translate-x-1/2 rounded-3xl border border-brand-border bg-white p-4 shadow-[0_24px_58px_-32px_rgba(0,10,45,0.28)]"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="divide-y divide-brand-border/80 rounded-2xl bg-white">
              {serviceRoutes.map((service, index) => {
                const isActive = activeIndex === index;
                const Icon = service.icon;

                return (
                  <Link
                    key={service.title}
                    to={service.href}
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => {
                      trackServiceNavClick(service, 'desktop_services_menu_list');
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className={cn(
                      'group flex items-center gap-4 px-4 py-4 transition first:rounded-t-2xl last:rounded-b-2xl hover:bg-brand-surface/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40',
                      isActive && 'bg-brand-surface/80',
                    )}
                  >
                    <ServiceNavIcon icon={Icon} tone={service.tone} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-brand-navy">{service.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">{service.summary}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-brand-cyan" aria-hidden />
                  </Link>
                );
              })}
            </div>

            <ActiveServicePanel
              service={activeService}
              location="desktop_services_menu_panel"
              onNavigate={() => {
                setOpen(false);
                onNavigate?.();
              }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-brand-border bg-brand-surface/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy">
              <MonitorCheck className="h-4 w-4 text-brand-cyan" strokeWidth={2.15} aria-hidden />
              Need help choosing the right service?
            </span>
            <Link
              to={BOOK_CALL_URL}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue transition hover:text-brand-navy"
            >
              Book a discovery call
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
