import { Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../data/blog/types';
import { getBlogThumbnailImage } from '../../data/blog/imageFallbacks';

type BlogCardProps = {
  post: BlogPost;
  variant?: 'related';
};

export const BlogCard = ({ post, variant = 'related' }: BlogCardProps) => {
  const postHref = `/blog/${post.id}`;

  return (
    <article className="group flex h-full flex-col">
      <Link to={postHref} className="block overflow-hidden" aria-label={`Read insight: ${post.title}`}>
        <div className="aspect-[16/10] overflow-hidden bg-zinc-100">
          <img
            src={getBlogThumbnailImage(post.thumbnailImage)}
            alt={post.imageAlt || post.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col pt-4">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
          {post.category}
        </span>
        <h3 className="mt-2 line-clamp-3 text-lg font-bold leading-snug tracking-tight text-zinc-900">
          <Link to={postHref} className="transition-colors hover:text-emerald-700">
            {post.title}
          </Link>
        </h3>
        {variant === 'related' ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">
            {post.excerpt || post.description}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            {post.date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {post.readTime}
          </span>
        </div>
      </div>
    </article>
  );
};
