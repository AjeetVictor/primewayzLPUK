export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  author: string;
  category: string;
  image: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 'monthly-digital-support-uk-smes',
    title: 'Why UK SMEs Need Monthly Digital Support',
    excerpt:
      'How a predictable monthly delivery model helps small businesses keep websites, SEO, CRM, and automation work moving.',
    content: `
      <p>Many UK small businesses do not need a large one-off software project. They need steady digital progress: website improvements, technical SEO fixes, CRM cleanup, landing pages, analytics, and small automations delivered in a practical monthly rhythm.</p>

      <h3>The problem with one-off digital projects</h3>
      <p>One-off projects often start well but leave the business with a long list of unresolved improvements after launch. Forms need refining, pages need updating, tracking needs fixing, and new campaign ideas appear every month.</p>

      <h3>Why monthly delivery works better</h3>
      <p>A monthly model gives UK SMEs a clear queue of priorities. Instead of repeatedly finding a new freelancer or agency, the business keeps one delivery partner who understands the website, systems, and commercial goals.</p>

      <h3>What should be included</h3>
      <p>Good monthly support should cover website updates, technical SEO foundations, CRM workflows, forms, lead tracking, landing pages, integrations, small automation tasks, maintenance, and release support.</p>

      <p>Primewayz UK is built around this need: flexible monthly digital delivery for UK small businesses that want progress without hiring a full in-house team.</p>
    `,
    date: 'March 24, 2026',
    readTime: '5 min read',
    author: 'Primewayz UK Team',
    category: 'UK SMEs',
    image: 'https://picsum.photos/seed/uk-monthly-support/800/500',
  },
  {
    id: 'website-seo-crm-automation-uk',
    title: 'Website, SEO, CRM and Automation: The Practical UK SME Stack',
    excerpt:
      'A simple framework for deciding what to improve first when your business needs better digital operations.',
    content: `
      <p>For many UK businesses, digital improvement becomes confusing because everything feels urgent: the website, SEO, lead forms, CRM, automation, content, analytics, and customer follow-up.</p>

      <h3>Start with the customer journey</h3>
      <p>The first step is to understand how a customer finds the business, what pages they view, which form or call-to-action they use, and what happens after the enquiry arrives.</p>

      <h3>Fix the core before adding more tools</h3>
      <p>A clean website structure, reliable contact forms, basic technical SEO, clear analytics, and a working CRM process often create more value than adding another disconnected tool.</p>

      <h3>Automate only where it helps</h3>
      <p>Automation should reduce manual follow-up, lost enquiries, repeated updates, and reporting gaps. It should not make the process harder for staff or customers.</p>

      <p>Primewayz UK helps businesses prioritise these improvements through Foundation Sprint planning and monthly delivery capacity.</p>
    `,
    date: 'March 18, 2026',
    readTime: '6 min read',
    author: 'Primewayz UK Team',
    category: 'Digital Operations',
    image: 'https://picsum.photos/seed/uk-digital-stack/800/500',
  },
  {
    id: 'foundation-sprint-before-monthly-delivery',
    title: 'Why Start with a Foundation Sprint Before Monthly Delivery?',
    excerpt:
      'How a short planning and setup phase reduces confusion before website, SEO, CRM, or automation work begins.',
    content: `
      <p>Starting monthly delivery without a clear foundation can create confusion. Priorities change, assumptions remain hidden, and small technical issues can delay visible progress.</p>

      <h3>What a Foundation Sprint should clarify</h3>
      <p>A strong Foundation Sprint confirms business goals, current website condition, tracking gaps, content needs, CRM requirements, technical risks, and the best delivery plan.</p>

      <h3>Why it matters for UK SMEs</h3>
      <p>Small businesses usually need clarity before capacity. A short setup phase helps the team decide what should be fixed first, what should wait, and what belongs in monthly delivery.</p>

      <h3>Moving into monthly support</h3>
      <p>Once the foundation is clear, monthly delivery can focus on agreed priorities: website improvements, landing pages, technical SEO, integrations, automation, maintenance, and reporting.</p>

      <p>This is why Primewayz UK recommends starting with a focused Foundation Sprint before moving into Essential, Growth, Scale, or Maintenance Mode.</p>
    `,
    date: 'March 12, 2026',
    readTime: '5 min read',
    author: 'Primewayz UK Team',
    category: 'Delivery Model',
    image: 'https://picsum.photos/seed/uk-foundation-sprint/800/500',
  },
];
