export type FeaturedInsight = {
  label: string;
  title: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  url: string;
  image: {
    src: string;
    alt: string;
  };
  source: 'linkedin' | 'blog' | 'case-study' | 'external';
};

export const featuredLinkedInInsight: FeaturedInsight = {
  label: 'Featured insight',
  title: 'AI is trending. Clarity still converts.',
  description:
    'Before automation works, UK SMEs need a clearer lead-flow from website enquiry to CRM, follow-up, and reporting.',
  primaryCta: 'Read the LinkedIn article',
  secondaryCta: 'View on LinkedIn',
  url: 'https://www.linkedin.com/pulse/ai-trending-clarity-still-converts-manish-mishra-keigc',
  image: {
    src: '/images/ai-clarity-leadflow-linkedin.jpg',
    alt: 'AI is trending but clarity still converts - lead flow from website enquiry to CRM, follow-up and reporting',
  },
  source: 'linkedin',
};
