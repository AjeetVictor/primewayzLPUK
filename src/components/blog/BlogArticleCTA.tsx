import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TrackedLink } from '../common/TrackedLink';
import { getArticleServiceContext } from '../../data/blog/articleServiceContext';
import type { BlogPost } from '../../data/blog/types';

type BlogArticleCTAProps = {
  post: BlogPost;
};

export const BlogArticleCTA = ({ post }: BlogArticleCTAProps) => {
  const context = getArticleServiceContext(post);

  return (
    <section className="mt-16 border-t border-zinc-200 pt-10">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">{context.eyebrow}</p>
      <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-zinc-900">{context.heading}</h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">{context.description}</p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          to={context.primaryHref}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#000A2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          {context.primaryLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>

        <TrackedLink
          href={context.secondaryHref}
          ctaText={context.secondaryLabel}
          ctaLocation="blog_article_cta"
          eventType="book_call_click"
          className="text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
        >
          {context.secondaryLabel}
        </TrackedLink>
      </div>
    </section>
  );
};
