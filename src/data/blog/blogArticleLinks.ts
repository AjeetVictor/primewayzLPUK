/** Blog article internal CTAs use clean canonical paths (analytics events carry attribution). */

export const FIXED_PRICE_ARTICLE_CAMPAIGN = 'fixed_price_vs_subscription_support';
export const AI_CONTENT_FATIGUE_CAMPAIGN = 'ai_content_fatigue';

export function fixedPriceArticleHref(path: string, _content?: string): string {
  return path;
}

export function aiContentFatigueArticleHref(path: string, _content?: string): string {
  return path;
}

export const BUSINESS_SOFTWARE_VALUE_CAMPAIGN = 'business_software_value';

export function businessSoftwareValueArticleHref(
  path: string,
  _content?: string,
): string {
  return path;
}
