import type { AuditCheck, WebPresenceAuditBenchmark } from '../types.ts';
import { getScoreBand } from '../scoreBands.ts';
import {
  BENCHMARK_DISCLAIMER,
  BENCHMARK_FRAMEWORK_NAME,
  PRIMEWAYZ_AUDIT_URL,
} from './constants.ts';

export type AuditBenchmarkInput = {
  score: number;
  label: string;
  checks: AuditCheck[];
  businessType: string;
  targetCountry: string;
  location?: string;
  businessName?: string;
  websiteUrl?: string;
};

type SectorInsight = {
  sector: string;
  insight: string;
};

const SECTOR_INSIGHTS: Record<string, SectorInsight> = {
  'Financial services': {
    sector: 'Financial services',
    insight:
      'For financial services businesses, visible trust signals, clear contact paths, privacy transparency, and analytics readiness are especially important in public-signal reviews.',
  },
  'Local service business': {
    sector: 'Local service business',
    insight:
      'For local service businesses, location wording, contact clarity, enquiry paths, and local trust signals are often the strongest public-signal indicators in a free audit.',
  },
  'Professional services': {
    sector: 'Professional services',
    insight:
      'For professional services firms, credibility pages, case evidence, contact clarity, and technical SEO foundations typically carry the most visible public-signal weight.',
  },
  'Ecommerce business': {
    sector: 'Ecommerce business',
    insight:
      'For ecommerce businesses, product-page clarity, performance basics, trust pages, analytics readiness, and conversion paths are common public-signal focus areas.',
  },
  'Software / IT services': {
    sector: 'Software / IT services',
    insight:
      'For software and IT services businesses, technical SEO, trust content, lead capture, analytics readiness, and visible credibility signals are common public-signal priorities.',
  },
  'Healthcare / clinic': {
    sector: 'Healthcare / clinic',
    insight:
      'For healthcare and clinic websites, trust signals, contact clarity, privacy transparency, and local relevance are especially important in public-signal reviews.',
  },
  'Education / training': {
    sector: 'Education / training',
    insight:
      'For education and training providers, clear service explanations, enquiry paths, trust content, and technical foundations are typical public-signal focus areas.',
  },
  'Restaurant / hospitality': {
    sector: 'Restaurant / hospitality',
    insight:
      'For restaurant and hospitality businesses, local visibility, contact details, booking or enquiry paths, and reputation signals are often the most visible public indicators.',
  },
  Other: {
    sector: 'General UK SME',
    insight:
      'For UK SMEs, visible trust signals, enquiry paths, technical SEO foundations, and analytics readiness are common public-signal focus areas in this framework.',
  },
};

function resolveSectorInsight(businessType: string): SectorInsight {
  return SECTOR_INSIGHTS[businessType] ?? SECTOR_INSIGHTS.Other;
}

function checkRatio(check: AuditCheck): number {
  if (!check.maxPoints) return 0;
  return check.points / check.maxPoints;
}

function strengthLabel(check: AuditCheck): string {
  return `${check.name}: ${check.explanation}`;
}

function improvementLabel(check: AuditCheck): string {
  const recommendation = check.recommendations?.[0];
  if (recommendation) {
    return `${check.name}: ${recommendation}`;
  }
  return `${check.name}: ${check.explanation}`;
}

function buildStrengths(checks: AuditCheck[]): string[] {
  return checks
    .filter((check) => check.status === 'good' || (check.status === 'partial' && checkRatio(check) >= 0.6))
    .sort((a, b) => checkRatio(b) - checkRatio(a))
    .slice(0, 4)
    .map(strengthLabel);
}

function buildImprovementAreas(checks: AuditCheck[]): string[] {
  return checks
    .filter((check) => check.status === 'gap' || check.status === 'partial' || check.status === 'not_verified')
    .sort((a, b) => checkRatio(a) - checkRatio(b))
    .slice(0, 4)
    .map(improvementLabel);
}

function fallbackStrengths(scoreBandLabel: string): string[] {
  return [`Overall public-signal band: ${scoreBandLabel}`];
}

function fallbackImprovements(checks: AuditCheck[]): string[] {
  if (checks.length === 0) {
    return ['Review visible trust, enquiry, and technical signals across key public pages.'];
  }
  return checks
    .sort((a, b) => checkRatio(a) - checkRatio(b))
    .slice(0, 2)
    .map(improvementLabel);
}

function buildShareSummary(input: AuditBenchmarkInput, bandLabel: string): string {
  const name = input.businessName?.trim() || 'This website';
  const url = input.websiteUrl?.trim() || 'Website URL not available';
  const locationLine = input.location?.trim()
    ? `Location context: ${input.location.trim()}`
    : `Target country: ${input.targetCountry}`;

  return [
    `${name} — Web Presence Audit Benchmark`,
    `Website: ${url}`,
    `Score: ${input.score}/100`,
    `Band: ${bandLabel}`,
    locationLine,
    `Sector: ${resolveSectorInsight(input.businessType).sector}`,
    '',
    `Framework: ${BENCHMARK_FRAMEWORK_NAME}`,
    BENCHMARK_DISCLAIMER,
    '',
    `Run your own free audit: ${PRIMEWAYZ_AUDIT_URL}`,
  ].join('\n');
}

export function buildAuditBenchmark(input: AuditBenchmarkInput): WebPresenceAuditBenchmark {
  const scoreBand = getScoreBand(input.score);
  const sector = resolveSectorInsight(input.businessType);
  const strengths = buildStrengths(input.checks);
  const improvementAreas = buildImprovementAreas(input.checks);

  return {
    label: scoreBand.label,
    helper: scoreBand.helper,
    disclaimer: BENCHMARK_DISCLAIMER,
    frameworkName: BENCHMARK_FRAMEWORK_NAME,
    sector: sector.sector,
    sectorInsight: sector.insight,
    strengths: strengths.length > 0 ? strengths : fallbackStrengths(scoreBand.label),
    improvementAreas: improvementAreas.length > 0 ? improvementAreas : fallbackImprovements(input.checks),
    shareSummary: buildShareSummary(input, scoreBand.label),
  };
}
