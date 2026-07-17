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
    href: '/maintenance',
  },
  {
    label: 'CRM integration support',
    href: '/crm-automation-support',
  },
];

export const BlogServiceBridge = () => (
  <section className="mt-16 border-t border-zinc-200 pt-16 lg:mt-20 lg:pt-20">
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">Connect insights to action</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
        Turn editorial insight into practical UK SME support
      </h2>
      <p className="mt-4 text-base leading-7 text-zinc-600">
        When an article highlights a delivery, website, CRM, or automation gap, these are the
        Primewayz UK paths most teams review next.
      </p>
    </div>

    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {serviceLinks.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className="group border border-zinc-200 bg-white px-5 py-4 transition hover:border-emerald-200"
        >
          <span className="text-sm font-bold text-zinc-900 transition group-hover:text-emerald-700">
            {item.label}
          </span>
        </Link>
      ))}
    </div>

    <div className="mt-8">
      <TrackedLink
        href="/contact-us#book-call"
        ctaText="Book a UK discovery call"
        ctaLocation="blog_service_bridge"
        eventType="book_call_click"
        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#000A2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
      >
        Book a UK discovery call
        <ArrowRight className="h-4 w-4" aria-hidden />
      </TrackedLink>
    </div>
  </section>
);
