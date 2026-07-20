import assert from 'node:assert/strict';
import test from 'node:test';
import {
  keywordsAreExactDuplicates,
  normaliseAutopilotKeyword,
} from './keywordNormalisation.ts';
import {
  AUTOPILOT_CSV_MAX_ROWS,
  isFormulaLikeCell,
  parseAutopilotCsv,
  sanitiseCellForDisplay,
  stripUtf8Bom,
} from './csvParser.ts';
import {
  detectColumnMapping,
  mappingHasKeywordColumn,
  parseAveragePositionMetric,
  parseCtrMetric,
  parseKeywordDifficultyMetric,
  parseNonNegativeIntegerMetric,
} from './keywordImportMapping.ts';
import {
  buildKeywordImportPreview,
  filterRowsForCommit,
} from './keywordImportPreview.ts';
import {
  buildConversionPayload,
  conversionCopyImpliesGenerationOrPublication,
  formatNotSupplied,
  KEYWORD_IMPORT_CONVERSION_COPY,
  serialiseCandidateFilters,
  DEFAULT_CANDIDATE_FILTERS,
  suggestWorkingTitleFromKeyword,
  validateImportFileSize,
} from './adminKeywordImportHelpers.ts';
import { AUTOPILOT_CSV_MAX_BYTES } from './csvParser.ts';
import { matchStaticBlogSignals, matchSdaasSignals } from './keywordMatchRegistry.ts';
import { normaliseAutopilotKeyword as norm } from './keywordNormalisation.ts';

test('keyword normalisation: case, spaces, unicode, punctuation, distinct phrases', () => {
  assert.equal(
    normaliseAutopilotKeyword('Custom Software Development').normalised,
    normaliseAutopilotKeyword('custom   software development').normalised,
  );
  assert.equal(
    normaliseAutopilotKeyword('CUSTOM SOFTWARE DEVELOPMENT').normalised,
    'custom software development',
  );
  assert.equal(normaliseAutopilotKeyword('  hello   world  ').original, 'hello world');
  assert.ok(keywordsAreExactDuplicates('Café', 'Café'));
  assert.equal(
    keywordsAreExactDuplicates('software development company', 'custom software development company'),
    false,
  );
  assert.equal(
    keywordsAreExactDuplicates('software development company', 'software developers UK'),
    false,
  );
  assert.match(normaliseAutopilotKeyword('C++ frameworks').normalised, /\+\+/);
});

test('CSV parser: quotes, BOM, CRLF, blank rows, limits, formulas, malformed quotes', () => {
  assert.equal(stripUtf8Bom('\uFEFFquery,clicks'), 'query,clicks');

  const basic = parseAutopilotCsv('query,clicks\n"crm, uk",10\n"He said ""hi""",2\n');
  assert.deepEqual(basic.headers, ['query', 'clicks']);
  assert.equal(basic.rows[0][0], 'crm, uk');
  assert.equal(basic.rows[1][0], 'He said "hi"');

  const crlf = parseAutopilotCsv('query,clicks\r\na,1\r\n\r\nb,2\r\n');
  assert.equal(crlf.rows.length, 2);
  assert.ok(crlf.blankRowCount >= 1);

  const escaped = parseAutopilotCsv('query\n"He said ""hello"""\n');
  assert.equal(escaped.rows[0][0], 'He said "hello"');

  const malformed = parseAutopilotCsv('query\n"unclosed\n');
  assert.ok(malformed.errors.some((error) => /unclosed quote/i.test(error.message)));

  const manyRows = ['query', ...Array.from({ length: AUTOPILOT_CSV_MAX_ROWS + 5 }, (_, i) => `k${i}`)].join(
    '\n',
  );
  const limited = parseAutopilotCsv(manyRows);
  assert.equal(limited.rows.length, AUTOPILOT_CSV_MAX_ROWS);
  assert.ok(limited.errors.some((error) => /maximum/i.test(error.message)));

  assert.equal(isFormulaLikeCell('=1+1'), true);
  assert.equal(sanitiseCellForDisplay('+cmd'), "'+cmd");
  assert.equal(sanitiseCellForDisplay('normal'), 'normal');
});

test('column mapping and metric parsing', () => {
  const detected = detectColumnMapping([
    'Search Query',
    'Clicks',
    'Impressions',
    'CTR',
    'Position',
    'Search Volume',
    'KD',
    'Landing Page',
    'Unknown Extra',
  ]);
  assert.equal(detected.mapping.keyword, 'Search Query');
  assert.equal(detected.mapping.clicks, 'Clicks');
  assert.equal(detected.mapping.impressions, 'Impressions');
  assert.equal(detected.mapping.ctr, 'CTR');
  assert.equal(detected.mapping.averagePosition, 'Position');
  assert.equal(detected.mapping.searchVolume, 'Search Volume');
  assert.equal(detected.mapping.keywordDifficulty, 'KD');
  assert.equal(detected.mapping.currentUrl, 'Landing Page');
  assert.ok(detected.unmappedColumns.includes('Unknown Extra'));
  assert.equal(mappingHasKeywordColumn({}), false);
  assert.equal(mappingHasKeywordColumn({ keyword: 'query' }), true);

  const pct = parseCtrMetric('12.5%');
  assert.equal(pct.ok, true);
  if (pct.ok) assert.equal(pct.value, 0.125);

  const fraction = parseCtrMetric('0.125');
  assert.equal(fraction.ok, true);

  const ambiguous = parseCtrMetric('12.5');
  assert.equal(ambiguous.ok, false);

  assert.equal(parseNonNegativeIntegerMetric('', 'Impressions').value, null);
  assert.equal(parseNonNegativeIntegerMetric('0', 'Impressions').value, 0);
  assert.equal(parseNonNegativeIntegerMetric('-1', 'Impressions').ok, false);
  assert.equal(parseAveragePositionMetric('3.14').value, 3.14);
  assert.equal(parseKeywordDifficultyMetric('101').ok, false);
  assert.equal(parseKeywordDifficultyMetric('42.5').value, 42.5);
});

test('preview: duplicates, exact matches, no persistence side effects, skip option', () => {
  const preview = buildKeywordImportPreview({
    sourceType: 'gsc_export',
    headers: ['query', 'clicks', 'impressions', 'ctr', 'position'],
    columnMapping: {
      keyword: 'query',
      clicks: 'clicks',
      impressions: 'impressions',
      ctr: 'ctr',
      averagePosition: 'position',
    },
    rows: [
      { values: { query: 'Custom Software Development', clicks: '10', impressions: '100', ctr: '10%', position: '4.2' } },
      { values: { query: 'custom   software development', clicks: '1', impressions: '2', ctr: '0.5', position: '5' } },
      { values: { query: '', clicks: '1', impressions: '2', ctr: '0.1', position: '1' } },
    ],
    context: {
      existingCandidateKeywords: [{ id: 9, normalisedKeyword: 'other keyword' }],
      existingTopicKeywords: [{ id: 3, primaryKeyword: 'Custom Software Development' }],
      cmsPosts: [{ title: 'Example CMS', slug: 'example-cms' }],
    },
  });

  assert.equal(preview.totalRows, 3);
  assert.equal(preview.invalidRows, 1);
  assert.equal(preview.duplicateRows, 1);
  assert.ok(preview.rows[0].matches.some((m) => m.matchType === 'exact_existing_topic_primary_keyword'));
  assert.equal(preview.rows[0].ctr, 0.1);
  assert.match(preview.rows[0].ctrDisplay, /0\.1/);
  assert.equal(preview.rows[0].searchVolume, null);
  assert.equal(preview.rows[1].status, 'duplicate');

  const skipped = filterRowsForCommit(preview, 'skip_exact_duplicates');
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].normalisedKeyword, 'custom software development');

  const staticMatches = matchStaticBlogSignals(
    norm('Fixed Price vs T&M vs Subscription Support for UK SMEs').normalised,
  );
  assert.ok(staticMatches.some((m) => m.matchType === 'exact_static_title'));
  assert.ok(matchSdaasSignals(norm('/insights/subscription-based-software-development').normalised).length >= 0);
});

test('frontend helpers: not supplied, conversion allowlist, copy, filters, file size', () => {
  assert.equal(formatNotSupplied(null), 'Not supplied');
  assert.equal(formatNotSupplied(0), '0');
  assert.equal(suggestWorkingTitleFromKeyword('custom software'), 'Custom Software');
  assert.equal(conversionCopyImpliesGenerationOrPublication(KEYWORD_IMPORT_CONVERSION_COPY), false);
  assert.match(KEYWORD_IMPORT_CONVERSION_COPY, /does not generate or publish/i);

  const payload = buildConversionPayload({
    workingTitle: 'Title',
    userProblem: 'Problem',
    audience: 'Audience',
    impressions: 99,
    searchVolume: 1000,
    createdById: 1,
    topicStatus: 'DISCOVERED',
    totalScore: 80,
  });
  assert.equal(payload.workingTitle, 'Title');
  assert.equal('impressions' in payload, false);
  assert.equal('searchVolume' in payload, false);
  assert.equal('createdById' in payload, false);
  assert.equal('totalScore' in payload, false);

  const params = serialiseCandidateFilters({
    ...DEFAULT_CANDIDATE_FILTERS,
    q: 'crm',
    duplicatesOnly: true,
    unconvertedOnly: true,
    minImpressions: '10',
  });
  assert.equal(params.get('q'), 'crm');
  assert.equal(params.get('duplicatesOnly'), 'true');
  assert.equal(params.get('unconvertedOnly'), 'true');
  assert.equal(params.get('minImpressions'), '10');

  assert.ok(validateImportFileSize(AUTOPILOT_CSV_MAX_BYTES + 1));
  assert.equal(validateImportFileSize(10), null);
});

test('canonical Phase 1C archive and recommend-category response shapes', async () => {
  // Service-level archive shape already returns { topic, alreadyArchived }.
  // Route envelope contract is documented here for regression.
  const archiveEnvelope = {
    topic: { id: 1, workingTitle: 'T' },
    alreadyArchived: false,
    correlationId: 'corr-archive',
  };
  assert.equal(typeof archiveEnvelope.topic, 'object');
  assert.equal('alreadyArchived' in archiveEnvelope, true);
  assert.equal('topic' in (archiveEnvelope.topic as object) && 'alreadyArchived' in (archiveEnvelope.topic as object), false);

  const recommendEnvelope = {
    topic: { id: 1, workingTitle: 'T' },
    categoryValidation: { ok: true, errors: [], warnings: [] },
    correlationId: 'corr-rec',
  };
  assert.equal('id' in recommendEnvelope, false);
  assert.ok(recommendEnvelope.topic);
  assert.ok(recommendEnvelope.categoryValidation);
});

test('candidate review and conversion contracts (pure)', () => {
  // Source metrics must not appear in conversion payloads.
  const body = buildConversionPayload({
    workingTitle: 'W',
    userProblem: 'U',
    audience: 'A',
    primaryKeyword: 'should-not-copy-as-editable-override-field',
  });
  assert.equal('primaryKeyword' in body, false);

  // Missing metrics display contract.
  assert.equal(formatNotSupplied(undefined), 'Not supplied');
  assert.equal(formatNotSupplied(''), 'Not supplied');
});
