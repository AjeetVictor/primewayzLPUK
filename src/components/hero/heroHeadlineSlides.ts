export type HeroHeadlineSlide = {
  id: string;
  badge: string;
  headline: string;
  highlight: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  image: string;
  imageAlt: string;
};

export const heroHeadlineSlides: HeroHeadlineSlide[] = [
  {
    id: 'monthly-uk-sme-support',
    badge: 'MONTHLY UK SME SUPPORT',
    headline: 'Monthly Software, Website & CRM Support for UK SMEs',
    highlight: 'Reliable digital delivery without hiring a full-time developer',
    description:
      'Primewayz UK helps small and growing UK businesses maintain, improve, and extend their digital systems every month — from website fixes and CRM workflows to automation, integrations, SEO foundations, and ongoing software delivery.',
    primaryCtaLabel: 'Book a UK discovery call',
    primaryCtaHref: '#contact',
    secondaryCtaLabel: 'See monthly support plans',
    secondaryCtaHref: '#pricing',
    image:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Developer working on a laptop with code on screen',
  },
  {
    id: 'website-crm-automation',
    badge: 'WEBSITE, CRM & AUTOMATION',
    headline: 'Ongoing technical support for websites, CRM and business workflows',
    highlight: 'Keep your digital systems moving every month',
    description:
      'Whether you need regular website improvements, CRM cleanup, lead-flow automation, third-party integrations, or support for an existing platform, our monthly delivery model gives your business a practical technical team with a clear execution rhythm.',
    primaryCtaLabel: 'Discuss your support needs',
    primaryCtaHref: '#contact',
    secondaryCtaLabel: 'Explore services',
    secondaryCtaHref: '#services',
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Team collaborating on software delivery',
  },
  {
    id: 'structured-delivery',
    badge: 'STRUCTURED DELIVERY MODEL',
    headline: 'A monthly delivery model built for practical SME priorities',
    highlight: 'Plan the work, execute clearly, review progress, then continue',
    description:
      'Every approved workstream moves through planning, design, development, QA, and release in sequence — helping UK business owners stay in control of priorities, approvals, delivery quality, and monthly progress.',
    primaryCtaLabel: 'Book a UK discovery call',
    primaryCtaHref: '#contact',
    secondaryCtaLabel: 'How delivery works',
    secondaryCtaHref: '#how-it-works',
    image:
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Software planning discussion between professionals',
  },
  {
    id: 'transparent-commercials',
    badge: 'TRANSPARENT COMMERCIAL MODEL',
    headline: 'Clear monthly capacity, transparent add-ons, and no hidden surprises',
    highlight: "Know what's included before work starts",
    description:
      'Your subscription covers Primewayz delivery capacity for websites, CRM integrations, automation, SEO foundations, maintenance, and software improvements. Third-party costs such as hosting, messaging, payment gateways, and external tools are handled separately and transparently.',
    primaryCtaLabel: 'See monthly plans',
    primaryCtaHref: '#pricing',
    secondaryCtaLabel: 'Book a call',
    secondaryCtaHref: '#contact',
    image:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Business team reviewing transparent software delivery plan',
  },
];