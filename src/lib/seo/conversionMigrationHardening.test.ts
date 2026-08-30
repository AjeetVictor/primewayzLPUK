/**
 * Tests for conversion daily hardening migration semantics.
 */

import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { computeConversionBucketKeyHash } from './conversionBucketKey.ts';

const migrationPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../prisma/migrations/20260830160000_seo_conversion_daily_hardening/migration.sql',
);

type DuplicateRow = {
  id: number;
  metricDate: string;
  bucketKeyHash: string;
  updatedAt: string;
  chatsInitiated: number;
  qualifiedLeads: number;
  proposals: number;
  attributedValueMinor: number;
};

function buildSqlBucketKeyHash(input: {
  seoPageId: number | null;
  attributionModel: string;
  channelGroup: string;
}): string {
  const pagePart =
    input.seoPageId === null || input.seoPageId === undefined
      ? 'unknown'
      : String(input.seoPageId);
  const payload = [pagePart, input.attributionModel, input.channelGroup.trim().toLowerCase()].join(
    '\0',
  );
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

function selectDuplicateSurvivors(rows: DuplicateRow[]): DuplicateRow[] {
  const grouped = new Map<string, DuplicateRow[]>();
  for (const row of rows) {
    const key = `${row.metricDate}|${row.bucketKeyHash}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(row);
    grouped.set(key, bucket);
  }

  const survivors: DuplicateRow[] = [];
  for (const group of grouped.values()) {
    const sorted = [...group].sort((left, right) => {
      const updatedDiff = right.updatedAt.localeCompare(left.updatedAt);
      return updatedDiff !== 0 ? updatedDiff : right.id - left.id;
    });
    survivors.push(sorted[0]!);
  }
  return survivors.sort((left, right) => left.id - right.id);
}

test('bucket hash SQL uses CHAR(0) separators', () => {
  const sql = readFileSync(migrationPath, 'utf8');
  assert.match(sql, /CHAR\(0\)/);
  assert.equal(sql.includes("'\\0'"), false);
});

test('SQL CHAR(0) hash payload matches Node bucket helper', () => {
  const cases = [
    { seoPageId: 42, attributionModel: 'first_touch', channelGroup: 'organic' },
    { seoPageId: null, attributionModel: 'last_touch', channelGroup: ' Direct ' },
    { seoPageId: 7, attributionModel: 'first_touch', channelGroup: 'paid' },
  ] as const;

  for (const input of cases) {
    assert.equal(buildSqlBucketKeyHash(input), computeConversionBucketKeyHash(input));
  }
});

test('newest duplicate snapshot survives without summing counters', () => {
  const bucketKeyHash = computeConversionBucketKeyHash({
    seoPageId: null,
    attributionModel: 'first_touch',
    channelGroup: 'unknown',
  });
  const survivors = selectDuplicateSurvivors([
    {
      id: 10,
      metricDate: '2026-07-10',
      bucketKeyHash,
      updatedAt: '2026-07-10T10:00:00.000Z',
      chatsInitiated: 2,
      qualifiedLeads: 1,
      proposals: 0,
      attributedValueMinor: 1000,
    },
    {
      id: 11,
      metricDate: '2026-07-10',
      bucketKeyHash,
      updatedAt: '2026-07-11T10:00:00.000Z',
      chatsInitiated: 5,
      qualifiedLeads: 3,
      proposals: 1,
      attributedValueMinor: 2500,
    },
  ]);

  assert.equal(survivors.length, 1);
  assert.equal(survivors[0]?.id, 11);
  assert.equal(survivors[0]?.chatsInitiated, 5);
  assert.equal(survivors[0]?.qualifiedLeads, 3);
  assert.equal(survivors[0]?.proposals, 1);
  assert.equal(survivors[0]?.attributedValueMinor, 2500);
});

test('duplicate counters are not summed', () => {
  const bucketKeyHash = computeConversionBucketKeyHash({
    seoPageId: 3,
    attributionModel: 'last_touch',
    channelGroup: 'organic',
  });
  const survivors = selectDuplicateSurvivors([
    {
      id: 20,
      metricDate: '2026-07-12',
      bucketKeyHash,
      updatedAt: '2026-07-12T08:00:00.000Z',
      chatsInitiated: 4,
      qualifiedLeads: 2,
      proposals: 1,
      attributedValueMinor: 500,
    },
    {
      id: 21,
      metricDate: '2026-07-12',
      bucketKeyHash,
      updatedAt: '2026-07-13T08:00:00.000Z',
      chatsInitiated: 1,
      qualifiedLeads: 0,
      proposals: 0,
      attributedValueMinor: 0,
    },
  ]);

  assert.equal(survivors[0]?.chatsInitiated, 1);
  assert.equal(survivors[0]?.qualifiedLeads, 0);
  assert.equal(survivors[0]?.proposals, 0);
});

test('duplicate attributedValueMinor is not doubled', () => {
  const bucketKeyHash = computeConversionBucketKeyHash({
    seoPageId: 8,
    attributionModel: 'first_touch',
    channelGroup: 'email',
  });
  const survivors = selectDuplicateSurvivors([
    {
      id: 30,
      metricDate: '2026-07-14',
      bucketKeyHash,
      updatedAt: '2026-07-14T09:00:00.000Z',
      chatsInitiated: 0,
      qualifiedLeads: 0,
      proposals: 0,
      attributedValueMinor: 1200,
    },
    {
      id: 31,
      metricDate: '2026-07-14',
      bucketKeyHash,
      updatedAt: '2026-07-15T09:00:00.000Z',
      chatsInitiated: 0,
      qualifiedLeads: 0,
      proposals: 0,
      attributedValueMinor: 900,
    },
  ]);

  assert.equal(survivors[0]?.attributedValueMinor, 900);
  assert.notEqual(survivors[0]?.attributedValueMinor, 2100);
});

test('updatedAt tie uses highest id', () => {
  const bucketKeyHash = computeConversionBucketKeyHash({
    seoPageId: 2,
    attributionModel: 'last_touch',
    channelGroup: 'direct',
  });
  const survivors = selectDuplicateSurvivors([
    {
      id: 40,
      metricDate: '2026-07-16',
      bucketKeyHash,
      updatedAt: '2026-07-16T12:00:00.000Z',
      chatsInitiated: 1,
      qualifiedLeads: 0,
      proposals: 0,
      attributedValueMinor: 0,
    },
    {
      id: 41,
      metricDate: '2026-07-16',
      bucketKeyHash,
      updatedAt: '2026-07-16T12:00:00.000Z',
      chatsInitiated: 7,
      qualifiedLeads: 2,
      proposals: 1,
      attributedValueMinor: 300,
    },
  ]);

  assert.equal(survivors[0]?.id, 41);
  assert.equal(survivors[0]?.chatsInitiated, 7);
});

test('migration deletes duplicate rows instead of merging counters', () => {
  const sql = readFileSync(migrationPath, 'utf8');
  assert.match(sql, /ROW_NUMBER\(\) OVER/);
  assert.match(sql, /ORDER BY `updatedAt` DESC, `id` DESC/);
  assert.equal(sql.includes('SUM(`chatsInitiated`)'), false);
  assert.equal(sql.includes('_SeoConversionDupSurvivors'), false);
});
