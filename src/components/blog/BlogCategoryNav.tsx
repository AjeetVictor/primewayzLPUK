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
      className={className.trim()}
    >
      <ul className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isActive = activeSlug === category.slug;
          const count = articleCounts?.[category.slug];
          const label =
            showCounts && typeof count === 'number'
              ? `${category.shortName || category.name} (${count})`
              : category.shortName || category.name;

          return (
            <li key={category.slug}>
              <Link
                to={category.canonicalPath}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex min-h-[36px] items-center rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                  isActive
                    ? 'border-[#000A2D] bg-[#000A2D] text-white'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 hover:text-emerald-700'
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
