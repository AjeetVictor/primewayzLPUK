#!/usr/bin/env node
/**
 * Deployment preflight: public build assets must be readable by the Apache/web user.
 *
 * Previous production regression: dist/client/assets at mode 700 and JS/CSS at 600
 * caused HTTP 403 from Apache. This check runs against an existing dist/client tree
 * BEFORE any service restart.
 *
 * Narrow remediation (do NOT chmod the whole repository or shared server):
 *   find dist/client -type d -exec chmod 755 {} +
 *   find dist/client -type f -exec chmod 644 {} +
 *
 * Usage:
 *   node scripts/check-public-asset-permissions.mjs
 *   npm run preflight:assets
 *
 * Exit 0 = OK; non-zero = block deploy / restart.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SECRET_NAME_PATTERN =
  /(?:^|[\\/])(?:\.env(?:\..+)?|credentials\.json|.*(?:secret|private[_-]?key|id_rsa).*)$/i;

const PUBLIC_ASSET_EXT = new Set([
  '.js',
  '.mjs',
  '.css',
  '.map',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.html',
  '.json',
  '.txt',
  '.xml',
  '.webmanifest',
]);

export function modeOctal(mode) {
  return (mode & 0o777).toString(8).padStart(3, '0');
}

/** Other (world) bits — Apache often runs as a different user than the deploy owner. */
export function isWorldReadableFile(mode) {
  return (mode & 0o004) !== 0;
}

export function isWorldTraversableDir(mode) {
  return (mode & 0o001) !== 0 && (mode & 0o004) !== 0;
}

export { SECRET_NAME_PATTERN };

function walk(dir, visit) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    visit.error?.(`Cannot read directory ${dir}: ${err.message}`);
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      visit(full, true);
      walk(full, visit);
    } else if (entry.isFile()) {
      visit(full, false);
    }
  }
}

/**
 * @param {{
 *   projectRoot?: string,
 *   skipUnixPerms?: boolean,
 *   modeFor?: (fullPath: string, isDir: boolean, realMode: number) => number,
 * }} [options]
 * @returns {{ ok: boolean, errors: string[], warnings: string[], counts: { js: number, css: number, images: number } }}
 */
export function checkPublicAssetPermissions(options = {}) {
  const projectRoot = options.projectRoot ?? process.cwd();
  const clientRoot = path.join(projectRoot, 'dist', 'client');
  const assetsRoot = path.join(clientRoot, 'assets');
  const skipUnixPerms = options.skipUnixPerms ?? process.platform === 'win32';
  const modeFor = options.modeFor;

  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  const relative = (p) => path.relative(projectRoot, p).split(path.sep).join('/');

  if (!fs.existsSync(clientRoot)) {
    return {
      ok: false,
      errors: [`Missing ${relative(clientRoot)}. Run npm run build first.`],
      warnings,
      counts: { js: 0, css: 0, images: 0 },
    };
  }

  if (!fs.existsSync(assetsRoot)) {
    errors.push(`Missing ${relative(assetsRoot)} (Vite client assets directory).`);
  }

  let jsCount = 0;
  let cssCount = 0;
  let imageCount = 0;

  const visitor = (full, isDir) => {
    const rel = relative(full);
    if (SECRET_NAME_PATTERN.test(rel)) {
      errors.push(`Secret-like path exposed under public build: ${rel}`);
    }

    let stat;
    try {
      stat = fs.statSync(full);
    } catch (err) {
      errors.push(`Cannot stat ${rel}: ${err.message}`);
      return;
    }

    if (!skipUnixPerms) {
      const effectiveMode = modeFor ? modeFor(full, isDir, stat.mode) : stat.mode;
      const mode = modeOctal(effectiveMode);
      if (isDir) {
        if (!isWorldTraversableDir(effectiveMode)) {
          errors.push(
            `Directory ${rel} mode ${mode} is not traversable/readable by other users (need at least ---r-x for other; recommended 755). Apache would return 403.`,
          );
        }
      } else {
        const ext = path.extname(full).toLowerCase();
        if (PUBLIC_ASSET_EXT.has(ext) && !isWorldReadableFile(effectiveMode)) {
          errors.push(
            `Public asset ${rel} mode ${mode} is not readable by other users (need ---r--; recommended 644). Apache would return 403.`,
          );
        }
      }
    }

    if (isDir) return;
    const ext = path.extname(full).toLowerCase();
    if (ext === '.js' || ext === '.mjs') jsCount += 1;
    if (ext === '.css') cssCount += 1;
    if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico'].includes(ext)) imageCount += 1;
  };
  visitor.error = (message) => errors.push(message);

  walk(clientRoot, visitor);

  if (jsCount === 0) warnings.push('No JS assets found under dist/client — unexpected for a Vite client build.');
  if (cssCount === 0) warnings.push('No CSS assets found under dist/client — unexpected for a Vite client build.');
  if (imageCount === 0) warnings.push('No image assets found under dist/client — verify public/ was copied.');
  if (skipUnixPerms) {
    warnings.push(
      'Unix permission bits not checked on this host; re-run this preflight on the Linux deploy host before restart.',
    );
  }

  const sampleLimit = 40;
  let scanned = 0;
  if (fs.existsSync(assetsRoot)) {
    walk(assetsRoot, (full, isDir) => {
      if (isDir || scanned >= sampleLimit) return;
      const ext = path.extname(full).toLowerCase();
      if (ext !== '.js' && ext !== '.css' && ext !== '.mjs') return;
      scanned += 1;
      let text;
      try {
        text = fs.readFileSync(full, 'utf8');
      } catch {
        return;
      }
      if (/DATABASE_URL\s*=\s*['"][^'"]+['"]/.test(text) || /BEGIN (RSA |OPENSSH )?PRIVATE KEY/.test(text)) {
        errors.push(`Possible secret material in public bundle: ${relative(full)}`);
      }
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: { js: jsCount, css: cssCount, images: imageCount },
  };
}

function runCli() {
  const result = checkPublicAssetPermissions();
  for (const warning of result.warnings) {
    console.warn(`[preflight:assets] WARN: ${warning}`);
  }
  if (!result.ok) {
    console.error('[preflight:assets] FAILED — fix permissions before restarting services:');
    for (const error of result.errors) console.error(`  - ${error}`);
    console.error('');
    console.error('Narrow fix (dist/client only):');
    console.error('  find dist/client -type d -exec chmod 755 {} +');
    console.error('  find dist/client -type f -exec chmod 644 {} +');
    process.exit(1);
  }
  console.log(
    `[preflight:assets] OK: dist/client is ready (js=${result.counts.js}, css=${result.counts.css}, images=${result.counts.images}).`,
  );
}

const isCli =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  runCli();
}
