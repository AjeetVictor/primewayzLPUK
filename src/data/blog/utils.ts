import { posts } from './posts';
import type { BlogPost } from './types';
import {
  getArticlePrimaryCategory,
  getArticleSecondaryCategories,
  warnInvalidArticleCategories,
} from './categories';

export const blogPosts: BlogPost[] = posts;

warnInvalidArticleCategories(blogPosts);

export const getPostTimestamp = (post: BlogPost) => {
  const timestamp = Date.parse(post.updatedDate || post.date);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const getAllBlogPosts = () => [...blogPosts].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));

export const getLatestBlogPosts = (limit = 3) => getAllBlogPosts().slice(0, limit);

export const getFeaturedBlogPost = () => getAllBlogPosts().find((post) => post.featured) || blogPosts[0];

export const getBlogPostById = (id?: string) => {
  if (!id) return undefined;
  return blogPosts.find((post) => post.id === id || post.slug === id);
};

/**
 * Related article priority:
 * 1. same primary category
 * 2. overlapping secondary category
 * 3. shared tags (editorial relation)
 * 4. latest articles as fallback via score ordering
 */
export const getRelatedBlogPosts = (post: BlogPost, limit = 3, pool: BlogPost[] = blogPosts) => {
  const tagSet = new Set(post.tags);
  const primary = getArticlePrimaryCategory(post);
  const secondary = new Set(getArticleSecondaryCategories(post));

  return pool
    .filter((candidate) => candidate.id !== post.id)
    .map((candidate) => {
      const candidatePrimary = getArticlePrimaryCategory(candidate);
      const candidateSecondary = getArticleSecondaryCategories(candidate);
      const samePrimary = Boolean(primary && candidatePrimary === primary);
      const overlappingSecondary =
        (primary && candidateSecondary.includes(primary)) ||
        candidateSecondary.some((slug) => secondary.has(slug)) ||
        Boolean(candidatePrimary && secondary.has(candidatePrimary));
      const tagOverlap = candidate.tags.filter((tag) => tagSet.has(tag)).length;
      const legacyCategoryMatch = candidate.category === post.category ? 1 : 0;

      return {
        post: candidate,
        score:
          (samePrimary ? 8 : 0) +
          (overlappingSecondary ? 4 : 0) +
          tagOverlap +
          legacyCategoryMatch +
          getPostTimestamp(candidate) / 1e15,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);
};
