import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BlogPost } from '../../data/blog/types';
import { getBlogThumbnailImage } from '../../data/blog/imageFallbacks';
import type { EditorialSection } from '../../data/blog/editorialSections';

type BlogCategorySectionsProps = {
  sections: Array<{
    section: EditorialSection;
    posts: BlogPost[];
  }>;
};

const SectionCard = ({ post }: { post: BlogPost }) => {
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
        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-6 text-zinc-600">
          {post.excerpt || post.description}
        </p>
        <p className="mt-4 text-xs font-semibold text-zinc-400">{post.date}</p>
      </div>
    </article>
  );
};

export const BlogCategorySections = ({ sections }: BlogCategorySectionsProps) => (
  <div className="space-y-16 lg:space-y-20">
    {sections.map(({ section, posts }) => {
      if (!posts.length) {
        return null;
      }

      return (
        <section key={section.id} id={`section-${section.id}`} aria-labelledby={`heading-${section.id}`}>
          <div className="mb-8 flex items-end justify-between gap-4 border-b border-zinc-200 pb-4">
            <h2
              id={`heading-${section.id}`}
              className="text-xl font-bold uppercase tracking-[0.14em] text-zinc-900 sm:text-2xl"
            >
              {section.title}
            </h2>
            <Link
              to={`/blog#section-${section.id}`}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
            >
              View all
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
            {posts.map((post) => (
              <SectionCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      );
    })}
  </div>
);
