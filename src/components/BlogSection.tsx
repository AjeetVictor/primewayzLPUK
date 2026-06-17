import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAllBlogPosts } from '../data/blog/utils';
import type { BlogPost } from '../data/blog/types';
import { FeaturedInsightCta } from './FeaturedInsightCta';
import { featuredLinkedInInsight } from '../data/insights';

const insightKeywords = ['seo', 'crm', 'upkeep', 'automation', 'maintenance', 'website support'];

const getPostTime = (post: BlogPost) => {
  const timestamp = Date.parse(post.updatedDate || post.date);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const matchesInsightTopic = (post: BlogPost) => {
  const searchable = [post.category, post.title, post.description, ...post.tags].join(' ').toLowerCase();
  return insightKeywords.some((keyword) => searchable.includes(keyword));
};

const insightPosts = getAllBlogPosts()
  .filter(matchesInsightTopic)
  .sort((a, b) => getPostTime(b) - getPostTime(a))
  .slice(0, 3);

export const BlogSection = () => {
  return (
    <section id="blog" className="py-24 bg-zinc-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {insightPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="group flex h-full flex-col bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <span className="mb-4 inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                {post.category}
              </span>

              <h3 className="text-xl font-bold leading-tight tracking-tight text-zinc-900">
                <Link to={`/blog/${post.id}`} className="transition-colors hover:text-emerald-600">
                  {post.title}
                </Link>
              </h3>

              <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-600">
                {post.description || post.excerpt}
              </p>

              <Link
                to={`/blog/${post.id}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-zinc-900 transition-colors hover:text-emerald-600"
                aria-label={`Read article: ${post.title}`}
              >
                Read Article
              </Link>
            </motion.article>
          ))}
        </div>

        <FeaturedInsightCta insight={featuredLinkedInInsight} />
      </div>
    </section>
  );
};
