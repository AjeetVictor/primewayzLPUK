import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const projectRoot = process.cwd();
dotenv.config({ path: path.join(projectRoot, '.env') });

function assertRootPath(name, value) {
  if (value === '/') return;
  console.error(`[base-path-lock] ${name} must be "/" but got "${value ?? '(unset)'}".`);
  process.exit(1);
}

const viteBasePath = process.env.VITE_APP_BASE_PATH ?? '/';
const appBasePath = process.env.APP_BASE_PATH ?? '/';

assertRootPath('VITE_APP_BASE_PATH', viteBasePath);
assertRootPath('APP_BASE_PATH', appBasePath);

const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
if (!/base:\s*['"]\/['"]/.test(viteConfig)) {
  console.error('[base-path-lock] vite.config.ts must keep base set to "/".');
  process.exit(1);
}

console.log('[base-path-lock] OK: root base path is locked.');
