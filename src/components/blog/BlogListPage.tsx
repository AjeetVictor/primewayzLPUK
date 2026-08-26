import { useEffect, useMemo, useState } from 'react';
import { BlogLayout } from './BlogLayout';
import { BlogEditorialGrid } from './BlogEditorialGrid';
import { BlogCategoryDirectory } from './BlogCategoryDirectory';
import { BlogCategorySections } from './BlogCategorySections';
import { BlogEssentialGuides } from './BlogEssentialGuides';
import { BlogServiceBridge } from './BlogServiceBridge';
import { getAllBlogPosts, getFeaturedBlogPost, getPostTimestamp } from '../../data/blog/utils';
import {
  EDITORIAL_SECTIONS,
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

export const BlogListPage = ({ initialPosts }: BlogListPageProps) => {
  const sortPosts = (items: BlogPost[]) =>
    [...items].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));

  const [posts, setPosts] = useState<BlogPost[]>(() =>
    sortPosts(initialPosts?.length ? initialPosts : getAllBlogPosts()),
  );

  // The newest published insight leads the landing page.
  // Campaign pinning should use a separate time-limited mechanism.
  const featuredPost =
    posts[0] ??
    getFeaturedBlogPost();

  const heroExcludedIds = useMemo(() => {
    const secondaryPosts = posts
      .filter((post) => post.id !== featuredPost?.id)
      .slice(0, 2);

    return new Set(
      [featuredPost?.id, ...secondaryPosts.map((post) => post.id)].filter(Boolean),
    );
  }, [posts, featuredPost?.id]);

  const secondaryPosts = posts
    .filter((post) => post.id !== featuredPost?.id)
    .slice(0, 2);


  const editorialSections = EDITORIAL_SECTIONS.map((section) => ({
    section,
    posts: getPostsForEditorialSection(posts, section, heroExcludedIds, 4),
  }));
  const navigableCategories = useMemo(
    () => getNavigableCategories(posts),
    [posts],
  );

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
    >
      {featuredPost ? (
        <BlogEditorialGrid
          featuredPost={featuredPost}
          secondaryPosts={secondaryPosts}

        />
      ) : null}

      <BlogCategoryDirectory
        categories={navigableCategories}
        articleCounts={articleCounts}
      />

      <BlogCategorySections sections={editorialSections} />

      <BlogEssentialGuides />

      <BlogServiceBridge />
    </BlogLayout>
  );
};
