import { buildInternalUtmUrl, REMOTE_RESOURCE_CAMPAIGN } from '../../lib/utm';
import { BOOK_CALL_URL, CONTACT_ENQUIRY_URL } from '../../constants/contactBooking';

export type HeroHeadlineSlide = {
  id: string;
  badge: string;
  headline: string;
  highlight: string;
  description: string;
  bullets?: string[];
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  image: string;
  imageAlt: string;
  visualKey?: 'remote-it-hero';
  tracking?: {
    slideName: string;
    service: string;
    ctaLocation: string;
  };
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
    primaryCtaHref: BOOK_CALL_URL,
    secondaryCtaLabel: 'See monthly support plans',
    secondaryCtaHref: '#pricing',
    image: '/images/hero/software-delivery-hero.webp',
    imageAlt: 'Developer working on a laptop with code on screen',
  },
  {
    id: 'remote-it-resource-augmentation',
    badge: 'Flexible IT capacity for UK SMEs',
    headline: 'Remote IT Resource Augmentation for UK Businesses',
    highlight: 'Add reliable remote IT capacity without building a full in-house team',
    description:
      'Access developers, QA testers, website support, automation specialists, digital support and project coordination through a structured remote delivery model from Primewayz UK.',
    bullets: [
      'Developers, QA, support and digital resources',
      'Flexible part-time, monthly or dedicated support',
      'Managed delivery from India for UK business needs',
      'Useful for SMEs, agencies, startups and growing teams',
    ],
    primaryCtaLabel: 'Explore Remote IT Resources',
    primaryCtaHref: buildInternalUtmUrl(
      '/remote-it-resources',
      'home_hero_slider',
      REMOTE_RESOURCE_CAMPAIGN,
      'hero_slider_primary_cta',
    ),
    secondaryCtaLabel: 'Discuss resource needs',
    secondaryCtaHref: buildInternalUtmUrl(
      CONTACT_ENQUIRY_URL,
      'home_hero_slider',
      REMOTE_RESOURCE_CAMPAIGN,
      'hero_slider_secondary_cta',
    ),
    image: '/images/hero/team-collaboration.webp',
    imageAlt: 'Remote IT resource augmentation dashboard for UK businesses',
    visualKey: 'remote-it-hero',
    tracking: {
      slideName: 'Remote IT Resource Augmentation',
      service: REMOTE_RESOURCE_CAMPAIGN,
      ctaLocation: 'home_hero_slider',
    },
  },
  {
    id: 'website-crm-automation',
    badge: 'WEBSITE, CRM & AUTOMATION',
    headline: 'Ongoing technical support for websites, CRM and business workflows',
    highlight: 'Keep your digital systems moving every month',
    description:
      'Whether you need regular website improvements, CRM cleanup, lead-flow automation, third-party integrations, or support for an existing platform, our monthly delivery model gives your business a practical technical team with a clear execution rhythm.',
    primaryCtaLabel: 'Discuss your support needs',
    primaryCtaHref: CONTACT_ENQUIRY_URL,
    secondaryCtaLabel: 'Explore services',
    secondaryCtaHref: '#services',
    image: '/images/hero/team-collaboration.webp',
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
    primaryCtaHref: BOOK_CALL_URL,
    secondaryCtaLabel: 'How delivery works',
    secondaryCtaHref: '#how-it-works',
    image: '/images/hero/business-planning.webp',
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
    secondaryCtaHref: BOOK_CALL_URL,
    image: '/images/hero/client-workshop.webp',
    imageAlt: 'Business team reviewing transparent software delivery plan',
  },
];
