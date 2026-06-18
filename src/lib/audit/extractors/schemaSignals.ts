import type { AuditContext, AuditSignal } from '../types.ts';

function schemaSignal(
  key: string,
  category: AuditSignal['category'],
  pattern: RegExp,
  maxPoints: number,
  label: string,
  recommendation: string,
  context: AuditContext,
): AuditSignal {
  const found = pattern.test(context.combinedHtml);
  return {
    key,
    category,
    status: found ? 'found' : 'missing',
    confidence: 0.94,
    points: found ? maxPoints : 0,
    maxPoints,
    evidence: found ? [{ source: 'website', url: context.homepage?.finalUrl, label }] : [],
    recommendations: found ? [] : [recommendation],
  };
}

export function extractSchemaSignals(context: AuditContext): AuditSignal[] {
  return [
    schemaSignal(
      'schema-reviews',
      'reviews-reputation',
      /"@type"\s*:\s*"(?:review|aggregaterating)"/i,
      2,
      'Review or AggregateRating schema was found.',
      'Add valid Review or AggregateRating schema only when supported by genuine on-page reviews.',
      context,
    ),
  ];
}
