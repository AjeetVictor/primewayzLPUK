import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  SERVICES_MENU_TITLE,
  serviceNavGroups,
  type ServiceNavGroup,
} from '../../constants/servicesNavigation';
import { getDataLayerUtmPayload, pushDataLayer } from '../../lib/dataLayer';

type ServicesMegaMenuProps = {
  variant: 'desktop' | 'mobile';
  onNavigate?: () => void;
};

function trackServiceNavClick(group: ServiceNavGroup, serviceName: string, href: string): void {
  const utm = getDataLayerUtmPayload();
  pushDataLayer({
    event: 'nav_service_click',
    nav_group: group.label,
    service_name: serviceName,
    destination_url: href,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '/',
    ...utm,
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
  const Icon = item.icon;
  const isInternal = item.href.startsWith('/');
  const isHashOnly = item.href.startsWith('/#');

  const handleClick = () => {
    trackServiceNavClick(group, item.name, item.href);
    onNavigate?.();
  };

  const content = (
    <>
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-800">
            {item.name}
          </span>
          {item.isNew ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
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
    className: `group flex gap-3 rounded-xl p-3 transition hover:bg-slate-50 ${className ?? ''}`.trim(),
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
      <div className="border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-h-[44px] w-full items-center justify-between rounded-md px-3 py-3 text-[15px] font-medium text-slate-700"
          aria-expanded={open}
        >
          Services
          <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} />
        </button>

        {open ? (
          <div className="space-y-3 px-1 pb-2">
            <p className="px-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              {SERVICES_MENU_TITLE}
            </p>
            {serviceNavGroups.map((group) => {
              const isExpanded = expandedGroup === group.label;
              return (
                <div key={group.label} className="rounded-xl border border-slate-100 bg-slate-50/80">
                  <button
                    type="button"
                    onClick={() => setExpandedGroup(isExpanded ? null : group.label)}
                    className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-semibold text-slate-800"
                    aria-expanded={isExpanded}
                  >
                    {group.label}
                    <ChevronDown className={`h-4 w-4 transition ${isExpanded ? 'rotate-180' : ''}`} />
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
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-2 text-[13px] font-medium leading-none text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600/40 xl:text-sm"
      >
        Services
        <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          className="absolute left-1/2 top-full z-50 mt-3 w-[min(92vw,52rem)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/10"
          onMouseLeave={() => setOpen(false)}
        >
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            {SERVICES_MENU_TITLE}
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {serviceNavGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
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
