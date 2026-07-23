import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REVIEW_DB_COLUMN_CAPACITIES,
  REVIEW_FIELD_LIMITS,
} from '../../constants/digitalSystemsReview.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

/**
 * Application validation must never accept a value wider than its DB column.
 * Fail if a validated value can exceed its database column.
 */
test('application validation limits fit database column capacities', () => {
  assert.ok(
    REVIEW_FIELD_LIMITS.submissionIdMax <= REVIEW_DB_COLUMN_CAPACITIES.submissionId,
    'submissionId',
  );
  assert.ok(REVIEW_FIELD_LIMITS.nameMax <= REVIEW_DB_COLUMN_CAPACITIES.name, 'name');
  assert.ok(
    REVIEW_FIELD_LIMITS.emailMax <= REVIEW_DB_COLUMN_CAPACITIES.workEmail,
    'workEmail',
  );
  assert.ok(
    REVIEW_FIELD_LIMITS.companyMax <= REVIEW_DB_COLUMN_CAPACITIES.company,
    'company',
  );
  assert.ok(
    REVIEW_FIELD_LIMITS.websiteMax <= REVIEW_DB_COLUMN_CAPACITIES.website,
    'website',
  );
  assert.ok(
    REVIEW_FIELD_LIMITS.landingPageMax <= REVIEW_DB_COLUMN_CAPACITIES.landingPage,
    'landingPage',
  );
  assert.ok(
    REVIEW_FIELD_LIMITS.sourceLocationMax <= REVIEW_DB_COLUMN_CAPACITIES.sourceLocation,
    'sourceLocation',
  );
  assert.ok(
    REVIEW_FIELD_LIMITS.chatSessionIdMax <= REVIEW_DB_COLUMN_CAPACITIES.chatSessionId,
    'chatSessionId',
  );
});

test('websiteMax and landingPageMax fit migration column widths', () => {
  assert.equal(REVIEW_FIELD_LIMITS.websiteMax, 200);
  assert.ok(REVIEW_FIELD_LIMITS.websiteMax <= 255);
  assert.equal(REVIEW_FIELD_LIMITS.landingPageMax, 500);
  assert.ok(REVIEW_FIELD_LIMITS.landingPageMax <= 500);
});

test('Prisma schema and migration SQL declare matching column widths', () => {
  const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
  const migration = fs.readFileSync(
    path.join(
      root,
      'prisma/migrations/20260722190000_digital_systems_review_leads/migration.sql',
    ),
    'utf8',
  );

  const schemaChecks: Array<[string, RegExp]> = [
    ['submissionId', /submissionId\s+String\s+@unique\s+@db\.VarChar\(64\)/],
    ['name', /name\s+String\s+@db\.VarChar\(80\)/],
    ['workEmail', /workEmail\s+String\s+@db\.VarChar\(191\)/],
    ['company', /company\s+String\s+@db\.VarChar\(120\)/],
    ['website', /website\s+String\?\s+@db\.VarChar\(255\)/],
    ['landingPage', /landingPage\s+String\?\s+@db\.VarChar\(500\)/],
    ['sourceLocation', /sourceLocation\s+String\?\s+@db\.VarChar\(80\)/],
    ['chatSessionId', /chatSessionId\s+String\?\s+@db\.VarChar\(64\)/],
  ];
  for (const [label, pattern] of schemaChecks) {
    assert.match(schema, pattern, `schema ${label}`);
  }

  const sqlChecks: Array<[string, RegExp]> = [
    ['submissionId', /`submissionId` VARCHAR\(64\)/],
    ['name', /`name` VARCHAR\(80\)/],
    ['workEmail', /`workEmail` VARCHAR\(191\)/],
    ['company', /`company` VARCHAR\(120\)/],
    ['website', /`website` VARCHAR\(255\)/],
    ['landingPage', /`landingPage` VARCHAR\(500\)/],
    ['sourceLocation', /`sourceLocation` VARCHAR\(80\)/],
    ['chatSessionId', /`chatSessionId` VARCHAR\(64\)/],
  ];
  for (const [label, pattern] of sqlChecks) {
    assert.match(migration, pattern, `migration ${label}`);
  }
});
