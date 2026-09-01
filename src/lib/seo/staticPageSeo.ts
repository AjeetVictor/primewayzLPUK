import { SDAAS_SEO } from '../../data/sdaas/commercialPage.ts';
import { SDAAS_PILLAR_PATH, SDAAS_PILLAR_SEO } from '../../data/sdaas/pillarArticle.ts';
import { SDAAS_COMPARISON_PATH, SDAAS_COMPARISON_SEO } from '../../data/sdaas/comparisonArticle.ts';
import { SDAAS_USE_CASES_PATH, SDAAS_USE_CASES_SEO } from '../../data/sdaas/useCasesArticle.ts';
import { SDAAS_SUPPORTING_ARTICLES } from '../../data/sdaas/supportingArticlesRegistry.ts';
import { PRIMEWAYZ_UK_SITE_DESCRIPTION } from './defaultStructuredData.ts';

export const STATIC_PAGE_SEO: Record<string, { title: string; description: string }> = {
    '/': {
      title: 'Digital Transformation Services for UK SMEs | Primewayz UK',
      description: PRIMEWAYZ_UK_SITE_DESCRIPTION,
    },
    '/services': {
      title: 'Software, CRM, Application Support & Digital Services | Primewayz UK',
      description:
        'Practical technical support across website visibility, CRM workflows, software engineering, managed application support and remote IT team extension for UK SMEs.',
    },
    '/software-development-subscription-uk': {
      title: SDAAS_SEO.title,
      description: SDAAS_SEO.description,
    },
    [SDAAS_PILLAR_PATH]: {
      title: `${SDAAS_PILLAR_SEO.title} | Primewayz UK`,
      description: SDAAS_PILLAR_SEO.description,
    },
    [SDAAS_COMPARISON_PATH]: {
      title: `${SDAAS_COMPARISON_SEO.title} | Primewayz UK`,
      description: SDAAS_COMPARISON_SEO.description,
    },
    [SDAAS_USE_CASES_PATH]: {
      title: `${SDAAS_USE_CASES_SEO.title} | Primewayz UK`,
      description: SDAAS_USE_CASES_SEO.description,
    },
    ...Object.fromEntries(
      SDAAS_SUPPORTING_ARTICLES.map((article) => [
        article.path,
        {
          title: `${article.seo.title} | Primewayz UK`,
          description: article.seo.description,
        },
      ]),
    ),
    '/software-development-subscription-uk/request-capacity': {
      title: 'Request Capacity Recommendation | Primewayz UK',
      description:
        'Request a recommended monthly software development capacity plan from Primewayz UK.',
    },
    '/professional-services-crm-support-uk': {
      title: 'Professional Services CRM Support UK | Primewayz UK',
      description:
        'CRM integration, lead-flow cleanup, website enquiry tracking, follow-up workflows, and reporting support for UK professional services firms.',
    },
    '/success-stories': {
      title: 'Software & Digital Delivery Success Stories | Primewayz UK',
      description:
        'Explore how Primewayz has helped organisations improve software delivery, connect business systems, support critical applications and strengthen digital operations.',
    },
    '/uk-sme-digital-visibility-checker': {
      title: 'Free Website Visibility Audit & Checker for UK SMEs | Primewayz',
      description:
        'Run a free public-signal website visibility audit for your UK SME. Get a visibility score, priority fixes, SEO, trust and enquiry-readiness checks.',
    },
    '/about-us': {
      title: 'About Primewayz UK | Digital Systems & Delivery Partner',
      description:
        'Primewayz is a digital systems and delivery partner for UK SMEs, helping businesses improve websites, CRM workflows, software applications and technical delivery.',
    },
    '/contact-us': {
      title: 'Contact Primewayz UK | Discuss Your Digital Priorities',
      description:
        'Contact Primewayz UK to discuss website visibility, CRM workflows, software delivery, managed support or remote technical capacity.',
    },
    '/digital-systems-review': {
      title: 'Free Digital Systems Review for UK SMEs | Primewayz',
      description:
        'Ask Primewayz to review where your website, CRM, software or support model is creating friction and identify the most useful next step.',
    },
    '/thank-you/digital-systems-review': {
      title: 'Digital Systems Review Request Received | Primewayz',
      description:
        'Your digital systems review request has been received. Primewayz will review the submitted information and identify the most useful next step.',
    },
    '/website-visibility-support': {
      title: 'Website Optimisation & SEO Services UK | Primewayz',
      description:
        'Website optimisation and SEO services for UK businesses covering technical SEO, crawlability, indexability, Search Console fixes, performance and enquiry journeys.',
    },
    '/maintenance': {
      title: 'Website Maintenance Services UK | Primewayz',
      description:
        'Website maintenance services for UK businesses with predictable monthly support for updates, fixes, security, performance, monitoring and ongoing technical care.',
    },
    '/crm-automation-support': {
      title: 'CRM Setup & Automation for UK SMEs | Primewayz',
      description:
        'CRM setup, automation and integration services for UK SMEs covering website enquiries, lead routing, data migration, follow-up workflows and reporting.',
    },
    '/custom-ai-agent-development-uk': {
      title: 'Custom AI Agent Development Services UK | Primewayz',
      description:
        'Custom AI agent development for UK businesses, including AI workflow automation, RAG, system integrations, human approvals and controlled agent workflows.',
    },
    '/remote-it-resources': {
      title: 'IT Staff Augmentation Services UK | Primewayz',
      description:
        'IT staff augmentation services for UK businesses needing flexible developers, QA professionals, analysts and technical specialists to extend existing delivery teams.',
    },
    '/pricing': {
      title: 'Primewayz UK Pricing & Engagement Options',
      description:
        'Review Primewayz UK engagement options including Foundation Sprint, structured monthly delivery, Maintenance Mode and enterprise or complex delivery.',
    },
    '/privacy-policy': {
      title: 'Privacy Policy | Primewayz UK',
      description:
        'How Primewayz UK collects, uses and protects personal information for UK website visitors and business enquiries.',
    },
    '/terms-of-service': {
      title: 'Terms of Service | Primewayz UK',
      description:
        'Terms governing use of the Primewayz UK website and related digital systems support services for UK businesses.',
    },
    '/cookie-policy': {
      title: 'Cookie Policy | Primewayz UK',
      description:
        'How Primewayz UK uses cookies and similar technologies on the UK website.',
    },
    '/faq': {
      title: 'Primewayz UK Services: Frequently Asked Questions',
      description:
        'Answers about Digital Systems Review, website audit, monthly delivery, software ownership, maintenance, capacity changes and confidentiality.',
    },
    '/how-it-works': {
      title: 'How Primewayz UK Digital Delivery Works',
      description:
        'Understand how Primewayz UK reviews priorities, selects a delivery model, delivers work and moves into ongoing support where appropriate.',
    },
  };
