import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('fresh successful audit emits one completion conversion before catch', () => {
  const form = read('src/components/tools/WebPresenceAuditForm.tsx');

  const completionCalls =
    form.match(/trackConversionEvent\('web_presence_audit_complete'/g) ?? [];

  assert.equal(completionCalls.length, 1);

  const resultViewIndex = form.indexOf(
    "trackEvent('web_presence_audit_result_view', auditCompletionPayload);",
  );
  const completionIndex = form.indexOf(
    "trackConversionEvent('web_presence_audit_complete', auditCompletionPayload);",
  );
  const catchIndex = form.indexOf('} catch (error) {', completionIndex);

  assert.ok(resultViewIndex >= 0);
  assert.ok(completionIndex > resultViewIndex);
  assert.ok(catchIndex > completionIndex);
});

test('failure, restored-report and shared-report paths do not emit audit completion', () => {
  const form = read('src/components/tools/WebPresenceAuditForm.tsx');
  const checker = read('src/components/UkSmeDigitalVisibilityCheckerPage.tsx');
  const sharedReport = read(
    'src/components/tools/WebPresenceAuditSharedReportPage.tsx',
  );

  const catchStart = form.indexOf('} catch (error) {');
  const finallyStart = form.indexOf('} finally {', catchStart);

  assert.ok(catchStart >= 0);
  assert.ok(finallyStart > catchStart);

  const failureBlock = form.slice(catchStart, finallyStart);

  assert.doesNotMatch(failureBlock, /web_presence_audit_complete/);
  assert.doesNotMatch(checker, /web_presence_audit_complete/);
  assert.doesNotMatch(sharedReport, /web_presence_audit_complete/);
});

test('audit completion payload contains non-PII result metadata only', () => {
  const form = read('src/components/tools/WebPresenceAuditForm.tsx');

  const contextMatch = form.match(
    /const safeAnalyticsContext = \{[\s\S]*?\n    \};/,
  );
  const payloadMatch = form.match(
    /const auditCompletionPayload = \{[\s\S]*?\n      \};/,
  );

  assert.ok(contextMatch);
  assert.ok(payloadMatch);

  const contextBlock = contextMatch[0];
  const payloadBlock = payloadMatch[0];

  assert.match(contextBlock, /has_phone: Boolean\(form\.phone\.trim\(\)\)/);
  assert.match(contextBlock, /has_email: Boolean\(form\.email\.trim\(\)\)/);
  assert.doesNotMatch(
    contextBlock,
    /\bwebsiteUrl\s*:|\bbusinessName\s*:|\bemail\s*:|\bphone\s*:/,
  );

  assert.match(payloadBlock, /\.\.\.safeAnalyticsContext/);
  assert.match(payloadBlock, /score:/);
  assert.match(payloadBlock, /score_label:/);
  assert.match(payloadBlock, /pages_crawled:/);
  assert.match(payloadBlock, /audit_success: true/);
  assert.doesNotMatch(
    payloadBlock,
    /\bwebsiteUrl\s*:|\bbusinessName\s*:|\bemail\s*:|\bphone\s*:|\bauditedUrl\s*:|\bpublicToken\s*:/,
  );
});

test('persisted audit email-report lead emits generate_lead exactly once', () => {
  const panel = read(
    'src/components/tools/WebPresenceAuditEmailReportPanel.tsx',
  );

  assert.match(panel, /payload\.success !== true/);
  assert.match(panel, /typeof payload\.leadId !== 'string'/);
  assert.match(
    panel,
    /payload\.leadStorage !== 'database' && payload\.leadStorage !== 'file'/,
  );

  assert.equal(
    (
      panel.match(
        /trackConversionEvent\('generate_lead', leadConversionPayload\);/g,
      ) ?? []
    ).length,
    1,
  );

  const persistenceGuardIndex = panel.indexOf(
    'payload.success !== true',
  );
  const conversionIndex = panel.indexOf(
    "trackConversionEvent('generate_lead', leadConversionPayload);",
  );
  const skippedIndex = panel.indexOf(
    "if (payload.emailDeliveryStatus === 'skipped')",
  );
  const failedIndex = panel.indexOf(
    "if (payload.emailDeliveryStatus === 'failed')",
  );

  assert.ok(persistenceGuardIndex >= 0);
  assert.ok(conversionIndex > persistenceGuardIndex);
  assert.ok(skippedIndex > conversionIndex);
  assert.ok(failedIndex > conversionIndex);
});

test('audit lead conversion payload contains no submitted PII', () => {
  const panel = read(
    'src/components/tools/WebPresenceAuditEmailReportPanel.tsx',
  );

  const payloadMatch = panel.match(
    /const leadConversionPayload = \{[\s\S]*?\n      \};/,
  );

  assert.ok(payloadMatch, 'Audit lead conversion payload was not found');

  const payloadBlock = payloadMatch[0];

  for (const key of [
    'name',
    'email',
    'phone',
    'message',
    'websiteUrl',
    'businessName',
    'leadId',
    'publicToken',
    'shareUrl',
  ]) {
    assert.doesNotMatch(
      payloadBlock,
      new RegExp(`\\b${key}\\s*:`, 'i'),
    );
  }

  assert.match(
    panel,
    /assertNoProhibitedAnalyticsProps\(leadConversionPayload\);/,
  );
  assert.match(
    panel,
    /trackEvent\('web_presence_audit_lead_saved', leadConversionPayload\);/,
  );
});

test('email-report-sent diagnostic is emitted only after delivery-status handling', () => {
  const panel = read(
    'src/components/tools/WebPresenceAuditEmailReportPanel.tsx',
  );

  const failedIndex = panel.indexOf(
    "if (payload.emailDeliveryStatus === 'failed')",
  );
  const sentDiagnosticIndex = panel.indexOf(
    "trackEvent('web_presence_audit_email_report_sent'",
  );

  assert.ok(failedIndex >= 0);
  assert.ok(sentDiagnosticIndex > failedIndex);

  assert.match(
    panel,
    /payload\.emailDeliveryStatus === 'sent'[\s\S]*?payload\.emailDeliveryStatus === 'partial'/,
  );
});
