import { motion } from 'motion/react';
import type { TargetAndTransition, VariantLabels } from 'motion/react';
import type { ReactNode } from 'react';
import { trackCtaClick, trackEvent } from '../../lib/analytics';

type TrackingEventType =
  | 'cta_click'
  | 'book_call_click'
  | 'pricing_plan_click'
  | 'external_link_click'
  | 'footer_link_click'
  | 'whatsapp_click'
  | 'email_click'
  | 'phone_click';


type TrackedLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  target?: string;
  rel?: string;
  ctaText: string;
  ctaLocation: string;
  eventType?: TrackingEventType;
  trackingParams?: Record<string, unknown>;
  onClick?: () => void;
  whileHover?: VariantLabels | TargetAndTransition;
  whileTap?: VariantLabels | TargetAndTransition;
};

export function TrackedLink({
  href,
  children,
  className,
  ariaLabel,
  target,
  rel,
  ctaText,
  ctaLocation,
  eventType = 'cta_click',
  trackingParams,
  onClick,
  whileHover,
  whileTap,
}: TrackedLinkProps) {
  const handleClick = () => {
    if (eventType === 'cta_click') {
      trackCtaClick(ctaText, ctaLocation, trackingParams);
    } else {
      trackEvent(eventType, {
        cta_text: ctaText,
        cta_location: ctaLocation,
        ...trackingParams,
      });
    }

    onClick?.();
  };

  return (
    <motion.a
      href={href}
      aria-label={ariaLabel}
      target={target}
      rel={rel}
      onClick={handleClick}
      whileHover={whileHover}
      whileTap={whileTap}
      className={className}
    >
      {children}
    </motion.a>
  );
}
