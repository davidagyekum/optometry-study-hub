import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import {
  assertReleaseProfile,
  environmentForReleaseProfile,
  parseReleaseProfile,
  releaseFlagsFromEnvironment,
} from '@/lib/release/profile';

const profileArgument = process.argv.find((argument) => argument.startsWith('--profile='))
  ?.slice('--profile='.length);
const profile = parseReleaseProfile(profileArgument ?? process.argv[2] ?? '');
const environment = environmentForReleaseProfile(profile);
assertReleaseProfile(profile, releaseFlagsFromEnvironment(environment));

const dist = resolve('dist');
const releaseRoot = resolve('tmp', 'release');
const output = resolve(releaseRoot, 'builds', profile);
const metadataDirectory = resolve(releaseRoot, 'build-metadata');
rmSync(dist, { recursive: true, force: true });
rmSync(output, { recursive: true, force: true });
mkdirSync(metadataDirectory, { recursive: true });

const npmExecPath = process.env.npm_execpath;
const npmCommand = npmExecPath ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
const npmArguments = npmExecPath ? [npmExecPath, 'run', 'build'] : ['run', 'build'];
const started = performance.now();
const result = spawnSync(npmCommand, npmArguments, {
  cwd: process.cwd(),
  env: environment,
  encoding: 'utf8',
  shell: false,
  stdio: 'inherit',
});
const buildDurationMs = Math.round(performance.now() - started);
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

cpSync(dist, output, { recursive: true });
writeFileSync(
  resolve(metadataDirectory, `${profile}.json`),
  `${JSON.stringify({
    schemaVersion: 1,
    profile,
    buildDurationMs,
    flags: {
      assessmentPilot: false,
      hvpCuratedPractice: profile === 'hvp-public-beta',
    },
  }, null, 2)}\n`,
  'utf8',
);
console.log(`Release build complete: ${profile} (${buildDurationMs} ms)`);
