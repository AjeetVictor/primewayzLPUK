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
    id: 'monthly-delivery',
    badge: 'FLEXIBLE MONTHLY DELIVERY',
    headline: 'Subscription software delivery for UK SMEs',
    highlight: 'Start with Foundation Sprint, then scale monthly capacity',
    description:
      'Websites, CMS platforms, integrations, and digital improvements - planned, designed, built, tested, and released through a structured monthly delivery model.',
    primaryCtaLabel: 'Book a UK discovery call',
    primaryCtaHref: '#contact',
    secondaryCtaLabel: 'See plans',
    secondaryCtaHref: '#pricing',
    image:
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Developer working on a laptop with code on screen',
  },
  {
    id: 'adaptive-priorities',
    badge: 'FLEXIBLE MONTHLY DELIVERY',
    headline: 'Software delivery that adapts as your priorities evolve',
    highlight: 'Scale up, slow down, or move to maintenance',
    description:
      'Start with your current goals, then adjust your delivery pace as your roadmap changes. Add new priorities, refine direction, or switch to maintenance mode without losing continuity.',
    primaryCtaLabel: 'Book a UK discovery call',
    primaryCtaHref: '#contact',
    secondaryCtaLabel: 'How it works',
    secondaryCtaHref: '#how-it-works',
    image:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Team collaborating on software delivery',
  },
  {
    id: 'structured-delivery',
    badge: 'STRUCTURED DELIVERY MODEL',
    headline: 'A structured delivery model with clear execution rhythm',
    highlight: 'One clear workstream. Sequential execution. Predictable outcomes.',
    description:
      'Every approved workstream moves through planning, design, development, QA, and deployment in sequence - helping you stay in control of priorities, approvals, and delivery quality.',
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
    headline: 'Clear monthly capacity. Transparent add-ons. No hidden surprises.',
    highlight: "Know what's included - and what's billed separately",
    description:
      'Your subscription covers Primewayz delivery capacity for websites, CRM integrations, automation, SEO foundations, maintenance, and ongoing digital improvements. Third-party services like hosting, messaging, payment gateways, and external tools are handled transparently through clearly defined add-ons.',
    primaryCtaLabel: 'See plans',
    primaryCtaHref: '#pricing',
    secondaryCtaLabel: 'Book a call',
    secondaryCtaHref: '#contact',
    image:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80',
    imageAlt: 'Business team reviewing transparent software delivery plan',
  },
];
