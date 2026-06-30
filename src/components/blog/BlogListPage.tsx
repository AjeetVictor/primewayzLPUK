import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BlogCard } from './BlogCard';
import { BlogCTA } from './BlogCTA';
import { BlogLayout } from './BlogLayout';
import { getAllBlogPosts, getFeaturedBlogPost } from '../../data/blog/utils';
import type { BlogPost } from '../../data/blog/types';
import { apiUrl } from '../../utils/apiUrl';

type BlogListPageProps = {
  initialPosts?: BlogPost[];
};

const supportPathLinks = [
  {
    title: 'Software Development Subscription',
    href: '/software-product-delivery',
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
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts?.length ? initialPosts : getAllBlogPosts());
  const featuredPost = posts.find((post) => post.featured) || getFeaturedBlogPost();
  const remainingPosts = posts.filter((post) => post.id !== featuredPost.id);
  const categories = Array.from(new Set(posts.map((post) => post.category)));

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(apiUrl('/api/blog/posts'));

        if (res.ok) {
          setPosts(await res.json());
        }
      } catch {
        setPosts(getAllBlogPosts());
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
