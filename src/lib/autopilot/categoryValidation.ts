/**
 * Category assignment validation for Autopilot topics.
 * Uses BLOG_CATEGORIES as the only taxonomy source of truth.
 */

import { isValidBlogCategorySlug } from '../../data/blog/categories.ts';
import type {
  AutopilotCategoryAssignmentInput,
  AutopilotCategoryRecommendation,
  AutopilotValidationIssue,
  AutopilotValidationResult,
} from '../../data/autopilot/types.ts';

function issue(
  code: string,
  message: string,
  field?: string,
  severity: AutopilotValidationIssue['severity'] = 'error',
): AutopilotValidationIssue {
  return { code, message, field, severity };
}

function emptyResult(): AutopilotValidationResult {
  return { ok: true, errors: [], warnings: [] };
}

function finalise(errors: AutopilotValidationIssue[], warnings: AutopilotValidationIssue[] = []): AutopilotValidationResult {
  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

function dedupePreserveOrder(slugs: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const slug of slugs) {
    if (seen.has(slug)) continue;
    seen.add(slug);
    result.push(slug);
  }
  return result;
}

function collectSecondaryCandidates(
  secondaryCategories?: Array<string | null | undefined> | null,
): { cleaned: string[]; duplicatesRemoved: string[] } {
  const raw = (secondaryCategories || [])
    .map((slug) => (typeof slug === 'string' ? slug.trim() : ''))
    .filter(Boolean);

  const cleaned = dedupePreserveOrder(raw);
  const duplicatesRemoved = raw.filter((slug, index) => raw.indexOf(slug) !== index);

  return {
    cleaned,
    duplicatesRemoved: dedupePreserveOrder(duplicatesRemoved),
  };
}

export interface AutopilotNormalisedCategoryAssignment {
  primaryCategory?: string;
  secondaryCategories: string[];
}

/**
 * Normalise assignment shape without inventing unknown category slugs.
 * Unknown values are preserved so validation can report blocking errors.
 */
export function normaliseAutopilotCategoryAssignment(
  input: AutopilotCategoryAssignmentInput,
): AutopilotNormalisedCategoryAssignment {
  const primary =
    typeof input.primaryCategory === 'string' && input.primaryCategory.trim()
      ? input.primaryCategory.trim()
      : undefined;

  const { cleaned } = collectSecondaryCandidates(input.secondaryCategories);
  const secondaryCategories = primary
    ? cleaned.filter((slug) => slug !== primary)
    : cleaned;

  return { primaryCategory: primary, secondaryCategories };
}

export function validateAutopilotPrimaryCategory(
  primaryCategory?: string | null,
  options: { required?: boolean } = {},
): AutopilotValidationResult {
  const required = options.required ?? false;
  const errors: AutopilotValidationIssue[] = [];
  const trimmed =
    typeof primaryCategory === 'string' && primaryCategory.trim()
      ? primaryCategory.trim()
      : undefined;

  if (!trimmed) {
    if (required) {
      errors.push(
        issue(
          'PRIMARY_CATEGORY_REQUIRED',
          'Primary category is required.',
          'primaryCategory',
        ),
      );
    }
    return finalise(errors);
  }

  if (!isValidBlogCategorySlug(trimmed)) {
    errors.push(
      issue(
        'PRIMARY_CATEGORY_UNKNOWN',
        `Unknown primary category: ${trimmed}. Categories must exist in the blog category registry.`,
        'primaryCategory',
      ),
    );
  }

  return finalise(errors);
}

export function validateAutopilotSecondaryCategories(
  secondaryCategories?: Array<string | null | undefined> | null,
  primaryCategory?: string | null,
): AutopilotValidationResult {
  const errors: AutopilotValidationIssue[] = [];
  const warnings: AutopilotValidationIssue[] = [];
  const primary =
    typeof primaryCategory === 'string' && primaryCategory.trim()
      ? primaryCategory.trim()
      : undefined;

  const { cleaned, duplicatesRemoved } = collectSecondaryCandidates(secondaryCategories);

  if (duplicatesRemoved.length > 0) {
    warnings.push(
      issue(
        'SECONDARY_CATEGORY_DUPLICATES',
        `Duplicate secondary categories were removed: ${duplicatesRemoved.join(', ')}.`,
        'secondaryCategories',
        'warning',
      ),
    );
  }

  for (const slug of cleaned) {
    if (!isValidBlogCategorySlug(slug)) {
      errors.push(
        issue(
          'SECONDARY_CATEGORY_UNKNOWN',
          `Unknown secondary category: ${slug}. Categories must exist in the blog category registry.`,
          'secondaryCategories',
        ),
      );
    }
    if (primary && slug === primary) {
      errors.push(
        issue(
          'SECONDARY_CONTAINS_PRIMARY',
          'Primary category must not appear in secondary categories.',
          'secondaryCategories',
        ),
      );
    }
  }

  return finalise(errors, warnings);
}

export function validateAutopilotCategoryAssignment(
  input: AutopilotCategoryAssignmentInput,
  options: { requirePrimary?: boolean } = {},
): AutopilotValidationResult {
  const requirePrimary = options.requirePrimary ?? false;
  const normalised = normaliseAutopilotCategoryAssignment(input);
  const primaryResult = validateAutopilotPrimaryCategory(normalised.primaryCategory, {
    required: requirePrimary,
  });
  const secondaryResult = validateAutopilotSecondaryCategories(
    input.secondaryCategories,
    normalised.primaryCategory,
  );

  return finalise(
    [...primaryResult.errors, ...secondaryResult.errors],
    [...primaryResult.warnings, ...secondaryResult.warnings],
  );
}

/** Recommendation may omit primary until a human assigns one; unknown slugs still block. */
export function validateAutopilotCategoryRecommendation(
  recommendation: AutopilotCategoryRecommendation | AutopilotCategoryAssignmentInput,
): AutopilotValidationResult {
  return validateAutopilotCategoryAssignment(
    {
      primaryCategory: recommendation.primaryCategory,
      secondaryCategories: recommendation.secondaryCategories,
    },
    { requirePrimary: false },
  );
}

/** Final assignment used for decision approval — primary required. */
export function validateAutopilotFinalCategoryAssignment(
  input: AutopilotCategoryAssignmentInput,
): AutopilotValidationResult {
  return validateAutopilotCategoryAssignment(input, { requirePrimary: true });
}

/**
 * Human override of recommended categories.
 * Override must itself be a valid final assignment (primary required).
 */
export function validateAutopilotCategoryOverride(
  override: AutopilotCategoryAssignmentInput,
): AutopilotValidationResult {
  return validateAutopilotFinalCategoryAssignment(override);
}

export function mergeAutopilotValidationResults(
  ...results: AutopilotValidationResult[]
): AutopilotValidationResult {
  const errors = results.flatMap((result) => result.errors);
  const warnings = results.flatMap((result) => result.warnings);
  return finalise(errors, warnings);
}

export { emptyResult as emptyAutopilotValidationResult };
