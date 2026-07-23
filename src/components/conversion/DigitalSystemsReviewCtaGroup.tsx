import { ArrowRight, CalendarDays } from 'lucide-react';
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
    <div className={`flex flex-col gap-4 ${className}`.trim()}>
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
        <Link
          to={WEBSITE_CHECKER_DESTINATION}
          onClick={() => {
            trackCtaClick(WEBSITE_CHECKER_CTA_LABEL, websiteCheckerPlacement, {
              cta_placement: websiteCheckerPlacement,
              source_location: sourceLocation,
              route,
              destination: WEBSITE_CHECKER_DESTINATION,
            });
          }}
          className="inline-flex min-h-[44px] w-fit items-center gap-1.5 text-sm font-medium text-slate-600 underline-offset-2 transition hover:text-brand-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
        >
          {WEBSITE_CHECKER_CTA_LABEL}
          <ArrowRight className="h-3.5 w-3.5 text-brand-cyan" strokeWidth={2.1} aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}
