import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { assertReleaseAssertions } from '@/lib/release/assertions';
import {
  assertReleaseProfile,
  RELEASE_PROFILES,
} from '@/lib/release/profile';
import {
  RELEASE_PROFILE_IDS,
  type ReleaseProfileId,
} from '@/lib/release/types';

function gitTrackedEnvironmentFiles(): string[] {
  const result = spawnSync('git', ['ls-files', '.env*'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: false,
  });
  if (result.status !== 0) {
    throw new Error(`Unable to inspect tracked environment files: ${result.stderr.trim()}`);
  }
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

for (const profile of RELEASE_PROFILE_IDS) {
  assertReleaseProfile(profile as ReleaseProfileId, RELEASE_PROFILES[profile]);
}
assertReleaseAssertions();

const trackedEnvironmentFiles = gitTrackedEnvironmentFiles();
if (
  trackedEnvironmentFiles.length !== 1
  || trackedEnvironmentFiles[0] !== '.env.example'
) {
  throw new Error(
    `Unexpected tracked environment file(s): ${trackedEnvironmentFiles.join(', ') || 'none'}`,
  );
}
const example = readFileSync('.env.example', 'utf8');
const committedFlagNames = [
  'ASSESSMENT_PILOT',
  'HVP_CURATED_PRACTICE',
  'TISSUE_FOUNDATIONS_CURATED_PRACTICE',
  'OCULAR_ADNEXA_CURATED_PRACTICE',
  'AQUEOUS_VITREOUS_CURATED_PRACTICE',
  'BLOOD_SUPPLY_CURATED_PRACTICE',
  'ENVIRONMENTAL_VISION_CURATED_PRACTICE',
  'AUTONOMIC_PHARMACOLOGY_CURATED_PRACTICE',
];
if (
  committedFlagNames.some(
    (name) => !example.includes(`NEXT_PUBLIC_ENABLE_${name}=false`),
  )
  || /NEXT_PUBLIC_ENABLE_\w+=true/.test(example)
) {
  throw new Error('Committed feature defaults must keep all assessment flags false.');
}

console.log('Release profiles and repository guardrails passed.');
