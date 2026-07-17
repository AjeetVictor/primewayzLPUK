import { Link, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BlogLayout } from './BlogLayout';
import { BlogCard } from './BlogCard';
import { BlogBreadcrumbs } from './BlogBreadcrumbs';
import { BlogCategoryNav } from './BlogCategoryNav';
import { BlogFaqSection } from './BlogFaqSection';
import { TrackedLink } from '../common/TrackedLink';
import {
  buildCategoryBreadcrumbs,
  getBlogCategoryBySlug,
  getCategoryArticleCount,
  getCategoryPageArticles,
  getNavigableCategories,
  getRelatedCategories,
  isPublishableCategoryPage,
} from '../../data/blog/categories';
import { getAllBlogPosts, getPostTimestamp } from '../../data/blog/utils';
import { getBlogThumbnailImage } from '../../data/blog/imageFallbacks';
import type { BlogCategory, BlogPost } from '../../data/blog/types';
import { apiUrl } from '../../utils/apiUrl';

type BlogCategoryPageProps = {
  initialCategory?: BlogCategory | null;
  initialPosts?: BlogPost[];
};

export const BlogCategoryPage = ({ initialCategory, initialPosts }: BlogCategoryPageProps) => {
  const { slug } = useParams<{ slug: string }>();
  const sortPosts = (items: BlogPost[]) =>
    [...items].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));

  const [posts, setPosts] = useState<BlogPost[]>(() =>
    sortPosts(initialPosts?.length ? initialPosts : getAllBlogPosts()),
  );

  const category = useMemo(() => {
    if (initialCategory && initialCategory.slug === slug) return initialCategory;
    return getBlogCategoryBySlug(slug);
  }, [initialCategory, slug]);

  const isPublishable = category ? isPublishableCategoryPage(category.slug, posts) : false;

  const navigableCategories = useMemo(() => getNavigableCategories(posts), [posts]);
  const articleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of navigableCategories) {
      counts[item.slug] = getCategoryArticleCount(item.slug, posts);
    }
    return counts;
  }, [navigableCategories, posts]);

  const { featured, articles, essentialGuides } = useMemo(() => {
    if (!category || !isPublishable) {
      return { featured: undefined, articles: [], essentialGuides: [] };
    }
    return getCategoryPageArticles(category.slug, posts);
  }, [category, isPublishable, posts]);

  const relatedCategories = useMemo(() => {
    if (!category || !isPublishable) return [];
    return getRelatedCategories(category.slug, posts);
  }, [category, isPublishable, posts]);

  const breadcrumbs = category ? buildCategoryBreadcrumbs(category) : [];
  const articleCount = category ? getCategoryArticleCount(category.slug, posts) : 0;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(apiUrl('/api/blog/posts'));
        if (res.ok) {
          setPosts(sortPosts(await res.json()));
        }
      } catch {
        setPosts(sortPosts(getAllBlogPosts()));
      }
    };

    fetchPosts();
  }, []);

  if (!category || !isPublishable) {
    return (
      <main className="min-h-screen bg-white pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">
            Category not found
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
            This category is not available
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-zinc-600">
            The category may not exist yet, or it does not currently have published insights.
          </p>
          <Link
            to="/blog"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            Back to insights
          </Link>
        </div>
      </main>
    );
  }

  return (
    <BlogLayout
      eyebrow={category.eyebrow || 'Insights'}
      title={category.title}
      description={category.description}
      introActions={
        <div className="space-y-5">
          <BlogBreadcrumbs items={breadcrumbs} />
          <p className="text-sm font-semibold text-zinc-500">
            {articleCount} {articleCount === 1 ? 'article' : 'articles'}
          </p>
          <BlogCategoryNav
            categories={navigableCategories}
            activeSlug={category.slug}
            articleCounts={articleCounts}
          />
        </div>
      }
    >
      {featured ? (
        <section className="mb-16" aria-labelledby="category-featured-heading">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">Featured</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <h2 id="category-featured-heading" className="text-3xl font-bold tracking-tight text-zinc-900">
                <Link to={`/blog/${featured.id}`} className="transition hover:text-emerald-700">
                  {featured.title}
                </Link>
              </h2>
              <p className="mt-4 text-base leading-7 text-zinc-600">
                {featured.excerpt || featured.description}
              </p>
              <Link
                to={`/blog/${featured.id}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
              >
                Read article
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <Link
              to={`/blog/${featured.id}`}
              className="block overflow-hidden bg-zinc-100"
              aria-label={`Read featured insight: ${featured.title}`}
            >
              <div className="aspect-[16/10]">
                <img
                  src={getBlogThumbnailImage(featured.thumbnailImage)}
                  alt={featured.imageAlt || featured.title}
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </Link>
          </div>
        </section>
      ) : null}

      {category.longDescription ? (
        <section className="mb-16 max-w-3xl border-t border-zinc-200 pt-10" aria-labelledby="category-context-heading">
          <h2 id="category-context-heading" className="text-2xl font-bold tracking-tight text-zinc-900">
            Why this topic matters
          </h2>
          <p className="mt-4 text-base leading-7 text-zinc-600">{category.longDescription}</p>
        </section>
      ) : null}

      {articles.length ? (
        <section className="mb-16" aria-labelledby="category-articles-heading">
          <div className="mb-8 border-b border-zinc-200 pb-4">
            <h2 id="category-articles-heading" className="text-xl font-bold uppercase tracking-[0.14em] text-zinc-900">
              Latest articles
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {articles.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      {essentialGuides.length ? (
        <section className="mb-16" aria-labelledby="category-guides-heading">
          <div className="mb-8 border-b border-zinc-200 pb-4">
            <h2 id="category-guides-heading" className="text-xl font-bold uppercase tracking-[0.14em] text-zinc-900">
              Essential guides
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {essentialGuides.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      {category.serviceLinks?.length ? (
        <section className="mb-16 border-t border-zinc-200 pt-16" aria-labelledby="category-services-heading">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">Related services</p>
          <h2 id="category-services-heading" className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
            Connect this topic to practical support
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {category.serviceLinks.map((service) => (
              <Link
                key={`${service.href}-${service.title}`}
                to={service.href}
                className="group border border-zinc-200 bg-white px-5 py-5 transition hover:border-emerald-200"
              >
                <h3 className="text-sm font-bold text-zinc-900 transition group-hover:text-emerald-700">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{service.description}</p>
                {service.ctaLabel ? (
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                    {service.ctaLabel}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
          <div className="mt-8">
            <TrackedLink
              href="/contact-us#book-call"
              ctaText="Book a UK discovery call"
              ctaLocation={`blog_category_${category.slug}`}
              eventType="book_call_click"
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#000A2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Book a UK discovery call
              <ArrowRight className="h-4 w-4" aria-hidden />
            </TrackedLink>
          </div>
        </section>
      ) : null}

      {category.faq?.length ? <BlogFaqSection faqs={category.faq} /> : null}

      {relatedCategories.length ? (
        <section className="mt-16 border-t border-zinc-200 pt-16" aria-labelledby="related-categories-heading">
          <h2 id="related-categories-heading" className="text-xl font-bold tracking-tight text-zinc-900">
            Related categories
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {relatedCategories.map((related) => (
              <li key={related.slug}>
                <Link
                  to={related.canonicalPath}
                  className="block border border-zinc-200 px-5 py-4 transition hover:border-emerald-200"
                >
                  <span className="text-sm font-bold text-zinc-900">{related.name}</span>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{related.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </BlogLayout>
  );
};
