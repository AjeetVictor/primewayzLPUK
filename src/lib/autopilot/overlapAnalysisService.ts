/**
 * Deterministic content-overlap analysis engine (Phase 2B).
 * Exact matches are high-confidence advisories; lexical overlap is never
 * labelled as confirmed cannibalisation.
 */

import {
  AUTOPILOT_LEXICAL_OVERLAP_THRESHOLDS,
  AUTOPILOT_OVERLAP_ANALYSIS_VERSION,
} from '../../data/autopilot/researchConfig.ts';
import type {
  AutopilotClusterHint,
  AutopilotInternalLinkHint,
  AutopilotOverlapAnalysisResult,
  AutopilotOverlapFinding,
} from '../../data/autopilot/types.ts';
import { normaliseAutopilotKeyword } from './keywordNormalisation.ts';
import type { ContentInventory, ContentInventoryItem } from './contentInventoryService.ts';
import {
  calculateJaccardOverlap,
  classifyLexicalOverlap,
  isPhraseContainment,
  phrasesAreExactMatch,
  slugToComparablePhrase,
} from './overlapTokens.ts';

export type OverlapAnalysisTopicInput = {
  id?: number;
  workingTitle: string;
  primaryKeyword: string;
  proposedSlug?: string | null;
  primaryCategory?: string | null;
};

function pushUniqueFinding(
  findings: AutopilotOverlapFinding[],
  finding: AutopilotOverlapFinding,
) {
  const key = [
    finding.matchType,
    finding.sourceType,
    String(finding.sourceId ?? ''),
    finding.sourceRoute ?? '',
    finding.comparedValues.existing ?? '',
  ].join('|');
  if (
    findings.some(
      (existing) =>
        [
          existing.matchType,
          existing.sourceType,
          String(existing.sourceId ?? ''),
          existing.sourceRoute ?? '',
          existing.comparedValues.existing ?? '',
        ].join('|') === key,
    )
  ) {
    return;
  }
  findings.push(finding);
}

function baseFinding(
  item: ContentInventoryItem,
  partial: Omit<
    AutopilotOverlapFinding,
    'sourceType' | 'sourceId' | 'sourceRoute' | 'sourceTitle' | 'publicationStatus' | 'workflowStatus'
  >,
): AutopilotOverlapFinding {
  return {
    sourceType: item.sourceType,
    sourceId: item.id,
    sourceRoute: item.route ?? null,
    sourceTitle: item.title ?? null,
    publicationStatus: item.publicationStatus ?? null,
    workflowStatus: item.workflowStatus ?? null,
    ...partial,
  };
}

function analyseExactAndPhrase(
  topic: OverlapAnalysisTopicInput,
  item: ContentInventoryItem,
  findings: AutopilotOverlapFinding[],
) {
  const keyword = topic.primaryKeyword;
  const title = topic.workingTitle;
  const slug = topic.proposedSlug || '';

  if (item.primaryKeyword && phrasesAreExactMatch(keyword, item.primaryKeyword)) {
    pushUniqueFinding(
      findings,
      baseFinding(item, {
        matchType: 'exact_keyword_match',
        confidenceClass: 'exact',
        classification: 'blocking_advisory',
        explanation:
          'Exact normalised primary keyword match with existing content. Potential overlap — requires editorial review.',
        comparedValues: { candidate: keyword, existing: item.primaryKeyword },
      }),
    );
  }

  if (item.title && phrasesAreExactMatch(title, item.title)) {
    pushUniqueFinding(
      findings,
      baseFinding(item, {
        matchType: 'exact_title_match',
        confidenceClass: 'exact',
        classification: 'blocking_advisory',
        explanation:
          'Exact normalised title match with existing content. Possible consolidation candidate — requires editorial review.',
        comparedValues: { candidate: title, existing: item.title },
      }),
    );
  }

  if (slug && item.slug && phrasesAreExactMatch(slug, item.slug)) {
    pushUniqueFinding(
      findings,
      baseFinding(item, {
        matchType: 'exact_slug_match',
        confidenceClass: 'exact',
        classification: 'blocking_advisory',
        explanation:
          'Exact slug match with existing content. Exact slug conflict advisory for future publishing gates.',
        comparedValues: { candidate: slug, existing: item.slug },
      }),
    );
  }

  if (slug && item.proposedSlug && phrasesAreExactMatch(slug, item.proposedSlug)) {
    pushUniqueFinding(
      findings,
      baseFinding(item, {
        matchType: 'exact_slug_match',
        confidenceClass: 'exact',
        classification: 'blocking_advisory',
        explanation:
          'Exact proposed-slug match with another Autopilot topic. Exact slug conflict advisory.',
        comparedValues: { candidate: slug, existing: item.proposedSlug },
      }),
    );
  }

  const candidateRoute = slug ? `/blog/${slug}` : '';
  if (candidateRoute && item.route && phrasesAreExactMatch(candidateRoute, item.route)) {
    pushUniqueFinding(
      findings,
      baseFinding(item, {
        matchType: 'exact_route_match',
        confidenceClass: 'exact',
        classification: 'blocking_advisory',
        explanation:
          'Exact route match with existing content. Exact route conflict advisory for future publishing gates.',
        comparedValues: { candidate: candidateRoute, existing: item.route },
      }),
    );
  }

  // Phrase containment advisories (not exact conflicts)
  const pairs: Array<{ candidate: string; existing: string | null | undefined; label: string }> = [
    { candidate: keyword, existing: item.title, label: 'keyword vs title' },
    { candidate: keyword, existing: item.primaryKeyword, label: 'keyword vs keyword' },
    {
      candidate: keyword,
      existing: item.slug ? slugToComparablePhrase(item.slug) : null,
      label: 'keyword vs slug phrase',
    },
    { candidate: title, existing: item.primaryKeyword, label: 'title vs keyword' },
  ];

  for (const pair of pairs) {
    if (!pair.existing) continue;
    if (phrasesAreExactMatch(pair.candidate, pair.existing)) continue;
    if (!isPhraseContainment(pair.candidate, pair.existing)) continue;
    pushUniqueFinding(
      findings,
      baseFinding(item, {
        matchType: 'phrase_containment',
        confidenceClass: 'advisory',
        classification: 'advisory',
        explanation: `Phrase containment advisory (${pair.label}). Possible supporting article relationship — not an exact conflict.`,
        comparedValues: { candidate: pair.candidate, existing: pair.existing },
      }),
    );
  }
}

function analyseLexical(
  topic: OverlapAnalysisTopicInput,
  item: ContentInventoryItem,
  findings: AutopilotOverlapFinding[],
) {
  const candidateTexts = [topic.primaryKeyword, topic.workingTitle].filter(Boolean);
  const existingTexts = [
    item.title,
    item.primaryKeyword,
    item.slug ? slugToComparablePhrase(item.slug) : null,
  ].filter(Boolean) as string[];

  for (const candidate of candidateTexts) {
    for (const existing of existingTexts) {
      if (phrasesAreExactMatch(candidate, existing)) continue;
      const overlap = calculateJaccardOverlap(candidate, existing);
      const level = classifyLexicalOverlap(overlap);
      if (!level) continue;

      const threshold =
        level === 'high'
          ? AUTOPILOT_LEXICAL_OVERLAP_THRESHOLDS.high
          : AUTOPILOT_LEXICAL_OVERLAP_THRESHOLDS.moderate;

      pushUniqueFinding(
        findings,
        baseFinding(item, {
          matchType: level === 'high' ? 'high_lexical_overlap' : 'moderate_lexical_overlap',
          confidenceClass: level === 'high' ? 'high' : 'moderate',
          classification: 'advisory',
          explanation:
            level === 'high'
              ? `High lexical-overlap advisory (Jaccard ≥ ${threshold.minJaccard}, shared tokens ≥ ${threshold.minSharedTokens}). Possible cannibalisation risk — requires editorial review. Lexical overlap does not prove SEO cannibalisation.`
              : `Moderate lexical-overlap advisory (Jaccard ≥ ${threshold.minJaccard}, shared tokens ≥ ${threshold.minSharedTokens}). Potential overlap — requires editorial review.`,
          comparedValues: { candidate, existing },
          sharedTokens: overlap.sharedTokens,
          formula: overlap.formula,
          formulaInputs: {
            intersection: overlap.intersection,
            union: overlap.union,
            jaccard: Math.round(overlap.jaccard * 1000) / 1000,
            threshold: threshold.minJaccard,
            minSharedTokens: threshold.minSharedTokens,
          },
        }),
      );
    }
  }
}

function analyseCategoryCluster(
  topic: OverlapAnalysisTopicInput,
  item: ContentInventoryItem,
  findings: AutopilotOverlapFinding[],
) {
  if (
    topic.primaryCategory &&
    item.primaryCategory &&
    phrasesAreExactMatch(topic.primaryCategory, item.primaryCategory) &&
    item.sourceType !== 'keyword_candidate'
  ) {
    pushUniqueFinding(
      findings,
      baseFinding(item, {
        matchType: 'same_category_advisory',
        confidenceClass: 'advisory',
        classification: 'advisory',
        explanation:
          'Same primary category as existing content. Possible existing cluster — not an automatic assignment.',
        comparedValues: {
          candidate: topic.primaryCategory,
          existing: item.primaryCategory,
        },
      }),
    );
  }

  if (item.clusterId && item.sourceType === 'sdaas_insights') {
    const keywordNorm = normaliseAutopilotKeyword(topic.primaryKeyword).normalised;
    const titleNorm = normaliseAutopilotKeyword(item.title).normalised;
    if (
      keywordNorm &&
      titleNorm &&
      (isPhraseContainment(keywordNorm, titleNorm) ||
        classifyLexicalOverlap(calculateJaccardOverlap(keywordNorm, titleNorm)))
    ) {
      pushUniqueFinding(
        findings,
        baseFinding(item, {
          matchType: 'same_cluster_advisory',
          confidenceClass: 'advisory',
          classification: 'advisory',
          explanation: `Possible existing cluster relationship with ${item.clusterName || item.clusterId}. Human may record the chosen cluster in research architecture.`,
          comparedValues: {
            candidate: topic.primaryKeyword,
            existing: item.title,
          },
        }),
      );
    }
  }
}

function buildClusterHints(
  topic: OverlapAnalysisTopicInput,
  inventory: ContentInventory,
  findings: AutopilotOverlapFinding[],
): AutopilotClusterHint[] {
  const hints: AutopilotClusterHint[] = [];
  const clusterFindings = findings.filter(
    (f) =>
      f.matchType === 'same_cluster_advisory' ||
      f.matchType === 'same_category_advisory' ||
      f.matchType === 'phrase_containment' ||
      f.matchType === 'exact_keyword_match',
  );

  for (const finding of clusterFindings.slice(0, 12)) {
    if (finding.matchType === 'same_cluster_advisory') {
      hints.push({
        kind: 'possible_existing_cluster',
        label: 'Possible existing cluster',
        explanation: finding.explanation,
        sourceType: finding.sourceType,
        sourceId: finding.sourceId,
        sourceRoute: finding.sourceRoute,
      });
    } else if (finding.matchType === 'phrase_containment') {
      hints.push({
        kind: 'likely_supporting_article',
        label: 'Likely supporting article',
        explanation: finding.explanation,
        sourceType: finding.sourceType,
        sourceId: finding.sourceId,
        sourceRoute: finding.sourceRoute,
      });
    } else if (
      finding.sourceTitle &&
      /pillar|guide/i.test(finding.sourceTitle) &&
      finding.sourceType === 'sdaas_insights'
    ) {
      hints.push({
        kind: 'possible_pillar_relationship',
        label: 'Possible pillar relationship',
        explanation: finding.explanation,
        sourceType: finding.sourceType,
        sourceId: finding.sourceId,
        sourceRoute: finding.sourceRoute,
      });
    }
  }

  // Commercial page opportunities from SDaaS service entries
  for (const item of inventory.items) {
    if (item.sourceType !== 'sdaas_insights') continue;
    if (item.contentRole !== 'service') continue;
    if (!item.route) continue;
    hints.push({
      kind: 'potential_internal_link_to_commercial',
      label: 'Potential internal link to commercial page',
      explanation: `Consider linking to ${item.title || item.route} if editorially relevant. Do not invent money-page links.`,
      sourceType: item.sourceType,
      sourceId: item.id,
      sourceRoute: item.route,
      clusterId: item.clusterId,
    });
    if (hints.filter((h) => h.kind === 'potential_internal_link_to_commercial').length >= 3) {
      break;
    }
  }

  if (hints.length === 0) {
    hints.push({
      kind: 'no_clear_existing_cluster',
      label: 'No clear existing cluster',
      explanation:
        'No clear deterministic cluster relationship found from category, keyword, or registry signals.',
    });
  }

  void topic;
  return hints;
}

function buildInternalLinkHints(
  inventory: ContentInventory,
  findings: AutopilotOverlapFinding[],
): AutopilotInternalLinkHint[] {
  const hints: AutopilotInternalLinkHint[] = [];

  for (const finding of findings) {
    if (
      (finding.matchType === 'phrase_containment' ||
        finding.matchType === 'moderate_lexical_overlap' ||
        finding.matchType === 'high_lexical_overlap' ||
        finding.matchType === 'same_category_advisory') &&
      finding.sourceRoute &&
      (finding.sourceType === 'static_blog' ||
        finding.sourceType === 'cms_blog' ||
        finding.sourceType === 'sdaas_insights')
    ) {
      hints.push({
        kind: 'from_existing_article',
        label: 'Potential internal link from existing article',
        explanation: `Existing article may link to this topic if published later: ${finding.sourceTitle || finding.sourceRoute}.`,
        sourceType: finding.sourceType,
        sourceRoute: finding.sourceRoute,
        sourceTitle: finding.sourceTitle,
      });
    }
  }

  for (const item of inventory.items) {
    if (item.sourceType !== 'sdaas_insights') continue;
    if (item.contentRole === 'service' || item.contentRole === 'comparison') {
      hints.push({
        kind: item.contentRole === 'service' ? 'to_service_page' : 'to_commercial_page',
        label:
          item.contentRole === 'service'
            ? 'Potential internal link to service page'
            : 'Potential internal link to commercial page',
        explanation: `Possible supporting link to ${item.title || item.route}.`,
        sourceType: item.sourceType,
        sourceRoute: item.route,
        sourceTitle: item.title,
      });
    }
    if (hints.length >= 15) break;
  }

  // Deduplicate by route+kind
  const seen = new Set<string>();
  return hints.filter((hint) => {
    const key = `${hint.kind}|${hint.sourceRoute || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Run deterministic overlap analysis against a content inventory.
 */
export function analyseContentOverlap(
  topic: OverlapAnalysisTopicInput,
  inventory: ContentInventory,
): AutopilotOverlapAnalysisResult {
  const findings: AutopilotOverlapFinding[] = [];

  for (const item of inventory.items) {
    analyseExactAndPhrase(topic, item, findings);
    analyseLexical(topic, item, findings);
    analyseCategoryCluster(topic, item, findings);

    // Converted keyword candidate exact keyword match (already covered via primaryKeyword)
    if (
      item.sourceType === 'keyword_candidate' &&
      item.publicationStatus === 'converted' &&
      item.primaryKeyword &&
      phrasesAreExactMatch(topic.primaryKeyword, item.primaryKeyword)
    ) {
      pushUniqueFinding(
        findings,
        baseFinding(item, {
          matchType: 'exact_keyword_match',
          confidenceClass: 'exact',
          classification: 'blocking_advisory',
          explanation:
            'Exact match with a converted keyword candidate. Potential overlap — requires editorial review.',
          comparedValues: {
            candidate: topic.primaryKeyword,
            existing: item.primaryKeyword,
          },
        }),
      );
    }
  }

  // Internal link opportunity findings
  const linkHints = buildInternalLinkHints(inventory, findings);
  for (const hint of linkHints.slice(0, 8)) {
    if (!hint.sourceRoute) continue;
    findings.push({
      sourceType: hint.sourceType || 'sdaas_insights',
      sourceId: hint.sourceRoute,
      sourceRoute: hint.sourceRoute,
      sourceTitle: hint.sourceTitle ?? null,
      matchType: 'internal_link_opportunity',
      confidenceClass: 'advisory',
      classification: 'advisory',
      explanation: hint.explanation,
      comparedValues: {
        candidate: topic.primaryKeyword,
        existing: hint.sourceRoute,
      },
      publicationStatus: null,
      workflowStatus: null,
    });
  }

  const clusterHints = buildClusterHints(topic, inventory, findings);
  const internalLinkHints = linkHints;

  const exactConflictCount = findings.filter((f) =>
    [
      'exact_keyword_match',
      'exact_title_match',
      'exact_slug_match',
      'exact_route_match',
    ].includes(f.matchType),
  ).length;
  const highOverlapCount = findings.filter((f) => f.matchType === 'high_lexical_overlap').length;
  const moderateOverlapCount = findings.filter(
    (f) => f.matchType === 'moderate_lexical_overlap',
  ).length;
  const phraseContainmentCount = findings.filter(
    (f) => f.matchType === 'phrase_containment',
  ).length;

  return {
    version: AUTOPILOT_OVERLAP_ANALYSIS_VERSION,
    analysedAt: new Date().toISOString(),
    inventoryCounts: { ...inventory.counts },
    findings,
    clusterHints,
    internalLinkHints,
    summary: {
      exactConflictCount,
      highOverlapCount,
      moderateOverlapCount,
      phraseContainmentCount,
      advisoryCount: findings.filter((f) => f.classification === 'advisory').length,
      clusterHintCount: clusterHints.length,
      internalLinkHintCount: internalLinkHints.length,
    },
  };
}

/** Guard: forbidden certainty language must not appear in generated explanations. */
export function overlapFindingsUseSafeLanguage(findings: AutopilotOverlapFinding[]): boolean {
  const forbidden = [
    'guaranteed cannibalisation',
    'confirmed cannibalisation',
    'google will penalise',
    'google will penalize',
    'this page cannot rank',
    'duplicate content penalty',
    'confirmed seo conflict',
  ];
  return findings.every(
    (finding) =>
      !forbidden.some((phrase) => finding.explanation.toLowerCase().includes(phrase)),
  );
}
