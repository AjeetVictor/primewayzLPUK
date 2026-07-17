import { ArrowRight, Calendar, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../data/blog/types';
import { getBlogThumbnailImage } from '../../data/blog/imageFallbacks';

type BlogCardProps = {
  post: BlogPost;
  featured?: boolean;
};

const getServiceHint = (post: BlogPost) => {
  const searchableText = `${post.title} ${post.description || ''} ${post.excerpt || ''} ${post.category} ${post.tags.join(
    ' ',
  )}`.toLowerCase();

  if (searchableText.includes('crm') || searchableText.includes('lead') || searchableText.includes('automation')) {
    return 'Related to CRM integration support';
  }

  if (
    searchableText.includes('website') ||
    searchableText.includes('seo') ||
    searchableText.includes('maintenance') ||
    searchableText.includes('search console')
  ) {
    return 'Related to website maintenance support';
  }

  if (
    searchableText.includes('software') ||
    searchableText.includes('delivery') ||
    searchableText.includes('systems') ||
    searchableText.includes('digital')
  ) {
    return 'Related to software delivery support';
  }

  return 'Related to UK SME digital support';
};

export const BlogCard = ({ post, featured = false }: BlogCardProps) => {
  const serviceHint = getServiceHint(post);
  const postHref = `/blog/${post.id}`;
  const cardImage = getBlogThumbnailImage(post.thumbnailImage, post.image);

  return (
    <article
      className={`group h-full overflow-hidden border border-zinc-100 bg-white shadow-sm shadow-zinc-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-900/10 ${
        featured ? 'rounded-[2rem] lg:grid lg:grid-cols-[1.05fr_0.95fr]' : 'flex flex-col rounded-[1.75rem]'
      }`}
    >
      {cardImage && (
        <Link
          to={postHref}
          aria-label={`Read Primewayz UK insight: ${post.title}`}
          className={`relative block overflow-hidden ${featured ? 'min-h-[280px] lg:min-h-full' : 'aspect-[16/10]'}`}
        >
          <img
            src={cardImage}
            alt={post.imageAlt || post.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading={featured ? 'eager' : 'lazy'}
          />

          <div className="absolute left-4 top-4">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 backdrop-blur-md">
              {post.category}
            </span>
          </div>
        </Link>
      )}

      <div className={`flex flex-1 flex-col ${featured ? 'p-8 sm:p-10 lg:p-12' : 'p-7'}`}>
        <div className="mb-4 flex flex-wrap items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {post.date}
          </span>

          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readTime}
          </span>
        </div>

        <h3
          className={`font-bold tracking-tight text-zinc-900 ${
            featured ? 'text-3xl leading-tight sm:text-4xl' : 'line-clamp-2 text-xl'
          }`}
        >
          <Link to={postHref} className="transition-colors group-hover:text-emerald-600 hover:text-emerald-600">
            {post.title}
          </Link>
        </h3>

        <p className={`mt-4 leading-relaxed text-zinc-600 ${featured ? 'text-base' : 'line-clamp-3 text-sm'}`}>
          {post.description || post.excerpt}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.slice(0, featured ? 4 : 2).map((tag) => (
            <span key={tag} className="rounded-full bg-zinc-50 px-3 py-1 text-xs font-semibold text-zinc-500">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            {serviceHint}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
              <User className="h-4 w-4 text-zinc-400" />
            </div>

            <span className="truncate text-sm font-semibold text-zinc-700">{post.author}</span>
          </div>

          <Link
            to={postHref}
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition-colors hover:text-emerald-800"
          >
            Read insight
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
};
