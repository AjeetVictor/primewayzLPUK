#!/usr/bin/env node
/**
 * Verify a Primewayz Chat Connect WordPress ZIP before release.
 *
 * Checks:
 * - Exactly one plugin root directory: primewayz-integration/
 * - Forward-slash ZIP entry paths only (no Windows backslashes)
 * - Canonical entry point primewayz-integration/primewayz-integration.php
 * - Version / display-name / widgetVersion metadata
 * - Bundled pw-chat.js byte-identical to embed-releases/chat/1.3.3
 * - Presence CSS cascade order and palette hexes
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_SLUG = 'primewayz-integration';
const EXPECTED_WIDGET = path.join(ROOT, 'embed-releases/chat/1.3.3/pw-chat.js');
const EXPECTED_VERSION = '1.3.3';

function die(msg) {
  console.error(`FAIL: ${msg}`);
  process.exit(1);
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function listZipEntries(zipPath) {
  // Prefer PowerShell/.NET for reliable entry name bytes on Windows.
  if (process.platform === 'win32') {
    const ps = [
      'Add-Type -AssemblyName System.IO.Compression.FileSystem',
      `$z = [IO.Compression.ZipFile]::OpenRead(${JSON.stringify(zipPath)})`,
      'try {',
      "  $z.Entries | ForEach-Object { $_.FullName + [char]9 + $_.Length }",
      '} finally { $z.Dispose() }',
    ].join('\n');
    const out = execFileSync('powershell', ['-NoProfile', '-Command', ps], {
      encoding: 'utf8',
    });
    return out
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const tab = line.indexOf('\t');
        if (tab < 0) die(`unexpected zip listing line: ${line}`);
        return { name: line.slice(0, tab), size: Number(line.slice(tab + 1)) };
      });
  }

  // unzip -l fallback
  const out = execFileSync('unzip', ['-l', zipPath], { encoding: 'utf8' });
  /** @type {{name:string,size:number}[]} */
  const entries = [];
  for (const line of out.split(/\r?\n/)) {
    const m = line.match(/^\s*(\d+)\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(.+)$/);
    if (m && m[2] !== 'Name' && !m[2].startsWith('----') && !m[2].startsWith('----')) {
      const name = m[2].trim();
      if (name && !/^files?$/i.test(name)) entries.push({ name, size: Number(m[1]) });
    }
  }
  return entries;
}

function extractEntry(zipPath, entryName, destFile) {
  const ps = `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$z = [IO.Compression.ZipFile]::OpenRead(${JSON.stringify(zipPath)})
try {
  $e = $z.GetEntry(${JSON.stringify(entryName)})
  if ($null -eq $e) { throw "missing entry ${entryName}" }
  $dest = ${JSON.stringify(destFile)}
  New-Item -ItemType Directory -Force -Path ([IO.Path]::GetDirectoryName($dest)) | Out-Null
  [IO.Compression.ZipFileExtensions]::ExtractToFile($e, $dest, $true)
} finally { $z.Dispose() }
`;
  execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'pipe' });
}

function main() {
  const zipPath = path.resolve(process.argv[2] || '');
  if (!zipPath || !fs.existsSync(zipPath)) die(`ZIP not found: ${zipPath || '(missing arg)'}`);

  const entries = listZipEntries(zipPath);
  if (entries.length === 0) die('ZIP has no entries');

  const names = entries.map((e) => e.name);
  for (const name of names) {
    if (name.includes('\\')) {
      die(`backslash ZIP entry (breaks Linux WordPress): ${name}`);
    }
    if (name.includes('..')) die(`unsafe ZIP entry: ${name}`);
  }

  const tops = new Set(
    names
      .map((n) => n.split('/').filter(Boolean)[0])
      .filter(Boolean),
  );
  if (tops.size !== 1 || !tops.has(PLUGIN_SLUG)) {
    die(`expected single root '${PLUGIN_SLUG}/', found: ${[...tops].join(', ')}`);
  }

  const entryPhp = `${PLUGIN_SLUG}/primewayz-integration.php`;
  if (!names.includes(entryPhp)) die(`missing entry point ${entryPhp}`);

  const required = [
    entryPhp,
    `${PLUGIN_SLUG}/uninstall.php`,
    `${PLUGIN_SLUG}/readme.txt`,
    `${PLUGIN_SLUG}/includes/class-pwi-chat-loader.php`,
    `${PLUGIN_SLUG}/includes/class-pwi-chat-connect.php`,
    `${PLUGIN_SLUG}/includes/class-pwi-settings.php`,
    `${PLUGIN_SLUG}/includes/class-pwi-chat-admin.php`,
    `${PLUGIN_SLUG}/includes/class-pwi-chat-api-client.php`,
    `${PLUGIN_SLUG}/assets/chat/pw-chat.js`,
    `${PLUGIN_SLUG}/assets/chat/BUILD_INFO.json`,
    `${PLUGIN_SLUG}/assets/chat/pwi-email-deep-link.js`,
  ];
  for (const req of required) {
    if (!names.includes(req)) die(`missing required path ${req}`);
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-chat-connect-verify-'));
  try {
    const headerFile = path.join(tmp, 'primewayz-integration.php');
    const connectFile = path.join(tmp, 'class-pwi-chat-connect.php');
    const widgetFile = path.join(tmp, 'pw-chat.js');
    const buildFile = path.join(tmp, 'BUILD_INFO.json');
    extractEntry(zipPath, entryPhp, headerFile);
    extractEntry(zipPath, `${PLUGIN_SLUG}/includes/class-pwi-chat-connect.php`, connectFile);
    extractEntry(zipPath, `${PLUGIN_SLUG}/assets/chat/pw-chat.js`, widgetFile);
    extractEntry(zipPath, `${PLUGIN_SLUG}/assets/chat/BUILD_INFO.json`, buildFile);

    const header = fs.readFileSync(headerFile, 'utf8');
    if (!header.includes('Plugin Name: Primewayz Chat Connect v1.3.3')) {
      die('Plugin Name must be exactly "Primewayz Chat Connect v1.3.3"');
    }
    if (!new RegExp(`Version:\\s*${EXPECTED_VERSION}`).test(header)) {
      die(`Version must be ${EXPECTED_VERSION}`);
    }
    if (!header.includes(`define( 'PWI_VERSION', '${EXPECTED_VERSION}' )`)) {
      die(`PWI_VERSION must be ${EXPECTED_VERSION}`);
    }

    const connect = fs.readFileSync(connectFile, 'utf8');
    if (!connect.includes(`'widgetVersion' => '${EXPECTED_VERSION}'`)) {
      die(`connect heartbeat widgetVersion must be ${EXPECTED_VERSION}`);
    }

    // Soft PHP structure checks (PHP CLI may be unavailable).
    for (const [label, body] of [
      ['entry', header],
      ['connect', connect],
    ]) {
      if (!body.trimStart().startsWith('<?php')) die(`${label} must start with <?php`);
      const opens = (body.match(/\bfunction\b/g) || []).length;
      if (opens < 1 && label === 'connect') die('connect.php looks empty of functions');
    }

    const buildInfo = JSON.parse(fs.readFileSync(buildFile, 'utf8'));
    if (buildInfo.buildVersion !== EXPECTED_VERSION) {
      die(`BUILD_INFO.buildVersion ${buildInfo.buildVersion} != ${EXPECTED_VERSION}`);
    }
    if (buildInfo.artifactNote) {
      die('BUILD_INFO.artifactNote present — refusing hand-patched widget packaging');
    }

    const widgetBuf = fs.readFileSync(widgetFile);
    const hostedBuf = fs.readFileSync(EXPECTED_WIDGET);
    const widgetHash = sha256(widgetBuf);
    const hostedHash = sha256(hostedBuf);
    if (widgetHash !== hostedHash) {
      die(`bundled widget ${widgetHash} != hosted embed 1.3.3 ${hostedHash}`);
    }
    if (typeof buildInfo.sha256 === 'string' && buildInfo.sha256.toLowerCase() !== widgetHash) {
      die(`BUILD_INFO.sha256 mismatch`);
    }

    const css = widgetBuf.toString('utf8');
    const statusDot = css.indexOf('.pw-chat-status-dot');
    const toneOnline = css.indexOf('.pw-chat-tone-online');
    if (!(statusDot >= 0 && toneOnline > statusDot)) {
      die('presence CSS cascade order invalid (status-dot must precede tone-online)');
    }
    for (const hex of ['#16A34A', '#F59E0B', '#94A3B8', '#0284C7', '#DC2626']) {
      if (!css.includes(hex)) die(`missing presence colour ${hex}`);
    }

    // Loader must vendor local assets (not remote /embed URL).
    const loaderFile = path.join(tmp, 'class-pwi-chat-loader.php');
    extractEntry(zipPath, `${PLUGIN_SLUG}/includes/class-pwi-chat-loader.php`, loaderFile);
    const loader = fs.readFileSync(loaderFile, 'utf8');
    if (!loader.includes("PWI_URL . 'assets/chat/pw-chat.js'")) {
      die('loader must enqueue local bundled assets/chat/pw-chat.js');
    }
    if (/https?:\/\/uk\.primewayz\.com\/embed\/chat\//.test(loader)) {
      die('loader must not hardcode hosted embed URL as primary asset');
    }
    if (!loader.includes('wp_enqueue_script') || !loader.includes('pwi-chat-config')) {
      die('loader missing enqueue / config injection hooks');
    }
    if (!loader.includes("'siteKey'    => 'primewayz-infotech'")) {
      die('loader siteKey must remain primewayz-infotech (public site key, not tenant id)');
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  const zipHash = sha256(fs.readFileSync(zipPath));
  console.log('PASS Chat Connect ZIP verification');
  console.log(`  zip: ${zipPath}`);
  console.log(`  entries: ${entries.length}`);
  console.log(`  root: ${PLUGIN_SLUG}/`);
  console.log(`  entry: ${PLUGIN_SLUG}/primewayz-integration.php`);
  console.log(`  widget: matches embed-releases/chat/1.3.3 (sha256 ${sha256(fs.readFileSync(EXPECTED_WIDGET))})`);
  console.log(`  zip sha256: ${zipHash}`);
}

main();
