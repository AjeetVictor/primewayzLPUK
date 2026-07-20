import assert from 'node:assert/strict';
import test from 'node:test';
import { BLOG_CATEGORIES, isValidBlogCategorySlug } from '../../data/blog/categories.ts';
import {
  normaliseAutopilotCategoryAssignment,
  validateAutopilotCategoryOverride,
  validateAutopilotCategoryRecommendation,
  validateAutopilotFinalCategoryAssignment,
  validateAutopilotPrimaryCategory,
  validateAutopilotSecondaryCategories,
} from './categoryValidation.ts';

const knownPrimary = BLOG_CATEGORIES[0]?.slug;
const knownSecondary = BLOG_CATEGORIES[1]?.slug;

test('shared BLOG_CATEGORIES registry is used for validity', () => {
  assert.ok(knownPrimary);
  assert.ok(knownSecondary);
  assert.equal(isValidBlogCategorySlug(knownPrimary), true);
  assert.equal(isValidBlogCategorySlug('not-a-real-category'), false);
});

test('valid primary category passes', () => {
  const result = validateAutopilotPrimaryCategory(knownPrimary, { required: true });
  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
});

test('invalid primary category blocks', () => {
  const result = validateAutopilotPrimaryCategory('invented-category', { required: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === 'PRIMARY_CATEGORY_UNKNOWN'));
});

test('valid secondary categories pass', () => {
  const result = validateAutopilotSecondaryCategories([knownSecondary], knownPrimary);
  assert.equal(result.ok, true);
});

test('invalid secondary category blocks', () => {
  const result = validateAutopilotSecondaryCategories(['nope-category'], knownPrimary);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === 'SECONDARY_CATEGORY_UNKNOWN'));
});

test('duplicate secondaries are deduplicated with a warning', () => {
  const result = validateAutopilotSecondaryCategories(
    [knownSecondary, knownSecondary],
    knownPrimary,
  );
  assert.equal(result.ok, true);
  assert.ok(result.warnings.some((warning) => warning.code === 'SECONDARY_CATEGORY_DUPLICATES'));

  const normalised = normaliseAutopilotCategoryAssignment({
    primaryCategory: knownPrimary,
    secondaryCategories: [knownSecondary, knownSecondary],
  });
  assert.deepEqual(normalised.secondaryCategories, [knownSecondary]);
});

test('primary repeated as secondary is a blocking error', () => {
  const result = validateAutopilotSecondaryCategories([knownPrimary, knownSecondary], knownPrimary);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === 'SECONDARY_CONTAINS_PRIMARY'));
});

test('approval is blocked without primary category', () => {
  const result = validateAutopilotFinalCategoryAssignment({
    primaryCategory: undefined,
    secondaryCategories: [knownSecondary],
  });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => error.code === 'PRIMARY_CATEGORY_REQUIRED'));
});

test('category recommendation allows missing primary but blocks unknown slugs', () => {
  const missingPrimary = validateAutopilotCategoryRecommendation({
    secondaryCategories: [knownSecondary],
  });
  assert.equal(missingPrimary.ok, true);

  const unknown = validateAutopilotCategoryRecommendation({
    primaryCategory: 'made-up',
    secondaryCategories: [],
  });
  assert.equal(unknown.ok, false);
});

test('category override requires a valid final assignment', () => {
  const valid = validateAutopilotCategoryOverride({
    primaryCategory: knownPrimary,
    secondaryCategories: [knownSecondary],
  });
  assert.equal(valid.ok, true);

  const invalid = validateAutopilotCategoryOverride({
    primaryCategory: 'unknown-override',
    secondaryCategories: [],
  });
  assert.equal(invalid.ok, false);
});

test('normalisation strips primary from secondaries without inventing slugs', () => {
  const normalised = normaliseAutopilotCategoryAssignment({
    primaryCategory: knownPrimary,
    secondaryCategories: [knownPrimary, knownSecondary, 'still-unknown'],
  });
  assert.equal(normalised.primaryCategory, knownPrimary);
  assert.deepEqual(normalised.secondaryCategories, [knownSecondary, 'still-unknown']);
});
