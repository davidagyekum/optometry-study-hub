import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  rmSync,
} from 'node:fs';
import { resolve } from 'node:path';
import {
  assertCleanReleaseTree,
  detectedNpmVersion,
  releaseBuildMetadataPath,
  releaseGitIdentity,
  releaseOutputDirectory,
  releaseOutputDirectoryId,
  releaseOutputFingerprint,
  writeReleaseBuildMetadataAtomically,
} from '@/lib/release/buildIdentity';
import {
  assertReleaseProfile,
  environmentForReleaseProfile,
  parseReleaseProfile,
  releaseFlagsFromEnvironment,
} from '@/lib/release/profile';

const profileArgument = process.argv.find((argument) => argument.startsWith('--profile='))
  ?.slice('--profile='.length);
const profile = parseReleaseProfile(profileArgument ?? process.argv[2] ?? '');
const allowDirty = process.argv.includes('--allow-dirty');
const environment = environmentForReleaseProfile(profile);
const flags = assertReleaseProfile(profile, releaseFlagsFromEnvironment(environment));
const git = releaseGitIdentity();
if (!allowDirty) assertCleanReleaseTree(git);

const dist = resolve('dist');
const output = releaseOutputDirectory(profile);
const metadataPath = releaseBuildMetadataPath(profile);
const metadataDirectory = resolve('tmp', 'release', 'build-metadata');
rmSync(metadataPath, { force: true });
rmSync(`${metadataPath}.development`, { force: true });
rmSync(dist, { recursive: true, force: true });
rmSync(output, { recursive: true, force: true });
mkdirSync(metadataDirectory, { recursive: true });

const npmExecPath = process.env.npm_execpath;
const npmCommand = npmExecPath
  ? process.execPath
  : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
const npmArguments = npmExecPath ? [npmExecPath, 'run', 'build'] : ['run', 'build'];
const started = performance.now();
const result = spawnSync(npmCommand, npmArguments, {
  cwd: process.cwd(),
  env: environment,
  encoding: 'utf8',
  shell: false,
  stdio: 'inherit',
});
const buildDurationMs = Math.round(Math.max(0, performance.now() - started));
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

cpSync(dist, output, { recursive: true });
const outputFingerprint = releaseOutputFingerprint(output);
const metadata = {
  schemaVersion: 1 as const,
  profile,
  flags,
  commitSha: git.commitSha,
  treeSha: git.treeSha,
  dirty: false as const,
  nodeVersion: process.version,
  npmVersion: detectedNpmVersion(),
  builtAt: new Date().toISOString(),
  buildDurationMs,
  outputFingerprint,
  outputDirectory: releaseOutputDirectoryId(output),
};

if (allowDirty && git.dirty) {
  console.warn(
    'Development-only dirty build completed. No release metadata was written, so audit and manifest commands will reject it.',
  );
} else {
  writeReleaseBuildMetadataAtomically(metadata, metadataPath);
}
console.log(`Release build complete: ${profile} (${Math.round(buildDurationMs)} ms)`);
