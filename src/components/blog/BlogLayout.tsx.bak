import type { ReactNode } from 'react';

type BlogLayoutProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
};

export const BlogLayout = ({ eyebrow = 'Insights', title, description, children }: BlogLayoutProps) => (
  <main className="min-h-screen bg-zinc-50 pt-32 pb-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="mb-14 max-w-3xl">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">{eyebrow}</p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mt-6 text-lg leading-8 text-zinc-600">{description}</p>
      </header>
      {children}
    </div>
  </main>
);

