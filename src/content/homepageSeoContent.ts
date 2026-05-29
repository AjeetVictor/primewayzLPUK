export type HomepageSeoBlock = {
  heading: string;
  level: 1 | 2 | 3;
  paragraphs?: string[];
};

export const homepageSeoContent: HomepageSeoBlock[] = [
  {
    level: 1,
    heading: 'Software Delivery Partner for UK Businesses',
    paragraphs: [
      'Primewayz helps UK businesses plan, build, stabilise and automate software through flexible delivery partnerships.',
      'We support web applications, internal business systems, ERP workflows, B2B ecommerce platforms, integrations, automation and long-term maintenance.'
    ]
  },
  {
    level: 2,
    heading: 'Software Development Subscription for UK SMEs',
    paragraphs: [
      'Start with a focused Foundation Sprint, then continue with monthly delivery capacity for development, ERP workflows, B2B ecommerce, integrations, maintenance and AI-enabled automation.'
    ]
  },
  {
    level: 2,
    heading: 'How Primewayz Delivery Works',
    paragraphs: [
      'We understand your current systems, business goals, operational bottlenecks and delivery risks, then define a practical execution path through planning, development, testing and review cycles.'
    ]
  },
  {
    level: 2,
    heading: 'Foundation Sprint',
    paragraphs: [
      'The Foundation Sprint helps UK SMEs clarify scope, priorities, risks, delivery plan, and the most suitable monthly software delivery model before moving into longer subscription support.'
    ]
  },
  {
    level: 2,
    heading: 'Full-Stack Capability for Long-Term Software Delivery',
    paragraphs: [
      'Primewayz supports frontend, backend, database, integration, automation and delivery management work across modern business applications.'
    ]
  },
  {
    level: 2,
    heading: 'UK SME Pricing and Support Options',
    paragraphs: [
      'Primewayz offers flexible software delivery and maintenance options including Foundation Sprint, Essential, Growth, Scale and Maintenance Mode.'
    ]
  },
  {
    level: 2,
    heading: 'Technology and Delivery Focus',
    paragraphs: [
      'Our delivery experience includes Java, React, MySQL, Node.js, APIs, dashboards, ecommerce workflows, ERP-related systems, admin panels, workflow automation and reporting interfaces.'
    ]
  },
  {
    level: 2,
    heading: 'UK Software Delivery Subscription FAQs',
    paragraphs: [
      'Primewayz can support new builds, existing systems, stabilisation, improvements, integrations, automation and long-term maintenance.'
    ]
  },
  {
    level: 2,
    heading: 'Book a 20-Minute Fit Check',
    paragraphs: [
      'Discuss your current system, delivery bottlenecks, software priorities and possible next steps with Primewayz.'
    ]
  }
];
