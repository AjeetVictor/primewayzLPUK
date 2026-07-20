import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canContributeTopics,
  canEditorialAutopilot,
  canManageAutopilotSettings,
  canReadAutopilot,
} from './autopilotPermissions.ts';

test('viewer cannot read or contribute Autopilot', () => {
  assert.equal(canReadAutopilot('viewer'), false);
  assert.equal(canContributeTopics('viewer'), false);
  assert.equal(canEditorialAutopilot('viewer'), false);
  assert.equal(canManageAutopilotSettings('viewer'), false);
});

test('blog_author can read and create but not editorial or settings', () => {
  assert.equal(canReadAutopilot('blog_author'), true);
  assert.equal(canContributeTopics('blog_author'), true);
  assert.equal(canEditorialAutopilot('blog_author'), false);
  assert.equal(canManageAutopilotSettings('blog_author'), false);
});

test('blog_editor and editor have editorial control', () => {
  for (const role of ['blog_editor', 'editor', 'admin', 'super_admin'] as const) {
    assert.equal(canEditorialAutopilot(role), true, role);
    assert.equal(canReadAutopilot(role), true, role);
  }
});

test('only super_admin can manage settings (not admin alias)', () => {
  assert.equal(canManageAutopilotSettings('super_admin'), true);
  assert.equal(canManageAutopilotSettings('admin'), false);
  assert.equal(canManageAutopilotSettings('blog_editor'), false);
});
