import { Link } from 'react-router-dom';
import { ENTITY_TERMS, type EntityTermKey } from '../../data/contentClusters/entityTerms';
import { cn } from '../../utils/cn';

type EntityTermLinkProps = {
  term: EntityTermKey;
  className?: string;
};

/** Semantic internal link for cluster entity terms (or plain text when route not live). */
export function EntityTermLink({ term, className }: EntityTermLinkProps) {
  const entity = ENTITY_TERMS[term];

  if (!entity.href) {
    return <span className={className}>{entity.label}</span>;
  }

  if (entity.href.startsWith('#')) {
    return (
      <a href={entity.href} className={cn('font-semibold text-emerald-700 hover:text-emerald-800', className)}>
        {entity.label}
      </a>
    );
  }

  return (
    <Link
      to={entity.href}
      className={cn('font-semibold text-emerald-700 hover:text-emerald-800', className)}
    >
      {entity.label}
    </Link>
  );
}
