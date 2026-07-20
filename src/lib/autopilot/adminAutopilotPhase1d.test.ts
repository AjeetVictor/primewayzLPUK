import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTOPILOT_DECISION_STATUSES,
  AUTOPILOT_TOPIC_STATUSES,
} from '../../data/autopilot/status.ts';
import { AUTOPILOT_RECOMMENDATION_BANDS } from '../../data/autopilot/scoringConfig.ts';
import {
  getDecisionStatusLabel,
  getScoreBandLabel,
  getTopicStatusLabel,
  listAllDecisionStatusLabels,
  listAllScoreBandLabels,
  listAllTopicStatusLabels,
} from './adminAutopilotLabels.ts';
import {
  assertNoSettingsEditCapabilityExposed,
  getAutopilotUiCapabilities,
  canShowAutopilotTab,
} from './adminAutopilotCapabilities.ts';
import {
  calculatePaginationRange,
  countActivePipelineFilters,
  DEFAULT_PIPELINE_FILTERS,
  formatScoreDisplay,
  resetPipelineFilters,
  serialisePipelineFilters,
  validateScoreRange,
} from './adminAutopilotPipelineHelpers.ts';
import {
  APPROVAL_CONFIRMATION_COPY,
  approvalCopyImpliesPublication,
  dedupeSecondaryCategories,
  extractChangedPatchFields,
  getPermittedDecisionActions,
  SCORE_INPUT_BOUNDS,
  separateRecommendationFromFinal,
} from './adminAutopilotDecisionHelpers.ts';
import {
  buildSafeEventSummary,
  canOpenTopicFromActivity,
  ensureRedactedMetadata,
  formatAutopilotDate,
  getTopicIdFromActivity,
} from './adminAutopilotActivityHelpers.ts';
import {
  AutopilotClientError,
  buildAutopilotQueryString,
  buildAutopilotRequestInit,
  parseAutopilotErrorResponse,
} from './adminAutopilotService.ts';

test('status labels cover every known topic status', () => {
  const labels = listAllTopicStatusLabels();
  for (const status of AUTOPILOT_TOPIC_STATUSES) {
    assert.equal(typeof labels[status], 'string');
    assert.ok(labels[status].length > 0);
    assert.equal(getTopicStatusLabel(status), labels[status]);
  }
  assert.match(getTopicStatusLabel('SOME_NEW_STATUS'), /Some New Status/i);
});

test('decision labels cover every known decision status', () => {
  const labels = listAllDecisionStatusLabels();
  for (const status of AUTOPILOT_DECISION_STATUSES) {
    assert.equal(getDecisionStatusLabel(status), labels[status]);
  }
  assert.equal(getDecisionStatusLabel('PENDING_REVIEW'), 'Pending review');
  assert.equal(getDecisionStatusLabel('NEEDS_MORE_RESEARCH'), 'Needs more research');
});

test('score band labels cover every known band', () => {
  const labels = listAllScoreBandLabels();
  for (const band of AUTOPILOT_RECOMMENDATION_BANDS) {
    assert.equal(getScoreBandLabel(band), labels[band]);
  }
  assert.equal(getScoreBandLabel('strong_approve_candidate'), 'Strong candidate');
  assert.equal(getScoreBandLabel(null), 'Not scored');
  assert.match(getScoreBandLabel('mystery_band'), /Mystery Band/i);
});

test('frontend capabilities: viewer denied, authors contribute, editors editorial, no settings UI', () => {
  assert.equal(canShowAutopilotTab('viewer'), false);
  assert.deepEqual(getAutopilotUiCapabilities('viewer'), {
    canRead: false,
    canContribute: false,
    canEditorial: false,
    canManageSettings: false,
  });

  const author = getAutopilotUiCapabilities('blog_author');
  assert.equal(author.canRead, true);
  assert.equal(author.canContribute, true);
  assert.equal(author.canEditorial, false);
  assert.equal(author.canManageSettings, false);

  for (const role of ['blog_editor', 'editor', 'admin'] as const) {
    const caps = getAutopilotUiCapabilities(role);
    assert.equal(caps.canRead, true);
    assert.equal(caps.canContribute, true);
    assert.equal(caps.canEditorial, true);
    assert.equal(caps.canManageSettings, false);
  }

  const superCaps = getAutopilotUiCapabilities('super_admin');
  assert.equal(superCaps.canRead, true);
  assert.equal(superCaps.canEditorial, true);
  assert.equal(superCaps.canManageSettings, false, 'Phase 1D must not expose settings edit UI');
  assert.equal(assertNoSettingsEditCapabilityExposed('super_admin'), true);
});

test('pipeline helpers: serialise, reset, score range, pagination, score display', () => {
  const invalid = validateScoreRange('80', '20');
  assert.equal(invalid.ok, false);

  const valid = validateScoreRange('10', '90');
  assert.equal(valid.ok, true);
  assert.equal(valid.minScore, 10);
  assert.equal(valid.maxScore, 90);

  const filters = {
    ...DEFAULT_PIPELINE_FILTERS,
    q: 'crm',
    topicStatus: 'RESEARCH_COMPLETE' as const,
    minScore: '10',
    maxScore: '90',
    includeArchived: true,
    limit: 20,
    offset: 40,
  };
  assert.equal(countActivePipelineFilters(filters), 5);

  const params = serialisePipelineFilters(filters);
  assert.equal(params.get('q'), 'crm');
  assert.equal(params.get('topicStatus'), 'RESEARCH_COMPLETE');
  assert.equal(params.get('minScore'), '10');
  assert.equal(params.get('maxScore'), '90');
  assert.equal(params.get('includeArchived'), 'true');
  assert.equal(params.get('offset'), '40');

  const reset = resetPipelineFilters(50);
  assert.equal(reset.q, '');
  assert.equal(reset.offset, 0);
  assert.equal(reset.limit, 50);

  const range = calculatePaginationRange(95, 20, 40);
  assert.deepEqual(range, { from: 41, to: 60, total: 95, hasPrev: true, hasNext: true });

  assert.deepEqual(formatScoreDisplay(null), {
    scoreText: 'Not scored',
    bandLabel: 'Not scored',
  });
  assert.equal(formatScoreDisplay(78, 'strong_approve_candidate').scoreText, '78');
});

test('decision helpers: actions by role/status, patch extraction, categories, approval copy', () => {
  assert.deepEqual(
    getPermittedDecisionActions('NOT_READY', 'blog_author').map((a) => a.action),
    ['submit'],
  );
  assert.deepEqual(
    getPermittedDecisionActions('PENDING_REVIEW', 'blog_author').map((a) => a.action),
    [],
  );
  assert.deepEqual(
    getPermittedDecisionActions('PENDING_REVIEW', 'blog_editor').map((a) => a.action),
    ['approve', 'reject', 'defer', 'needs_more_research'],
  );
  assert.equal(getPermittedDecisionActions('APPROVED', 'admin').length, 0);

  const approve = getPermittedDecisionActions('PENDING_REVIEW', 'editor').find(
    (a) => a.action === 'approve',
  );
  assert.ok(approve);
  assert.equal(approve.confirmBody, APPROVAL_CONFIRMATION_COPY);
  assert.equal(approvalCopyImpliesPublication(APPROVAL_CONFIRMATION_COPY), false);
  assert.match(APPROVAL_CONFIRMATION_COPY, /will not create, publish, or schedule an article/i);

  const separated = separateRecommendationFromFinal({
    recommendationPrimary: 'software-development',
    recommendationSecondary: ['ai'],
    finalPrimary: 'software-support',
    finalSecondary: ['product-development'],
  });
  assert.equal(separated.areDistinctConcepts, true);
  assert.equal(separated.recommendation.primary, 'software-development');
  assert.equal(separated.final.primary, 'software-support');

  assert.deepEqual(
    dedupeSecondaryCategories('software-development', [
      'ai',
      'software-development',
      'ai',
      'product-development',
    ]),
    ['ai', 'product-development'],
  );

  assert.equal(SCORE_INPUT_BOUNDS.dimension.max, 100);
  assert.equal(SCORE_INPUT_BOUNDS.cannibalisationPenalty.max, 30);
  assert.equal(SCORE_INPUT_BOUNDS.unsupportedClaimRiskPenalty.max, 20);

  const ordinary = extractChangedPatchFields({
    original: { workingTitle: 'A', primaryKeyword: 'kw', rawScore: 10, totalScore: 10 },
    draft: { workingTitle: 'B', primaryKeyword: 'kw', rawScore: 99, totalScore: 99 },
    section: 'identity',
  });
  assert.deepEqual(ordinary.changedKeys, ['workingTitle']);
  assert.equal(ordinary.payload.workingTitle, 'B');
  assert.equal('rawScore' in ordinary.payload, false);
  assert.equal('totalScore' in ordinary.payload, false);
  assert.equal('createdById' in ordinary.payload, false);
  assert.equal('topicStatus' in ordinary.payload, false);

  const privilegedMissingReason = extractChangedPatchFields({
    original: { primaryCategory: 'a', secondaryCategories: [] },
    draft: { primaryCategory: 'b', secondaryCategories: [] },
    section: 'categories',
  });
  assert.ok(privilegedMissingReason.error);

  const privilegedOk = extractChangedPatchFields({
    original: { serviceRelevance: 10 },
    draft: { serviceRelevance: 20 },
    section: 'score',
    reason: 'Editorial override after research',
  });
  assert.equal(privilegedOk.payload.serviceRelevance, 20);
  assert.equal(privilegedOk.payload.reason, 'Editorial override after research');
  assert.equal('rawScore' in privilegedOk.payload, false);
});

test('activity helpers: summaries, redaction, topic links, date fallback', () => {
  const row = {
    eventType: 'decision_approved',
    entityType: 'topic',
    entityId: '42',
    actorDisplayName: 'Alex Editor',
    createdAt: 'not-a-date',
    metadata: { token: 'secret', note: 'ok' },
  };

  assert.match(buildSafeEventSummary(row), /Decision approved/i);
  assert.equal(canOpenTopicFromActivity(row), true);
  assert.equal(getTopicIdFromActivity(row), 42);
  assert.equal(canOpenTopicFromActivity({ entityType: 'setting', entityId: '1' }), false);
  assert.equal(formatAutopilotDate(row.createdAt), '—');

  const redacted = ensureRedactedMetadata(row.metadata) as Record<string, unknown>;
  assert.equal(redacted.token, '[redacted]');
  assert.equal(redacted.note, 'ok');
});

test('API client: query building, request options, error mapping with correlation id', async () => {
  assert.equal(buildAutopilotQueryString({ q: 'crm', limit: 20, offset: 0 }), '?q=crm&limit=20&offset=0');
  assert.equal(buildAutopilotQueryString({ empty: '', skip: undefined }), '');

  const init = buildAutopilotRequestInit({
    method: 'POST',
    body: JSON.stringify({ workingTitle: 'x' }),
  });
  assert.equal(init.credentials, 'include');
  assert.equal((init.headers as Record<string, string>)['Content-Type'], 'application/json');

  async function map(status: number, body: unknown) {
    const response = {
      status,
      headers: { get: (name: string) => (name === 'x-correlation-id' ? 'corr-header' : null) },
      json: async () => body,
    } as Response;
    return parseAutopilotErrorResponse(response);
  }

  const badRequest = await map(400, {
    error: { code: 'AUTOPILOT_VALIDATION_ERROR', message: 'Invalid title', details: { field: 'workingTitle' } },
    correlationId: 'corr-400',
  });
  assert.ok(badRequest instanceof AutopilotClientError);
  assert.equal(badRequest.kind, 'validation');
  assert.equal(badRequest.correlationId, 'corr-400');
  assert.equal(badRequest.message, 'Invalid title');

  const forbidden = await map(403, {
    error: { code: 'AUTOPILOT_FORBIDDEN', message: 'No access' },
    correlationId: 'corr-403',
  });
  assert.equal(forbidden.kind, 'forbidden');

  const missing = await map(404, {
    error: { code: 'AUTOPILOT_NOT_FOUND', message: 'Topic not found' },
    correlationId: 'corr-404',
  });
  assert.equal(missing.kind, 'not_found');

  const conflict = await map(409, {
    error: { code: 'AUTOPILOT_ILLEGAL_TRANSITION', message: 'Illegal transition' },
    correlationId: 'corr-409',
  });
  assert.equal(conflict.kind, 'conflict');

  const server = await map(500, {
    error: {
      code: 'AUTOPILOT_INTERNAL_ERROR',
      message: 'Prisma P2021 table does not exist\n    at Object.handler',
    },
    correlationId: 'corr-500',
  });
  assert.equal(server.kind, 'unavailable');
  assert.doesNotMatch(server.message, /Prisma|stack|at Object/i);
  assert.match(server.message, /migration or server deployment/i);
  assert.equal(server.correlationId, 'corr-500');

  const middleware = await map(403, { success: false, error: 'Forbidden' });
  assert.equal(middleware.kind, 'forbidden');
  assert.equal(middleware.correlationId, 'corr-header');
});
