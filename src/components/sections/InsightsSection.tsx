import { motion } from 'motion/react';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { ArrowRight, BarChart2, Layers, Target, User, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLatestBlogPosts } from '../../data/blog/utils';
import type { BlogPost } from '../../data/blog/types';
import { buildInternalUtmUrl } from '../../lib/utm';
import { FIXED_PRICE_ARTICLE_CAMPAIGN } from '../../data/blog/blogArticleLinks';

const TEAL = '#087E8B';
const BORDER = '#D7E7EC';
const CHIP_BG = '#E6F7F9';
const SECTION_BG = '#F8F9FC';
const BODY = '#334155';

const categoryIcons: Record<string, LucideIcon> = {
  'Delivery Model': Layers,
  'Digital Adoption': BarChart2,
  'AI Operations': Target,
  'Maintenance': BarChart2,
  'CRM': User,
  'UK SMEs': Layers,
  'Digital Operations': Target,
  SEO: Target,
};

function getInsightHref(post: BlogPost, index: number) {
  return buildInternalUtmUrl(
    `/blog/${post.id}`,
    'homepage_insights',
    post.slug === 'fixed-price-vs-time-material-vs-subscription-support-uk-smes-saas-founders'
      ? FIXED_PRICE_ARTICLE_CAMPAIGN
      : 'latest_blog_posts',
    `insight_card_${index + 1}`,
  );
}

function InsightCardItem({
  post,
  href,
}: {
  post: BlogPost;
  href: string;
}) {
  const CategoryIcon = categoryIcons[post.category] || BarChart2;

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-[22px] border bg-white"
      style={{ borderColor: BORDER }}
    >
      <Link to={href} className="block aspect-[16/10] overflow-hidden bg-slate-100" aria-label={`Read article: ${post.title}`}>
        <img
          src={post.image || '/images/visibility.webp'}
          alt={post.title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
        />
      </Link>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <span
          className="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ backgroundColor: CHIP_BG, color: TEAL }}
        >
          <CategoryIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {post.category}
        </span>

        <h3 className="text-xl font-bold leading-snug text-brand-navy sm:text-[1.35rem]">
          <Link to={href} className="transition-colors hover:text-[#087E8B]">
            {post.title}
          </Link>
        </h3>

        <p className="mt-3 flex-1 text-sm leading-7 sm:text-base" style={{ color: BODY }}>
          {post.excerpt || post.description}
        </p>

        <Link
          to={href}
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-navy transition hover:gap-3"
        >
          Read article
          <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export const InsightsSection = () => {
  const reveal = useRevealMotion();
  const latestPosts = getLatestBlogPosts(3);

  return (
    <section
      id="insights"
      className="py-20 md:py-24"
      style={{ backgroundColor: SECTION_BG }}
      aria-labelledby="insights-heading"
    >
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            initial={reveal.initial({ opacity: 0, y: 20 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
                Insights
              </p>
              <span className="h-0.5 w-10 rounded-full" style={{ backgroundColor: TEAL }} aria-hidden />
            </div>

            <h2
              id="insights-heading"
              className="mt-6 text-[2rem] font-bold leading-[1.12] tracking-[-0.04em] text-brand-navy sm:text-4xl md:text-5xl lg:text-[3.25rem]"
            >
              Latest visibility notes from
              <br className="hidden sm:block" />
              <span className="sm:sr-only"> </span>
              UK business website reviews
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
              Practical observations on website clarity, SEO readiness, trust signals, delivery models,
              and enquiry flow.
            </p>
          </motion.div>

          <motion.div
            initial={reveal.initial({ opacity: 0, x: 12 })}
            whileInView={reveal.whileInView({ opacity: 1, x: 0 })}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <Link
              to={buildInternalUtmUrl('/blog', 'homepage_insights', 'latest_blog_posts', 'view_all_insights')}
              className="inline-flex items-center gap-2 text-base font-bold text-brand-navy transition hover:gap-3"
            >
              View all insights
              <ArrowRight className="h-5 w-5" strokeWidth={1.8} aria-hidden />
            </Link>
          </motion.div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {latestPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={reveal.initial({ opacity: 0, y: 20 })}
              whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="group"
            >
              <InsightCardItem post={post} href={getInsightHref(post, index)} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
