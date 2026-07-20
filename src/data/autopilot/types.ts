/**
 * Article Autopilot 2.0 — shared foundation types (Phase 1B.1).
 * JSON-compatible shapes for future Prisma JSON columns and API payloads.
 */

import type {
  AutopilotBriefStatus,
  AutopilotDecisionStatus,
  AutopilotDraftStatus,
  AutopilotMediaStatus,
  AutopilotPerformanceStatus,
  AutopilotPublishingStatus,
  AutopilotTopicStatus,
} from './status.ts';
import type {
  AutopilotPenaltyKey,
  AutopilotRecommendationBand,
  AutopilotScoreDimensionKey,
} from './scoringConfig.ts';

export type { AutopilotScoreDimensionKey, AutopilotPenaltyKey, AutopilotRecommendationBand };

export type AutopilotTopicSource = 'import' | 'manual' | 'cluster' | 'system';

/** Core topic identity fields used by the decision card. */
export interface AutopilotTopicIdentity {
  id: string;
  workingTitle: string;
  primaryKeyword: string;
  supportingKeywords: string[];
  keywordVariants: string[];
  userProblem: string;
  audience: string;
  market: string;
  language: string;
  location?: string;
  source: AutopilotTopicSource;
  proposedSlug?: string;
  primaryCategory?: string;
  secondaryCategories: string[];
}

export type AutopilotSearchIntentKind =
  | 'informational'
  | 'commercial_investigation'
  | 'transactional'
  | 'navigational'
  | 'mixed'
  | 'unknown';

export type AutopilotFunnelStage = 'awareness' | 'consideration' | 'decision' | 'retention' | 'mixed';

/** Phase 2B journey-stage vocabulary (human-entered). */
export type AutopilotJourneyStage =
  | 'problem_awareness'
  | 'solution_awareness'
  | 'vendor_evaluation'
  | 'purchase_decision'
  | 'post_purchase'
  | 'unknown';

/**
 * Search intent evidence. Phase 2B prefers primaryIntent / journeyStage / userNeed.
 * Legacy Phase 1 fields (dominantIntent, funnelStage) remain accepted for compatibility.
 */
export interface AutopilotSearchIntent {
  primaryIntent?: AutopilotSearchIntentKind;
  secondaryIntents?: AutopilotSearchIntentKind[];
  journeyStage?: AutopilotJourneyStage;
  userNeed?: string;
  expectedAnswerFormat?: string;
  decisionContext?: string;
  /** @deprecated Prefer primaryIntent — retained for Phase 1 payloads. */
  dominantIntent?: AutopilotSearchIntentKind;
  /** @deprecated Prefer secondaryIntents. */
  secondaryIntent?: AutopilotSearchIntentKind;
  intents?: AutopilotSearchIntentKind[];
  /** @deprecated Prefer journeyStage. */
  funnelStage?: AutopilotFunnelStage;
  notes?: string;
}

export type AutopilotSerpContentType =
  | 'service_page'
  | 'blog_article'
  | 'guide'
  | 'comparison'
  | 'category_page'
  | 'tool'
  | 'forum'
  | 'video'
  | 'other'
  | 'unknown';

/** One manually entered SERP evidence row — not a verified live ranking. */
export interface AutopilotSerpEvidenceRow {
  position?: number;
  title?: string;
  url?: string;
  domain?: string;
  contentType?: AutopilotSerpContentType;
  /** ISO date supplied by the human — never defaulted by the server. */
  observedAt?: string;
  notes?: string;
  serpFeatures?: string[];
  /** Provenance label, e.g. manual, pasted, screenshot. */
  source?: string;
}

/**
 * SERP evidence. Phase 2B prefers structured `rows`.
 * Legacy summary fields remain accepted for Phase 1 topic PATCH compatibility.
 */
export interface AutopilotSerpEvidence {
  rows?: AutopilotSerpEvidenceRow[];
  /** Explicit explanation when fewer than the minimum rows are available. */
  evidenceLimitation?: string;
  researchedAt?: string;
  observedResultTypes?: string[];
  commonContentFormats?: string[];
  commonHeadings?: string[];
  competitorDomains?: string[];
  featuredSnippets?: boolean;
  peopleAlsoAsk?: string[];
  videoOrImagePresence?: boolean;
  freshnessNotes?: string;
  localIntent?: boolean;
  aiOverviewNotes?: string;
  notes?: string;
}

export interface AutopilotBusinessAlignment {
  serviceRelevanceNotes?: string;
  businessValueNotes?: string;
  buyerIntentNotes?: string;
  commercialPageSupportNotes?: string;
  internalLinkOpportunityNotes?: string;
  targetServicePaths?: string[];
  targetCommercialPaths?: string[];
  /** Explicit reasoning when no suitable internal path was identified. */
  noSuitablePathReason?: string;
  /** Legacy Phase 1 fields. */
  relevantService?: string;
  relevantMoneyPage?: string;
  serviceFit?: string;
  buyerFit?: string;
  authorityFit?: string;
  conversionOpportunity?: string;
  internalLinkingOpportunity?: string;
  commercialValue?: string;
  notes?: string;
}

export type AutopilotPageType =
  | 'blog_article'
  | 'pillar'
  | 'supporting'
  | 'comparison'
  | 'use_case'
  | 'other';

export type AutopilotContentRole =
  | 'pillar'
  | 'supporting'
  | 'comparison'
  | 'explainer'
  | 'commercial_support'
  | 'other'
  | 'unknown';

export interface AutopilotContentArchitecture {
  proposedPageType?: AutopilotPageType | string;
  topicCluster?: string;
  contentRole?: AutopilotContentRole | string;
  differentiationAngle?: string;
  directAnswerOpportunity?: string;
  requiredSections?: string[];
  supportingQuestions?: string[];
  /** Legacy Phase 1 fields. */
  primaryCategory?: string;
  secondaryCategories?: string[];
  pillarSupportingRelationship?: string;
  intendedPageType?: AutopilotPageType;
  suggestedCanonicalRoute?: string;
  proposedSlug?: string;
  relatedExistingArticles?: string[];
  contentGap?: string;
  notes?: string;
}

export interface AutopilotRiskAssessment {
  cannibalisationNotes?: string;
  unsupportedClaimRisks?: string;
  legalOrComplianceNotes?: string;
  evidenceLimitations?: string;
  freshnessRisks?: string;
  /** Legacy Phase 1 fields. */
  cannibalisationRisk?: string;
  overlappingPages?: string[];
  duplicateTopicRisk?: string;
  unsupportedClaimRisk?: string;
  outdatedEvidenceRisk?: string;
  legalComplianceNotes?: string;
  notes?: string;
}

export interface AutopilotCategoryRecommendation {
  primaryCategory?: string;
  secondaryCategories?: string[];
  confidence?: number;
  reasoning?: string;
  recommendedAt?: string;
  source?: 'rules' | 'ai' | 'human' | 'import';
}

export type AutopilotScoreDimensions = Record<AutopilotScoreDimensionKey, number>;

export type AutopilotScorePenalties = Record<AutopilotPenaltyKey, number>;

export type AutopilotScoreExplanations = Partial<
  Record<AutopilotScoreDimensionKey | AutopilotPenaltyKey, string>
>;

export interface AutopilotScoreBreakdown {
  dimensions: AutopilotScoreDimensions;
  penalties: AutopilotScorePenalties;
  explanations?: AutopilotScoreExplanations;
  /** Never authoritative — calculator always recomputes totals from dimensions. */
  aiSuggestedTotal?: number;
}

export interface AutopilotScoreCalculationResult {
  dimensions: AutopilotScoreDimensions;
  penalties: AutopilotScorePenalties;
  weights: Record<AutopilotScoreDimensionKey, number>;
  rawWeightedScore: number;
  totalScore: number;
  recommendationBand: AutopilotRecommendationBand;
  scoringVersion: string;
  explanations?: AutopilotScoreExplanations;
  ignoredAiSuggestedTotal?: number;
}

export interface AutopilotAiMetadata {
  provider?: string;
  model?: string;
  promptTemplateVersion?: string;
  systemPromptVersion?: string;
  inputHash?: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  latencyMs?: number;
  costEstimate?: number;
  success?: boolean;
  retryCount?: number;
  correlationId?: string;
  notes?: string;
}

export interface AutopilotTopicWorkflowStatuses {
  topicStatus: AutopilotTopicStatus;
  decisionStatus: AutopilotDecisionStatus;
  briefStatus: AutopilotBriefStatus;
  draftStatus: AutopilotDraftStatus;
  mediaStatus: AutopilotMediaStatus;
  publishingStatus: AutopilotPublishingStatus;
  performanceStatus: AutopilotPerformanceStatus;
}

/** Foundation topic aggregate (in-memory / future DB row mapping). */
export interface AutopilotTopic extends AutopilotTopicIdentity, AutopilotTopicWorkflowStatuses {
  searchIntent?: AutopilotSearchIntent;
  serpEvidence?: AutopilotSerpEvidence;
  businessAlignment?: AutopilotBusinessAlignment;
  contentArchitecture?: AutopilotContentArchitecture;
  riskAssessment?: AutopilotRiskAssessment;
  categoryRecommendation?: AutopilotCategoryRecommendation;
  scoreBreakdown?: AutopilotScoreBreakdown;
  totalScore?: number;
  scoringVersion?: string;
  recommendationBand?: AutopilotRecommendationBand;
  decisionRationale?: string;
  decidedById?: number;
  decidedAt?: string;
  aiMetadata?: AutopilotAiMetadata;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Persistence-oriented topic shape aligned with Prisma `AutopilotTopic`.
 * Decimal columns are represented as numbers after service-layer conversion.
 * Domain `AutopilotTopicIdentity.id` remains a string for API/UI; DB id is numeric.
 */
export interface AutopilotTopicRecord {
  id: number;
  workingTitle: string;
  primaryKeyword: string;
  supportingKeywords: string[];
  keywordVariants: string[];
  userProblem: string;
  audience: string;
  market: string;
  language: string;
  location: string | null;
  source: AutopilotTopicSource;
  proposedSlug: string | null;
  primaryCategory: string | null;
  secondaryCategories: string[];
  topicStatus: AutopilotTopicStatus;
  decisionStatus: AutopilotDecisionStatus;
  briefStatus: AutopilotBriefStatus;
  draftStatus: AutopilotDraftStatus;
  mediaStatus: AutopilotMediaStatus;
  publishingStatus: AutopilotPublishingStatus;
  performanceStatus: AutopilotPerformanceStatus;
  searchIntent: AutopilotSearchIntent | null;
  serpEvidence: AutopilotSerpEvidence | null;
  businessAlignment: AutopilotBusinessAlignment | null;
  contentArchitecture: AutopilotContentArchitecture | null;
  riskAssessment: AutopilotRiskAssessment | null;
  categoryRecommendation: AutopilotCategoryRecommendation | null;
  scoreBreakdown: AutopilotScoreBreakdown | null;
  aiMetadata: AutopilotAiMetadata | null;
  serviceRelevance: number | null;
  businessValue: number | null;
  buyerIntent: number | null;
  topicalAuthorityFit: number | null;
  contentGap: number | null;
  differentiationPotential: number | null;
  rankingFeasibility: number | null;
  evidenceConfidence: number | null;
  internalLinkOpportunity: number | null;
  commercialPageSupport: number | null;
  cannibalisationPenalty: number | null;
  unsupportedClaimRiskPenalty: number | null;
  rawScore: number | null;
  totalScore: number | null;
  scoringVersion: string | null;
  assignedToId: number | null;
  createdById: number | null;
  updatedById: number | null;
  decidedById: number | null;
  decidedAt: string | null;
  decisionRationale: string | null;
  mergeIntoTopicId: number | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutopilotActivityLogRecord {
  id: number;
  entityType: string;
  entityId: string;
  eventType: string;
  actorType: string;
  actorId: number | null;
  actorDisplayName: string | null;
  source: string;
  previousValue: unknown | null;
  newValue: unknown | null;
  metadata: unknown | null;
  reason: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface AutopilotWorkflowRunRecord {
  id: number;
  workflowType: string;
  entityType: string;
  entityId: string;
  status: string;
  currentStep: string | null;
  totalSteps: number | null;
  progress: number;
  attempt: number;
  startedAt: string | null;
  completedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  providerMetadata: unknown | null;
  inputHash: string | null;
  correlationId: string | null;
  createdById: number | null;
  retryOfRunId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutopilotSettingRecord {
  id: number;
  key: string;
  value: unknown;
  description: string | null;
  isLocked: boolean;
  updatedById: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Locked foundation setting key seeded by the Autopilot Prisma migration. */
export const AUTOPILOT_SETTING_AUTO_PUBLISH_ENABLED = 'autoPublishEnabled' as const;

/* -------------------------------------------------------------------------- */
/* Phase 2B — Research snapshots & overlap analysis                           */
/* -------------------------------------------------------------------------- */

export type AutopilotOverlapMatchType =
  | 'exact_keyword_match'
  | 'exact_title_match'
  | 'exact_slug_match'
  | 'exact_route_match'
  | 'phrase_containment'
  | 'high_lexical_overlap'
  | 'moderate_lexical_overlap'
  | 'same_category_advisory'
  | 'same_cluster_advisory'
  | 'internal_link_opportunity';

export type AutopilotOverlapConfidenceClass =
  | 'exact'
  | 'high'
  | 'moderate'
  | 'advisory';

export type AutopilotOverlapClassification = 'blocking_advisory' | 'advisory';

export type AutopilotInventorySourceType =
  | 'static_blog'
  | 'cms_blog'
  | 'sdaas_insights'
  | 'autopilot_topic'
  | 'keyword_candidate';

export interface AutopilotOverlapFinding {
  sourceType: AutopilotInventorySourceType | string;
  sourceId?: string | number | null;
  sourceRoute?: string | null;
  sourceTitle?: string | null;
  matchType: AutopilotOverlapMatchType;
  confidenceClass: AutopilotOverlapConfidenceClass;
  classification: AutopilotOverlapClassification;
  explanation: string;
  comparedValues: {
    candidate?: string | null;
    existing?: string | null;
  };
  sharedTokens?: string[];
  formula?: string;
  formulaInputs?: {
    intersection?: number;
    union?: number;
    jaccard?: number;
    threshold?: number;
    minSharedTokens?: number;
  };
  publicationStatus?: string | null;
  workflowStatus?: string | null;
}

export interface AutopilotClusterHint {
  kind:
    | 'possible_existing_cluster'
    | 'likely_supporting_article'
    | 'possible_pillar_relationship'
    | 'potential_internal_link_from_article'
    | 'potential_internal_link_to_commercial'
    | 'no_clear_existing_cluster';
  label: string;
  explanation: string;
  sourceType?: AutopilotInventorySourceType | string;
  sourceId?: string | number | null;
  sourceRoute?: string | null;
  clusterId?: string | null;
}

export interface AutopilotInternalLinkHint {
  kind: 'from_existing_article' | 'to_commercial_page' | 'to_service_page';
  label: string;
  explanation: string;
  sourceType?: AutopilotInventorySourceType | string;
  sourceRoute?: string | null;
  sourceTitle?: string | null;
}

export interface AutopilotOverlapAnalysisResult {
  version: string;
  analysedAt: string;
  inventoryCounts: Record<string, number>;
  findings: AutopilotOverlapFinding[];
  clusterHints: AutopilotClusterHint[];
  internalLinkHints: AutopilotInternalLinkHint[];
  summary: {
    exactConflictCount: number;
    highOverlapCount: number;
    moderateOverlapCount: number;
    phraseContainmentCount: number;
    advisoryCount: number;
    clusterHintCount: number;
    internalLinkHintCount: number;
  };
}

export interface AutopilotResearchCompletenessSectionScore {
  key: string;
  weight: number;
  score: number;
  complete: boolean;
  missing: string[];
  warnings: string[];
}

export interface AutopilotResearchCompletenessResult {
  version: string;
  completeness: number;
  sectionScores: AutopilotResearchCompletenessSectionScore[];
  missingItems: string[];
  warnings: string[];
}

export interface AutopilotResearchReadinessResult {
  ready: boolean;
  blockers: Array<{ code: string; message: string }>;
  warnings: Array<{ code: string; message: string }>;
  completeness: AutopilotResearchCompletenessResult;
}

export interface AutopilotResearchSnapshotRecord {
  id: number;
  topicId: number;
  version: number;
  status: string;
  sourceType: string;
  query: string | null;
  market: string | null;
  language: string | null;
  location: string | null;
  searchIntent: AutopilotSearchIntent | null;
  serpEvidence: AutopilotSerpEvidence | null;
  businessAlignment: AutopilotBusinessAlignment | null;
  contentArchitecture: AutopilotContentArchitecture | null;
  riskAssessment: AutopilotRiskAssessment | null;
  overlapAnalysis: AutopilotOverlapAnalysisResult | null;
  clusterHints: AutopilotClusterHint[] | null;
  internalLinkHints: AutopilotInternalLinkHint[] | null;
  researchNotes: string | null;
  evidenceQuality: string;
  evidenceCompleteness: number | null;
  createdById: number | null;
  updatedById: number | null;
  confirmedById: number | null;
  confirmedAt: string | null;
  supersededAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AutopilotValidationSeverity = 'error' | 'warning';

export interface AutopilotValidationIssue {
  code: string;
  message: string;
  field?: string;
  severity: AutopilotValidationSeverity;
}

export interface AutopilotValidationResult {
  ok: boolean;
  errors: AutopilotValidationIssue[];
  warnings: AutopilotValidationIssue[];
}

export interface AutopilotCategoryAssignmentInput {
  primaryCategory?: string | null;
  secondaryCategories?: Array<string | null | undefined> | null;
}

export type AutopilotSlugConflictSource =
  | 'static_blog'
  | 'additional_reserved'
  | 'malformed'
  | 'none';

export interface AutopilotSlugReservationInput {
  candidate: string;
  /** Extra reserved paths/slugs (CMS, legacy redirects, insights) for later phases. */
  additionalReserved?: string[];
}

export interface AutopilotSlugReservationResult {
  ok: boolean;
  normalisedSlug: string;
  conflict: boolean;
  conflictSource: AutopilotSlugConflictSource;
  conflictValue?: string;
  message?: string;
}
