import { Link } from 'react-router-dom';
import type { BreadcrumbItem } from '../../data/blog/types';

type BlogBreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export const BlogBreadcrumbs = ({ items, className = '' }: BlogBreadcrumbsProps) => {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={`text-sm text-zinc-500 ${className}`.trim()}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="inline-flex min-w-0 items-center gap-2">
              {index > 0 ? (
                <span aria-hidden className="text-zinc-300">
                  /
                </span>
              ) : null}

              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="truncate transition-colors hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`truncate ${isLast ? 'font-medium text-zinc-700' : ''}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
