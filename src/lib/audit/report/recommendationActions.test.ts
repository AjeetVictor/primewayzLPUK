import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyActionImportance,
  getFindingLabel,
  normalizeRecommendationActions,
} from './recommendationActions.ts';

describe('recommendationActions helpers', () => {
  it('maps audit statuses to finding labels', () => {
    assert.equal(getFindingLabel('good'), 'What we found');
    assert.equal(getFindingLabel('partial'), 'Area to review');
    assert.equal(getFindingLabel('not_verified'), 'Area to review');
    assert.equal(getFindingLabel('gap'), 'Problem observed');
  });

  it('classifies analytics actions by importance', () => {
    assert.equal(
      classifyActionImportance(
        'Verify that Google Analytics and key enquiry-conversion events are configured and recording correctly.',
        'analytics-readiness',
      ),
      'important',
    );
    assert.equal(
      classifyActionImportance(
        'Review cookie consent and consent-mode behaviour where applicable.',
        'analytics-readiness',
      ),
      'important',
    );
    assert.equal(
      classifyActionImportance(
        'Use a tag manager where multiple marketing tags require central governance.',
        'analytics-readiness',
      ),
      'recommended',
    );
    assert.equal(
      classifyActionImportance('Add Meta Pixel only when Meta advertising is actively used.', 'analytics-readiness'),
      'optional',
    );
  });

  it('defaults legacy strings to recommended unless optional patterns match', () => {
    assert.equal(classifyActionImportance('Add visible testimonials if available.'), 'recommended');
    assert.equal(
      classifyActionImportance('Add Meta Pixel only when Meta advertising is actively used.'),
      'optional',
    );
  });

  it('accepts mixed string and object recommendation inputs', () => {
    const actions = normalizeRecommendationActions([
      'Use a tag manager where multiple marketing tags require central governance.',
      { text: 'Add Meta Pixel only when Meta advertising is actively used.', importance: 'optional' },
      'Use a tag manager where multiple marketing tags require central governance.',
    ], 'analytics-readiness');

    assert.equal(actions.length, 2);
    assert.equal(actions[0].importance, 'recommended');
    assert.equal(actions[1].importance, 'optional');
  });
});
