import { Link } from 'react-router-dom';

const essentialGuides = [
  {
    category: 'Pillar guide',
    title: 'Subscription-Based Software Development: Models & Examples',
    description:
      'A long-lived cluster resource explaining the two meanings of subscription-based software development, SaaS models, examples, and how development subscriptions work.',
    href: '/insights/subscription-based-software-development',
  },
  {
    category: 'Decision guide',
    title: 'Software Development Subscription vs Fixed-Price Development',
    description:
      'A balanced comparison of recurring monthly capacity and fixed-price projects covering scope, procurement, budget, risk and hybrid approaches.',
    href: '/insights/software-development-subscription-vs-fixed-price',
  },
  {
    category: 'Use cases',
    title: '10 Software Development Subscription Use Cases for Growing Businesses',
    description:
      'Practical situations where monthly delivery capacity may fit—and where fixed-price, discovery or hiring may be more appropriate.',
    href: '/insights/software-development-subscription-use-cases',
  },
  {
    category: 'Process guide',
    title: 'How Monthly Software Development Capacity Works',
    description:
      'How backlog intake, estimation, QA, releases and urgent work fit within finite monthly capacity.',
    href: '/insights/how-monthly-software-development-capacity-works',
  },
  {
    category: 'Process guide',
    title: 'How to Prioritise Software Development Requests',
    description:
      'Turn a backlog into a delivery plan using value, urgency, risk, effort and capacity.',
    href: '/insights/how-to-prioritise-software-development-requests',
  },
  {
    category: 'Technical guide',
    title: 'Application Rescue and Stabilisation',
    description:
      'What assessment and stabilisation should happen before ongoing development begins.',
    href: '/insights/application-rescue-and-stabilisation-before-ongoing-development',
  },
];

export const BlogEssentialGuides = () => (
  <section id="section-essential-guides" className="mt-16 border-t border-zinc-200 pt-16 lg:mt-20 lg:pt-20">
    <div className="mb-8 max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">Essential guides</p>
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
        Deeper reading for delivery, procurement, and stabilisation decisions
      </h2>
      <p className="mt-4 text-base leading-7 text-zinc-600">
        These longer-form guides support the insights above when you need more structure around
        subscription delivery, prioritisation, rescue work, and partner selection.
      </p>
    </div>

    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {essentialGuides.map((guide) => (
        <Link
          key={guide.href}
          to={guide.href}
          className="group border border-zinc-200 bg-white p-6 transition hover:border-emerald-200"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
            {guide.category}
          </p>
          <h3 className="mt-3 text-lg font-bold leading-snug text-zinc-900 transition group-hover:text-emerald-700">
            {guide.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-zinc-600">{guide.description}</p>
          <span className="mt-5 inline-flex text-sm font-bold text-emerald-700">Read guide →</span>
        </Link>
      ))}
    </div>
  </section>
);
