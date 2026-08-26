import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { BlogCategory } from '../../data/blog/types';

type BlogCategoryDirectoryProps = {
  categories: BlogCategory[];
  articleCounts: Record<string, number>;
};

export const BlogCategoryDirectory = ({
  categories,
  articleCounts,
}: BlogCategoryDirectoryProps) => {
  if (!categories.length) return null;

  return (
    <section
      className="mb-16 border-b border-zinc-200 pb-16 lg:mb-20 lg:pb-20"
      aria-labelledby="browse-insights-heading"
    >
      <div className="mb-8 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#0A66C2]">
          Browse insights
        </p>

        <h2
          id="browse-insights-heading"
          className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl"
        >
          Explore practical guidance by business need
        </h2>

        <p className="mt-4 text-base leading-7 text-zinc-600">
          Choose the area closest to the operational, technology, visibility, or delivery
          challenge you are working through.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const articleCount = articleCounts[category.slug] ?? 0;

          return (
            <Link
              key={category.slug}
              to={category.canonicalPath}
              className="group flex min-h-[190px] cursor-pointer flex-col justify-between rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-[#0A66C2] hover:shadow-lg active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A66C2] focus-visible:ring-offset-2"
              aria-label={`Browse ${category.name} insights`}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0A66C2]">
                  {articleCount} {articleCount === 1 ? 'insight' : 'insights'}
                </p>

                <h3 className="mt-3 text-xl font-bold leading-snug text-zinc-900 transition-colors duration-150 group-hover:text-[#0A66C2]">
                  {category.name}
                </h3>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
                  {category.description}
                </p>
              </div>

              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-zinc-900 transition-all duration-150 group-hover:gap-3 group-hover:text-[#0A66C2]">
                Explore insights
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
