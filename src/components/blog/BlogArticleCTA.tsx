import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DigitalSystemsReviewCtaGroup } from '../conversion/DigitalSystemsReviewCtaGroup';
import { getArticleServiceContext } from '../../data/blog/articleServiceContext';
import { resolveBlogArticleReviewServiceArea } from '../../lib/digitalSystemsReview/articleServiceContext';
import type { BlogPost } from '../../data/blog/types';

type BlogArticleCTAProps = {
  post: BlogPost;
};

export const BlogArticleCTA = ({ post }: BlogArticleCTAProps) => {
  const serviceArea = resolveBlogArticleReviewServiceArea(post);
  const context = getArticleServiceContext(post);

  return (
    <section className="mt-16 border-t border-zinc-200 pt-10">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">
        A practical next step
      </p>
      <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-tight text-zinc-900">
        Review where your digital systems need attention next
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
        Share the website, application, workflow or delivery challenge creating friction. We will review
        the context and identify the most useful starting point.
      </p>

      <div className="mt-8">
        <DigitalSystemsReviewCtaGroup
          sourceLocation="article"
          serviceArea={serviceArea}
          primaryPlacement="blog_article_primary"
          secondaryPlacement="blog_article_secondary"
          variant="closing"
        />
      </div>

      <Link
        to={context.primaryHref}
        className="mt-5 inline-flex min-h-[44px] w-fit items-center gap-1.5 text-sm font-medium text-slate-600 underline-offset-2 transition hover:text-brand-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
      >
        Explore the related service: {context.primaryLabel}
        <ArrowRight className="h-3.5 w-3.5 text-brand-cyan" strokeWidth={2.1} aria-hidden />
      </Link>
    </section>
  );
};
