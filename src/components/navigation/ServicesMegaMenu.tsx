import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SERVICES_MENU_TITLE,
  serviceNavGroups,
  type ServiceNavGroup,
} from '../../constants/servicesNavigation';
import { shellClasses } from '../../constants/designSystem';
import { getDataLayerUtmPayload, pushDataLayer } from '../../lib/dataLayer';
import { ServiceNavIcon } from '../ui/ServiceNavIcon';
import { cn } from '../../utils/cn';

type ServicesMegaMenuProps = {
  variant: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

function trackServiceNavClick(group: ServiceNavGroup, serviceName: string, href: string): void {
  pushDataLayer({
    event: 'nav_service_click',
    nav_group: group.label,
    service_name: serviceName,
    destination_url: href,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '/',
    ...getDataLayerUtmPayload(),
  });
}

function ServiceNavLink({
  group,
  item,
  onNavigate,
  className,
}: {
  group: ServiceNavGroup;
  item: ServiceNavGroup['items'][number];
  onNavigate?: () => void;
  className?: string;
}) {
  const isInternal = item.href.startsWith('/');
  const isHashOnly = item.href.startsWith('/#');

  const handleClick = () => {
    trackServiceNavClick(group, item.name, item.href);
    onNavigate?.();
  };

  const content = (
    <>
      <ServiceNavIcon icon={item.icon} tone={item.iconTone ?? 'blue'} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-brand-ink group-hover:text-brand-navy">
            {item.name}
          </span>
          {item.isNew ? (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">
              New
            </span>
          ) : null}
        </span>
        <span className="mt-1 block text-xs leading-5 text-slate-500">{item.description}</span>
      </span>
    </>
  );

  const sharedProps = {
    'data-track': 'nav_service_click',
    'data-nav-group': group.label,
    'data-service-name': item.name,
    onClick: handleClick,
    className: cn(
      'group flex gap-3 rounded-xl border border-transparent p-3 transition hover:border-brand-border hover:bg-brand-surface/80',
      className,
    ),
  };

  if (isHashOnly) {
    return (
      <a href={item.href} {...sharedProps}>
        {content}
      </a>
    );
  }

  if (isInternal) {
    return (
      <Link to={item.href} {...sharedProps}>
        {content}
      </Link>
    );
  }

  return (
    <a href={item.href} {...sharedProps}>
      {content}
    </a>
  );
}

export function ServicesMegaMenu({ variant, onNavigate }: ServicesMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(serviceNavGroups[0]?.label ?? null);
  const containerRef = useRef<HTMLDivElement>(null);

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
        >
          Services
          <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
        </button>

        {open ? (
          <div className="space-y-3 px-1 pb-2">
            <p className="px-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              {SERVICES_MENU_TITLE}
            </p>
            {serviceNavGroups.map((group) => {
              const isExpanded = expandedGroup === group.label;
              return (
                <div key={group.label} className="rounded-xl border border-brand-border bg-brand-surface/50">
                  <button
                    type="button"
                    onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
                    className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-semibold text-brand-navy"
                    aria-expanded={isExpanded}
                  >
                    {group.label}
                    <ChevronDown className={cn('h-4 w-4 transition', isExpanded && 'rotate-180')} />
                  </button>
                  {isExpanded ? (
                    <div className="space-y-1 px-2 pb-3">
                      {group.items.map((item) => (
                        <ServiceNavLink
                          key={`${group.label}-${item.name}`}
                          group={group}
                          item={item}
                          onNavigate={onNavigate}
                          className="bg-white"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
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
        aria-haspopup="true"
        className={cn(shellClasses.navLink, 'inline-flex items-center gap-1', open && 'bg-brand-surface text-brand-navy')}
      >
        Services
        <ChevronDown className={cn('h-3.5 w-3.5 transition', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          className={cn(shellClasses.megaMenuPanel, 'absolute left-1/2 top-full z-50 mt-3 w-[min(92vw,56rem)] -translate-x-1/2')}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-brand-border pb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              {SERVICES_MENU_TITLE}
            </p>
            <Link
              to="/services"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="text-xs font-semibold text-brand-blue transition hover:text-brand-navy"
            >
              View all services →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {serviceNavGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <ServiceNavLink
                      key={`${group.label}-${item.name}`}
                      group={group}
                      item={item}
                      onNavigate={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
