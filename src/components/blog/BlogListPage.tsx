import { useEffect, useMemo, useState } from 'react';
import { BlogLayout } from './BlogLayout';
import { BlogEditorialGrid } from './BlogEditorialGrid';
import { BlogCategorySections } from './BlogCategorySections';
import { BlogCategoryNav } from './BlogCategoryNav';
import { BlogEssentialGuides } from './BlogEssentialGuides';
import { BlogServiceBridge } from './BlogServiceBridge';
import { getAllBlogPosts, getFeaturedBlogPost, getPostTimestamp } from '../../data/blog/utils';
import {
  EDITORIAL_SECTIONS,
  getAllEditorialTags,
  getPostsForEditorialSection,
} from '../../data/blog/editorialSections';
import {
  getCategoryArticleCount,
  getNavigableCategories,
} from '../../data/blog/categories';
import type { BlogPost } from '../../data/blog/types';
import { apiUrl } from '../../utils/apiUrl';

type BlogListPageProps = {
  initialPosts?: BlogPost[];
};

const sectionNavItems = [
  { label: 'Software Delivery', href: '#section-software-delivery' },
  { label: 'Website & SEO', href: '#section-website-technical-seo' },
  { label: 'CRM & Automation', href: '#section-crm-automation' },
  { label: 'AI & Operations', href: '#section-ai-digital-operations' },
  { label: 'Essential guides', href: '#section-essential-guides' },
];

export const BlogListPage = ({ initialPosts }: BlogListPageProps) => {
  const sortPosts = (items: BlogPost[]) =>
    [...items].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));

  const [posts, setPosts] = useState<BlogPost[]>(() =>
    sortPosts(initialPosts?.length ? initialPosts : getAllBlogPosts()),
  );

  const featuredPost = posts.find((post) => post.featured) ?? posts[0] ?? getFeaturedBlogPost();
  const heroExcludedIds = useMemo(() => {
    const secondaryPosts = posts.filter((post) => post.id !== featuredPost?.id).slice(0, 2);
    return new Set([featuredPost?.id, ...secondaryPosts.map((post) => post.id)].filter(Boolean));
  }, [posts, featuredPost?.id]);

  const secondaryPosts = posts.filter((post) => post.id !== featuredPost?.id).slice(0, 2);
  const latestPosts = posts.slice(0, 5);
  const editorialSections = EDITORIAL_SECTIONS.map((section) => ({
    section,
    posts: getPostsForEditorialSection(posts, section, heroExcludedIds, 4),
  }));
  const topicTags = getAllEditorialTags(posts);
  const navigableCategories = useMemo(() => getNavigableCategories(posts), [posts]);
  const articleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const category of navigableCategories) {
      counts[category.slug] = getCategoryArticleCount(category.slug, posts);
    }
    return counts;
  }, [navigableCategories, posts]);

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

  return (
    <BlogLayout
      title="Primewayz UK Insights"
      description="Practical guidance on AI automation, digital systems, SEO, CRM, websites, and operational stability for UK SMEs."
      introActions={
        <div className="space-y-5">
          <BlogCategoryNav categories={navigableCategories} articleCounts={articleCounts} />
          <div className="flex flex-wrap gap-2">
            {sectionNavItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-600 transition hover:border-emerald-200 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      }
    >
      {featuredPost ? (
        <BlogEditorialGrid
          featuredPost={featuredPost}
          secondaryPosts={secondaryPosts}
          latestPosts={latestPosts}
        />
      ) : null}

      <BlogCategorySections sections={editorialSections} />

      <BlogEssentialGuides />

      <BlogServiceBridge />

      <section className="mt-16 border-t border-zinc-200 pt-16 lg:mt-20 lg:pt-20">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">Topics</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {topicTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>
    </BlogLayout>
  );
};
