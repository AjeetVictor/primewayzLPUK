/**
 * Deterministic research completeness calculator (Phase 2B).
 * Completeness measures section fill — not topic quality or SEO score.
 * Client-supplied totals are never accepted.
 */

import {
  AUTOPILOT_ARCHITECTURE_MIN_ITEMS,
  AUTOPILOT_RESEARCH_COMPLETENESS_VERSION,
  AUTOPILOT_RESEARCH_SECTION_WEIGHTS,
  AUTOPILOT_SERP_MIN_ROWS,
} from '../../data/autopilot/researchConfig.ts';
import type {
  AutopilotBusinessAlignment,
  AutopilotContentArchitecture,
  AutopilotResearchCompletenessResult,
  AutopilotResearchCompletenessSectionScore,
  AutopilotRiskAssessment,
  AutopilotSearchIntent,
  AutopilotSerpEvidence,
} from '../../data/autopilot/types.ts';

export type ResearchCompletenessInput = {
  searchIntent?: AutopilotSearchIntent | null;
  serpEvidence?: AutopilotSerpEvidence | null;
  businessAlignment?: AutopilotBusinessAlignment | null;
  contentArchitecture?: AutopilotContentArchitecture | null;
  riskAssessment?: AutopilotRiskAssessment | null;
};

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function resolvePrimaryIntent(intent: AutopilotSearchIntent | null | undefined): string | null {
  if (!intent) return null;
  if (hasText(intent.primaryIntent)) return String(intent.primaryIntent).trim();
  if (hasText(intent.dominantIntent)) return String(intent.dominantIntent).trim();
  return null;
}

function resolveJourneyStage(intent: AutopilotSearchIntent | null | undefined): string | null {
  if (!intent) return null;
  if (hasText(intent.journeyStage)) return String(intent.journeyStage).trim();
  if (hasText(intent.funnelStage)) return String(intent.funnelStage).trim();
  return null;
}

function resolveUserNeed(intent: AutopilotSearchIntent | null | undefined): string | null {
  if (!intent) return null;
  if (hasText(intent.userNeed)) return intent.userNeed!.trim();
  return null;
}

function scoreSearchIntent(
  intent: AutopilotSearchIntent | null | undefined,
): AutopilotResearchCompletenessSectionScore {
  const weight = AUTOPILOT_RESEARCH_SECTION_WEIGHTS.searchIntent;
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!resolvePrimaryIntent(intent)) missing.push('primaryIntent');
  if (!resolveUserNeed(intent)) missing.push('userNeed');
  if (!resolveJourneyStage(intent)) missing.push('journeyStage');

  const required = 3;
  const present = required - missing.length;
  const score = Math.round((present / required) * weight * 10) / 10;

  return {
    key: 'searchIntent',
    weight,
    score,
    complete: missing.length === 0,
    missing,
    warnings,
  };
}

function scoreSerpEvidence(
  serp: AutopilotSerpEvidence | null | undefined,
): AutopilotResearchCompletenessSectionScore {
  const weight = AUTOPILOT_RESEARCH_SECTION_WEIGHTS.serpEvidence;
  const missing: string[] = [];
  const warnings: string[] = [];
  const rows = Array.isArray(serp?.rows) ? serp!.rows! : [];
  const limitation = hasText(serp?.evidenceLimitation)
    ? serp!.evidenceLimitation!.trim()
    : hasText(serp?.notes)
      ? null
      : null;
  const explicitLimitation =
    hasText(serp?.evidenceLimitation) ? serp!.evidenceLimitation!.trim() : '';

  const rowOk = rows.length >= AUTOPILOT_SERP_MIN_ROWS;
  const limitationOk = explicitLimitation.length > 0;

  if (!rowOk && !limitationOk) {
    missing.push(
      `serpEvidence.rows (need ≥${AUTOPILOT_SERP_MIN_ROWS}) or evidenceLimitation`,
    );
  }

  if (rows.length > 0 && rows.length < AUTOPILOT_SERP_MIN_ROWS && !limitationOk) {
    warnings.push(
      `Fewer than ${AUTOPILOT_SERP_MIN_ROWS} SERP evidence rows without an evidence limitation.`,
    );
  }

  // Unused intentionally — keep local for clarity if notes-as-limitation is reconsidered.
  void limitation;

  const score = missing.length === 0 ? weight : 0;

  return {
    key: 'serpEvidence',
    weight,
    score,
    complete: missing.length === 0,
    missing,
    warnings,
  };
}

function scoreBusinessAlignment(
  biz: AutopilotBusinessAlignment | null | undefined,
): AutopilotResearchCompletenessSectionScore {
  const weight = AUTOPILOT_RESEARCH_SECTION_WEIGHTS.businessAlignment;
  const missing: string[] = [];
  const warnings: string[] = [];

  const serviceNotes =
    hasText(biz?.serviceRelevanceNotes) ||
    hasText(biz?.serviceFit) ||
    hasText(biz?.relevantService);
  const valueNotes =
    hasText(biz?.businessValueNotes) ||
    hasText(biz?.commercialValue) ||
    hasText(biz?.conversionOpportunity);

  if (!serviceNotes) missing.push('serviceRelevanceNotes');
  if (!valueNotes) missing.push('businessValueNotes');

  const paths = [
    ...stringList(biz?.targetServicePaths),
    ...stringList(biz?.targetCommercialPaths),
  ];
  if (hasText(biz?.relevantMoneyPage)) paths.push(biz!.relevantMoneyPage!.trim());
  if (hasText(biz?.relevantService) && biz!.relevantService!.startsWith('/')) {
    paths.push(biz!.relevantService!.trim());
  }

  const noPathReason = hasText(biz?.noSuitablePathReason)
    ? biz!.noSuitablePathReason!.trim()
    : '';

  if (paths.length === 0 && !noPathReason) {
    missing.push('targetServicePaths/targetCommercialPaths or noSuitablePathReason');
  }

  const required = 3;
  const present = required - missing.length;
  const score = Math.round((Math.max(0, present) / required) * weight * 10) / 10;

  return {
    key: 'businessAlignment',
    weight,
    score,
    complete: missing.length === 0,
    missing,
    warnings,
  };
}

function scoreContentArchitecture(
  arch: AutopilotContentArchitecture | null | undefined,
): AutopilotResearchCompletenessSectionScore {
  const weight = AUTOPILOT_RESEARCH_SECTION_WEIGHTS.contentArchitecture;
  const missing: string[] = [];
  const warnings: string[] = [];

  const pageType =
    hasText(arch?.proposedPageType) || hasText(arch?.intendedPageType);
  const angle = hasText(arch?.differentiationAngle) || hasText(arch?.contentGap);

  if (!pageType) missing.push('proposedPageType');
  if (!angle) missing.push('differentiationAngle');

  const sections = stringList(arch?.requiredSections);
  const questions = stringList(arch?.supportingQuestions);
  if (sections.length + questions.length < AUTOPILOT_ARCHITECTURE_MIN_ITEMS) {
    missing.push(
      `requiredSections/supportingQuestions (need ≥${AUTOPILOT_ARCHITECTURE_MIN_ITEMS} combined)`,
    );
  }

  const required = 3;
  const present = required - missing.length;
  const score = Math.round((Math.max(0, present) / required) * weight * 10) / 10;

  return {
    key: 'contentArchitecture',
    weight,
    score,
    complete: missing.length === 0,
    missing,
    warnings,
  };
}

function scoreRiskAssessment(
  risk: AutopilotRiskAssessment | null | undefined,
): AutopilotResearchCompletenessSectionScore {
  const weight = AUTOPILOT_RESEARCH_SECTION_WEIGHTS.riskAssessment;
  const missing: string[] = [];
  const warnings: string[] = [];

  const cannibal =
    hasText(risk?.cannibalisationNotes) || hasText(risk?.cannibalisationRisk);
  const claims =
    hasText(risk?.unsupportedClaimRisks) || hasText(risk?.unsupportedClaimRisk);
  const limitations =
    hasText(risk?.evidenceLimitations) ||
    hasText(risk?.notes);

  if (!cannibal) missing.push('cannibalisationNotes');
  if (!claims) missing.push('unsupportedClaimRisks');
  if (!limitations) missing.push('evidenceLimitations');

  const required = 3;
  const present = required - missing.length;
  const score = Math.round((Math.max(0, present) / required) * weight * 10) / 10;

  return {
    key: 'riskAssessment',
    weight,
    score,
    complete: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Calculate research completeness from structured evidence sections.
 * Does not accept a client-provided completeness total.
 */
export function calculateResearchCompleteness(
  input: ResearchCompletenessInput,
): AutopilotResearchCompletenessResult {
  const sectionScores = [
    scoreSearchIntent(input.searchIntent),
    scoreSerpEvidence(input.serpEvidence),
    scoreBusinessAlignment(input.businessAlignment),
    scoreContentArchitecture(input.contentArchitecture),
    scoreRiskAssessment(input.riskAssessment),
  ];

  const rawTotal = sectionScores.reduce((sum, section) => sum + section.score, 0);
  const completeness = Math.round(Math.min(100, Math.max(0, rawTotal)) * 10) / 10;

  const missingItems = sectionScores.flatMap((section) =>
    section.missing.map((item) => `${section.key}.${item}`),
  );
  const warnings = sectionScores.flatMap((section) => section.warnings);

  return {
    version: AUTOPILOT_RESEARCH_COMPLETENESS_VERSION,
    completeness,
    sectionScores,
    missingItems,
    warnings,
  };
}
