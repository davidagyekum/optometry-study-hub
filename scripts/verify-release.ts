import { spawnSync } from 'node:child_process';

type Command = {
  label: string;
  command: string;
  args: string[];
};

const npmExecPath = process.env.npm_execpath;
const npmCommand = npmExecPath ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
const npmArgs = (...args: string[]) => npmExecPath ? [npmExecPath, ...args] : args;
const commands: Command[] = [
  { label: 'Release profile validation', command: npmCommand, args: npmArgs('run', 'release:profile') },
  { label: 'Lint', command: npmCommand, args: npmArgs('run', 'lint') },
  { label: 'Typecheck', command: npmCommand, args: npmArgs('run', 'typecheck') },
  { label: 'Tests', command: npmCommand, args: npmArgs('run', 'test') },
  { label: 'Aqueous validation', command: npmCommand, args: npmArgs('run', 'questions:validate') },
  { label: 'Aqueous strict validation', command: npmCommand, args: npmArgs('run', 'questions:validate', '--', '--strict') },
  { label: 'Aqueous report', command: npmCommand, args: npmArgs('run', 'questions:report') },
  { label: 'Aqueous blueprint', command: npmCommand, args: npmArgs('run', 'questions:blueprint') },
  { label: 'HVP validation', command: npmCommand, args: npmArgs('run', 'questions:validate:hvp') },
  { label: 'HVP report', command: npmCommand, args: npmArgs('run', 'questions:report:hvp') },
  { label: 'HVP blueprint', command: npmCommand, args: npmArgs('run', 'questions:blueprint:hvp') },
  { label: 'Disabled release build', command: npmCommand, args: npmArgs('run', 'release:build:disabled') },
  { label: 'Disabled bundle audit', command: npmCommand, args: npmArgs('run', 'release:audit', '--', '--profile=disabled') },
  { label: 'HVP release build', command: npmCommand, args: npmArgs('run', 'release:build:hvp') },
  { label: 'HVP bundle audit', command: npmCommand, args: npmArgs('run', 'release:audit', '--', '--profile=hvp-public-beta') },
  { label: 'Release manifest', command: npmCommand, args: npmArgs('run', 'release:manifest') },
  { label: 'Whitespace validation', command: 'git', args: ['diff', '--check'] },
];

for (const item of commands) {
  console.log(`\n== ${item.label} ==`);
  const result = spawnSync(item.command, item.args, {
    cwd: process.cwd(),
    env: process.env,
    shell: false,
    stdio: 'inherit',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('\nRelease verification passed.');
