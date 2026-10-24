import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  checkPublicAssetPermissions,
  isWorldReadableFile,
  isWorldTraversableDir,
  modeOctal,
  SECRET_NAME_PATTERN,
} from './check-public-asset-permissions.mjs';

test('mode helpers: 644/755 pass; 600/700 fail world access', () => {
  assert.equal(modeOctal(0o100644), '644');
  assert.equal(isWorldReadableFile(0o100644), true);
  assert.equal(isWorldReadableFile(0o100600), false);
  assert.equal(isWorldTraversableDir(0o040755), true);
  assert.equal(isWorldTraversableDir(0o040700), false);
});

test('secret name pattern catches .env and private key paths', () => {
  assert.match('dist/client/.env', SECRET_NAME_PATTERN);
  assert.match('dist/client/assets/app.secret.js', SECRET_NAME_PATTERN);
  assert.doesNotMatch('dist/client/assets/index-abc123.js', SECRET_NAME_PATTERN);
});

test('checkPublicAssetPermissions fails when dist/client is missing', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-assets-missing-'));
  try {
    const result = checkPublicAssetPermissions({ projectRoot: root, skipUnixPerms: true });
    assert.equal(result.ok, false);
    assert.match(result.errors[0], /Missing.*dist\/client/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('checkPublicAssetPermissions passes a minimal public tree without secret files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-assets-ok-'));
  try {
    const client = path.join(root, 'dist', 'client');
    const assets = path.join(client, 'assets');
    fs.mkdirSync(assets, { recursive: true });
    fs.writeFileSync(path.join(assets, 'index-test.js'), 'console.log("ok");');
    fs.writeFileSync(path.join(assets, 'index-test.css'), 'body{}');
    fs.writeFileSync(path.join(client, 'logo.svg'), '<svg></svg>');
    const result = checkPublicAssetPermissions({ projectRoot: root, skipUnixPerms: true });
    assert.equal(result.ok, true, result.errors.join('; '));
    assert.ok(result.counts.js >= 1);
    assert.ok(result.counts.css >= 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('checkPublicAssetPermissions rejects secret-like filenames under dist/client', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-assets-secret-'));
  try {
    const client = path.join(root, 'dist', 'client');
    const assets = path.join(client, 'assets');
    fs.mkdirSync(assets, { recursive: true });
    fs.writeFileSync(path.join(assets, 'index-test.js'), 'console.log("ok");');
    fs.writeFileSync(path.join(assets, 'index-test.css'), 'body{}');
    fs.writeFileSync(path.join(client, '.env'), 'DATABASE_URL=secret');
    const result = checkPublicAssetPermissions({ projectRoot: root, skipUnixPerms: true });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /Secret-like path/.test(e)));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('checkPublicAssetPermissions fails when public assets are Apache-inaccessible (600/700), not merely when files exist', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-assets-perms-'));
  try {
    const client = path.join(root, 'dist', 'client');
    const assets = path.join(client, 'assets');
    fs.mkdirSync(assets, { recursive: true });
    const jsPath = path.join(assets, 'index-test.js');
    const cssPath = path.join(assets, 'index-test.css');
    fs.writeFileSync(jsPath, 'console.log("ok");');
    fs.writeFileSync(cssPath, 'body{}');

    // Files exist — existence-only checks would pass. Inject the production regression modes.
    const result = checkPublicAssetPermissions({
      projectRoot: root,
      skipUnixPerms: false,
      modeFor: (full, isDir) => {
        if (isDir) return 0o040700;
        return 0o100600;
      },
    });

    assert.equal(result.ok, false, 'must fail when modes would cause Apache 403');
    assert.ok(
      result.errors.some((e) => /not readable by other users/.test(e) && /\.js|\.css/.test(e)),
      `expected unreadable public asset errors, got: ${result.errors.join('; ')}`,
    );
    assert.ok(
      result.errors.some((e) => /not traversable\/readable by other users/.test(e)),
      `expected non-traversable directory errors, got: ${result.errors.join('; ')}`,
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('checkPublicAssetPermissions fails after real chmod 600/700 when the host enforces Unix modes', () => {
  if (process.platform === 'win32') {
    // Windows ACLs do not model Apache's other-user Unix bits; covered by modeFor test above.
    return;
  }

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-assets-chmod-'));
  try {
    const client = path.join(root, 'dist', 'client');
    const assets = path.join(client, 'assets');
    fs.mkdirSync(assets, { recursive: true });
    const jsPath = path.join(assets, 'index-test.js');
    const cssPath = path.join(assets, 'index-test.css');
    fs.writeFileSync(jsPath, 'console.log("ok");');
    fs.writeFileSync(cssPath, 'body{}');
    fs.chmodSync(assets, 0o700);
    fs.chmodSync(client, 0o700);
    fs.chmodSync(jsPath, 0o600);
    fs.chmodSync(cssPath, 0o600);

    const result = checkPublicAssetPermissions({ projectRoot: root, skipUnixPerms: false });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /Apache would return 403/.test(e)));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
