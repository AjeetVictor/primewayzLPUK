import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type BlogLayoutProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
};

const serviceNavLinks = [
  {
    label: 'All services',
    href: '/services',
  },
  {
    label: 'Software subscription',
    href: '/software-product-delivery',
  },
  {
    label: 'Website maintenance',
    href: '/maintenance',
  },
  {
    label: 'CRM integration',
    href: '/crm-automation-support',
  },
  {
    label: 'UK SME examples',
    href: '/success-stories',
  },
];

export const BlogLayout = ({ eyebrow = 'Insights', title, description, children }: BlogLayoutProps) => (
  <main className="min-h-screen bg-zinc-50 pt-32 pb-24">
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
      <header className="mb-14 max-w-4xl">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">{eyebrow}</p>

        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">{title}</h1>

        <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-600">{description}</p>

        <nav
          aria-label="Primewayz UK service navigation from insights"
          className="mt-8 flex flex-wrap gap-2"
        >
          {serviceNavLinks.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {children}
    </div>
  </main>
);
