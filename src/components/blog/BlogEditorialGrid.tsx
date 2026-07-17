import { Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../data/blog/types';
import { getArticleCategoryDisplayName } from '../../data/blog/categories';
import { getBlogThumbnailImage } from '../../data/blog/imageFallbacks';

type BlogEditorialGridProps = {
  featuredPost: BlogPost;
  secondaryPosts: BlogPost[];
  latestPosts: BlogPost[];
};

const CategoryLabel = ({ children }: { children: string }) => (
  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">{children}</span>
);

const MetaRow = ({ post }: { post: BlogPost }) => (
  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-400">
    <span className="inline-flex items-center gap-1.5">
      <Calendar className="h-3.5 w-3.5" aria-hidden />
      {post.date}
    </span>
    <span className="inline-flex items-center gap-1.5">
      <Clock className="h-3.5 w-3.5" aria-hidden />
      {post.readTime}
    </span>
  </div>
);

const SecondaryStoryCard = ({ post }: { post: BlogPost }) => {
  const postHref = `/blog/${post.id}`;

  return (
    <article className="group border-b border-zinc-200 pb-8 last:border-b-0 last:pb-0">
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

      <div className="mt-4">
        <CategoryLabel>{getArticleCategoryDisplayName(post)}</CategoryLabel>
        <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight text-zinc-900">
          <Link to={postHref} className="transition-colors hover:text-emerald-700">
            {post.title}
          </Link>
        </h3>
        <MetaRow post={post} />
      </div>
    </article>
  );
};

const FeaturedStoryCard = ({ post }: { post: BlogPost }) => {
  const postHref = `/blog/${post.id}`;

  return (
    <article className="group">
      <Link to={postHref} className="block" aria-label={`Read featured insight: ${post.title}`}>
        <div className="aspect-[16/9] overflow-hidden bg-zinc-100">
          <img
            src={getBlogThumbnailImage(post.thumbnailImage)}
            alt={post.imageAlt || post.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            loading="eager"
            decoding="async"
          />
        </div>
      </Link>

      <div className="mt-6">
        <CategoryLabel>{getArticleCategoryDisplayName(post)}</CategoryLabel>
        <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-3xl lg:text-[2rem]">
          <Link to={postHref} className="transition-colors hover:text-emerald-700">
            {post.title}
          </Link>
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
          {post.description || post.excerpt}
        </p>
        <MetaRow post={post} />
      </div>
    </article>
  );
};

const LatestListItem = ({ post }: { post: BlogPost }) => {
  const postHref = `/blog/${post.id}`;

  return (
    <article className="flex gap-4 border-b border-zinc-200 py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold leading-snug text-zinc-900">
          <Link to={postHref} className="transition-colors hover:text-emerald-700">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 text-xs font-semibold text-zinc-400">{post.date}</p>
      </div>

      <Link
        to={postHref}
        aria-hidden
        tabIndex={-1}
        className="h-16 w-16 shrink-0 overflow-hidden bg-zinc-100"
      >
        <img
          src={getBlogThumbnailImage(post.thumbnailImage)}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </Link>
    </article>
  );
};

export const BlogEditorialGrid = ({
  featuredPost,
  secondaryPosts,
  latestPosts,
}: BlogEditorialGridProps) => (
  <section className="mb-16 lg:mb-20" aria-label="Featured insights">
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
      <div className="order-2 grid gap-8 sm:grid-cols-2 lg:order-1 lg:col-span-3 lg:grid-cols-1">
        {secondaryPosts.map((post) => (
          <SecondaryStoryCard key={post.id} post={post} />
        ))}
      </div>

      <div className="order-1 lg:order-2 lg:col-span-6">
        <FeaturedStoryCard post={featuredPost} />
      </div>

      <aside className="order-3 lg:col-span-3">
        <div className="border-t border-zinc-900 pt-4 lg:border-t-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-900">Latest insights</h2>
          <div className="mt-4">
            {latestPosts.map((post) => (
              <LatestListItem key={post.id} post={post} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  </section>
);
