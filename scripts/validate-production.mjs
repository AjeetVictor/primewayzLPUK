#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const shell = process.platform === 'win32';

const result = spawnSync(
  npmCmd,
  ['run', 'validate'],
  {
    stdio: 'inherit',
    shell,
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096',
    },
  },
);

process.exit(result.status ?? 1);
