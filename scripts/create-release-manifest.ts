import {
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { auditReleaseBundle } from '@/lib/release/bundleAudit';
import {
  assertManifestHasNoSensitivePaths,
  createReleaseManifest,
  releaseManifestChecksum,
  releaseManifestIdentity,
  renderReleaseReport,
} from '@/lib/release/manifest';
import {
  assertPublishableReleaseProfile,
  parseReleaseProfile,
} from '@/lib/release/profile';

const profileArgument = process.argv.find((argument) => argument.startsWith('--profile='))
  ?.slice('--profile='.length);
const profile = assertPublishableReleaseProfile(
  parseReleaseProfile(profileArgument ?? 'all-course-content-public'),
);
const audit = auditReleaseBundle(profile);
const manifest = createReleaseManifest({ profile, audit });
assertManifestHasNoSensitivePaths(manifest);

const directory = resolve('tmp', 'release');
mkdirSync(directory, { recursive: true });
const json = `${JSON.stringify(manifest, null, 2)}\n`;
const checksum = releaseManifestChecksum(manifest);
writeFileSync(resolve(directory, 'release-manifest.json'), json, 'utf8');
writeFileSync(
  resolve(directory, 'release-report.md'),
  renderReleaseReport(manifest, checksum),
  'utf8',
);
writeFileSync(resolve(directory, 'release-manifest.sha256'), `${checksum}\n`, 'utf8');
console.log(`Release manifest: ${resolve(directory, 'release-manifest.json')}`);
console.log(`Manifest SHA-256: ${checksum}`);
console.log(`Deterministic identity: ${releaseManifestIdentity(manifest)}`);
