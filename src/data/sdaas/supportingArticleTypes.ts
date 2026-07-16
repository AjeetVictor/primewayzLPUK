import type { SdaasImageAsset } from './images';

export type SupportingArticleFaq = {
  question: string;
  answer: string;
};

export type SupportingArticleLink = {
  title: string;
  description: string;
  href: string;
};

export type SupportingArticleSeo = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  h1: string;
  standfirst: string;
  category: string;
  author: string;
  datePublished: string;
  dateModified: string;
  readTime: string;
  keywords: readonly string[];
};

export type SupportingArticleIntroAside = {
  label: string;
  href: string;
  linkLabel: string;
};

export type SupportingArticleVisualRef = {
  image: SdaasImageAsset;
  caption: string;
};

export type SupportingArticleBlock =
  | { type: 'paragraphs'; texts: readonly string[] }
  | { type: 'bullets'; items: readonly string[]; ordered?: boolean }
  | { type: 'callout'; text: string; tone?: 'info' | 'warning' | 'geo' }
  | {
      type: 'subsection';
      title: string;
      paragraphs?: readonly string[];
      bullets?: readonly string[];
      ordered?: boolean;
    }
  | { type: 'table'; headers: readonly string[]; rows: readonly (readonly string[])[] }
  | { type: 'checklist'; items: readonly string[] }
  | {
      type: 'scorecard';
      intro?: string;
      categories: readonly { name: string; prompts: readonly string[] }[];
    }
  | { type: 'visual'; image: SdaasImageAsset; caption: string }
  | { type: 'geo'; statements: readonly string[] };

export type SupportingArticleSection = {
  id: string;
  sectionKey: string;
  title: string;
  blocks: readonly SupportingArticleBlock[];
};

export type SupportingArticleDefinition = {
  /** URL slug without /insights/ prefix */
  slug: string;
  path: string;
  seo: SupportingArticleSeo;
  ogImage: string;
  breadcrumbLabel: string;
  /** Blog-index card classification */
  cardCategory:
    | 'Explainer'
    | 'Process Guide'
    | 'Technical Guide'
    | 'Strategy Guide'
    | 'Comparison Guide'
    | 'Buyer Guide';
  contentType: 'explainer' | 'comparison' | 'decision' | 'use-cases';
  funnelStage: 'tof' | 'mof' | 'bof';
  primaryIntent: string;
  targetTopic: string;
  analyticsNamespace: string;
  directAnswerTitle: string;
  directAnswer: string;
  directAnswerFollow?: string;
  introParagraphs: readonly string[];
  introAsides?: readonly SupportingArticleIntroAside[];
  geoStatements: readonly string[];
  sections: readonly SupportingArticleSection[];
  faqs: readonly SupportingArticleFaq[];
  relatedLiveLinks: readonly SupportingArticleLink[];
  relatedBlogLinks?: readonly SupportingArticleLink[];
  reusableVisuals: readonly string[];
  aboutEntities: readonly string[];
  mentionEntities: readonly string[];
  conclusion: {
    paragraphs: readonly string[];
    primaryCta: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
  };
};
