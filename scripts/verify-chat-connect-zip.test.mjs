/**
 * Regression: recovery Chat Connect ZIP must stay Linux-safe and widget-aligned.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZIP = path.join(ROOT, 'releases/primewayz-chat-connect-v1.3.3.zip');
const VERIFY = path.join(ROOT, 'scripts/verify-chat-connect-zip.mjs');

describe('PW-CHAT-RECOVERY-01 WordPress package', () => {
  test('canonical v1.3.3 ZIP exists and passes verifier', () => {
    assert.ok(fs.existsSync(ZIP), `missing ${ZIP}`);
    const out = execFileSync(process.execPath, [VERIFY, ZIP], { encoding: 'utf8' });
    assert.match(out, /PASS Chat Connect ZIP verification/);
    assert.match(out, /primewayz-integration\//);
  });
});
