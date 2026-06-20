import type { MouseEvent, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import {
  scrollToWebPresenceAuditSection,
  WEB_PRESENCE_AUDIT_SECTION_ALIAS,
} from '../lib/utm';

export type SelfAuditCtaVariant = 'nav' | 'hero' | 'banner' | 'inline' | 'footer';

const LABELS: Record<SelfAuditCtaVariant, string> = {
  nav: 'Free website audit',
  hero: 'Check your website free',
  banner: 'Check your website free',
  inline: 'Check your website visibility',
  footer: 'Free website audit',
};

export function buildSelfAuditCtaUrl(utmContent: string): string {
  const params = new URLSearchParams({
    utm_source: 'website',
    utm_medium: 'internal_cta',
    utm_campaign: 'self_audit_cta',
    utm_content: utmContent,
  });
  return `/?${params.toString()}#${WEB_PRESENCE_AUDIT_SECTION_ALIAS}`;
}

type SelfAuditCtaProps = {
  variant: SelfAuditCtaVariant;
  utmContent: string;
  ctaLocation: string;
  className?: string;
  onClick?: () => void;
};

function trackSelfAuditClick(variant: SelfAuditCtaVariant, ctaLocation: string, pagePath: string) {
  trackEvent('self_audit_cta_clicked', {
    cta_location: ctaLocation,
    page_path: pagePath,
    variant,
  });
}

function SelfAuditLink({
  href,
  label,
  className,
  onClick,
  children,
}: {
  href: string;
  label: string;
  className: string;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
  children?: ReactNode;
}) {
  return (
    <a href={href} className={className} onClick={onClick}>
      {children ?? label}
    </a>
  );
}

export function SelfAuditCta({
  variant,
  utmContent,
  ctaLocation,
  className,
  onClick,
}: SelfAuditCtaProps) {
  const location = useLocation();
  const href = buildSelfAuditCtaUrl(utmContent);
  const label = LABELS[variant];

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    trackSelfAuditClick(variant, ctaLocation, location.pathname);
    onClick?.();

    if (location.pathname === '/') {
      event.preventDefault();
      window.history.pushState({}, '', href);
      scrollToWebPresenceAuditSection();
    }
  };

  const mergedClassName = className ?? '';

  if (variant === 'nav') {
    return (
      <SelfAuditLink
        href={href}
        label={label}
        onClick={handleClick}
        className={
          mergedClassName ||
          'hidden min-h-[40px] items-center rounded-md border border-emerald-600/40 bg-white px-3 py-2 text-[13px] font-semibold text-emerald-800 transition-colors hover:border-emerald-600 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600/40 md:inline-flex xl:px-4 xl:text-sm'
        }
      />
    );
  }

  if (variant === 'hero') {
    return (
      <SelfAuditLink
        href={href}
        label={label}
        onClick={handleClick}
        className={
          mergedClassName ||
          'inline-flex w-full items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50/80 px-7 py-3.5 text-[15px] font-semibold text-emerald-900 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50 sm:w-auto'
        }
      >
        {label}
        <ArrowRight className="ml-2 h-4 w-4" />
      </SelfAuditLink>
    );
  }

  if (variant === 'banner') {
    return (
      <section className="border-y border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-slate-50/80 px-6 py-8 sm:px-8">
          <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            Not sure how your website looks to search engines and new visitors?
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Run a free public-signal website audit and get a practical visibility score, benchmark,
            mobile-readiness indicators, and recommended next actions.
          </p>
          <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <SelfAuditLink
              href={href}
              label={label}
              onClick={handleClick}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#000A2D] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-900"
            >
              {label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </SelfAuditLink>
            <p className="text-xs leading-5 text-slate-500">
              Free public-signal overview. Not an authenticated platform audit.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'inline') {
    return (
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-slate-900">
              See how your website looks to search engines and new visitors
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Run a free public-signal audit for a practical visibility score and recommended next actions.
            </p>
          </div>
          <SelfAuditLink
            href={href}
            label={label}
            onClick={handleClick}
            className={
              mergedClassName ||
              'inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-600/30 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:border-emerald-600 hover:bg-emerald-50'
            }
          >
            {label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </SelfAuditLink>
        </div>
      </section>
    );
  }

  return (
    <SelfAuditLink
      href={href}
      label={label}
      onClick={handleClick}
      className={mergedClassName || 'hover:text-white transition-colors'}
    />
  );
}
