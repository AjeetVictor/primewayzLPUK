import type { ReactNode } from 'react';

type BlogLayoutProps = {
  eyebrow?: string;
  title: string;
  description: string;
  introActions?: ReactNode;
  children: ReactNode;
};

export const BlogLayout = ({
  eyebrow = 'Insights',
  title,
  description,
  introActions,
  children,
}: BlogLayoutProps) => (
  <main className="min-h-screen bg-white pt-32 pb-24">
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
      <header className="mb-12 max-w-3xl border-b border-zinc-200 pb-10">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">{eyebrow}</p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">{title}</h1>

        <p className="mt-5 text-lg leading-8 text-zinc-600">{description}</p>

        {introActions ? <div className="mt-6">{introActions}</div> : null}
      </header>

      {children}
    </div>
  </main>
);
