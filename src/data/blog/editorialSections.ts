import type { BlogPost } from './types';

export type EditorialSection = {
  id: string;
  title: string;
  categories: string[];
  tagHints?: string[];
};

export const EDITORIAL_SECTIONS: EditorialSection[] = [
  {
    id: 'software-delivery',
    title: 'Software Delivery',
    categories: ['Delivery Model', 'UK SMEs'],
    tagHints: ['Monthly delivery', 'Foundation Sprint', 'Digital delivery', 'Subscription support'],
  },
  {
    id: 'website-technical-seo',
    title: 'Website & Technical SEO',
    categories: ['SEO', 'Maintenance', 'Digital Visibility'],
    tagHints: ['Technical SEO', 'Website support', 'SEO', 'Upkeep', 'Content Marketing'],
  },
  {
    id: 'crm-automation',
    title: 'CRM & Automation',
    categories: ['CRM'],
    tagHints: ['Automation', 'Lead management', 'CRM', 'Forms'],
  },
  {
    id: 'ai-digital-operations',
    title: 'AI & Digital Operations',
    categories: ['AI Operations', 'Digital Adoption', 'Digital Operations'],
    tagHints: ['AI readiness', 'Digital adoption', 'Automation', 'Digital operations'],
  },
];

const matchesSection = (post: BlogPost, section: EditorialSection) => {
  if (section.categories.includes(post.category)) {
    return true;
  }

  if (!section.tagHints?.length) {
    return false;
  }

  const tagSet = new Set(post.tags.map((tag) => tag.toLowerCase()));
  return section.tagHints.some((hint) => tagSet.has(hint.toLowerCase()));
};

export const getPostsForEditorialSection = (
  posts: BlogPost[],
  section: EditorialSection,
  excludeIds: Set<string> = new Set(),
  limit = 4,
) =>
  posts
    .filter((post) => !excludeIds.has(post.id) && matchesSection(post, section))
    .slice(0, limit);

export const getAllEditorialTags = (posts: BlogPost[]) =>
  Array.from(new Set(posts.flatMap((post) => post.tags))).sort((a, b) =>
    a.localeCompare(b),
  );
