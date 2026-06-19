import type { AuditContext, WebPresenceAuditClassification } from '../types.ts';

type TypeRule = {
  detectedType: string;
  patterns: Array<{ regex: RegExp; label: string }>;
  recommendationFocus: string[];
};

const TYPE_RULES: TypeRule[] = [
  {
    detectedType: 'Ecommerce website',
    patterns: [
      { regex: /\b(add to (?:cart|basket)|shopping cart|checkout)\b/i, label: 'Cart or checkout wording' },
      { regex: /\b(products?|sku|woocommerce|shopify|magento)\b/i, label: 'Product or ecommerce platform signals' },
      { regex: /\b(basket|buy now|add to bag)\b/i, label: 'Purchase action wording' },
    ],
    recommendationFocus: [
      'Product schema and category clarity',
      'Checkout path clarity and trust badges',
      'Delivery and returns information',
      'Analytics and ecommerce tracking readiness',
    ],
  },
  {
    detectedType: 'SaaS / software product website',
    patterns: [
      { regex: /\b(pricing|features|integrations?|onboarding|subscription)\b/i, label: 'SaaS product wording' },
      { regex: /\b(request demo|book demo|free trial|start trial)\b/i, label: 'Demo or trial CTA wording' },
      { regex: /\b(software platform|saas|api)\b/i, label: 'Software platform signals' },
    ],
    recommendationFocus: [
      'Pricing and demo request clarity',
      'Integration and feature explanation',
      'Case studies and product credibility',
      'Analytics and conversion tracking readiness',
    ],
  },
  {
    detectedType: 'Web portal / application',
    patterns: [
      { regex: /\b(login|log in|sign in|dashboard|my account)\b/i, label: 'Login or account wording' },
      { regex: /\b(portal|signup|sign up|register)\b/i, label: 'Portal or registration wording' },
      { regex: /\b(app\.|application|user account)\b/i, label: 'Application or account signals' },
    ],
    recommendationFocus: [
      'Login and onboarding clarity',
      'Support documentation and help paths',
      'Security and trust pages',
      'Account recovery and contact support paths',
    ],
  },
  {
    detectedType: 'Financial services website',
    patterns: [
      { regex: /\b(finance|loan|mortgage|insurance|investment|advisory)\b/i, label: 'Financial services wording' },
      { regex: /\b(fca|regulated|wealth management|pension)\b/i, label: 'Financial compliance or advisory signals' },
    ],
    recommendationFocus: [
      'Privacy and legal clarity',
      'Trust proof and contact clarity',
      'Compliance-safe copy and disclaimers',
      'Clear enquiry paths for regulated services',
    ],
  },
  {
    detectedType: 'Healthcare / clinic website',
    patterns: [
      { regex: /\b(clinic|doctor|appointment|treatment|patient)\b/i, label: 'Healthcare or clinic wording' },
      { regex: /\b(dental|surgery|medical|gp|healthcare)\b/i, label: 'Medical service signals' },
    ],
    recommendationFocus: [
      'Appointment or enquiry path clarity',
      'Trust and credentials visibility',
      'Privacy and patient information clarity',
      'Location and service-area visibility',
    ],
  },
  {
    detectedType: 'Education / training website',
    patterns: [
      { regex: /\b(course|training|class|curriculum|admissions)\b/i, label: 'Education or training wording' },
      { regex: /\b(enrol|enroll|learn|students?|certification)\b/i, label: 'Learning or enrolment signals' },
    ],
    recommendationFocus: [
      'Course or programme page clarity',
      'Admissions and training enquiry paths',
      'Trust content and outcomes evidence',
      'Contact and location visibility',
    ],
  },
  {
    detectedType: 'Restaurant / hospitality website',
    patterns: [
      { regex: /\b(menu|booking|reservation|table)\b/i, label: 'Menu or booking wording' },
      { regex: /\b(restaurant|hotel|rooms|hospitality|dine)\b/i, label: 'Hospitality service signals' },
    ],
    recommendationFocus: [
      'Menu and booking path clarity',
      'Location and opening information',
      'Review or reputation link visibility',
      'Contact and reservation CTAs',
    ],
  },
  {
    detectedType: 'Blog / content website',
    patterns: [
      { regex: /\b(blog|article|published|author)\b/i, label: 'Blog or article wording' },
      { regex: /\b(categories?|tags?|read more|latest posts?)\b/i, label: 'Content publishing signals' },
    ],
    recommendationFocus: [
      'Content structure and category clarity',
      'Author and publishing trust signals',
      'Newsletter or enquiry capture paths',
      'Technical SEO for content pages',
    ],
  },
  {
    detectedType: 'Portfolio / brochure website',
    patterns: [
      { regex: /\b(portfolio|projects?|case stud(?:y|ies)|our work)\b/i, label: 'Portfolio or project wording' },
      { regex: /\b(brochure|showcase|gallery)\b/i, label: 'Showcase or gallery signals' },
    ],
    recommendationFocus: [
      'Case studies and project evidence',
      'Testimonials and credibility signals',
      'Service clarity and contact paths',
      'Trust pages and enquiry CTAs',
    ],
  },
  {
    detectedType: 'Service business website',
    patterns: [
      { regex: /\b(services?|quote|consultation|service area)\b/i, label: 'Service business wording' },
      { regex: /\b(call now|get a quote|book (?:a )?call|enquir(?:y|ies))\b/i, label: 'Service enquiry signals' },
    ],
    recommendationFocus: [
      'Location and service-area clarity',
      'Phone and contact visibility',
      'Review links and reputation signals',
      'Google Business Profile verification (not verified in this free audit)',
    ],
  },
];

function analyzeType(rule: TypeRule, haystack: string): { score: number; signals: string[] } {
  const signals: string[] = [];
  let score = 0;

  for (const pattern of rule.patterns) {
    if (pattern.regex.test(haystack)) {
      score += 1;
      signals.push(pattern.label);
    }
  }

  return { score, signals };
}

function buildReason(detectedType: string, signals: string[]): string {
  if (detectedType === 'Unknown / mixed website') {
    return 'The audited pages showed mixed or limited type-specific signals, so the likely website type could not be determined confidently from public HTML alone.';
  }
  if (signals.length === 0) {
    return `${detectedType} was inferred from limited public-page signals detected during the audit.`;
  }
  return `${detectedType} was inferred from public-page signals such as ${signals.slice(0, 3).join(', ').toLowerCase()}.`;
}

export function extractSiteClassification(context: AuditContext): WebPresenceAuditClassification {
  const haystack = `${context.combinedHtml}\n${context.combinedText}`.toLowerCase();

  const scored = TYPE_RULES.map((rule) => {
    const result = analyzeType(rule, haystack);
    return {
      ...rule,
      score: result.score,
      detectedSignals: result.signals,
    };
  }).sort((a, b) => b.score - a.score);

  const top = scored[0];
  const second = scored[1];
  const topScore = top?.score ?? 0;

  let detectedType = 'Unknown / mixed website';
  let confidence: WebPresenceAuditClassification['confidence'] = 'low';
  let detectedSignals: string[] = [];
  let recommendationFocus = [
    'Trust and contact clarity',
    'Technical SEO foundations',
    'Enquiry path visibility',
    'Analytics readiness',
  ];

  if (topScore === 0) {
    return {
      detectedType,
      confidence: 'low',
      reason: buildReason(detectedType, []),
      detectedSignals: [],
      recommendationFocus,
    };
  }

  if (topScore >= 2 && second && top.score - second.score <= 1 && second.score >= 2) {
    detectedType = 'Unknown / mixed website';
    confidence = 'low';
    detectedSignals = [...new Set([...(top.detectedSignals || []), ...(second.detectedSignals || [])])].slice(0, 5);
    recommendationFocus = [
      ...top.recommendationFocus.slice(0, 2),
      ...second.recommendationFocus.slice(0, 2),
    ];
  } else {
    detectedType = top.detectedType;
    detectedSignals = top.detectedSignals;
    recommendationFocus = top.recommendationFocus;
    if (topScore >= 3 && (!second || top.score - second.score >= 2)) {
      confidence = 'high';
    } else if (topScore >= 2) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
  }

  return {
    detectedType,
    confidence,
    reason: buildReason(detectedType, detectedSignals),
    detectedSignals,
    recommendationFocus,
  };
}
