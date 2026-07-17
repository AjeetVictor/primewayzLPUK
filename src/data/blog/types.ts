export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: string;
  tags: string[];
  date: string;
  updatedDate?: string;
  author: string;
  readTime: string;
  image?: string;
  thumbnailImage?: string;
  imageAlt?: string;
  content: string;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  faqs?: {
    question: string;
    answer: string;
  }[];
}

