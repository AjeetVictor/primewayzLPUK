import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, 'src');

const NATIVE_DIALOG_PATTERN =
  /(?:window\.)?(?:confirm|alert|prompt)\s*\(\s*(?!s\))/g;

const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx']);

function walkFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
      continue;
    }

    const extension = path.extname(entry.name);
    if (ALLOWED_EXTENSIONS.has(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

function findViolations(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const violations = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const matches = line.matchAll(NATIVE_DIALOG_PATTERN);

    for (const match of matches) {
      violations.push({
        filePath,
        line: index + 1,
        column: (match.index ?? 0) + 1,
        snippet: line.trim(),
      });
    }
  }

  return violations;
}

const files = walkFiles(srcRoot);
const violations = files.flatMap(findViolations);

if (violations.length > 0) {
  console.error('[native-dialogs] Browser-native dialog usage is not allowed in src/.');
  console.error('Use AppConfirmDialog, AppToast, or AppPromptDialog instead.\n');

  for (const violation of violations) {
    const relativePath = path.relative(projectRoot, violation.filePath);
    console.error(`${relativePath}:${violation.line}:${violation.column}`);
    console.error(`  ${violation.snippet}\n`);
  }

  process.exit(1);
}

console.log('[native-dialogs] OK: no browser-native alert, confirm, or prompt calls found.');
