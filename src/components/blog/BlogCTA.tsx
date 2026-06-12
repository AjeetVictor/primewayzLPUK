import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TrackedLink } from '../common/TrackedLink';

const serviceLinks = [
  {
    label: 'Software development subscription',
    href: '/software-development-subscription-uk',
  },
  {
    label: 'Website maintenance subscription',
    href: '/website-maintenance-subscription-uk',
  },
  {
    label: 'CRM integration support',
    href: '/crm-integration-support-uk',
  },
  {
    label: 'All UK SME support services',
    href: '/services',
  },
];

export const BlogCTA = () => (
  <section className="rounded-[2rem] bg-[#000A2D] px-6 py-10 text-white sm:px-10 lg:px-12">
    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">UK discovery call</p>

        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Not sure where your digital systems are leaking time or revenue?
        </h2>

        <p className="mt-4 text-sm leading-7 text-slate-200">
          Use the article as a starting point, then connect it to the right Primewayz UK support path:
          website maintenance, CRM integration, software delivery, or a wider monthly improvement plan.
        </p>
      </div>

      <TrackedLink
        href="/#contact"
        ctaText="Book a UK discovery call"
        ctaLocation="blog_cta"
        eventType="book_call_click"
        className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#000A2D] transition-colors hover:bg-emerald-50"
      >
        Book a UK discovery call
        <ArrowRight className="h-4 w-4" />
      </TrackedLink>
    </div>

    <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
      {serviceLinks.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className="group inline-flex min-h-[44px] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white/90 transition hover:border-emerald-300/40 hover:bg-white/15 hover:text-white"
        >
          <span>{item.label}</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-emerald-300 transition group-hover:translate-x-1" />
        </Link>
      ))}
    </div>
  </section>
);
