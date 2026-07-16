import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BlogCard } from './BlogCard';
import { BlogCTA } from './BlogCTA';
import { BlogLayout } from './BlogLayout';
import { getAllBlogPosts, getFeaturedBlogPost, getPostTimestamp } from '../../data/blog/utils';
import type { BlogPost } from '../../data/blog/types';
import { apiUrl } from '../../utils/apiUrl';

type BlogListPageProps = {
  initialPosts?: BlogPost[];
};

const supportPathLinks = [
  {
    title: 'Software Development Subscription',
    href: '/software-development-subscription-uk',
    description:
      'Monthly software delivery for UK SMEs that need steady progress across websites, CRM workflows, automation, dashboards, integrations, and technical improvements.',
    anchor: 'Software development subscription for UK SMEs',
  },
  {
    title: 'Website Maintenance Subscription',
    href: '/maintenance',
    description:
      'Monthly website support for content updates, bug fixes, landing page improvements, technical SEO checks, analytics, forms, and conversion journeys.',
    anchor: 'Website maintenance subscription for UK SMEs',
  },
  {
    title: 'CRM Integration & Support',
    href: '/crm-automation-support',
    description:
      'CRM integration support for cleaner lead capture, website form connections, enquiry routing, workflow automation, reporting, and follow-up visibility.',
    anchor: 'CRM integration support for UK SMEs',
  },
];

export const BlogListPage = ({ initialPosts }: BlogListPageProps) => {
  const sortPosts = (items: BlogPost[]) =>
    [...items].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));

  const [posts, setPosts] = useState<BlogPost[]>(() =>
    sortPosts(initialPosts?.length ? initialPosts : getAllBlogPosts()),
  );
  const featuredPost = posts.find((post) => post.featured) ?? posts[0] ?? getFeaturedBlogPost();
  const remainingPosts = posts.filter((post) => post.id !== featuredPost?.id);
  const categories = Array.from(new Set(posts.map((post) => post.category)));

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(apiUrl('/api/blog/posts'));

        if (res.ok) {
          setPosts(sortPosts(await res.json()));
        }
      } catch {
        setPosts(sortPosts(getAllBlogPosts()));
      }
    };

    fetchPosts();
  }, []);

  return (
    <BlogLayout
      title="Primewayz UK Insights"
      description="Practical guidance on AI automation, digital systems, SEO, CRM, websites, and operational stability for UK SMEs."
    >
      <section className="mb-10 rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm shadow-emerald-900/5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">
              Connect insights to action
            </p>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900">
              Explore the Primewayz UK support path behind each article
            </h2>

            <p className="mt-3 text-sm leading-7 text-zinc-600">
              These insights are written for UK SMEs reviewing website maintenance, CRM integration,
              automation, technical SEO foundations, software delivery, and ongoing digital improvement.
            </p>
          </div>

          <Link
            to="/services"
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full bg-[#000A2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            View all UK SME services
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Pillar guide</p>
          <h3 className="mt-2 text-lg font-bold text-zinc-900">
            Subscription-Based Software Development: Models &amp; Examples
          </h3>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            A long-lived cluster resource explaining the two meanings of subscription-based software
            development, SaaS models, examples, and how development subscriptions work.
          </p>
          <Link
            to="/insights/subscription-based-software-development"
            className="mt-4 inline-flex text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
          >
            Read the pillar guide →
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Decision guide</p>
          <h3 className="mt-2 text-lg font-bold text-zinc-900">
            Software Development Subscription vs Fixed-Price Development
          </h3>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            A balanced comparison of recurring monthly capacity and fixed-price projects covering
            scope, procurement, budget, risk and hybrid approaches.
          </p>
          <Link
            to="/insights/software-development-subscription-vs-fixed-price"
            className="mt-4 inline-flex text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
          >
            Read the decision guide →
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Use cases</p>
          <h3 className="mt-2 text-lg font-bold text-zinc-900">
            10 Software Development Subscription Use Cases for Growing Businesses
          </h3>
          <p className="mt-2 text-sm leading-7 text-zinc-600">
            Practical situations where monthly delivery capacity may fit—and where fixed-price,
            discovery or hiring may be more appropriate.
          </p>
          <Link
            to="/insights/software-development-subscription-use-cases"
            className="mt-4 inline-flex text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
          >
            Read the use-cases guide →
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              category: 'Process Guide',
              title: 'How Monthly Software Development Capacity Works',
              description:
                'How backlog intake, estimation, QA, releases and urgent work fit within finite monthly capacity.',
              href: '/insights/how-monthly-software-development-capacity-works',
            },
            {
              category: 'Process Guide',
              title: 'How to Prioritise Software Development Requests',
              description:
                'Turn a backlog into a delivery plan using value, urgency, risk, effort and capacity.',
              href: '/insights/how-to-prioritise-software-development-requests',
            },
            {
              category: 'Technical Guide',
              title: 'Application Rescue and Stabilisation',
              description:
                'What assessment and stabilisation should happen before ongoing development begins.',
              href: '/insights/application-rescue-and-stabilisation-before-ongoing-development',
            },
            {
              category: 'Technical Guide',
              title: 'Technical Debt Explained for Business Owners',
              description:
                'How accumulated software risk affects cost, speed and reliability—and how to prioritise it.',
              href: '/insights/technical-debt-explained-for-business-owners',
            },
            {
              category: 'Strategy Guide',
              title: 'Why Businesses Move to Continuous Development',
              description:
                'Strategic reasons organisations shift from isolated projects to ongoing software capability.',
              href: '/insights/why-businesses-move-to-continuous-software-development',
            },
            {
              category: 'Comparison Guide',
              title: 'Maintenance vs Continuous Product Development',
              description:
                'Clear boundaries between keeping systems dependable and expanding what they can do.',
              href: '/insights/software-maintenance-vs-continuous-product-development',
            },
            {
              category: 'Buyer Guide',
              title: 'How to Choose a Software Development Partner',
              description:
                'Evaluate partners across discovery, delivery, QA, ownership, communication and handover.',
              href: '/insights/how-to-choose-a-software-development-partner',
            },
          ].map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
                {card.category}
              </p>
              <h3 className="mt-2 text-base font-bold text-zinc-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-600">{card.description}</p>
              <span className="mt-4 inline-flex text-sm font-bold text-emerald-700">Read →</span>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {supportPathLinks.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              aria-label={item.anchor}
              className="group rounded-3xl border border-zinc-100 bg-zinc-50 p-5 transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-lg hover:shadow-emerald-900/10"
            >
              <h3 className="text-base font-black text-[#000A2D]">{item.title}</h3>

              <p className="mt-3 text-sm leading-6 text-zinc-600">{item.description}</p>

              <span className="mt-4 inline-flex text-sm font-bold text-emerald-700 group-hover:text-emerald-800">
                {item.anchor}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((category) => (
          <span
            key={category}
            className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700"
          >
            {category}
          </span>
        ))}
      </div>

      {featuredPost && (
        <section className="mb-14">
          <div className="mb-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-zinc-400">Featured</span>
            <span className="h-px flex-1 bg-zinc-200" />
          </div>

          <BlogCard post={featuredPost} featured />
        </section>
      )}

      <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {remainingPosts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </section>

      <div className="mt-16">
        <BlogCTA />
      </div>
    </BlogLayout>
  );
};
