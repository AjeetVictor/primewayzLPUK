import { useEffect, useState } from 'react';
import { BlogCard } from './BlogCard';
import { BlogCTA } from './BlogCTA';
import { BlogLayout } from './BlogLayout';
import { getAllBlogPosts, getFeaturedBlogPost } from '../../data/blog/utils';
import type { BlogPost } from '../../data/blog/types';
import { apiUrl } from '../../utils/apiUrl';

export const BlogListPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>(getAllBlogPosts());
  const featuredPost = posts.find((post) => post.featured) || getFeaturedBlogPost();
  const remainingPosts = posts.filter((post) => post.id !== featuredPost.id);
  const categories = Array.from(new Set(posts.map((post) => post.category)));

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(apiUrl('/api/blog/posts'));
        if (res.ok) {
          setPosts(await res.json());
        }
      } catch {
        setPosts(getAllBlogPosts());
      }
    };

    fetchPosts();
  }, []);

  return (
    <BlogLayout
      title="Primewayz UK Insights"
      description="Practical guidance on AI automation, digital systems, SEO, CRM, websites, and operational stability for UK SMEs."
    >
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((category) => (
          <span
            key={category}
            className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700"
          >
            {category}
          </span>
        ))}
      </div>

      {featuredPost && (
        <section className="mb-14">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">Featured</span>
            <span className="h-px flex-1 bg-zinc-200" />
          </div>
          <BlogCard post={featuredPost} featured />
        </section>
      )}

      <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {remainingPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </section>

      <div className="mt-16">
        <BlogCTA />
      </div>
    </BlogLayout>
  );
};
