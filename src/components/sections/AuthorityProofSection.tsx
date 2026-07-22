import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getPublishedSuccessStoryBySlug,
  getSuccessStoryPath,
  type SuccessStory,
} from '../../data/successStories';
import { successStoryIconByKey } from '../../data/successStoryIcons';

export type AuthorityProofVariant = 'service' | 'compact';

export type AuthorityProofSectionProps = {
  eyebrow: string;
  heading: string;
  introduction: string;
  storySlugs: readonly string[];
  variant?: AuthorityProofVariant;
  ctaLabel?: string;
  id?: string;
  className?: string;
};

/** Resolve only published public stories; unknown or unpublished slugs are omitted. */
export function resolveAuthorityProofStories(storySlugs: readonly string[]): SuccessStory[] {
  const stories: SuccessStory[] = [];
  for (const slug of storySlugs) {
    const story = getPublishedSuccessStoryBySlug(slug);
    if (story) stories.push(story);
  }
  return stories;
}

const accentStyles = {
  emerald: {
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    badge: 'border-emerald-100 bg-emerald-50 text-emerald-800',
  },
  indigo: {
    iconBg: 'bg-indigo-100',
    iconText: 'text-indigo-600',
    badge: 'border-indigo-100 bg-indigo-50 text-indigo-800',
  },
  amber: {
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    badge: 'border-amber-100 bg-amber-50 text-amber-800',
  },
} as const;

export function AuthorityProofSection({
  eyebrow,
  heading,
  introduction,
  storySlugs,
  variant = 'service',
  ctaLabel = 'Read the delivery story',
  id,
  className = '',
}: AuthorityProofSectionProps) {
  const stories = resolveAuthorityProofStories(storySlugs);
  if (stories.length === 0) return null;

  const gridClass =
    stories.length === 1
      ? 'md:grid-cols-1 max-w-3xl'
      : stories.length === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-3';

  const sectionPadding = variant === 'compact' ? 'py-16' : 'py-20';

  return (
    <section
      id={id}
      className={`bg-slate-50 px-4 sm:px-6 lg:px-8 ${sectionPadding} ${className}`.trim()}
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{heading}</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">{introduction}</p>
        </div>

        <div className={`mt-10 grid gap-5 ${gridClass}`}>
          {stories.map((story) => {
            const Icon = successStoryIconByKey[story.iconKey];
            const styles = accentStyles[story.accentColor];
            const href = getSuccessStoryPath(story.slug);

            return (
              <article
                key={story.slug}
                className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${styles.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${styles.iconText}`} aria-hidden />
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${styles.badge}`}
                  >
                    {story.relationshipType}
                  </span>
                </div>

                <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  {story.industry}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-400">{story.category}</p>

                <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-950">{story.shortTitle}</h3>
                <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">{story.summary}</p>

                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Delivery highlight
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">
                    {story.keyOutcome}
                  </p>
                </div>

                <Link
                  to={href}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-900"
                >
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
