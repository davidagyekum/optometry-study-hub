import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { relative, resolve } from 'node:path';
import {
  releaseBuildMetadataSchema,
  type ReleaseBuildMetadata,
  type ReleaseProfileId,
} from '@/lib/release/types';

export type ReleaseGitIdentity = {
  commitSha: string;
  treeSha: string;
  dirty: boolean;
};

function command(commandName: string, args: string[]): string {
  const result = spawnSync(commandName, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(
      `${commandName} ${args.join(' ')} failed: ${(result.stderr || result.stdout).trim()}`,
    );
  }
  return result.stdout.trim();
}

export function releaseGitIdentity(): ReleaseGitIdentity {
  return {
    commitSha: command('git', ['rev-parse', 'HEAD']),
    treeSha: command('git', ['rev-parse', 'HEAD^{tree}']),
    dirty: command('git', ['status', '--porcelain']).length > 0,
  };
}

export function assertCleanReleaseTree(identity: ReleaseGitIdentity): void {
  if (identity.dirty) {
    throw new Error('Release evidence requires a clean Git working tree.');
  }
}

export function detectedNpmVersion(): string {
  if (process.env.npm_execpath) {
    return command(process.execPath, [process.env.npm_execpath, '--version']);
  }
  return command(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['--version']);
}

function filesUnder(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = resolve(directory, entry.name);
    return entry.isDirectory() ? filesUnder(filePath) : [filePath];
  });
}

export function releaseOutputFingerprint(outputDirectory: string): string {
  const hash = createHash('sha256');
  for (const file of filesUnder(outputDirectory).sort()) {
    hash.update(relative(outputDirectory, file).replaceAll('\\', '/'));
    hash.update('\0');
    hash.update(readFileSync(file));
    hash.update('\0');
  }
  return hash.digest('hex');
}

export function releaseOutputDirectory(profile: ReleaseProfileId): string {
  return resolve('tmp', 'release', 'builds', profile);
}

export function releaseOutputDirectoryId(outputDirectory: string): string {
  return relative(process.cwd(), resolve(outputDirectory)).replaceAll('\\', '/');
}

export function releaseBuildMetadataPath(profile: ReleaseProfileId): string {
  return resolve('tmp', 'release', 'build-metadata', `${profile}.json`);
}

export function readReleaseBuildMetadata(
  profile: ReleaseProfileId,
  metadataPath = releaseBuildMetadataPath(profile),
): ReleaseBuildMetadata {
  if (!existsSync(metadataPath)) {
    throw new Error(`Release build metadata is missing for ${profile}: ${metadataPath}`);
  }
  let input: unknown;
  try {
    input = JSON.parse(readFileSync(metadataPath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Release build metadata is malformed for ${profile}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  const parsed = releaseBuildMetadataSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      `Release build metadata is invalid for ${profile}: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export function writeReleaseBuildMetadataAtomically(
  metadata: ReleaseBuildMetadata,
  metadataPath = releaseBuildMetadataPath(metadata.profile),
): void {
  const validated = releaseBuildMetadataSchema.parse(metadata);
  const temporaryPath = `${metadataPath}.${process.pid}.tmp`;
  rmSync(temporaryPath, { force: true });
  writeFileSync(temporaryPath, `${JSON.stringify(validated, null, 2)}\n`, 'utf8');
  renameSync(temporaryPath, metadataPath);
}

export function releaseOutputStats(outputDirectory: string): {
  fileCount: number;
  totalBytes: number;
} {
  const files = filesUnder(outputDirectory);
  return {
    fileCount: files.length,
    totalBytes: files.reduce((total, file) => total + statSync(file).size, 0),
  };
}
