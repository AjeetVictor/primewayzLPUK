import { Link, useLocation } from 'react-router-dom';
import {
  DISCOVERY_CALL_CTA_LABEL,
  DISCOVERY_CALL_DESTINATION,
  FREE_REVIEW_CTA_LABEL,
  buildFreeReviewCtaUrl,
  type FreeReviewCtaPlacement,
  type FreeReviewServiceArea,
  type FreeReviewSourceLocation,
} from '../../constants/conversionCta';
import { trackBookCallClick, trackConversionEvent } from '../../lib/analytics';
import {
  assertNoProhibitedAnalyticsProps,
  buildDigitalSystemsReviewAnalyticsPayload,
} from '../../lib/digitalSystemsReview/analytics';

type DigitalSystemsReviewCtaLinkProps = {
  kind: 'review' | 'discovery';
  sourceLocation: FreeReviewSourceLocation;
  placement: FreeReviewCtaPlacement;
  serviceArea?: FreeReviewServiceArea;
  className?: string;
  onClick?: () => void;
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

/**
 * Single conversion link for compact surfaces (e.g. Navbar) where the
 * vertical DigitalSystemsReviewCtaGroup wrapper is inappropriate.
 */
export function DigitalSystemsReviewCtaLink({
  kind,
  sourceLocation,
  placement,
  serviceArea,
  className = '',
  onClick,
}: DigitalSystemsReviewCtaLinkProps) {
  const location = useLocation();
  const route = location.pathname || '/';

  if (kind === 'review') {
    const href = buildFreeReviewCtaUrl(sourceLocation, serviceArea);
    return (
      <Link
        to={href}
        onClick={() => {
          emitReviewCtaClick(sourceLocation, placement, route, serviceArea);
          onClick?.();
        }}
        className={className}
      >
        {FREE_REVIEW_CTA_LABEL}
      </Link>
    );
  }

  return (
    <Link
      to={DISCOVERY_CALL_DESTINATION}
      onClick={() => {
        emitBookCallClick(sourceLocation, placement, route, serviceArea);
        onClick?.();
      }}
      className={className}
    >
      {DISCOVERY_CALL_CTA_LABEL}
    </Link>
  );
}
