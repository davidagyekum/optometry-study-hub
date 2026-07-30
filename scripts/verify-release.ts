import { spawnSync } from 'node:child_process';
import {
  readFileSync,
  rmSync,
} from 'node:fs';
import { resolve } from 'node:path';
import {
  assertCleanReleaseTree,
  readReleaseBuildMetadata,
  releaseGitIdentity,
} from '@/lib/release/buildIdentity';
import { releaseManifestSchema } from '@/lib/release/types';

type Command = {
  label: string;
  command: string;
  args: string[];
};

const initialGit = releaseGitIdentity();
assertCleanReleaseTree(initialGit);
rmSync(resolve('tmp', 'release'), { recursive: true, force: true });

const npmExecPath = process.env.npm_execpath;
const npmCommand = npmExecPath
  ? process.execPath
  : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
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
  { label: 'Autonomic Pharmacology validation', command: npmCommand, args: npmArgs('run', 'questions:validate:autonomic-pharmacology', '--', '--strict') },
  { label: 'Autonomic Pharmacology report', command: npmCommand, args: npmArgs('run', 'questions:report:autonomic-pharmacology') },
  { label: 'Autonomic Pharmacology blueprint', command: npmCommand, args: npmArgs('run', 'questions:blueprint:autonomic-pharmacology') },
  { label: 'Systemic Pathology validation', command: npmCommand, args: npmArgs('run', 'questions:validate:systemic-pathology', '--', '--strict') },
  { label: 'Systemic Pathology report', command: npmCommand, args: npmArgs('run', 'questions:report:systemic-pathology') },
  { label: 'Systemic Pathology blueprint', command: npmCommand, args: npmArgs('run', 'questions:blueprint:systemic-pathology') },
  { label: 'Disabled release build', command: npmCommand, args: npmArgs('run', 'release:build:disabled') },
  { label: 'Disabled bundle audit', command: npmCommand, args: npmArgs('run', 'release:audit', '--', '--profile=disabled') },
  { label: 'HVP release build', command: npmCommand, args: npmArgs('run', 'release:build:hvp') },
  { label: 'HVP bundle audit', command: npmCommand, args: npmArgs('run', 'release:audit', '--', '--profile=hvp-public-beta') },
  { label: 'Tissue release build', command: npmCommand, args: npmArgs('run', 'release:build:tissue') },
  { label: 'Tissue bundle audit', command: npmCommand, args: npmArgs('run', 'release:audit', '--', '--profile=tissue-foundations-preview') },
  { label: 'Combined HVP and Tissue release build', command: npmCommand, args: npmArgs('run', 'release:build:hvp-tissue') },
  { label: 'Combined HVP and Tissue bundle audit', command: npmCommand, args: npmArgs('run', 'release:audit', '--', '--profile=hvp-tissue-preview') },
  { label: 'Neuro Anatomy preview build', command: npmCommand, args: npmArgs('run', 'release:build:neuro') },
  { label: 'Neuro Anatomy preview bundle audit', command: npmCommand, args: npmArgs('run', 'release:audit', '--', '--profile=neuro-anatomy-preview') },
  { label: 'Environmental Vision preview build', command: npmCommand, args: npmArgs('run', 'release:build:environmental-vision') },
  { label: 'Environmental Vision preview bundle audit', command: npmCommand, args: npmArgs('run', 'release:audit', '--', '--profile=environmental-vision-preview') },
  { label: 'Autonomic Pharmacology preview build', command: npmCommand, args: npmArgs('run', 'release:build:autonomic-pharmacology') },
  { label: 'Autonomic Pharmacology preview bundle audit', command: npmCommand, args: npmArgs('run', 'release:audit', '--', '--profile=autonomic-pharmacology-preview') },
  { label: 'Systemic Pathology preview build', command: npmCommand, args: npmArgs('run', 'release:build:systemic-pathology') },
  { label: 'Systemic Pathology preview bundle audit', command: npmCommand, args: npmArgs('run', 'release:audit', '--', '--profile=systemic-pathology-preview') },
  { label: 'Full curated preview build', command: npmCommand, args: npmArgs('run', 'release:build:full-curated') },
  { label: 'Full curated preview bundle audit', command: npmCommand, args: npmArgs('run', 'release:audit', '--', '--profile=full-curated-preview') },
  { label: 'Full curated public-beta build', command: npmCommand, args: npmArgs('run', 'release:build:full-curated-public') },
  { label: 'Full curated public-beta bundle audit', command: npmCommand, args: npmArgs('run', 'release:audit', '--', '--profile=full-curated-public-beta') },
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

const manifest = releaseManifestSchema.parse(JSON.parse(readFileSync(
  resolve('tmp', 'release', 'release-manifest.json'),
  'utf8',
)));
const metadata = readReleaseBuildMetadata('full-curated-public-beta');
const finalGit = releaseGitIdentity();
assertCleanReleaseTree(finalGit);
if (
  finalGit.commitSha !== initialGit.commitSha
  || finalGit.treeSha !== initialGit.treeSha
  || manifest.git.commitSha !== metadata.commitSha
  || manifest.git.treeSha !== metadata.treeSha
  || manifest.releaseProfile !== metadata.profile
  || manifest.flags.assessmentPilot !== metadata.flags.assessmentPilot
  || manifest.flags.hvpCuratedPractice !== metadata.flags.hvpCuratedPractice
  || manifest.flags.tissueFoundationsCuratedPractice
    !== metadata.flags.tissueFoundationsCuratedPractice
  || manifest.flags.ocularAdnexaCuratedPractice
    !== metadata.flags.ocularAdnexaCuratedPractice
  || manifest.flags.aqueousVitreousCuratedPractice
    !== metadata.flags.aqueousVitreousCuratedPractice
  || manifest.flags.bloodSupplyCuratedPractice
    !== metadata.flags.bloodSupplyCuratedPractice
  || manifest.flags.environmentalVisionCuratedPractice
    !== metadata.flags.environmentalVisionCuratedPractice
  || manifest.flags.autonomicPharmacologyCuratedPractice
    !== metadata.flags.autonomicPharmacologyCuratedPractice
  || manifest.flags.systemicPathologyCuratedPractice
    !== metadata.flags.systemicPathologyCuratedPractice
  || manifest.build.outputFingerprint !== metadata.outputFingerprint
  || manifest.build.identity.outputFingerprint !== metadata.outputFingerprint
) {
  throw new Error('Fresh release manifest identity does not match its clean build evidence.');
}
console.log('\nRelease verification passed with fresh, source-bound evidence.');
