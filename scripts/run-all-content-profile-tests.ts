import { spawnSync } from 'node:child_process';
import { environmentForReleaseProfile } from '@/lib/release/profile';

const npmExecPath = process.env.npm_execpath;
const npmCommand = npmExecPath
  ? process.execPath
  : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
const args = npmExecPath
  ? [npmExecPath, 'exec', 'vitest', 'run', '--', 'tests/release/all-content-profile-smoke.test.tsx']
  : ['exec', 'vitest', 'run', '--', 'tests/release/all-content-profile-smoke.test.tsx'];
const result = spawnSync(npmCommand, args, {
  cwd: process.cwd(),
  env: environmentForReleaseProfile('all-course-content-public'),
  shell: false,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
