import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getBlogCategoryBySlug,
  isPublishableCategoryPage,
} from '../../data/blog/categories.ts';
import { getAllBlogPosts, getBlogPostById } from '../../data/blog/utils.ts';
import { getPublishedSuccessStoryBySlug } from '../../data/successStories.ts';
import {
  BLOG_ARTICLE_NOT_FOUND_SEO,
  BLOG_CATEGORY_NOT_FOUND_SEO,
  BLOG_INDEX_SEO,
  SHARED_WEB_PRESENCE_AUDIT_REPORT_SEO,
  SUCCESS_STORY_NOT_FOUND_SEO,
} from './routeMetadataContent.ts';
import { STATIC_PAGE_SEO } from './staticPageSeo.ts';
import {
  DEFAULT_OG_IMAGE,
  TWITTER_CARD,
} from './socialMetadata.ts';
import {
  buildStaticRouteCanonicalUrl,
  INDEXED_STATIC_ROBOTS,
  isDelegatedClientMetadataRoute,
  NOINDEX_NOFOLLOW_ROBOTS,
  normaliseRouteMetadataPathname,
  resolveBlogArticleNotFoundSnapshot,
  resolveRouteMetadataSnapshot,
  resolveStaticRouteRobots,
  STATIC_NOINDEX_FOLLOW_ROBOTS,
} from './routeMetadataHelpers.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const SERVER_BLOG_INDEX_TITLE = 'Primewayz UK Insights | Digital Support for UK SMEs';
const SERVER_BLOG_INDEX_DESCRIPTION =
  'Practical guidance for UK SMEs on websites, SEO, CRM workflows, automation, AI readiness, maintenance, and ongoing digital delivery.';

test('normaliseRouteMetadataPathname trims trailing slashes except root', () => {
  assert.equal(normaliseRouteMetadataPathname('/'), '/');
  assert.equal(normaliseRouteMetadataPathname('/pricing/'), '/pricing');
  assert.equal(normaliseRouteMetadataPathname('/about-us///'), '/about-us');
  assert.equal(normaliseRouteMetadataPathname(''), '/');
});

test('buildStaticRouteCanonicalUrl keeps root slash and omits query strings', () => {
  assert.equal(buildStaticRouteCanonicalUrl('/'), 'https://uk.primewayz.com/');
  assert.equal(buildStaticRouteCanonicalUrl('/pricing'), 'https://uk.primewayz.com/pricing');
  assert.equal(buildStaticRouteCanonicalUrl('/pricing/'), 'https://uk.primewayz.com/pricing');
});

test('pricing metadata comes from STATIC_PAGE_SEO with full social defaults', () => {
  const snapshot = resolveRouteMetadataSnapshot('/pricing');

  assert.ok(snapshot);
  assert.equal(snapshot!.title, STATIC_PAGE_SEO['/pricing'].title);
  assert.equal(snapshot!.description, STATIC_PAGE_SEO['/pricing'].description);
  assert.equal(snapshot!.canonical, 'https://uk.primewayz.com/pricing');
  assert.equal(snapshot!.robots, INDEXED_STATIC_ROBOTS);
  assert.equal(snapshot!.ogType, 'website');
  assert.equal(snapshot!.ogImage, DEFAULT_OG_IMAGE);
  assert.equal(snapshot!.ogImageSecureUrl, DEFAULT_OG_IMAGE);
  assert.equal(snapshot!.twitterCard, TWITTER_CARD);
  assert.equal(snapshot!.twitterImage, DEFAULT_OG_IMAGE);
});

test('about-us metadata comes from STATIC_PAGE_SEO', () => {
  const snapshot = resolveRouteMetadataSnapshot('/about-us');

  assert.ok(snapshot);
  assert.equal(snapshot!.title, STATIC_PAGE_SEO['/about-us'].title);
  assert.equal(snapshot!.description, STATIC_PAGE_SEO['/about-us'].description);
  assert.equal(snapshot!.canonical, 'https://uk.primewayz.com/about-us');
});

test('contact metadata comes from STATIC_PAGE_SEO', () => {
  const snapshot = resolveRouteMetadataSnapshot('/contact-us');

  assert.ok(snapshot);
  assert.equal(snapshot!.title, STATIC_PAGE_SEO['/contact-us'].title);
  assert.equal(snapshot!.description, STATIC_PAGE_SEO['/contact-us'].description);
  assert.equal(snapshot!.canonical, 'https://uk.primewayz.com/contact-us');
});

test('indexed static routes use the same robots directive as SSR', () => {
  assert.equal(resolveStaticRouteRobots('/pricing'), INDEXED_STATIC_ROBOTS);
  assert.equal(resolveStaticRouteRobots('/about-us'), INDEXED_STATIC_ROBOTS);
  assert.equal(
    resolveStaticRouteRobots('/digital-systems-review'),
    INDEXED_STATIC_ROBOTS,
  );
});

test('known noindex static routes preserve noindex, follow', () => {
  for (const route of [
    '/software-development-subscription-uk/request-capacity',
    '/thank-you/digital-systems-review',
  ]) {
    assert.equal(resolveStaticRouteRobots(route), STATIC_NOINDEX_FOLLOW_ROBOTS);
    assert.equal(resolveRouteMetadataSnapshot(route)?.robots, STATIC_NOINDEX_FOLLOW_ROBOTS);
  }
});

test('canonical URLs never include query strings or hashes', () => {
  const snapshot = resolveRouteMetadataSnapshot('/digital-systems-review');

  assert.ok(snapshot);
  assert.ok(snapshot!.canonical);
  assert.doesNotMatch(snapshot!.canonical!, /[?#]/);
});

test('/blog returns a definitive indexed snapshot matching SSR strings', () => {
  const snapshot = resolveRouteMetadataSnapshot('/blog');

  assert.ok(snapshot);
  assert.equal(snapshot!.title, BLOG_INDEX_SEO.title);
  assert.equal(snapshot!.description, BLOG_INDEX_SEO.description);
  assert.equal(snapshot!.title, SERVER_BLOG_INDEX_TITLE);
  assert.equal(snapshot!.description, SERVER_BLOG_INDEX_DESCRIPTION);
  assert.equal(snapshot!.canonical, 'https://uk.primewayz.com/blog');
  assert.equal(snapshot!.robots, INDEXED_STATIC_ROBOTS);
  assert.equal(snapshot!.ogType, 'website');
  assert.equal(snapshot!.ogImage, DEFAULT_OG_IMAGE);
});

test('valid /blog/category/:slug returns correct title, description, canonical, and robots', () => {
  const posts = getAllBlogPosts();
  const category = getBlogCategoryBySlug('software-development');
  assert.ok(category);
  assert.ok(isPublishableCategoryPage(category.slug, posts));

  const snapshot = resolveRouteMetadataSnapshot('/blog/category/software-development');

  assert.ok(snapshot);
  assert.equal(snapshot!.title, category.seoTitle);
  assert.equal(snapshot!.description, category.seoDescription);
  assert.equal(snapshot!.canonical, 'https://uk.primewayz.com/blog/category/software-development');
  assert.equal(snapshot!.robots, INDEXED_STATIC_ROBOTS);
  assert.equal(snapshot!.ogType, 'website');
  assert.notEqual(snapshot!.ogImage, DEFAULT_OG_IMAGE);
});

test('invalid blog category returns a 404 noindex snapshot', () => {
  const snapshot = resolveRouteMetadataSnapshot('/blog/category/not-a-real-category');

  assert.ok(snapshot);
  assert.equal(snapshot!.title, BLOG_CATEGORY_NOT_FOUND_SEO.title);
  assert.equal(snapshot!.description, BLOG_CATEGORY_NOT_FOUND_SEO.description);
  assert.equal(snapshot!.robots, NOINDEX_NOFOLLOW_ROBOTS);
});

test('valid /success-stories/:slug returns correct metadata', () => {
  const story = getPublishedSuccessStoryBySlug('wholesale-order-management-platform');
  assert.ok(story);

  const snapshot = resolveRouteMetadataSnapshot('/success-stories/wholesale-order-management-platform');

  assert.ok(snapshot);
  assert.equal(snapshot!.title, story.seoTitle);
  assert.equal(snapshot!.description, story.seoDescription);
  assert.equal(
    snapshot!.canonical,
    'https://uk.primewayz.com/success-stories/wholesale-order-management-platform',
  );
  assert.equal(snapshot!.robots, INDEXED_STATIC_ROBOTS);
  assert.equal(snapshot!.ogType, 'article');
  assert.equal(snapshot!.ogImage, `https://uk.primewayz.com${story.ogImage}`);
});

test('invalid success-story slug returns a 404 noindex snapshot', () => {
  const snapshot = resolveRouteMetadataSnapshot('/success-stories/not-a-real-story');

  assert.ok(snapshot);
  assert.equal(snapshot!.title, SUCCESS_STORY_NOT_FOUND_SEO.title);
  assert.equal(snapshot!.description, SUCCESS_STORY_NOT_FOUND_SEO.description);
  assert.equal(snapshot!.robots, NOINDEX_NOFOLLOW_ROBOTS);
});

test('static blog posts resolve centrally through the route snapshot model', () => {
  const slug = 'monthly-digital-support-uk-smes';
  const post = getBlogPostById(slug);
  assert.ok(post);

  const snapshot = resolveRouteMetadataSnapshot(`/blog/${slug}`);

  assert.ok(snapshot);
  assert.equal(snapshot!.title, `${post.seoTitle || post.title} | Primewayz UK`);
  assert.equal(snapshot!.ogType, 'article');
  assert.equal(isDelegatedClientMetadataRoute(`/blog/${slug}`), false);
});

test('unknown blog slugs remain delegated to BlogPost for CMS-only resolution', () => {
  assert.equal(resolveRouteMetadataSnapshot('/blog/cms-only-post-slug'), null);
  assert.equal(isDelegatedClientMetadataRoute('/blog/cms-only-post-slug'), true);
});

test('definitively missing blog article snapshot matches server not-found strings', () => {
  const snapshot = resolveBlogArticleNotFoundSnapshot('/blog/cms-only-post-slug');

  assert.equal(snapshot.title, BLOG_ARTICLE_NOT_FOUND_SEO.title);
  assert.equal(snapshot.description, BLOG_ARTICLE_NOT_FOUND_SEO.description);
  assert.equal(snapshot.robots, NOINDEX_NOFOLLOW_ROBOTS);
  assert.equal(snapshot.canonical, 'https://uk.primewayz.com/blog/cms-only-post-slug');
  assert.equal(snapshot.ogType, 'website');
  assert.equal(snapshot.ogImage, DEFAULT_OG_IMAGE);
  assert.equal(snapshot.twitterCard, TWITTER_CARD);
  assert.equal(snapshot.twitterImage, DEFAULT_OG_IMAGE);
});

test('BlogPost applies settled blog not-found metadata via shared snapshot helper', () => {
  const blogPost = read('src/components/BlogPost.tsx');

  assert.match(blogPost, /resolveBlogArticleNotFoundSnapshot/);
  assert.match(blogPost, /applyRouteMetadataSnapshot/);
  assert.match(blogPost, /if \(isPostLoading \|\| post \|\| !id\) return;/);
});

test('pricing snapshot resets article og:type to the static default', () => {
  const articleSnapshot = resolveRouteMetadataSnapshot(
    '/blog/monthly-digital-support-uk-smes',
  );
  const pricingSnapshot = resolveRouteMetadataSnapshot('/pricing');

  assert.equal(articleSnapshot?.ogType, 'article');
  assert.equal(pricingSnapshot?.ogType, 'website');
});

test('pricing snapshot resets article image to the static default', () => {
  const articleSnapshot = resolveRouteMetadataSnapshot(
    '/blog/monthly-digital-support-uk-smes',
  );
  const pricingSnapshot = resolveRouteMetadataSnapshot('/pricing');

  assert.notEqual(articleSnapshot?.ogImage, DEFAULT_OG_IMAGE);
  assert.equal(pricingSnapshot?.ogImage, DEFAULT_OG_IMAGE);
  assert.equal(pricingSnapshot?.twitterImage, DEFAULT_OG_IMAGE);
});

test('pricing snapshot resets twitter:card and twitter:image', () => {
  const pricingSnapshot = resolveRouteMetadataSnapshot('/pricing');

  assert.equal(pricingSnapshot?.twitterCard, TWITTER_CARD);
  assert.equal(pricingSnapshot?.twitterImage, DEFAULT_OG_IMAGE);
});

test('RouteMetadata applies the full social metadata set', () => {
  const routeMetadata = read('src/components/RouteMetadata.tsx');
  const routeMetadataDom = read('src/lib/seo/routeMetadataDom.ts');

  assert.match(routeMetadata, /applyRouteMetadataSnapshot/);
  assert.match(routeMetadataDom, /og:type/);
  assert.match(routeMetadataDom, /og:image:secure_url/);
  assert.match(routeMetadataDom, /og:image:type/);
  assert.match(routeMetadataDom, /og:image:alt/);
  assert.match(routeMetadataDom, /twitter:card/);
  assert.match(routeMetadataDom, /twitter:image/);
  assert.match(routeMetadataDom, /twitter:image:alt/);
});

test('RouteMetadata is mounted once in App and owns static-route updates', () => {
  const app = read('src/App.tsx');
  const routeMetadata = read('src/components/RouteMetadata.tsx');

  assert.match(app, /import \{ RouteMetadata \} from '\.\/components\/RouteMetadata';/);
  assert.match(app, /<RouteMetadata \/>/);
  assert.match(routeMetadata, /resolveRouteMetadataSnapshot/);
  assert.match(read('src/lib/seo/routeMetadataDom.ts'), /setMeta\('name', 'robots'/);
});

const CLEANED_COMPONENTS = [
  'src/components/ContactUsPage.tsx',
  'src/components/DigitalSystemsReviewPage.tsx',
  'src/components/DigitalSystemsReviewThankYouPage.tsx',
  'src/components/Pricing.tsx',
  'src/components/ProfessionalServicesCrmSupportUkPage.tsx',
  'src/components/sdaas/SdaasCapacityRequestPage.tsx',
] as const;

test('cleaned page components no longer own inline head metadata', () => {
  for (const file of CLEANED_COMPONENTS) {
    const source = read(file);
    assert.doesNotMatch(source, /<title\b/);
    assert.doesNotMatch(source, /<meta\s+name=["']description["']/);
    assert.doesNotMatch(source, /<meta\s+name=["']robots["']/);
    assert.doesNotMatch(source, /<link\s+rel=["']canonical["']/);
    assert.doesNotMatch(source, /<Helmet\b/);
    assert.doesNotMatch(source, /<SEO\b/);
    assert.doesNotMatch(source, /from ['"].*\/SEO['"]/);
    assert.doesNotMatch(source, /react-helmet-async/);
  }
});

test('contact route is covered by STATIC_PAGE_SEO for SPA metadata', () => {
  assert.ok(STATIC_PAGE_SEO['/contact-us']);
  assert.match(read('src/lib/seo/staticPageSeo.ts'), /\/contact-us':\s*\{/);
});

test('shared-report route returns definitive noindex snapshot matching server strings', () => {
  const snapshot = resolveRouteMetadataSnapshot('/web-presence-audit/report/public-token');

  assert.ok(snapshot);
  assert.equal(snapshot!.title, SHARED_WEB_PRESENCE_AUDIT_REPORT_SEO.title);
  assert.equal(snapshot!.description, SHARED_WEB_PRESENCE_AUDIT_REPORT_SEO.description);
  assert.equal(snapshot!.robots, NOINDEX_NOFOLLOW_ROBOTS);
  assert.equal(snapshot!.canonical, undefined);
  assert.equal(snapshot!.ogType, 'website');
  assert.equal(snapshot!.ogImage, DEFAULT_OG_IMAGE);
  assert.equal(snapshot!.twitterImage, DEFAULT_OG_IMAGE);
  assert.equal(isDelegatedClientMetadataRoute('/web-presence-audit/report/public-token'), false);
});

test('shared-report page no longer appends its own robots meta tag', () => {
  const sharedReportPage = read('src/components/tools/WebPresenceAuditSharedReportPage.tsx');

  assert.doesNotMatch(sharedReportPage, /document\.createElement\('meta'\)/);
  assert.doesNotMatch(sharedReportPage, /robotsMeta/);
  assert.doesNotMatch(sharedReportPage, /<meta\s+name=["']robots["']/);
});

test('applyRouteMetadataSnapshot collapses duplicate robots tags', () => {
  const routeMetadataDom = read('src/lib/seo/routeMetadataDom.ts');

  assert.match(routeMetadataDom, /for \(const duplicate of matches\)/);
  assert.match(routeMetadataDom, /duplicate\.remove\(\)/);
});

test('shared-report snapshot omits canonical to match SSR noindex tags', () => {
  const routeMetadataDom = read('src/lib/seo/routeMetadataDom.ts');

  assert.match(routeMetadataDom, /if \(snapshot\.canonical\)/);
  assert.match(routeMetadataDom, /removeLink\('canonical'\)/);
  assert.match(routeMetadataDom, /removeMeta\('property', 'og:url'\)/);
});

test('category canonical excludes trailing slashes from pathname normalisation', () => {
  const snapshot = resolveRouteMetadataSnapshot('/blog/category/software-development/');

  assert.ok(snapshot);
  assert.equal(snapshot!.canonical, 'https://uk.primewayz.com/blog/category/software-development');
  assert.doesNotMatch(snapshot!.canonical, /[?#]/);
});
