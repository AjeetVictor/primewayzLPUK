import { posts } from './posts';
import type { BlogPost } from './types';

export const blogPosts: BlogPost[] = posts;

export const getAllBlogPosts = () => blogPosts;

export const getFeaturedBlogPost = () => blogPosts.find((post) => post.featured) || blogPosts[0];

export const getBlogPostById = (id?: string) => {
  if (!id) return undefined;
  return blogPosts.find((post) => post.id === id || post.slug === id);
};

export const getRelatedBlogPosts = (post: BlogPost, limit = 3) => {
  const tagSet = new Set(post.tags);

  return blogPosts
    .filter((candidate) => candidate.id !== post.id)
    .map((candidate) => ({
      post: candidate,
      score:
        (candidate.category === post.category ? 2 : 0) +
        candidate.tags.filter((tag) => tagSet.has(tag)).length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);
};

