import type { MouseEvent, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { AUDIT_CHECKER_PATH } from '../constants/navigation';

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
  return `${AUDIT_CHECKER_PATH}?${params.toString()}`;
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
    destination: AUDIT_CHECKER_PATH,
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
    // Always route to the dedicated audit page (homepage stays promotional only).
    if (location.pathname === '/' && !href.startsWith('http')) {
      event.preventDefault();
      window.location.assign(href);
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
          'hidden min-h-[40px] items-center rounded-lg border border-brand-blue/35 bg-white px-3 py-2 text-[13px] font-semibold text-brand-blue transition-colors hover:border-brand-blue hover:bg-brand-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40 md:inline-flex xl:px-4 xl:text-sm'
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
          'inline-flex w-full items-center justify-center rounded-lg border border-brand-blue/25 bg-brand-surface px-7 py-3.5 text-[15px] font-semibold text-brand-navy shadow-sm transition-colors hover:border-brand-blue/40 hover:bg-white sm:w-auto'
        }
      >
        {label}
        <ArrowRight className="ml-2 h-4 w-4" />
      </SelfAuditLink>
    );
  }

  if (variant === 'banner') {
    return (
      <section className="border-y border-brand-border bg-brand-surface/60 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px] rounded-2xl border border-brand-border bg-white px-6 py-8 shadow-[0_16px_40px_-28px_rgba(0,10,45,0.25)] sm:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
            Free UK SME visibility tool
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-brand-navy sm:text-2xl">
            Not sure how your website looks to search engines and new visitors?
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Run a free public-signal website audit on our dedicated checker page and get a practical
            visibility score, benchmark, mobile-readiness indicators, and recommended next actions.
          </p>
          <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <SelfAuditLink
              href={href}
              label={label}
              onClick={handleClick}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-brand-navy px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-navy/90"
            >
              {label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </SelfAuditLink>
            <p className="text-xs leading-5 text-slate-500">
              Free public-signal overview. Full report runs on the audit page only.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'inline') {
    return (
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 rounded-2xl border border-brand-border bg-brand-surface/50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-navy">
              See how your website looks to search engines and new visitors
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Run the free checker on our dedicated audit page for a practical visibility score and next actions.
            </p>
          </div>
          <SelfAuditLink
            href={href}
            label={label}
            onClick={handleClick}
            className={
              mergedClassName ||
              'inline-flex shrink-0 items-center justify-center rounded-lg border border-brand-blue/30 bg-white px-4 py-2.5 text-sm font-semibold text-brand-blue transition hover:border-brand-blue hover:bg-brand-surface'
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
