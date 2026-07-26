/** FAQ content for /faq — keep schema in sync with visible answers only. */

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqGroup = {
  id: string;
  title: string;
  items: FaqItem[];
};

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'starting',
    title: 'Starting an engagement',
    items: [
      {
        question: 'How do UK SMEs usually start with Primewayz?',
        answer:
          'Most businesses begin with a free Digital Systems Review or a discovery call. That helps identify whether website visibility, CRM workflows, software delivery, managed support or remote capacity is the highest-value next step.',
      },
      {
        question: 'Do I need a full project brief before contacting you?',
        answer:
          'No. Share the current friction, systems involved and business priority. We help clarify the useful next step from that context.',
      },
    ],
  },
  {
    id: 'review-audit',
    title: 'Digital Systems Review and website audit',
    items: [
      {
        question: 'What is the free Digital Systems Review?',
        answer:
          'It is a practical review of where your website, CRM, software or support model is creating friction. You receive a clear recommended next step without obligation.',
      },
      {
        question: 'How is the free website audit different?',
        answer:
          'The website audit focuses on public-signal visibility, trust and enquiry readiness for your website. The Digital Systems Review looks across a broader set of systems and delivery options.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Monthly delivery and software ownership',
    items: [
      {
        question: 'What does monthly delivery include?',
        answer:
          'Monthly delivery provides structured capacity for agreed improvements such as website work, CRM workflows, software features, integrations and controlled technical support.',
      },
      {
        question: 'Who owns the software and systems we build?',
        answer:
          'Client ownership arrangements are agreed for the engagement. Delivery documentation and handover expectations are part of structured software and support work.',
      },
      {
        question: 'Can capacity change as priorities change?',
        answer:
          'Yes. Engagements can increase, reduce or move into maintenance depending on workload and business priorities.',
      },
    ],
  },
  {
    id: 'maintenance-costs',
    title: 'Maintenance and third-party costs',
    items: [
      {
        question: 'When is Maintenance Mode useful?',
        answer:
          'Maintenance Mode is useful when active development slows down but you still want monitoring, minor updates and continuity support for live systems.',
      },
      {
        question: 'Are third-party tools included in Primewayz fees?',
        answer:
          'No. Hosting, domains, SaaS tools, payment gateways and similar vendor costs remain separate so ownership and billing stay transparent.',
      },
    ],
  },
  {
    id: 'trust-security',
    title: 'Confidentiality, security and transition',
    items: [
      {
        question: 'How is shared business context handled?',
        answer:
          'Context shared for reviews and discovery is treated confidentially within Primewayz and used to recommend a useful next step.',
      },
      {
        question: 'Who is responsible for security?',
        answer:
          'Security responsibilities are shared. Primewayz applies delivery and support practices appropriate to the engagement; clients remain responsible for access control, vendor accounts and business-owned systems as agreed.',
      },
      {
        question: 'Can we cancel or transition support?',
        answer:
          'Yes. Engagements are designed to flex with business needs, including moving to maintenance or planning a controlled transition when priorities change.',
      },
    ],
  },
];

export const FAQ_FLAT_ITEMS: FaqItem[] = FAQ_GROUPS.flatMap((group) => group.items);
