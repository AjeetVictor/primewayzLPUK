import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { LEGACY_ROUTE_REDIRECTS, LEGACY_SUCCESS_STORY_REDIRECTS } from '../constants/canonicalRoutes.ts';
import {
  allSuccessStories,
  APPROVED_PUBLIC_STORY_SLUGS,
  FORBIDDEN_PUBLIC_STORY_PROPERTY_KEYS,
  getPublishedSuccessStories,
  getPublishedSuccessStoryBySlug,
  getSuccessStoryPath,
  getSuccessStorySeoEntries,
  PUBLIC_SUCCESS_STORY_RELATIONSHIP_TYPES,
  RETIRED_ILLUSTRATIVE_STORY_SLUGS,
} from './successStories.ts';

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const EXTERNAL_CLIENT_URL_PATTERN = /^https?:\/\//i;
const NUMERIC_CLAIM_PATTERN = /\b\d+(?:\.\d+)?\s*%|\b£\s*\d|\$\s*\d|\b\d+\s+(?:enquiries|orders|customers|users|branches|devices)\b/i;
const CURRENCY_CLAIM_PATTERN = /\b£\s*\d|\$\s*\d|\bGBP\s*\d|\bUSD\s*\d/i;

function collectStoryTextValues(story: (typeof allSuccessStories)[number]): string[] {
  return [
    story.slug,
    story.title,
    story.shortTitle,
    story.relationshipType,
    story.confidentiality,
    story.industry,
    story.category,
    story.summary,
    story.homepageSummary,
    story.keyOutcome,
    ...story.problem,
    ...story.responsibility,
    ...story.solution,
    ...story.deliveryDecisions,
    ...story.outcomes,
    ...story.technologies,
    ...story.relatedServiceLabels,
    story.ctaLabel,
    story.seoTitle,
    story.seoDescription,
    story.ogImage,
    story.image,
    story.imageAlt,
  ];
}

function collectAllStoryTextValues(): string[] {
  return allSuccessStories.flatMap((story) => collectStoryTextValues(story));
}

test('all three approved slugs resolve from central data', () => {
  for (const slug of APPROVED_PUBLIC_STORY_SLUGS) {
    const story = getPublishedSuccessStoryBySlug(slug);
    assert.ok(story, `Expected published story for slug: ${slug}`);
    assert.equal(getSuccessStoryPath(slug), `/success-stories/${slug}`);
  }
});

test('success story slugs are unique', () => {
  const slugs = allSuccessStories.map((story) => story.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('only three published authority stories are exposed publicly', () => {
  assert.equal(getPublishedSuccessStories().length, 3);
  assert.deepEqual(
    getPublishedSuccessStories().map((story) => story.slug).sort(),
    [...APPROVED_PUBLIC_STORY_SLUGS].sort(),
  );
});

test('published story slugs match the public allowlist exactly', () => {
  const publishedSlugs = getPublishedSuccessStories().map((story) => story.slug).sort();
  assert.deepEqual(publishedSlugs, [...APPROVED_PUBLIC_STORY_SLUGS].sort());
});

test('retired illustrative story slugs are absent from central public data', () => {
  const slugs = allSuccessStories.map((story) => story.slug);
  for (const retiredSlug of RETIRED_ILLUSTRATIVE_STORY_SLUGS) {
    assert.equal(
      slugs.includes(retiredSlug),
      false,
      `Retired slug must not appear in central data: ${retiredSlug}`,
    );
  }
});

test('public story objects do not expose forbidden internal property keys', () => {
  for (const story of allSuccessStories) {
    const record = story as unknown as Record<string, unknown>;
    for (const key of FORBIDDEN_PUBLIC_STORY_PROPERTY_KEYS) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(record, key),
        false,
        `Forbidden property "${key}" found on ${story.slug}`,
      );
    }
  }
});

test('published stories use allowlisted relationship types', () => {
  for (const story of getPublishedSuccessStories()) {
    assert.ok(
      (PUBLIC_SUCCESS_STORY_RELATIONSHIP_TYPES as readonly string[]).includes(story.relationshipType),
      `Unexpected relationshipType for ${story.slug}: ${story.relationshipType}`,
    );
  }
});

test('published story data contains no email addresses', () => {
  const combined = collectAllStoryTextValues().join('\n');
  assert.doesNotMatch(combined, EMAIL_PATTERN, 'Email address found in public story data');
});

test('published story data contains no external client-domain URLs', () => {
  for (const story of getPublishedSuccessStories()) {
    for (const value of collectStoryTextValues(story)) {
      if (EXTERNAL_CLIENT_URL_PATTERN.test(value.trim())) {
        assert.fail(`External URL found in ${story.slug}: ${value}`);
      }
    }
  }
});

test('published stories have non-empty title and summary fields', () => {
  for (const story of getPublishedSuccessStories()) {
    assert.ok(story.title.trim().length > 0, `Empty title for ${story.slug}`);
    assert.ok(story.summary.trim().length > 0, `Empty summary for ${story.slug}`);
  }
});

test('related service paths are absolute site paths', () => {
  for (const story of getPublishedSuccessStories()) {
    for (const servicePath of story.relatedServicePaths) {
      assert.match(servicePath, /^\//, `Expected absolute path for ${story.slug}: ${servicePath}`);
      assert.doesNotMatch(servicePath, /^https?:\/\//);
    }
    assert.equal(story.relatedServicePaths.length, story.relatedServiceLabels.length);
  }
});

test('published stories have SEO title and description', () => {
  for (const story of getPublishedSuccessStories()) {
    assert.ok(story.seoTitle.trim().length > 10, `Missing seoTitle for ${story.slug}`);
    assert.ok(story.seoDescription.trim().length > 40, `Missing seoDescription for ${story.slug}`);
  }
});

test('published stories have confidentiality and relationship labels', () => {
  for (const story of getPublishedSuccessStories()) {
    assert.ok(story.confidentiality.trim().length > 0, `Missing confidentiality for ${story.slug}`);
    assert.ok(story.relationshipType.trim().length > 0, `Missing relationshipType for ${story.slug}`);
    assert.equal(story.confidentiality, story.relationshipType);
  }
});

test('published stories do not include unsupported percentage or currency claims', () => {
  for (const story of getPublishedSuccessStories()) {
    const values = collectStoryTextValues(story);
    for (const value of values) {
      assert.doesNotMatch(
        value,
        NUMERIC_CLAIM_PATTERN,
        `Unapproved numeric claim in ${story.slug}: ${value}`,
      );
      assert.doesNotMatch(
        value,
        CURRENCY_CLAIM_PATTERN,
        `Unapproved currency claim in ${story.slug}: ${value}`,
      );
    }
  }
});

test('success story SEO entries use internal absolute paths for images', () => {
  for (const [storyPath, seo] of Object.entries(getSuccessStorySeoEntries())) {
    assert.match(storyPath, /^\/success-stories\//);
    assert.match(seo.image, /^\//, `Expected internal image path for ${storyPath}`);
    assert.doesNotMatch(seo.image, /^https?:\/\//);
  }
});

test('legacy success story redirect map contains all retired routes with correct targets', () => {
  assert.equal(Object.keys(LEGACY_SUCCESS_STORY_REDIRECTS).length, RETIRED_ILLUSTRATIVE_STORY_SLUGS.length);

  for (const retiredSlug of RETIRED_ILLUSTRATIVE_STORY_SLUGS) {
    const fromPath = `/success-stories/${retiredSlug}`;
    const target = LEGACY_SUCCESS_STORY_REDIRECTS[fromPath as keyof typeof LEGACY_SUCCESS_STORY_REDIRECTS];
    assert.ok(target, `Missing redirect for ${fromPath}`);
    assert.match(target, /^\//);
    assert.ok(!target.endsWith('/'));
    assert.equal(LEGACY_ROUTE_REDIRECTS[fromPath as keyof typeof LEGACY_ROUTE_REDIRECTS], target);
  }
});

test('legacy redirect targets remain slashless for trailing-slash sources with query strings', () => {
  const cases = [
    {
      fromPath: '/contact',
      toPath: '/contact-us',
      requestPath: '/contact/?utm_source=test',
      expectedLocation: '/contact-us?utm_source=test',
    },
    {
      fromPath: '/website-maintenance-subscription-uk',
      toPath: '/maintenance',
      requestPath: '/website-maintenance-subscription-uk/?utm_source=test',
      expectedLocation: '/maintenance?utm_source=test',
    },
    {
      fromPath: '/success-stories/local-trades-lead-capture',
      toPath: '/website-visibility-support',
      requestPath: '/success-stories/local-trades-lead-capture/?utm_source=test',
      expectedLocation: '/website-visibility-support?utm_source=test',
    },
    {
      fromPath: '/success-stories/professional-services-crm-cleanup',
      toPath: '/crm-automation-support',
      requestPath: '/success-stories/professional-services-crm-cleanup/?utm_source=test',
      expectedLocation: '/crm-automation-support?utm_source=test',
    },
    {
      fromPath: '/success-stories/ecommerce-store-stability-support',
      toPath: '/maintenance',
      requestPath: '/success-stories/ecommerce-store-stability-support/?utm_source=test',
      expectedLocation: '/maintenance?utm_source=test',
    },
  ] as const;

  for (const item of cases) {
    assert.equal(
      LEGACY_ROUTE_REDIRECTS[item.fromPath as keyof typeof LEGACY_ROUTE_REDIRECTS],
      item.toPath,
    );

    // Mirror the server handler: append only the query portion to the slashless target.
    const queryIndex = item.requestPath.indexOf('?');
    const search = queryIndex >= 0 ? item.requestPath.slice(queryIndex) : '';
    const location = `${item.toPath}${search}`;
    assert.equal(location, item.expectedLocation);
    assert.ok(!location.includes(`${item.toPath}/?`), `Unexpected trailing slash before query: ${location}`);
  }
});

test('sitemap includes approved success story URLs and excludes retired URLs', () => {
  const sitemap = readFileSync(path.join(process.cwd(), 'public', 'sitemap.xml'), 'utf8');

  for (const slug of APPROVED_PUBLIC_STORY_SLUGS) {
    const url = `https://uk.primewayz.com/success-stories/${slug}`;
    assert.equal(sitemap.includes(url), true, `Missing sitemap URL: ${url}`);
    assert.equal(sitemap.includes(`${url}/`), false, `Trailing-slash sitemap URL must not exist: ${url}/`);
  }

  for (const retiredSlug of RETIRED_ILLUSTRATIVE_STORY_SLUGS) {
    const url = `https://uk.primewayz.com/success-stories/${retiredSlug}`;
    assert.equal(sitemap.includes(url), false, `Retired sitemap URL must be removed: ${url}`);
  }

  const successStoryUrls = [...sitemap.matchAll(/<loc>https:\/\/uk\.primewayz\.com\/success-stories\/[^<]+<\/loc>/g)]
    .map((match) => match[0]);
  assert.equal(new Set(successStoryUrls).size, successStoryUrls.length, 'Duplicate success-story sitemap URLs');
});
