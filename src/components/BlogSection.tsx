import { motion } from 'motion/react';
import { ArrowRight, Calendar, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { blogPosts } from '../data/blogPosts';
import { extraBlogPosts } from '../data/extraBlogPosts';
import { apiUrl } from '../utils/apiUrl';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  author: string;
  category: string;
  image: string;
}

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
        setPosts([...blogPosts, ...extraBlogPosts]);
      }
    } catch (error) {
      setPosts([...blogPosts, ...extraBlogPosts]);
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
              Insights from the <br />
              <span className="text-emerald-600 italic">cutting edge</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-zinc-600"
            >
              Stay ahead of the curve with our latest thoughts on technology, 
              engineering culture, and the future of software development.
            </motion.p>
          </div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.scrollTo({ top: document.getElementById('blog')?.offsetTop, behavior: 'smooth' })}
            className="flex items-center gap-2 text-zinc-900 font-bold hover:text-emerald-600 transition-colors group"
          >
            Read all articles
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </motion.button>
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
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 3) * 0.1 }}
                className="group bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 flex flex-col h-full"
              >
                <Link to={`/blog/${post.id}`} className="block h-full flex flex-col">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img 
                      src={post.image} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-zinc-900">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </span>
                      <span className="w-1 h-1 bg-zinc-200 rounded-full" />
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-zinc-900 mb-4 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-zinc-500 text-sm leading-relaxed mb-8 line-clamp-3">
                      {post.excerpt}
                    </p>
                    
                    <div className="mt-auto pt-6 border-t border-zinc-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-zinc-400" />
                        </div>
                        <span className="text-sm font-semibold text-zinc-700">{post.author}</span>
                      </div>
                      <motion.div
                        whileHover={{ x: 3 }}
                        className="text-emerald-600"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </div>
                </Link>
              </motion.article>
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
              Load more insights
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
};
