import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildArticleBreadcrumbs,
  buildCategoryBreadcrumbs,
  getArticlePrimaryCategory,
  getArticleSecondaryCategories,
  getArticlesByCategory,
  getBlogCategoryBySlug,
  getCategoryCanonicalPath,
  getCategoryPageArticles,
  getFeaturedArticleForCategory,
  getIndexableCategoriesWithArticles,
  getInvalidArticleCategoryReferences,
  isPublishableCategoryPage,
  isValidBlogCategorySlug,
  normaliseBlogPostCategories,
} from './categories.ts';
import { getAllBlogPosts, getRelatedBlogPosts } from './utils.ts';
import type { BlogPost } from './types.ts';

const posts = getAllBlogPosts();

test('category slug lookup returns known categories and rejects unknown', () => {
  const category = getBlogCategoryBySlug('software-development');
  assert.ok(category);
  assert.equal(category?.canonicalPath, '/blog/category/software-development');
  assert.equal(getBlogCategoryBySlug('not-real'), undefined);
  assert.equal(isValidBlogCategorySlug('ai-automation'), true);
  assert.equal(isValidBlogCategorySlug('not-real'), false);
});

test('every static article has a resolvable primary category', () => {
  for (const post of posts) {
    const primary = getArticlePrimaryCategory(post);
    assert.ok(primary, `missing primary for ${post.id}`);
    assert.equal(isValidBlogCategorySlug(primary), true);
  }
  assert.equal(getInvalidArticleCategoryReferences(posts).length, 0);
});

test('primary and secondary grouping is deterministic and deduplicated', () => {
  const software = getArticlesByCategory('software-development', posts);
  const ids = software.map((post) => post.id);
  assert.equal(ids.length, new Set(ids).size);

  const primaryFirst = software.filter(
    (post) => getArticlePrimaryCategory(post) === 'software-development',
  );
  const secondaryOnly = software.filter(
    (post) =>
      getArticlePrimaryCategory(post) !== 'software-development' &&
      getArticleSecondaryCategories(post).includes('software-development'),
  );

  assert.ok(primaryFirst.length > 0);
  assert.ok(secondaryOnly.length > 0);
  assert.deepEqual(
    software.slice(0, primaryFirst.length).map((post) => post.id),
    primaryFirst.map((post) => post.id),
  );
});

test('featured article is excluded from category grid and essential guides', () => {
  const { featured, articles, essentialGuides } = getCategoryPageArticles(
    'software-development',
    posts,
  );
  assert.ok(featured);
  assert.equal(
    articles.some((post) => post.id === featured?.id),
    false,
  );
  assert.equal(
    essentialGuides.some((post) => post.id === featured?.id),
    false,
  );
  assert.equal(
    getFeaturedArticleForCategory('software-development', posts)?.id,
    featured?.id,
  );
});

test('empty and unknown categories are not publishable', () => {
  assert.equal(isPublishableCategoryPage('not-real', posts), false);
  assert.equal(isPublishableCategoryPage('mobile-app-development', posts), false);
  assert.equal(isPublishableCategoryPage('legacy-modernisation', posts), false);
  assert.equal(isPublishableCategoryPage('software-development', posts), true);

  const indexable = getIndexableCategoriesWithArticles(posts);
  assert.equal(
    indexable.some((category) => category.slug === 'mobile-app-development'),
    false,
  );
  assert.ok(indexable.some((category) => category.slug === 'software-development'));
});

test('breadcrumb builders match category and article hierarchy', () => {
  const category = getBlogCategoryBySlug('technical-seo');
  assert.ok(category);
  assert.deepEqual(buildCategoryBreadcrumbs(category!), [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'Technical SEO' },
  ]);

  const post = posts.find((item) => item.slug === 'technical-seo-basics-uk-small-business');
  assert.ok(post);
  assert.deepEqual(buildArticleBreadcrumbs(post!, category), [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'Technical SEO', href: '/blog/category/technical-seo' },
    { label: post!.title },
  ]);
});

test('category canonical paths are stable', () => {
  assert.equal(
    getCategoryCanonicalPath('ai-automation'),
    '/blog/category/ai-automation',
  );
});

test('normalisation supports Autopilot/CMS fallback sequence', () => {
  const fromPrimary = normaliseBlogPostCategories({
    category: 'Legacy Label',
    primaryCategory: 'software-support',
    categorySlug: 'wrong',
    secondaryCategories: ['software-support', 'web-development', 'web-development'],
  });
  assert.deepEqual(fromPrimary, {
    primaryCategory: 'software-support',
    secondaryCategories: ['web-development'],
  });

  const fromLegacy = normaliseBlogPostCategories({
    category: 'SEO',
    secondaryCategories: [],
  });
  assert.equal(fromLegacy.primaryCategory, 'technical-seo');
});

test('invalid category references are reported without crashing', () => {
  const invalidPost = {
    ...posts[0],
    id: 'invalid-ref-post',
    primaryCategory: 'not-a-real-category',
    secondaryCategories: ['software-development', 'software-development', 'not-a-real-category'],
  } as BlogPost;

  const issues = getInvalidArticleCategoryReferences([invalidPost]);
  assert.equal(issues.length, 1);
  assert.ok(issues[0].issues.some((issue) => issue.includes('Unknown primaryCategory')));
  assert.ok(issues[0].issues.some((issue) => issue.includes('Duplicate secondaryCategory')));
});

test('related articles prioritise same primary category', () => {
  const post = posts.find(
    (item) =>
      item.slug ===
      'fixed-price-vs-time-material-vs-subscription-support-uk-smes-saas-founders',
  );
  assert.ok(post);
  const related = getRelatedBlogPosts(post!, 3, posts);
  assert.ok(related.length > 0);
  assert.ok(
    related.some(
      (candidate) => getArticlePrimaryCategory(candidate) === 'software-development',
    ) ||
      related.some((candidate) =>
        getArticleSecondaryCategories(candidate).includes('software-development'),
      ),
  );
});

test('sitemap-indexable categories exclude empty planned categories', () => {
  const slugs = getIndexableCategoriesWithArticles(posts).map((category) => category.slug);
  assert.ok(slugs.includes('software-development'));
  assert.ok(slugs.includes('business-strategy'));
  assert.equal(slugs.includes('mobile-app-development'), false);
  assert.equal(slugs.includes('legacy-modernisation'), false);
});
