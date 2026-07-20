/**
 * Exact-match registries for keyword import preview (no semantic similarity).
 */

import { posts } from '../../data/blog/posts.ts';
import { SDAAS_SUPPORTING_ARTICLES } from '../../data/sdaas/supportingArticlesRegistry.ts';
import {
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_CHOOSE_PARTNER_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
} from '../../constants/canonicalRoutes.ts';
import { normaliseAutopilotKeyword } from './keywordNormalisation.ts';
import type { AutopilotKeywordMatchType } from '../../data/autopilot/keywordImportStatus.ts';

export type KeywordExactMatch = {
  matchType: AutopilotKeywordMatchType;
  label: string;
  value: string;
};

function slugToPhrase(slug: string): string {
  return slug.replace(/^\/+|\/+$/g, '').split('/').pop() || slug;
}

function phraseFromSlug(slug: string): string {
  return slugToPhrase(slug).replace(/[-_]+/g, ' ').trim();
}

const SDAAS_STATIC_ENTRIES: Array<{ title: string; path: string }> = [
  { title: 'Subscription-Based Software Development Guide', path: SDAAS_PILLAR_GUIDE_HREF },
  {
    title: 'Software Development Subscription vs Fixed Price',
    path: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  },
  { title: 'Software Development Subscription Use Cases', path: SDAAS_USE_CASES_HREF },
  { title: 'How Monthly Development Capacity Works', path: SDAAS_MONTHLY_CAPACITY_HREF },
  { title: 'How to Prioritise Software Development Requests', path: SDAAS_PRIORITISATION_HREF },
  {
    title: 'Application Rescue and Stabilisation Before Ongoing Development',
    path: SDAAS_APPLICATION_RESCUE_HREF,
  },
  { title: 'Technical Debt Explained for Business Owners', path: SDAAS_TECHNICAL_DEBT_HREF },
  {
    title: 'Why Businesses Move to Continuous Software Development',
    path: SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  },
  {
    title: 'Software Maintenance vs Continuous Product Development',
    path: SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  },
  { title: 'How to Choose a Software Development Partner', path: SDAAS_CHOOSE_PARTNER_HREF },
  ...SDAAS_SUPPORTING_ARTICLES.map((article) => ({
    title: article.seo.title || article.directAnswerTitle || article.breadcrumbLabel,
    path: article.path,
  })),
];

export function matchStaticBlogSignals(normalisedKeyword: string): KeywordExactMatch[] {
  const matches: KeywordExactMatch[] = [];
  for (const post of posts) {
    const titleNorm = normaliseAutopilotKeyword(post.title).normalised;
    if (titleNorm && titleNorm === normalisedKeyword) {
      matches.push({
        matchType: 'exact_static_title',
        label: `Static blog title: ${post.title}`,
        value: post.slug,
      });
    }
    const slugPhrase = normaliseAutopilotKeyword(phraseFromSlug(post.slug)).normalised;
    if (slugPhrase && slugPhrase === normalisedKeyword) {
      matches.push({
        matchType: 'exact_slug_derived_phrase',
        label: `Static blog slug phrase: ${post.slug}`,
        value: post.slug,
      });
    }
    if (post.id != null) {
      const idNorm = normaliseAutopilotKeyword(String(post.id)).normalised;
      if (idNorm === normalisedKeyword) {
        matches.push({
          matchType: 'exact_static_title',
          label: `Static blog id: ${post.id}`,
          value: String(post.id),
        });
      }
    }
  }
  return matches;
}

export function matchSdaasSignals(normalisedKeyword: string): KeywordExactMatch[] {
  const matches: KeywordExactMatch[] = [];
  const seen = new Set<string>();
  for (const entry of SDAAS_STATIC_ENTRIES) {
    const titleNorm = normaliseAutopilotKeyword(entry.title).normalised;
    if (titleNorm && titleNorm === normalisedKeyword) {
      const key = `title:${entry.path}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          matchType: 'exact_sdaas_title',
          label: `SDaaS title: ${entry.title}`,
          value: entry.path,
        });
      }
    }
    const pathNorm = normaliseAutopilotKeyword(entry.path).normalised;
    const pathPhrase = normaliseAutopilotKeyword(phraseFromSlug(entry.path)).normalised;
    if (
      (pathNorm && pathNorm === normalisedKeyword) ||
      (pathPhrase && pathPhrase === normalisedKeyword)
    ) {
      const key = `path:${entry.path}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push({
          matchType: 'exact_sdaas_path',
          label: `SDaaS path: ${entry.path}`,
          value: entry.path,
        });
      }
    }
  }
  return matches;
}

export function matchCmsSignals(
  normalisedKeyword: string,
  cmsPosts: Array<{ title: string; slug: string }>,
): KeywordExactMatch[] {
  const matches: KeywordExactMatch[] = [];
  for (const post of cmsPosts) {
    if (normaliseAutopilotKeyword(post.title).normalised === normalisedKeyword) {
      matches.push({
        matchType: 'exact_cms_title',
        label: `CMS title: ${post.title}`,
        value: post.slug,
      });
    }
    if (normaliseAutopilotKeyword(post.slug).normalised === normalisedKeyword) {
      matches.push({
        matchType: 'exact_cms_slug',
        label: `CMS slug: ${post.slug}`,
        value: post.slug,
      });
    }
    const slugPhrase = normaliseAutopilotKeyword(phraseFromSlug(post.slug)).normalised;
    if (slugPhrase === normalisedKeyword) {
      matches.push({
        matchType: 'exact_slug_derived_phrase',
        label: `CMS slug phrase: ${post.slug}`,
        value: post.slug,
      });
    }
  }
  return matches;
}
