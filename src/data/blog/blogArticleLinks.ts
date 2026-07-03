import { buildInternalUtmUrl } from '../../lib/utm.ts';

export const FIXED_PRICE_ARTICLE_CAMPAIGN = 'fixed_price_vs_subscription_support';
export const AI_CONTENT_FATIGUE_CAMPAIGN = 'ai_content_fatigue';

export function fixedPriceArticleHref(path: string, content: string): string {
  return buildInternalUtmUrl(path, 'blog_article', FIXED_PRICE_ARTICLE_CAMPAIGN, content);
}

export function aiContentFatigueArticleHref(path: string, content: string): string {
  return buildInternalUtmUrl(path, 'blog_article', AI_CONTENT_FATIGUE_CAMPAIGN, content);
}
