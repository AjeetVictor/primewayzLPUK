import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BlogCard } from './blog/BlogCard';
import { getAllBlogPosts } from '../data/blog/utils';
import type { BlogPost } from '../data/blog/types';
import { apiUrl } from '../utils/apiUrl';

export const BlogSection = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [visibleCount, setVisibleCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch(apiUrl('/api/blog/posts'));
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        setPosts(getAllBlogPosts());
      }
    } catch (error) {
      setPosts(getAllBlogPosts());
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    setVisibleCount(prev => prev + 3);
  };

  return (
    <section id="blog" className="py-24 bg-zinc-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6"
            >
              UK digital support <br />
              <span className="text-emerald-600 italic">insights for SMEs</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-zinc-600"
            >
              Practical guidance for UK small businesses on website upkeep, SEO foundations, CRM workflows, automation, and monthly digital delivery.
            </motion.p>
          </div>
          <motion.a
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
            href="/blog"
            className="flex items-center gap-2 text-zinc-900 font-bold hover:text-emerald-600 transition-colors group"
          >
            Read UK insights
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden animate-pulse h-[400px]">
                <div className="aspect-[16/10] bg-zinc-100" />
                <div className="p-8 space-y-4">
                  <div className="h-4 bg-zinc-100 rounded w-1/2" />
                  <div className="h-8 bg-zinc-100 rounded w-full" />
                  <div className="h-20 bg-zinc-100 rounded w-full" />
                </div>
              </div>
            ))
          ) : (
            posts.slice(0, visibleCount).map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 3) * 0.1 }}
              >
                <BlogCard post={post} />
              </motion.div>
            ))
          )}
        </div>

        {posts.length > visibleCount && (
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadMore}
              className="px-8 py-4 bg-zinc-900 text-white rounded-full font-bold hover:bg-emerald-600 transition-colors shadow-xl shadow-zinc-900/10"
            >
              Load more UK insights
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
};
