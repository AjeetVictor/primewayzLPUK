import { extractAttribute } from '../crawl/extractText.ts';
import type { AuditContext, WebPresenceAuditMobileReadiness } from '../types.ts';

const MOBILE_DISCLAIMER =
  'This free audit checks mobile-readiness indicators from visible HTML/CSS signals. It does not replace a full device-based mobile usability or Core Web Vitals test.';

export function extractMobileReadiness(context: AuditContext): WebPresenceAuditMobileReadiness {
  const homepageHtml = context.homepage?.html || '';
  const combinedHtml = context.combinedHtml;
  const signals: string[] = [];
  const concerns: string[] = [];
  const recommendations: string[] = [];

  const viewport = /<meta\b[^>]*name=["']viewport["'][^>]*>/i.test(homepageHtml);
  if (viewport) {
    signals.push('Viewport meta tag detected on the homepage.');
  } else {
    concerns.push('Viewport meta tag was not detected on the homepage.');
    recommendations.push('Add a responsive viewport meta tag to support mobile layout scaling.');
  }

  const mediaQueries = /@media\s*\(/i.test(combinedHtml);
  if (mediaQueries) {
    signals.push('CSS media query indicators were detected in accessible HTML/CSS.');
  } else {
    concerns.push('Responsive media query indicators were not detected in accessible HTML/CSS.');
    recommendations.push('Review responsive CSS breakpoints for common mobile screen sizes.');
  }

  const images = homepageHtml.match(/<img\b[^>]*>/gi) || [];
  const responsiveImages = images.filter((tag) => /\bsrcset=|\bsizes=/i.test(tag));
  if (responsiveImages.length > 0) {
    signals.push(`${responsiveImages.length} homepage image(s) use srcset or sizes attributes.`);
  } else if (images.length > 0) {
    concerns.push('Responsive image hints (srcset/sizes) were not detected on homepage images.');
    recommendations.push('Consider srcset/sizes for key homepage images where appropriate.');
  }

  const imagesWithAlt = images.filter((tag) => Boolean(extractAttribute(tag, 'alt')));
  const altRatio = images.length ? imagesWithAlt.length / images.length : 1;
  if (images.length > 0) {
    if (altRatio >= 0.8) {
      signals.push(`${imagesWithAlt.length} of ${images.length} homepage images include alt text.`);
    } else {
      concerns.push(`Only ${imagesWithAlt.length} of ${images.length} homepage images include alt text.`);
      recommendations.push('Add descriptive alt text to meaningful homepage images.');
    }
  }

  const hasForm = /<form\b/i.test(combinedHtml);
  const hasTelOrMail = /href=["']tel:|href=["']mailto:/i.test(combinedHtml);
  const hasCta = /\b(contact us|get a quote|book (?:a )?call|request (?:a )?quote|enquir(?:y|ies))\b/i.test(context.combinedText);
  if (hasForm || hasTelOrMail || hasCta) {
    signals.push('Visible contact, form, or CTA indicators were detected in the audited pages.');
  } else {
    concerns.push('Clear mobile-friendly contact or CTA indicators were not strongly detected.');
    recommendations.push('Make phone, contact, or enquiry CTAs easy to find on public pages.');
  }

  const fixedWidthHints = /width\s*:\s*(?:9\d{2,}|1\d{3,})px/i.test(combinedHtml)
    || /<table[^>]*\bwidth\s*=\s*["']\d{3,}/i.test(combinedHtml);
  if (fixedWidthHints) {
    concerns.push('Possible fixed-width layout hints were detected in accessible HTML/CSS.');
    recommendations.push('Review layouts that may not adapt well on smaller screens.');
  }

  let status: WebPresenceAuditMobileReadiness['status'] = 'needs_review';
  let label = 'Mobile-readiness needs review';

  const positiveCount = signals.length;
  const concernCount = concerns.length;

  if (!viewport) {
    status = 'needs_review';
    label = 'Mobile-readiness needs review';
  } else if (positiveCount >= 4 && concernCount <= 1) {
    status = 'strong';
    label = 'Strong mobile-readiness indicators detected';
  } else if (positiveCount >= 2 && concernCount <= 2) {
    status = 'workable';
    label = 'Workable mobile-readiness indicators detected';
  } else if (positiveCount === 0 && concernCount >= 3) {
    status = 'not_verified';
    label = 'Limited mobile-readiness signals detected';
  } else {
    status = 'needs_review';
    label = 'Mobile-readiness needs review';
  }

  if (recommendations.length === 0 && status === 'strong') {
    recommendations.push('Continue reviewing real-device mobile usability separately from this public-signal audit.');
  }

  return {
    label,
    status,
    signals,
    concerns,
    recommendations,
    disclaimer: MOBILE_DISCLAIMER,
  };
}
