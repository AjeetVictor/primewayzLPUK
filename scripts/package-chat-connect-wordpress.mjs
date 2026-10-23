#!/usr/bin/env node
/**
 * Package Primewayz Chat Connect for WordPress with Linux-safe ZIP entry paths.
 *
 * Windows Compress-Archive writes backslash entry names, which break WordPress
 * plugin installs on Linux (duplicate/broken folder layouts, missing assets,
 * launcher never enqueues). Always use this script for Chat Connect ZIPs.
 *
 * Usage:
 *   node scripts/package-chat-connect-wordpress.mjs --source <plugin-dir> --out <zip>
 *
 * <plugin-dir> must be the primewayz-integration folder (or its parent containing
 * exactly one primewayz-integration child).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN_SLUG = 'primewayz-integration';
const ENTRY = `${PLUGIN_SLUG}/primewayz-integration.php`;

function die(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { source: null, out: null };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--source') out.source = argv[++i];
    else if (a === '--out') out.out = argv[++i];
    else die(`unknown argument: ${a}`);
  }
  if (!out.source || !out.out) {
    die('required: --source <dir> --out <zip>');
  }
  return out;
}

function resolvePluginRoot(sourceArg) {
  const abs = path.resolve(sourceArg);
  if (!fs.existsSync(abs)) die(`source not found: ${abs}`);
  const base = path.basename(abs);
  if (base === PLUGIN_SLUG && fs.statSync(abs).isDirectory()) return abs;
  const nested = path.join(abs, PLUGIN_SLUG);
  if (fs.existsSync(nested) && fs.statSync(nested).isDirectory()) return nested;
  die(`expected ${PLUGIN_SLUG} directory at or under ${abs}`);
}

function listFiles(dir) {
  /** @type {string[]} */
  const files = [];
  const walk = (current) => {
    for (const name of fs.readdirSync(current)) {
      const full = path.join(current, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (st.isFile()) files.push(full);
    }
  };
  walk(dir);
  return files.sort((a, b) => a.localeCompare(b));
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function assertPluginIdentity(pluginRoot) {
  const entry = path.join(pluginRoot, 'primewayz-integration.php');
  if (!fs.existsSync(entry)) die(`missing entry point: ${entry}`);
  const header = fs.readFileSync(entry, 'utf8');
  if (!/Plugin Name:\s*Primewayz Chat Connect/.test(header)) {
    die('plugin header Plugin Name must start with Primewayz Chat Connect');
  }
  if (!/Version:\s*1\.3\.3/.test(header)) die('plugin header Version must be 1.3.3');
  if (!/define\(\s*'PWI_VERSION',\s*'1\.3\.3'\s*\)/.test(header)) {
    die("PWI_VERSION must be '1.3.3'");
  }

  const connect = fs.readFileSync(path.join(pluginRoot, 'includes/class-pwi-chat-connect.php'), 'utf8');
  if (!/['"]widgetVersion['"]\s*=>\s*['"]1\.3\.3['"]/.test(connect)) {
    die("heartbeat widgetVersion must be '1.3.3'");
  }

  const buildInfoPath = path.join(pluginRoot, 'assets/chat/BUILD_INFO.json');
  const widgetPath = path.join(pluginRoot, 'assets/chat/pw-chat.js');
  if (!fs.existsSync(buildInfoPath) || !fs.existsSync(widgetPath)) {
    die('missing assets/chat/pw-chat.js or BUILD_INFO.json');
  }
  const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
  if (buildInfo.buildVersion !== '1.3.3') die(`BUILD_INFO buildVersion is ${buildInfo.buildVersion}, expected 1.3.3`);
  const hosted = path.join(ROOT, 'embed-releases/chat/1.3.3/pw-chat.js');
  if (!fs.existsSync(hosted)) die(`missing hosted widget: ${hosted}`);
  const widgetHash = sha256File(widgetPath);
  const hostedHash = sha256File(hosted);
  if (widgetHash !== hostedHash) {
    die(`bundled widget SHA-256 ${widgetHash} != hosted 1.3.3 ${hostedHash}`);
  }
  if (typeof buildInfo.sha256 === 'string' && buildInfo.sha256.toLowerCase() !== widgetHash) {
    die(`BUILD_INFO.sha256 ${buildInfo.sha256} != widget ${widgetHash}`);
  }
  if (buildInfo.artifactNote) {
    die('BUILD_INFO must not describe a hand-patched / non-identical widget');
  }

  const css = fs.readFileSync(widgetPath, 'utf8');
  const statusDot = css.indexOf('.pw-chat-status-dot');
  const toneOnline = css.indexOf('.pw-chat-tone-online');
  if (statusDot < 0 || toneOnline < 0 || toneOnline <= statusDot) {
    die('widget CSS must place .pw-chat-tone-online after .pw-chat-status-dot');
  }
  for (const [tone, hex] of [
    ['online', '#16A34A'],
    ['away', '#F59E0B'],
    ['offline', '#94A3B8'],
    ['automated', '#0284C7'],
    ['unavailable', '#DC2626'],
  ]) {
    if (!css.includes(`.pw-chat-tone-${tone}`) || !css.includes(hex)) {
      die(`widget missing presence tone ${tone} / ${hex}`);
    }
  }
}

/**
 * Create a ZIP with forward-slash entry names using the system `zip` if available,
 * otherwise Node's zlib + manual local-file headers via the `archiver`-free approach:
 * spawn PowerShell/.NET with explicit entry names.
 */
function createZipForwardSlash(pluginRoot, zipOut) {
  fs.mkdirSync(path.dirname(zipOut), { recursive: true });
  if (fs.existsSync(zipOut)) fs.unlinkSync(zipOut);

  const files = listFiles(pluginRoot);
  if (files.length === 0) die('no files to package');

  // Prefer Python zipfile (forces /) when available.
  try {
    const py = `
import os, sys, zipfile
root = sys.argv[1]
out = sys.argv[2]
slug = ${JSON.stringify(PLUGIN_SLUG)}
with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED) as z:
    for dirpath, _, filenames in os.walk(root):
        for name in sorted(filenames):
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, root).replace(os.sep, '/')
            z.write(full, slug + '/' + rel)
`;
    const pyPath = path.join(path.dirname(zipOut), '.pw-chat-connect-zip.py');
    fs.writeFileSync(pyPath, py);
    execFileSync('python', [pyPath, pluginRoot, zipOut], { stdio: 'inherit' });
    fs.unlinkSync(pyPath);
    return;
  } catch {
    // fall through
  }

  // .NET ZipArchive with explicit forward-slash names (Windows).
  const ps = `
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$pluginRoot = ${JSON.stringify(pluginRoot)}
$zipOut = ${JSON.stringify(zipOut)}
$slug = ${JSON.stringify(PLUGIN_SLUG)}
if (Test-Path $zipOut) { Remove-Item -Force $zipOut }
$zip = [System.IO.Compression.ZipFile]::Open($zipOut, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  Get-ChildItem -Recurse -File $pluginRoot | Sort-Object FullName | ForEach-Object {
    $rel = $_.FullName.Substring($pluginRoot.Length).TrimStart('\\','/')
    $entryName = ($slug + '/' + ($rel -replace '\\\\','/'))
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal)
  }
} finally { $zip.Dispose() }
`;
  const psPath = path.join(path.dirname(zipOut), '.pw-chat-connect-zip.ps1');
  fs.writeFileSync(psPath, ps);
  try {
    execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psPath], {
      stdio: 'inherit',
    });
  } finally {
    fs.unlinkSync(psPath);
  }
}

function verifyZip(zipOut) {
  const verifyScript = path.join(ROOT, 'scripts/verify-chat-connect-zip.mjs');
  execFileSync(process.execPath, [verifyScript, zipOut], { stdio: 'inherit' });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const pluginRoot = resolvePluginRoot(args.source);
  const zipOut = path.resolve(args.out);
  assertPluginIdentity(pluginRoot);
  createZipForwardSlash(pluginRoot, zipOut);
  verifyZip(zipOut);
  const hash = sha256File(zipOut);
  console.log(`OK packaged ${zipOut}`);
  console.log(`SHA-256 ${hash}`);
  console.log(`entry root ${PLUGIN_SLUG}/ (${ENTRY})`);
}

main();
