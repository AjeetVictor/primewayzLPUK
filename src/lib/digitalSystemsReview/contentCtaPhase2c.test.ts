import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FREE_REVIEW_CTA_LABEL,
  FREE_REVIEW_CTA_PLACEMENTS,
  FREE_REVIEW_PREFERRED_NEXT_STEPS,
  FREE_REVIEW_SERVICE_AREAS,
  FREE_REVIEW_SERVICE_QUERY_PARAM,
  FREE_REVIEW_SOURCE_QUERY_PARAM,
  buildFreeReviewCtaUrl,
  type FreeReviewCtaPlacement,
  type FreeReviewServiceArea,
} from '../../constants/conversionCta.ts';
import {
  REVIEW_PREFERRED_NEXT_STEPS,
  REVIEW_SERVICE_AREAS,
} from '../../constants/digitalSystemsReview.ts';
import { SDAAS_CAPACITY_REQUEST_PATH } from '../../data/sdaas/commercialPage.ts';
import {
  getPublishedSuccessStories,
  getPublishedSuccessStoryBySlug,
} from '../../data/successStories.ts';
import {
  assertNoProhibitedAnalyticsProps,
  buildDigitalSystemsReviewAnalyticsPayload,
} from './analytics.ts';
import {
  BLOG_CATEGORY_REVIEW_SERVICE_AREA_MAP,
  resolveBlogArticleReviewServiceArea,
} from './articleServiceContext.ts';
import { getBlogCategoryBySlug } from '../../data/blog/categories.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const PHASE2C_PLACEMENTS = [
  'success_stories_listing_primary',
  'success_stories_listing_secondary',
  'success_story_hero_primary',
  'success_story_hero_secondary',
  'success_story_final_primary',
  'success_story_final_secondary',
  'blog_article_primary',
  'blog_article_secondary',
  'sdaas_supporting_article_primary',
  'sdaas_supporting_article_secondary',
] as const satisfies readonly FreeReviewCtaPlacement[];

const STORY_SERVICE_EXPECTATIONS: Record<string, FreeReviewServiceArea> = {
  'wholesale-order-management-platform': 'Managed Application & Website Support',
  'rentreadbuy-book-rental-platform': 'Software & Product Engineering',
  'restaurant-self-ordering-platform': 'Software & Product Engineering',
};

// --- Story data ---

test('every published story has an approved reviewServiceArea', () => {
  const stories = getPublishedSuccessStories();
  assert.equal(stories.length, 3);
  for (const story of stories) {
    assert.ok(
      (FREE_REVIEW_SERVICE_AREAS as readonly string[]).includes(story.reviewServiceArea),
      `${story.slug} reviewServiceArea must be approved`,
    );
  }
});

test('wholesale maps to Managed Application & Website Support', () => {
  const story = getPublishedSuccessStoryBySlug('wholesale-order-management-platform');
  assert.ok(story);
  assert.equal(story!.reviewServiceArea, 'Managed Application & Website Support');
});

test('rentreadbuy maps to Software & Product Engineering', () => {
  const story = getPublishedSuccessStoryBySlug('rentreadbuy-book-rental-platform');
  assert.ok(story);
  assert.equal(story!.reviewServiceArea, 'Software & Product Engineering');
});

test('restaurant self-ordering maps to Software & Product Engineering', () => {
  const story = getPublishedSuccessStoryBySlug('restaurant-self-ordering-platform');
  assert.ok(story);
  assert.equal(story!.reviewServiceArea, 'Software & Product Engineering');
});

test('no story mapping contains an arbitrary string', () => {
  for (const story of getPublishedSuccessStories()) {
    assert.ok(
      (FREE_REVIEW_SERVICE_AREAS as readonly string[]).includes(story.reviewServiceArea),
    );
    assert.equal(story.reviewServiceArea, STORY_SERVICE_EXPECTATIONS[story.slug]);
  }

  const data = read('src/data/successStories.ts');
  assert.match(data, /import type \{ FreeReviewServiceArea \}/);
  assert.match(data, /reviewServiceArea: FreeReviewServiceArea/);
  assert.doesNotMatch(data, /reviewServiceArea:\s*['"][^'"]*(?:Magic|Unknown|Custom)[^'"]*['"]/);
});

test('story-detail conversion no longer uses story.ctaHref', () => {
  const page = read('src/components/AuthorityStoryDetailPage.tsx');
  assert.doesNotMatch(page, /story\.ctaHref/);
  assert.doesNotMatch(page, /story\.ctaLabel/);
  assert.match(page, /DigitalSystemsReviewCtaGroup/);
  assert.match(page, /story\.reviewServiceArea/);
});

test('story-detail hero uses success_story source', () => {
  const page = read('src/components/AuthorityStoryDetailPage.tsx');
  assert.match(
    page,
    /primaryPlacement="success_story_hero_primary"[\s\S]*?sourceLocation="success_story"|sourceLocation="success_story"[\s\S]*?primaryPlacement="success_story_hero_primary"/,
  );
  assert.match(page, /sourceLocation="success_story"/);
  assert.match(page, /success_story_hero_primary/);
  assert.match(page, /success_story_hero_secondary/);
});

test('story-detail final section uses success_story source', () => {
  const page = read('src/components/AuthorityStoryDetailPage.tsx');
  assert.match(page, /success_story_final_primary/);
  assert.match(page, /success_story_final_secondary/);
  assert.equal((page.match(/sourceLocation="success_story"/g) || []).length, 2);
});

test('story hero and final placement values are allowlisted', () => {
  for (const placement of [
    'success_story_hero_primary',
    'success_story_hero_secondary',
    'success_story_final_primary',
    'success_story_final_secondary',
  ] as const) {
    assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes(placement));
  }
});

test('related-service and View-all-stories links remain', () => {
  const page = read('src/components/AuthorityStoryDetailPage.tsx');
  assert.match(page, /View all stories/);
  assert.match(page, /relatedServicePaths/);
  assert.match(page, /Related Primewayz services/);
  assert.match(page, /SUCCESS_STORIES_BASE_PATH/);
});

// --- Story listing ---

test('listing final CTA uses success_story', () => {
  const page = read('src/components/SuccessStoriesPage.tsx');
  assert.match(page, /sourceLocation="success_story"/);
  assert.match(page, /DigitalSystemsReviewCtaGroup/);
});

test('listing uses Not sure yet', () => {
  const page = read('src/components/SuccessStoriesPage.tsx');
  assert.match(page, /serviceArea="Not sure yet"/);
});

test('listing primary and secondary placements are allowlisted', () => {
  const page = read('src/components/SuccessStoriesPage.tsx');
  assert.match(page, /success_stories_listing_primary/);
  assert.match(page, /success_stories_listing_secondary/);
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('success_stories_listing_primary'));
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('success_stories_listing_secondary'));
});

test('story cards and SelfAuditCta remain', () => {
  const page = read('src/components/SuccessStoriesPage.tsx');
  assert.match(page, /SelfAuditCta/);
  assert.match(page, /Read success story/);
  assert.match(page, /getPublishedSuccessStories|publishedStories/);
  assert.match(page, /<h1\b/);
  assert.equal((page.match(/<h1\b/g) || []).length, 1);
});

test('homepage SuccessStories remains unchanged', () => {
  const homepage = read('src/components/SuccessStories.tsx');
  assert.doesNotMatch(homepage, /DigitalSystemsReviewCtaGroup/);
  assert.doesNotMatch(homepage, /buildFreeReviewCtaUrl/);
  assert.doesNotMatch(homepage, /review_source|review_service/);
  assert.doesNotMatch(homepage, /success_stories_listing_|success_story_hero_|success_story_final_/);
});

test('AuthorityProofSection remains story-navigation-only', () => {
  const section = read('src/components/sections/AuthorityProofSection.tsx');
  assert.match(section, /getSuccessStoryPath/);
  assert.match(section, /ctaLabel/);
  assert.doesNotMatch(section, /DigitalSystemsReviewCtaGroup/);
  assert.doesNotMatch(section, /buildFreeReviewCtaUrl/);
  assert.doesNotMatch(section, /review_source|free_review_cta_click/);
});

// --- Blog mapping ---

test('every explicitly mapped category returns an approved service area', () => {
  for (const [slug, serviceArea] of Object.entries(BLOG_CATEGORY_REVIEW_SERVICE_AREA_MAP)) {
    assert.ok(
      (FREE_REVIEW_SERVICE_AREAS as readonly string[]).includes(serviceArea),
      `${slug} maps outside FREE_REVIEW_SERVICE_AREAS`,
    );
    const resolved = resolveBlogArticleReviewServiceArea({
      primaryCategory: slug,
      secondaryCategories: [],
      category: '',
    });
    assert.equal(resolved, serviceArea);
  }
});

test('unmapped category returns undefined', () => {
  assert.equal(
    resolveBlogArticleReviewServiceArea({
      primaryCategory: 'business-strategy',
      secondaryCategories: [],
      category: '',
    }),
    undefined,
  );
  assert.equal(
    resolveBlogArticleReviewServiceArea({
      primaryCategory: 'digital-transformation',
      secondaryCategories: [],
      category: '',
    }),
    undefined,
  );
  assert.equal(
    resolveBlogArticleReviewServiceArea({
      primaryCategory: undefined,
      secondaryCategories: [],
      category: 'Unknown Label',
    }),
    undefined,
  );
});

test('conflicting mapped categories return undefined', () => {
  assert.equal(
    resolveBlogArticleReviewServiceArea({
      primaryCategory: 'ai-automation',
      secondaryCategories: ['technical-seo'],
      category: '',
    }),
    undefined,
  );
  assert.equal(
    resolveBlogArticleReviewServiceArea({
      primaryCategory: 'software-development',
      secondaryCategories: ['software-support'],
      category: '',
    }),
    undefined,
  );
});

test('mapping does not inspect title, content or arbitrary tags', () => {
  const helper = read('src/lib/digitalSystemsReview/articleServiceContext.ts');
  assert.match(helper, /normaliseBlogPostCategories/);
  assert.match(helper, /getBlogCategoryBySlug/);
  assert.match(helper, /BLOG_CATEGORY_REVIEW_SERVICE_AREA_MAP/);
  assert.doesNotMatch(helper, /\.title|\.content|\.tags|includes\(/);
  assert.doesNotMatch(helper, /searchableText|toLowerCase\(\)/);

  assert.equal(
    resolveBlogArticleReviewServiceArea({
      primaryCategory: 'business-strategy',
      secondaryCategories: [],
      category: 'CRM Automation SEO Software',
    }),
    undefined,
  );
});

test('every mapped category slug exists in the central category registry', () => {
  for (const slug of Object.keys(BLOG_CATEGORY_REVIEW_SERVICE_AREA_MAP)) {
    assert.ok(getBlogCategoryBySlug(slug), `${slug} must exist in BLOG_CATEGORIES`);
  }
});

test('invented category slug resolves to undefined', () => {
  assert.equal(
    resolveBlogArticleReviewServiceArea({
      primaryCategory: 'invented-category-slug-xyz',
      secondaryCategories: [],
      category: '',
    }),
    undefined,
  );
  assert.equal(getBlogCategoryBySlug('invented-category-slug-xyz'), undefined);
});

test('BlogArticleCTA uses source article and review CTA group', () => {
  const cta = read('src/components/blog/BlogArticleCTA.tsx');
  assert.match(cta, /sourceLocation="article"/);
  assert.match(cta, /DigitalSystemsReviewCtaGroup/);
  assert.match(cta, /resolveBlogArticleReviewServiceArea/);
  assert.match(cta, /blog_article_primary/);
  assert.match(cta, /blog_article_secondary/);
});

test('BlogArticleCTA renders contextual service link from getArticleServiceContext', () => {
  const cta = read('src/components/blog/BlogArticleCTA.tsx');
  assert.match(cta, /getArticleServiceContext/);
  assert.match(cta, /context\.primaryHref/);
  assert.match(cta, /context\.primaryLabel/);
  assert.match(cta, /Explore the related service:/);
  assert.doesNotMatch(cta, /context\.secondaryHref/);
  assert.doesNotMatch(cta, /context\.secondaryLabel/);
  assert.doesNotMatch(cta, /TrackedLink/);
  assert.doesNotMatch(cta, /eventType="book_call_click"/);
  // Discovery call remains only inside DigitalSystemsReviewCtaGroup (one secondary placement).
  assert.equal((cta.match(/DISCOVERY_CALL|Book a discovery call/g) || []).length, 0);
  assert.doesNotMatch(cta, /review_source|review_service/);
});

test('mapped article URL contains review_service', () => {
  const serviceArea = resolveBlogArticleReviewServiceArea({
    primaryCategory: 'software-development',
    secondaryCategories: [],
    category: '',
  });
  assert.equal(serviceArea, 'Software & Product Engineering');
  const url = buildFreeReviewCtaUrl('article', serviceArea);
  assert.match(url, new RegExp(`${FREE_REVIEW_SOURCE_QUERY_PARAM}=article`));
  assert.match(url, new RegExp(`${FREE_REVIEW_SERVICE_QUERY_PARAM}=`));
  assert.match(url, /Software/);
  assert.match(url, /Product\+Engineering|Product%20Engineering/);
  assert.ok(url.includes(FREE_REVIEW_SERVICE_QUERY_PARAM));
  assert.equal(
    decodeURIComponent(url.replace(/\+/g, ' ')).includes('Software & Product Engineering'),
    true,
  );
});

test('unmapped and conflicting article URLs omit review_service', () => {
  const unmapped = resolveBlogArticleReviewServiceArea({
    primaryCategory: 'business-strategy',
    secondaryCategories: [],
    category: '',
  });
  assert.equal(unmapped, undefined);
  const unmappedUrl = buildFreeReviewCtaUrl('article', unmapped);
  assert.match(unmappedUrl, new RegExp(`${FREE_REVIEW_SOURCE_QUERY_PARAM}=article`));
  assert.doesNotMatch(unmappedUrl, new RegExp(FREE_REVIEW_SERVICE_QUERY_PARAM));

  const conflicting = resolveBlogArticleReviewServiceArea({
    primaryCategory: 'ai-automation',
    secondaryCategories: ['technical-seo'],
    category: '',
  });
  assert.equal(conflicting, undefined);
  const conflictingUrl = buildFreeReviewCtaUrl('article', conflicting);
  assert.match(conflictingUrl, new RegExp(`${FREE_REVIEW_SOURCE_QUERY_PARAM}=article`));
  assert.doesNotMatch(conflictingUrl, new RegExp(FREE_REVIEW_SERVICE_QUERY_PARAM));
});

test('contextual service link never contains review query params', () => {
  const cta = read('src/components/blog/BlogArticleCTA.tsx');
  assert.match(cta, /to=\{context\.primaryHref\}/);
  assert.doesNotMatch(cta, /buildFreeReviewCtaUrl/);
  assert.doesNotMatch(cta, /FREE_REVIEW_SOURCE_QUERY_PARAM|FREE_REVIEW_SERVICE_QUERY_PARAM/);
});

test('BlogArticleCTA primary and secondary placements are allowlisted', () => {
  const cta = read('src/components/blog/BlogArticleCTA.tsx');
  assert.match(cta, /blog_article_primary/);
  assert.match(cta, /blog_article_secondary/);
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('blog_article_primary'));
  assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes('blog_article_secondary'));
});

test('BlogPost still renders one BlogArticleCTA', () => {
  const post = read('src/components/BlogPost.tsx');
  assert.equal((post.match(/<BlogArticleCTA\b/g) || []).length, 1);
  assert.match(post, /BlogArticleCTA post=\{post\}/);
});

test('Blog article retains one H1', () => {
  const post = read('src/components/BlogPost.tsx');
  // Missing-post branch uses <h1>; published branch uses one motion.h1 title.
  assert.match(post, /<h1\b/);
  assert.match(post, /motion\.h1/);
  // Exactly one opening motion.h1 for the published article title (closing tag also matches motion.h1).
  assert.equal((post.match(/<motion\.h1\b/g) || []).length, 1);
  assert.equal((post.match(/<h1\b/g) || []).length, 1);
});

// --- Supporting articles ---

test('SdaasSupportingArticlePage includes the review panel', () => {
  const page = read('src/components/insights/SdaasSupportingArticlePage.tsx');
  assert.match(page, /DigitalSystemsReviewCtaGroup/);
  assert.match(page, /Need help applying this to your systems\?/);
  assert.match(page, /Start with a review of your software priorities/);
  assert.match(page, /sdaas_supporting_article_primary/);
  assert.match(page, /sdaas_supporting_article_secondary/);
});

test('supporting article review uses Software & Product Engineering', () => {
  const page = read('src/components/insights/SdaasSupportingArticlePage.tsx');
  assert.match(page, /serviceArea="Software & Product Engineering"/);
});

test('supporting article review uses source article', () => {
  const page = read('src/components/insights/SdaasSupportingArticlePage.tsx');
  assert.match(page, /sourceLocation="article"/);
});

test('existing article conclusion primary CTA remains', () => {
  const page = read('src/components/insights/SdaasSupportingArticlePage.tsx');
  assert.match(page, /article\.conclusion\.primaryCta/);
  assert.match(page, /sdaas_supporting_article_cta_click/);
  assert.match(page, /conclusion_primary/);
});

test('existing article conclusion secondary CTA remains when defined', () => {
  const page = read('src/components/insights/SdaasSupportingArticlePage.tsx');
  assert.match(page, /article\.conclusion\.secondaryCta/);
  assert.match(page, /conclusion_secondary/);
});

test('existing sdaas supporting-article analytics remain', () => {
  const page = read('src/components/insights/SdaasSupportingArticlePage.tsx');
  assert.match(page, /sdaas_supporting_article_section_view/);
  assert.match(page, /sdaas_supporting_article_cta_click/);
  assert.match(page, /sdaas_supporting_article_service_click/);
  assert.match(page, /sdaas_supporting_article_related_click/);
  assert.match(page, /sdaas_supporting_article_faq_open/);
  assert.match(page, /trackSdaasEvent/);
});

// --- Specialised funnel preservation ---

test('pillar capacity CTA remains unchanged', () => {
  const page = read('src/components/insights/SubscriptionBasedSoftwareDevelopmentPage.tsx');
  assert.match(page, /Request a Capacity Recommendation/);
  assert.match(page, /SDAAS_CAPACITY_REQUEST_PATH/);
  assert.doesNotMatch(page, /DigitalSystemsReviewCtaGroup/);
  assert.doesNotMatch(page, /sdaas_supporting_article_primary/);
});

test('comparison capacity CTA remains unchanged', () => {
  const page = read(
    'src/components/insights/SoftwareDevelopmentSubscriptionVsFixedPricePage.tsx',
  );
  assert.match(page, /Request a Capacity Recommendation/);
  assert.match(page, /SDAAS_CAPACITY_REQUEST_PATH/);
  assert.doesNotMatch(page, /DigitalSystemsReviewCtaGroup/);
});

test('use-case capacity CTA remains unchanged', () => {
  const page = read(
    'src/components/insights/SoftwareDevelopmentSubscriptionUseCasesPage.tsx',
  );
  assert.match(page, /Request a Capacity Recommendation/);
  assert.match(page, /SDAAS_CAPACITY_REQUEST_PATH/);
  assert.doesNotMatch(page, /DigitalSystemsReviewCtaGroup/);
});

test('specialised insight funnels still point to SDAAS_CAPACITY_REQUEST_PATH', () => {
  assert.equal(SDAAS_CAPACITY_REQUEST_PATH, '/software-development-subscription-uk/request-capacity');
  for (const file of [
    'src/components/insights/SubscriptionBasedSoftwareDevelopmentPage.tsx',
    'src/components/insights/SoftwareDevelopmentSubscriptionVsFixedPricePage.tsx',
    'src/components/insights/SoftwareDevelopmentSubscriptionUseCasesPage.tsx',
  ]) {
    const page = read(file);
    assert.match(page, /to=\{SDAAS_CAPACITY_REQUEST_PATH\}/);
    assert.match(page, /Request a Capacity Recommendation/);
  }
});

// --- Global preservation ---

test('homepage Phase 2A remains unchanged', () => {
  const hero = read('src/components/Hero.tsx');
  assert.match(hero, /sourceLocation="homepage"/);
  assert.match(hero, /homepage_hero_primary/);
  assert.doesNotMatch(hero, /serviceArea=/);
  assert.doesNotMatch(hero, /success_story|blog_article/);
});

test('service-page Phase 2B remains unchanged', () => {
  const services = read('src/components/ServicesPage.tsx');
  assert.match(services, /sourceLocation="services_page"/);
  assert.match(services, /services_hero_primary/);
  assert.match(services, /serviceArea="Not sure yet"/);

  const software = read('src/components/SoftwareDevelopmentSubscriptionUkPage.tsx');
  assert.match(software, /software_review_primary/);
  assert.match(software, /SDAAS_CAPACITY_REQUEST_PATH|request-capacity/);
});

test('Navbar remains unchanged', () => {
  const nav = read('src/components/Navbar.tsx');
  assert.doesNotMatch(nav, /DigitalSystemsReviewCtaGroup/);
  assert.doesNotMatch(nav, /buildFreeReviewCtaUrl/);
});

test('Footer remains unchanged', () => {
  const footer = read('src/components/Footer.tsx');
  assert.doesNotMatch(footer, /DigitalSystemsReviewCtaGroup/);
  assert.doesNotMatch(footer, /buildFreeReviewCtaUrl/);
});

test('LiveChat remains unchanged', () => {
  const chat = read('src/components/LiveChat.tsx');
  assert.doesNotMatch(chat, /DigitalSystemsReviewCtaGroup/);
  assert.doesNotMatch(chat, /success_stories_listing_|blog_article_/);
});

test('LazyLiveChat remains unchanged', () => {
  const chat = read('src/components/LazyLiveChat.tsx');
  assert.doesNotMatch(chat, /DigitalSystemsReviewCtaGroup/);
  assert.doesNotMatch(chat, /buildFreeReviewCtaUrl/);
});

test('About remains unchanged', () => {
  const aboutCandidates = [
    'src/components/AboutPage.tsx',
    'src/components/About.tsx',
    'src/components/AboutUsPage.tsx',
  ];
  const aboutFile = aboutCandidates.find((p) => fs.existsSync(path.join(root, p)));
  assert.ok(aboutFile, 'expected an About page component');
  const about = read(aboutFile!);
  assert.doesNotMatch(about, /DigitalSystemsReviewCtaGroup/);
  assert.doesNotMatch(about, /success_story_hero_|blog_article_/);
});

test('Contact remains unchanged', () => {
  const contactCandidates = [
    'src/components/ContactUsPage.tsx',
    'src/components/ContactPage.tsx',
  ];
  const contactFile = contactCandidates.find((p) => fs.existsSync(path.join(root, p)));
  assert.ok(contactFile, 'expected a contact page component');
  const contact = read(contactFile!);
  assert.doesNotMatch(contact, /DigitalSystemsReviewCtaGroup/);
  assert.doesNotMatch(contact, /buildFreeReviewCtaUrl/);
});

test('Pricing remains unchanged', () => {
  const pricingCandidates = [
    'src/components/PricingPage.tsx',
    'src/components/Pricing.tsx',
  ];
  const pricingFile = pricingCandidates.find((p) => fs.existsSync(path.join(root, p)));
  assert.ok(pricingFile, 'expected a Pricing page component');
  const pricing = read(pricingFile!);
  assert.doesNotMatch(pricing, /DigitalSystemsReviewCtaGroup/);
  assert.doesNotMatch(pricing, /blog_article_primary|success_story_hero_/);
});

test('no server, Prisma, route or migration change required by Phase 2C surfaces', () => {
  for (const file of PHASE2C_PLACEMENTS) {
    assert.ok(FREE_REVIEW_CTA_PLACEMENTS.includes(file));
  }

  const config = read('src/constants/conversionCta.ts');
  for (const placement of PHASE2C_PLACEMENTS) {
    assert.match(config, new RegExp(`'${placement}'`));
  }

  // Boundary: review form / page / server / prisma are not part of Phase 2C CTA wiring.
  assert.doesNotMatch(read('src/components/blog/BlogArticleCTA.tsx'), /prisma|server\.ts/);
  assert.doesNotMatch(read('src/components/SuccessStoriesPage.tsx'), /prisma|DigitalSystemsReviewForm/);
  assert.doesNotMatch(
    read('src/components/AuthorityStoryDetailPage.tsx'),
    /DigitalSystemsReviewForm|prisma/,
  );
});

test('both preferred-next-step options remain', () => {
  assert.ok(REVIEW_PREFERRED_NEXT_STEPS.includes('Email me the recommended next step'));
  assert.ok(REVIEW_PREFERRED_NEXT_STEPS.includes('Arrange a short discovery call'));
  assert.deepEqual([...FREE_REVIEW_PREFERRED_NEXT_STEPS], [...REVIEW_PREFERRED_NEXT_STEPS]);
  assert.deepEqual([...REVIEW_SERVICE_AREAS], [...FREE_REVIEW_SERVICE_AREAS]);
});

test('no PII or content identifiers appear in review analytics', () => {
  const payload = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation: 'success_story',
    ctaPlacement: 'success_story_hero_primary',
    route: '/success-stories/wholesale-order-management-platform',
    serviceArea: 'Managed Application & Website Support',
  });
  assert.equal(payload.source_location, 'success_story');
  assert.equal(payload.cta_placement, 'success_story_hero_primary');
  assert.equal(payload.service_area, 'Managed Application & Website Support');
  assertNoProhibitedAnalyticsProps(payload);
  assert.equal('slug' in payload, false);
  assert.equal('title' in payload, false);
  assert.equal('article_slug' in payload, false);
  assert.equal('article_title' in payload, false);
  assert.equal('post_id' in payload, false);
  assert.equal('author' in payload, false);

  const articlePayload = buildDigitalSystemsReviewAnalyticsPayload({
    sourceLocation: 'article',
    ctaPlacement: 'blog_article_primary',
    route: '/blog/example',
    serviceArea: 'Software & Product Engineering',
  });
  assertNoProhibitedAnalyticsProps(articlePayload);

  for (const key of [
    'name',
    'email',
    'workEmail',
    'company',
    'website',
    'submissionId',
    'chatSessionId',
  ]) {
    assert.throws(() => assertNoProhibitedAnalyticsProps({ [key]: 'x' }), new RegExp(key));
  }

  const group = read('src/components/conversion/DigitalSystemsReviewCtaGroup.tsx');
  assert.match(group, /free_review_cta_click/);
  assert.match(group, /free_review_book_call_click/);
  assert.match(group, /assertNoProhibitedAnalyticsProps/);
  assert.equal(FREE_REVIEW_CTA_LABEL, 'Request a free digital systems review');
});

test('BlogCTA, BlogServiceBridge and blog index surfaces remain untouched', () => {
  for (const file of [
    'src/components/blog/BlogCTA.tsx',
    'src/components/blog/BlogServiceBridge.tsx',
    'src/components/blog/BlogCategoryPage.tsx',
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /DigitalSystemsReviewCtaGroup/);
    assert.doesNotMatch(source, /blog_article_primary/);
  }
});
