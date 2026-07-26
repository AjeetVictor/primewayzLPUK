import { ArrowRight, CalendarDays, ScanSearch } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  DISCOVERY_CALL_CTA_LABEL,
  DISCOVERY_CALL_DESTINATION,
  FREE_REVIEW_CTA_LABEL,
  WEBSITE_CHECKER_CTA_LABEL,
  WEBSITE_CHECKER_DESTINATION,
  buildFreeReviewCtaUrl,
  type FreeReviewCtaPlacement,
  type FreeReviewServiceArea,
  type FreeReviewSourceLocation,
} from '../../constants/conversionCta';
import { shellClasses } from '../../constants/designSystem';
import { trackBookCallClick, trackConversionEvent, trackCtaClick } from '../../lib/analytics';
import {
  assertNoProhibitedAnalyticsProps,
  buildDigitalSystemsReviewAnalyticsPayload,
} from '../../lib/digitalSystemsReview/analytics';

export type DigitalSystemsReviewCtaGroupVariant = 'hero' | 'closing' | 'onDark';

type DigitalSystemsReviewCtaGroupProps = {
  sourceLocation: FreeReviewSourceLocation;
  primaryPlacement: FreeReviewCtaPlacement;
  secondaryPlacement: FreeReviewCtaPlacement;
  variant?: DigitalSystemsReviewCtaGroupVariant;
  /** Optional allowlisted service-area preselection for the review form. */
  serviceArea?: FreeReviewServiceArea;
  /** When set, shows a lower-emphasis tertiary link to the website checker. */
  websiteCheckerPlacement?: FreeReviewCtaPlacement;
  className?: string;
};

const WEBSITE_AUDIT_SUPPORTING_LABELS = ['Free', 'No login required', 'UK SME focused'] as const;

function emitReviewCtaClick(
  sourceLocation: FreeReviewSourceLocation,
  ctaPlacement: FreeReviewCtaPlacement,
  route: string,
  serviceArea?: FreeReviewServiceArea,
) {
  const payload = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation,
    ctaPlacement,
    route,
    serviceArea,
  });
  assertNoProhibitedAnalyticsProps(payload);
  trackConversionEvent('free_review_cta_click', payload);
}

function emitBookCallClick(
  sourceLocation: FreeReviewSourceLocation,
  ctaPlacement: FreeReviewCtaPlacement,
  route: string,
  serviceArea?: FreeReviewServiceArea,
) {
  const payload = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation,
    ctaPlacement,
    route,
    serviceArea,
  });
  assertNoProhibitedAnalyticsProps(payload);
  trackConversionEvent('free_review_book_call_click', payload);
  trackBookCallClick(DISCOVERY_CALL_CTA_LABEL, ctaPlacement);
}

function emitWebsiteCheckerClick(
  sourceLocation: FreeReviewSourceLocation,
  websiteCheckerPlacement: FreeReviewCtaPlacement,
  route: string,
) {
  trackCtaClick(WEBSITE_CHECKER_CTA_LABEL, websiteCheckerPlacement, {
    cta_placement: websiteCheckerPlacement,
    source_location: sourceLocation,
    route,
    destination: WEBSITE_CHECKER_DESTINATION,
  });
}

export function DigitalSystemsReviewCtaGroup({
  sourceLocation,
  primaryPlacement,
  secondaryPlacement,
  variant = 'hero',
  serviceArea,
  websiteCheckerPlacement,
  className = '',
}: DigitalSystemsReviewCtaGroupProps) {
  const location = useLocation();
  const reviewHref = buildFreeReviewCtaUrl(sourceLocation, serviceArea);
  const route = location.pathname || '/';
  const isHero = variant === 'hero';
  const isOnDark = variant === 'onDark';

  const primaryClass = isOnDark
    ? 'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 sm:w-auto'
    : isHero
      ? shellClasses.btnHeroPrimary
      : 'inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-brand-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy sm:w-auto';

  const secondaryClass = isOnDark
    ? 'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50 sm:w-auto'
    : isHero
      ? shellClasses.btnHeroSecondary
      : 'inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-[#D7E7EC] bg-white px-6 py-3 text-base font-semibold text-brand-navy transition hover:border-brand-blue/40 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40 sm:w-auto';

  return (
    <div className={`flex w-full max-w-full flex-col gap-4 ${className}`.trim()}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          to={reviewHref}
          onClick={() => emitReviewCtaClick(sourceLocation, primaryPlacement, route, serviceArea)}
          className={primaryClass}
        >
          {FREE_REVIEW_CTA_LABEL}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>

        <Link
          to={DISCOVERY_CALL_DESTINATION}
          onClick={() => emitBookCallClick(sourceLocation, secondaryPlacement, route, serviceArea)}
          className={secondaryClass}
        >
          <CalendarDays
            className={`h-4 w-4 shrink-0 ${isOnDark ? 'text-emerald-300' : 'text-brand-blue'}`}
            strokeWidth={2.1}
            aria-hidden
          />
          {DISCOVERY_CALL_CTA_LABEL}
        </Link>
      </div>

      {websiteCheckerPlacement ? (
        isHero ? (
          <Link
            to={WEBSITE_CHECKER_DESTINATION}
            onClick={() => emitWebsiteCheckerClick(sourceLocation, websiteCheckerPlacement, route)}
            aria-label={WEBSITE_CHECKER_CTA_LABEL}
            className="group flex w-full min-h-[44px] max-w-full flex-col gap-1.5 overflow-hidden rounded-xl border border-brand-cyan/35 bg-brand-surface px-4 py-3.5 text-left shadow-sm transition hover:border-brand-cyan/55 hover:bg-[#EAF4FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40 sm:px-5"
            data-homepage-website-audit-cta="strip"
          >
            <span className="text-[11px] font-semibold leading-4 text-brand-blue">
              Not ready to request a review?
            </span>
            <span className="flex min-w-0 items-start justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand-cyan/30 bg-white text-brand-cyan">
                  <ScanSearch className="h-4 w-4" strokeWidth={2.1} aria-hidden />
                </span>
                <span className="min-w-0 text-sm font-bold leading-5 text-brand-navy sm:text-[15px]">
                  {WEBSITE_CHECKER_CTA_LABEL}
                </span>
              </span>
              <ArrowRight
                className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan transition group-hover:translate-x-0.5"
                strokeWidth={2.1}
                aria-hidden
              />
            </span>
            <span className="text-xs leading-5 text-slate-600 sm:text-[13px] sm:leading-6">
              Check how easily customers can find, trust and contact your business — usually in under
              a minute.
            </span>
            <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              {WEBSITE_AUDIT_SUPPORTING_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </span>
          </Link>
        ) : (
          <Link
            to={WEBSITE_CHECKER_DESTINATION}
            onClick={() => emitWebsiteCheckerClick(sourceLocation, websiteCheckerPlacement, route)}
            className="inline-flex min-h-[44px] w-fit max-w-full items-center gap-1.5 text-sm font-medium text-slate-600 underline-offset-2 transition hover:text-brand-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
          >
            {WEBSITE_CHECKER_CTA_LABEL}
            <ArrowRight className="h-3.5 w-3.5 text-brand-cyan" strokeWidth={2.1} aria-hidden />
          </Link>
        )
      ) : null}
    </div>
  );
}
