import { CANONICAL_ROUTES } from '../constants/canonicalRoutes';

export const HOW_IT_WORKS_STEPS = [
  {
    number: '01',
    title: 'Understand the current position',
    description:
      'Review the website, CRM, software, support model and constraints that are creating friction today.',
  },
  {
    number: '02',
    title: 'Prioritise the next actions',
    description:
      'Separate urgent fixes from longer-term improvements so effort goes where impact and risk make sense.',
  },
  {
    number: '03',
    title: 'Select the delivery model',
    description:
      'Choose Foundation Sprint, Monthly Delivery, Maintenance Mode or a more complex engagement path.',
  },
  {
    number: '04',
    title: 'Deliver and validate',
    description:
      'Execute agreed work through a controlled process with clear ownership, review points and acceptance.',
  },
  {
    number: '05',
    title: 'Report and improve',
    description:
      'Track progress, risks and opportunities so the next stage stays informed rather than reactive.',
  },
  {
    number: '06',
    title: 'Move into ongoing support where appropriate',
    description:
      'Continue with monthly delivery, maintenance or remote capacity when the business still needs steady support.',
  },
] as const;

export const HOW_IT_WORKS_SERVICE_LINKS = [
  {
    label: 'Digital Systems Review',
    description: 'A practical first step when priorities are unclear.',
    href: CANONICAL_ROUTES.digitalSystemsReview,
  },
  {
    label: 'Pricing & engagement options',
    description: 'Compare Foundation Sprint, monthly delivery and maintenance.',
    href: CANONICAL_ROUTES.pricing,
  },
  {
    label: 'Website Visibility & Conversion',
    description: 'Improve discovery, trust and enquiry readiness.',
    href: CANONICAL_ROUTES.websiteVisibilitySupport,
  },
  {
    label: 'CRM & Workflow Automation',
    description: 'Connect enquiries, CRM records and follow-up.',
    href: CANONICAL_ROUTES.crmAutomationSupport,
  },
  {
    label: 'Software Development Subscription',
    description: 'Ongoing product and application engineering capacity.',
    href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
  },
  {
    label: 'Contact',
    description: 'Discuss your current digital systems priority.',
    href: CANONICAL_ROUTES.contact,
  },
] as const;
