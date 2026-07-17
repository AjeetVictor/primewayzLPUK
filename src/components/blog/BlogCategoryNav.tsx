import { Link } from 'react-router-dom';
import type { BlogCategory } from '../../data/blog/types';

type BlogCategoryNavProps = {
  categories: BlogCategory[];
  activeSlug?: string;
  articleCounts?: Record<string, number>;
  showCounts?: boolean;
  className?: string;
};

export const BlogCategoryNav = ({
  categories,
  activeSlug,
  articleCounts,
  showCounts = false,
  className = '',
}: BlogCategoryNavProps) => {
  if (!categories.length) return null;

  return (
    <nav
      aria-label="Blog categories"
      className={`-mx-1 overflow-x-auto pb-1 ${className}`.trim()}
    >
      <ul className="flex min-w-full gap-2 px-1">
        {categories.map((category) => {
          const isActive = activeSlug === category.slug;
          const count = articleCounts?.[category.slug];
          const label =
            showCounts && typeof count === 'number'
              ? `${category.shortName || category.name} (${count})`
              : category.shortName || category.name;

          return (
            <li key={category.slug} className="shrink-0">
              <Link
                to={category.canonicalPath}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-[40px] items-center rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  isActive
                    ? 'border-[#000A2D] bg-[#000A2D] text-white'
                    : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-200 hover:bg-white hover:text-emerald-700'
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
