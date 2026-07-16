import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import type { CommercialSectionKey } from '../../data/contentClusters/metricsFramework';
import { useCommercialSectionView } from '../../hooks/useCommercialSectionView';
import { CommercialJourneyDivider } from './CommercialJourneyDivider';

export type CommercialSectionBackground = 'white' | 'muted' | 'navy';

type CommercialSectionShellProps = {
  id?: string;
  journeyStep?: number;
  journeyLabel?: string;
  transition?: string;
  eyebrow?: string;
  title: string;
  lead?: ReactNode;
  background?: CommercialSectionBackground;
  sectionKey?: CommercialSectionKey;
  breathing?: boolean;
  narrow?: boolean;
  className?: string;
  children: ReactNode;
};

const backgroundClass: Record<CommercialSectionBackground, string> = {
  white: 'bg-white text-slate-950',
  muted: 'bg-slate-50 text-slate-950',
  navy: 'bg-[#000A2D] text-white',
};

export function CommercialSectionShell({
  id,
  journeyStep,
  journeyLabel,
  transition,
  eyebrow,
  title,
  lead,
  background = 'white',
  sectionKey,
  breathing = false,
  narrow = false,
  className,
  children,
}: CommercialSectionShellProps) {
  const viewRef = useCommercialSectionView(sectionKey);
  const isNavy = background === 'navy';

  return (
    <section
      id={id}
      ref={viewRef}
      className={cn(
        'scroll-mt-24 px-4 sm:px-6 lg:px-8',
        breathing ? 'py-24 sm:py-28' : 'py-20 sm:py-24',
        backgroundClass[background],
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto w-full',
          narrow ? 'max-w-[900px]' : 'max-w-[1200px]',
        )}
      >
        {journeyStep && journeyLabel ? (
          <CommercialJourneyDivider step={journeyStep} label={journeyLabel} />
        ) : null}

        {transition ? (
          <p
            className={cn(
              'mb-8 max-w-3xl text-base leading-7',
              isNavy ? 'text-slate-300' : 'text-slate-600',
            )}
          >
            {transition}
          </p>
        ) : null}

        {eyebrow ? (
          <p
            className={cn(
              'text-sm font-semibold uppercase tracking-[0.22em]',
              isNavy ? 'text-emerald-300' : 'text-emerald-600',
            )}
          >
            {eyebrow}
          </p>
        ) : null}

        <h2
          className={cn(
            'text-3xl font-bold tracking-tight sm:text-4xl',
            eyebrow ? 'mt-3' : undefined,
            isNavy ? 'text-white' : 'text-slate-950',
          )}
        >
          {title}
        </h2>

        {lead ? (
          <div
            className={cn(
              'mt-4 max-w-3xl text-lg leading-8',
              isNavy ? 'text-slate-200' : 'text-slate-600',
            )}
          >
            {lead}
          </div>
        ) : null}

        <div className={cn(lead || eyebrow || transition || journeyStep ? 'mt-10' : undefined)}>
          {children}
        </div>
      </div>
    </section>
  );
}
