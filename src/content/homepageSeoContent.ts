export type HomepageSeoBlock = {
  heading: string;
  level: 1 | 2 | 3;
  paragraphs?: string[];
};

export const homepageSeoContent: HomepageSeoBlock[] = [
  {
    level: 1,
    heading: 'Reliable digital systems for growing UK businesses',
    paragraphs: [
      'Primewayz helps UK SMEs improve, connect and support the digital systems their businesses depend on.',
      'We help businesses improve website visibility, connect CRM and workflows, build and modernise software, support live applications and strengthen technical delivery.',
    ],
  },
  {
    level: 2,
    heading: 'Improve the systems your business already depends on',
    paragraphs: [
      'Your website, CRM, internal workflows and software applications should work together to support growth. When they are disconnected, outdated or poorly supported, enquiries are missed, manual work increases and delivery slows down.',
    ],
  },
  {
    level: 2,
    heading: 'Practical ownership across digital operations',
    paragraphs: [
      'Primewayz provides practical ownership from assessment and improvement through delivery and ongoing support, organised through engagement models such as Foundation Sprint, fixed-scope project, structured monthly delivery, managed support and dedicated technical capacity.',
    ],
  },
  {
    level: 2,
    heading: 'Five working service areas',
    paragraphs: [
      'Website Visibility & Conversion, CRM & Workflow Automation, Software & Product Engineering, Managed Application & Website Support, and Remote IT Team Extension.',
    ],
  },
  {
    level: 2,
    heading: 'Foundation Sprint',
    paragraphs: [
      'The Foundation Sprint helps UK SMEs clarify scope, priorities, risks and the most suitable engagement model before moving into longer delivery or support arrangements.',
    ],
  },
];
