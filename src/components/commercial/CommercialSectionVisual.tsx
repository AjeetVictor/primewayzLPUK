import type { ReactNode } from 'react';
import { OptimizedPicture } from '../ui/OptimizedPicture';
import type { CommercialImageAsset } from '../../types/commercialVisual';
import { COMMERCIAL_RESPONSIVE_SIZES } from '../../types/commercialVisual';
import { cn } from '../../utils/cn';

export type CommercialVisualAlignment = 'default' | 'wide' | 'narrow';

export type CommercialSectionVisualProps = {
  image: CommercialImageAsset;
  caption: string;
  title?: string;
  description?: string;
  headingLevel?: 'h2' | 'h3';
  priority?: boolean;
  variant?: 'light' | 'dark';
  background?: 'transparent' | 'card';
  alignment?: CommercialVisualAlignment;
  className?: string;
};

const alignmentClass: Record<CommercialVisualAlignment, string> = {
  default: 'max-w-4xl',
  wide: 'max-w-5xl',
  narrow: 'max-w-3xl',
};

export function CommercialSectionVisual({
  image,
  caption,
  title,
  description,
  headingLevel = 'h3',
  priority = false,
  variant = 'light',
  background = 'card',
  alignment = 'default',
  className,
}: CommercialSectionVisualProps) {
  const HeadingTag = headingLevel;

  return (
    <div className={cn('space-y-4', alignmentClass[alignment], className)}>
      {title ? (
        <div className="max-w-3xl">
          <HeadingTag
            className={cn(
              'text-xl font-bold tracking-tight sm:text-2xl',
              variant === 'dark' ? 'text-white' : 'text-slate-950',
            )}
          >
            {title}
          </HeadingTag>
          {description ? (
            <p
              className={cn(
                'mt-2 text-sm leading-7 sm:text-base',
                variant === 'dark' ? 'text-slate-200' : 'text-slate-600',
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      <figure
        className={cn(
          'overflow-hidden rounded-3xl',
          background === 'card' && 'border shadow-sm',
          variant === 'dark'
            ? 'border-white/15 bg-white/5 shadow-black/20'
            : 'border-slate-200 bg-white',
        )}
      >
        <OptimizedPicture
          basePath={image.basePath}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          sizes={COMMERCIAL_RESPONSIVE_SIZES}
          imgClassName="h-auto w-full object-cover object-center"
        />
        <figcaption
          className={cn(
            'border-t px-4 py-3 text-sm font-medium leading-6',
            variant === 'dark'
              ? 'border-white/10 bg-white/5 text-slate-200'
              : 'border-slate-200 bg-slate-50 text-slate-700',
          )}
        >
          {caption}
        </figcaption>
      </figure>
    </div>
  );
}

/** Hero visual integrated into the value proposition */
export function CommercialHeroVisual({
  image,
  caption,
  supportText,
}: {
  image: CommercialImageAsset;
  caption: string;
  supportText: string;
}) {
  return (
    <div className="space-y-4" aria-labelledby="sdaas-hero-visual-caption">
      <figure className="overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-3 shadow-2xl shadow-black/25 backdrop-blur sm:p-4">
        <OptimizedPicture
          basePath={image.basePath}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="eager"
          fetchPriority="high"
          sizes={COMMERCIAL_RESPONSIVE_SIZES}
          imgClassName="h-auto w-full rounded-2xl object-cover object-center"
        />
        <figcaption
          id="sdaas-hero-visual-caption"
          className="mt-4 px-1 text-center text-sm font-semibold leading-6 text-emerald-200"
        >
          {caption}
        </figcaption>
      </figure>
      <p className="text-center text-sm font-medium leading-6 text-slate-300 sm:text-base">
        {supportText}
      </p>
    </div>
  );
}

/** Breathing-space wrapper after dense card grids */
export function CommercialVisualBreather({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mt-14 sm:mt-16', className)}>{children}</div>;
}
