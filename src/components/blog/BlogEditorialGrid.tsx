import { Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../data/blog/types';
import { getArticleCategoryDisplayName } from '../../data/blog/categories';
import { getBlogThumbnailImage } from '../../data/blog/imageFallbacks';

type BlogEditorialGridProps = {
  featuredPost: BlogPost;
  secondaryPosts: BlogPost[];
};


const CategoryLabel = ({ children }: { children: string }) => (
  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
    {children}
  </span>
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
      <Link to={postHref} className="block cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2 active:scale-[0.995]" aria-label={`Read insight: ${post.title}`}>
        <div className="aspect-video overflow-hidden bg-zinc-50">
          <img
            src={getBlogThumbnailImage(post.thumbnailImage, post.image)}
            alt={post.imageAlt || post.title}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.015]"
            loading="lazy"
            decoding="async"
          />
        </div>
      </Link>

      <div className="mt-4">
        <CategoryLabel>{getArticleCategoryDisplayName(post)}</CategoryLabel>

        <h3 className="mt-2 text-lg font-bold leading-snug tracking-tight text-zinc-900">
          <Link to={postHref} className="cursor-pointer rounded-sm transition-colors duration-150 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2 active:text-emerald-800">
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
      <Link to={postHref} className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2 active:scale-[0.995]" aria-label={`Read featured insight: ${post.title}`}>
        <div className="aspect-video overflow-hidden bg-zinc-100">
          <img
            src={getBlogThumbnailImage(post.thumbnailImage, post.image)}
            alt={post.imageAlt || post.title}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.015]"
            loading="eager"
            decoding="async"
          />
        </div>
      </Link>

      <div className="mt-6">
        <CategoryLabel>{getArticleCategoryDisplayName(post)}</CategoryLabel>

        <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-3xl lg:text-[2rem]">
          <Link to={postHref} className="cursor-pointer rounded-sm transition-colors duration-150 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2 active:text-emerald-800">
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


export const BlogEditorialGrid = ({
  featuredPost,
  secondaryPosts,
}: BlogEditorialGridProps) => (
  <section
    className="mb-16 border-b border-zinc-200 pb-16 lg:mb-20 lg:pb-20"
    aria-label="Featured insights"
  >
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)] lg:items-start">
      <FeaturedStoryCard post={featuredPost} />

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
        {secondaryPosts.map((post) => (
          <SecondaryStoryCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  </section>
);