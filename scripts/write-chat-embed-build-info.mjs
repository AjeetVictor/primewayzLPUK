/**
 * Writes dist/embed/BUILD_INFO.json next to pw-chat.js so the WordPress plugin
 * can record exactly which artifact it vendors. Contains no secrets.
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = process.cwd();
const outDir = path.join(root, 'dist', 'embed');
const artifactPath = path.join(outDir, 'pw-chat.js');

if (!fs.existsSync(artifactPath)) {
  console.error('[chat-embed] dist/embed/pw-chat.js is missing; run the embed build first.');
  process.exit(1);
}

const versionSource = fs.readFileSync(path.join(root, 'src', 'embed', 'chat', 'version.ts'), 'utf8');
const buildVersion = versionSource.match(/PW_CHAT_EMBED_VERSION\s*=\s*'([^']+)'/)?.[1];
if (!buildVersion) {
  console.error('[chat-embed] Could not read PW_CHAT_EMBED_VERSION.');
  process.exit(1);
}

function git(command) {
  try {
    return execSync(command, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return null;
  }
}

const embedSourcePaths = 'src/embed src/lib/chat vite.embed.config.ts';
const artifact = fs.readFileSync(artifactPath);
const info = {
  artifact: 'pw-chat.js',
  buildVersion,
  gitCommit: git('git rev-parse HEAD'),
  gitSourceDirty: git(`git status --porcelain -- ${embedSourcePaths}`) ? true : false,
  builtAt: new Date().toISOString(),
  sha256: createHash('sha256').update(artifact).digest('hex'),
  sizeBytes: artifact.length,
  gzipBytes: zlib.gzipSync(artifact, { level: 9 }).length,
};

fs.writeFileSync(path.join(outDir, 'BUILD_INFO.json'), `${JSON.stringify(info, null, 2)}\n`);
console.log(
  `[chat-embed] pw-chat.js v${info.buildVersion}: ${info.sizeBytes} bytes raw, ${info.gzipBytes} bytes gzip, sha256 ${info.sha256.slice(0, 12)}`,
);
