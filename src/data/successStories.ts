import type { FreeReviewServiceArea } from '../constants/conversionCta';

export type SuccessStoryRelationshipType = 'Anonymised client delivery' | 'Primewayz product';

export type SuccessStoryConfidentiality = 'Anonymised client delivery' | 'Primewayz product';

export type SuccessStoryPublicationStatus = 'published' | 'draft' | 'blocked';

export type SuccessStoryIconKey = 'layers' | 'book-open' | 'smartphone';

export type SuccessStoryAccentColor = 'emerald' | 'indigo' | 'amber';

export interface SuccessStory {
  slug: string;
  title: string;
  shortTitle: string;
  relationshipType: SuccessStoryRelationshipType;
  confidentiality: SuccessStoryConfidentiality;
  industry: string;
  category: string;
  summary: string;
  homepageSummary: string;
  keyOutcome: string;
  problem: readonly string[];
  responsibility: readonly string[];
  solution: readonly string[];
  deliveryDecisions: readonly string[];
  outcomes: readonly string[];
  technologies: readonly string[];
  relatedServicePaths: readonly string[];
  relatedServiceLabels: readonly string[];
  /** Explicit review-form service preselection for story-detail CTAs. */
  reviewServiceArea: FreeReviewServiceArea;
  /** @deprecated Kept for compatibility; story-detail conversion UI no longer uses this. */
  ctaLabel: string;
  /** @deprecated Kept for compatibility; story-detail conversion UI no longer uses this. */
  ctaHref: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  image: string;
  imageAlt: string;
  iconKey: SuccessStoryIconKey;
  accentColor: SuccessStoryAccentColor;
  publicationStatus: SuccessStoryPublicationStatus;
}

export const SUCCESS_STORIES_BASE_PATH = '/success-stories';

export const APPROVED_PUBLIC_STORY_SLUGS = [
  'wholesale-order-management-platform',
  'rentreadbuy-book-rental-platform',
  'restaurant-self-ordering-platform',
] as const;

export const RETIRED_ILLUSTRATIVE_STORY_SLUGS = [
  'local-trades-lead-capture',
  'professional-services-crm-cleanup',
  'ecommerce-store-stability-support',
] as const;

export const PUBLIC_SUCCESS_STORY_RELATIONSHIP_TYPES = [
  'Anonymised client delivery',
  'Primewayz product',
] as const;

export const FORBIDDEN_PUBLIC_STORY_PROPERTY_KEYS = [
  'internalProjectReference',
  'clientName',
  'internalClientName',
  'consortiumName',
  'contactName',
  'contactEmail',
] as const;

const successStories: readonly SuccessStory[] = [
  {
    slug: 'wholesale-order-management-platform',
    title: 'Supporting a long-running wholesale order-management platform',
    shortTitle: 'Wholesale order-management platform',
    relationshipType: 'Anonymised client delivery',
    confidentiality: 'Anonymised client delivery',
    industry: 'Wholesale and B2B commerce',
    category: 'Software engineering · Managed support',
    summary:
      'Primewayz has contributed to the ongoing development and technical continuity of a business-critical wholesale order-management platform, supporting complex catalogue, inventory, customer, order and operational workflows.',
    homepageSummary: 'Long-term platform continuity',
    keyOutcome:
      'Continued technical support for a business-critical platform with greater delivery continuity across complex inherited workflows.',
    problem: [
      'Complex business workflows accumulated over time across catalogue, customer, order and warehouse processes.',
      'Multiple connected operational areas needed to keep working together without disruption.',
      'The business required continuity while improving an established application rather than replacing it.',
      'Dependable technical ownership and controlled enhancement were needed as delivery contributors changed.',
    ],
    responsibility: [
      'Ongoing software-development contribution to a long-running platform.',
      'Understanding inherited workflows and existing application behaviour.',
      'Supporting catalogue and SKU-related processes.',
      'Supporting inventory, warehouse, customer and order workflows.',
      'Technical analysis and controlled enhancement.',
      'Delivery continuity and knowledge transfer across contributors.',
    ],
    solution: [
      'Incremental improvement rather than destabilising replacement.',
      'Business-rule clarification before implementation changes.',
      'Workflow-focused implementation aligned to operational needs.',
      'Controlled releases with ongoing support rhythm.',
      'Continuity planning as delivery contributors changed over time.',
    ],
    deliveryDecisions: [
      'Prioritise stability and continuity over large disruptive rewrites.',
      'Clarify business rules before changing inherited workflow behaviour.',
      'Improve workflows in controlled releases rather than big-bang replacements.',
      'Document and transfer knowledge to reduce dependency on individual contributors.',
    ],
    outcomes: [
      'Continued technical support for a business-critical platform.',
      'Greater delivery continuity across complex inherited workflows.',
      'A structured basis for ongoing enhancement.',
      'Reduced dependency on undocumented individual knowledge through transition and support.',
    ],
    technologies: [
      'Web application platform and inherited codebase',
      'Catalogue and SKU workflow support',
      'Inventory and warehouse process integration',
      'Customer and order workflow maintenance',
      'Controlled release and support practices',
    ],
    relatedServicePaths: [
      '/software-development-subscription-uk',
      '/maintenance',
      '/remote-it-resources',
      '/crm-automation-support',
    ],
    relatedServiceLabels: [
      'Software development subscription',
      'Managed application and website support',
      'Remote IT team extension',
      'CRM and workflow automation',
    ],
    reviewServiceArea: 'Managed Application & Website Support',
    ctaLabel: 'Discuss platform continuity support',
    ctaHref: '/contact-us#book-call',
    seoTitle: 'Wholesale Order Management Platform Support | Primewayz UK',
    seoDescription:
      'How Primewayz supports ongoing development and technical continuity for a business-critical wholesale order-management platform with complex catalogue, inventory and order workflows.',
    ogImage: '/images/delivery-cards/backend-integrations.webp',
    image: '/images/delivery-cards/backend-integrations.webp',
    imageAlt: 'Abstract illustration of connected backend and integration workflows',
    iconKey: 'layers',
    accentColor: 'emerald',
    publicationStatus: 'published',
  },
  {
    slug: 'rentreadbuy-book-rental-platform',
    title: 'Building and improving a digital book-rental and commerce platform',
    shortTitle: 'RentReadBuy book-rental platform',
    relationshipType: 'Primewayz product',
    confidentiality: 'Primewayz product',
    industry: 'Books, rental commerce and e-commerce',
    category: 'Product engineering · Website growth · Managed support',
    summary:
      'RentReadBuy combines book discovery, rental and purchase journeys, membership and commerce workflows within a platform that continues to evolve through product, content, SEO and operational improvements.',
    homepageSummary: 'Live rental and commerce platform',
    keyOutcome:
      'A live platform supporting book rental and purchasing journeys with connected product, catalogue, membership and commerce workflows.',
    problem: [
      'Standard e-commerce journeys do not fully support rental use cases alongside purchase paths.',
      'Catalogue quality and discovery directly affect customer experience and repeat use.',
      'Rental, purchase, condition, pricing and membership rules must work together reliably.',
      'The platform requires continuous technical, content and operational improvement.',
    ],
    responsibility: [
      'Product and workflow definition for rental and commerce journeys.',
      'Rental and purchase customer journeys.',
      'Membership, cart and checkout flows.',
      'Catalogue and book-discovery structure.',
      'Pricing and book-condition handling.',
      'Logistics-related workflow support.',
      'Technical SEO and analytics.',
      'Campaign and content landing pages.',
      'Ongoing product and platform improvement.',
    ],
    solution: [
      'Connected rental, purchase and membership journeys within one platform.',
      'Structured catalogue and discovery paths for books and categories.',
      'Integrated handling of rental rules, purchase options and book condition.',
      'Ongoing product, SEO, campaign and operational iteration.',
    ],
    deliveryDecisions: [
      'Design rental and purchase as connected journeys rather than separate silos.',
      'Treat catalogue quality and discovery as ongoing product work.',
      'Improve SEO, campaigns and operations incrementally alongside core platform features.',
    ],
    outcomes: [
      'A live platform supporting book rental and purchasing journeys.',
      'Connected product, catalogue, membership and commerce workflows.',
      'A structured foundation for ongoing catalogue, SEO and campaign improvements.',
      'Continued operational and technical iteration.',
    ],
    technologies: [
      'Product and commerce platform engineering',
      'Rental and purchase workflow implementation',
      'Membership and checkout flows',
      'Catalogue and content structure',
      'Technical SEO and analytics integration',
    ],
    relatedServicePaths: [
      '/software-development-subscription-uk',
      '/website-visibility-support',
      '/maintenance',
    ],
    relatedServiceLabels: [
      'Software development subscription',
      'Website visibility and conversion support',
      'Managed application and website support',
    ],
    reviewServiceArea: 'Software & Product Engineering',
    ctaLabel: 'Discuss product and platform engineering',
    ctaHref: '/contact-us#book-call',
    seoTitle: 'Book Rental & Commerce Platform Case Study | Primewayz UK',
    seoDescription:
      'How Primewayz built and continues to improve RentReadBuy, a digital platform combining book discovery, rental, purchase, membership and commerce workflows.',
    ogImage: '/images/delivery-cards/product-engineering.webp',
    image: '/images/delivery-cards/product-engineering.webp',
    imageAlt: 'Abstract illustration of product engineering and platform development',
    iconKey: 'book-open',
    accentColor: 'indigo',
    publicationStatus: 'published',
  },
  {
    slug: 'restaurant-self-ordering-platform',
    title: 'Creating a multilingual self-ordering and payment experience for restaurant customers',
    shortTitle: 'Restaurant self-ordering platform',
    relationshipType: 'Anonymised client delivery',
    confidentiality: 'Anonymised client delivery',
    industry: 'Hospitality and food service',
    category: 'Product engineering · Customer experience',
    summary:
      'Primewayz designed and built a touch-based restaurant ordering experience that connected menu discovery, product customisation, multilingual interaction, payment and paperless customer journeys.',
    homepageSummary: 'Multilingual ordering experience',
    keyOutcome:
      'A structured self-service ordering journey connecting browsing, selection and payment in one customer-facing experience.',
    problem: [
      'Customers need a simple way to browse and order without depending on staff for every step.',
      'Menus and product options must remain visually clear on a touch-based interface.',
      'Ordering and payment need to work as one coherent customer journey.',
      'Different customers may require multilingual interaction throughout the experience.',
      'Restaurant teams need administrable menu and reporting foundations.',
    ],
    responsibility: [
      'Touch-screen ordering user experience design and implementation.',
      'Menu browsing and product customisation flows.',
      'Multilingual experience design and delivery.',
      'Payment-integration work connecting checkout to the ordering journey.',
      'Dynamic menu presentation for operational updates.',
      'Contactless and paperless billing experience planning.',
      'Admin and reporting workflow planning.',
      'Delivery coordination across product, UX and integration work.',
    ],
    solution: [
      'A touch-based self-service ordering journey from menu discovery to payment.',
      'Visual menu browsing with product customisation support.',
      'Multilingual interaction designed into the customer experience.',
      'Integrated payment flow within the ordering journey.',
      'Foundations for menu administration and operational reporting.',
    ],
    deliveryDecisions: [
      'Treat ordering and payment as one journey rather than disconnected steps.',
      'Design for touch interaction and visual menu clarity from the start.',
      'Build multilingual support into core flows rather than as an afterthought.',
      'Plan admin and reporting foundations alongside the customer experience.',
    ],
    outcomes: [
      'A structured self-service ordering journey.',
      'Connected browsing, selection and payment interactions.',
      'A reusable foundation for menu administration and operational reporting.',
      'A simpler customer-facing ordering experience.',
    ],
    technologies: [
      'Touch-screen customer experience design',
      'Menu browsing and customisation flows',
      'Multilingual interface implementation',
      'Payment integration',
      'Menu administration and reporting foundations',
    ],
    relatedServicePaths: [
      '/software-development-subscription-uk',
      '/crm-automation-support',
      '/website-visibility-support',
    ],
    relatedServiceLabels: [
      'Software development subscription',
      'CRM and workflow automation',
      'Website visibility and conversion support',
    ],
    reviewServiceArea: 'Software & Product Engineering',
    ctaLabel: 'Discuss a customer-facing product build',
    ctaHref: '/contact-us#book-call',
    seoTitle: 'Restaurant Self-Ordering Platform Case Study | Primewayz UK',
    seoDescription:
      'How Primewayz designed and built a multilingual touch-based restaurant ordering experience connecting menu discovery, customisation, payment and paperless customer journeys.',
    ogImage: '/images/delivery-cards/frontend-ux.webp',
    image: '/images/delivery-cards/frontend-ux.webp',
    imageAlt: 'Abstract illustration of customer-facing interface and experience design',
    iconKey: 'smartphone',
    accentColor: 'amber',
    publicationStatus: 'published',
  },
] as const;

export const allSuccessStories: readonly SuccessStory[] = successStories;

export function getPublishedSuccessStories(): SuccessStory[] {
  return successStories.filter((story) => story.publicationStatus === 'published');
}

export function getSuccessStoryBySlug(slug: string): SuccessStory | undefined {
  return successStories.find((story) => story.slug === slug);
}

export function getPublishedSuccessStoryBySlug(slug: string): SuccessStory | undefined {
  const story = getSuccessStoryBySlug(slug);
  return story?.publicationStatus === 'published' ? story : undefined;
}

export function getSuccessStoryPath(slug: string): string {
  return `${SUCCESS_STORIES_BASE_PATH}/${slug}`;
}

export function getSuccessStorySeoEntries(): Record<string, { title: string; description: string; image: string }> {
  return Object.fromEntries(
    getPublishedSuccessStories().map((story) => [
      getSuccessStoryPath(story.slug),
      {
        title: story.seoTitle,
        description: story.seoDescription,
        image: story.ogImage,
      },
    ]),
  );
}
