import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { auditReleaseBundle, writeBundleAudit } from '@/lib/release/bundleAudit';
import {
  RELEASE_PROFILE_IDS,
  type ReleaseProfileId,
} from '@/lib/release/types';
import { parseReleaseProfile } from '@/lib/release/profile';

const profileArgument = process.argv.find((argument) => argument.startsWith('--profile='))
  ?.slice('--profile='.length);
const profiles: ReleaseProfileId[] = profileArgument
  ? [parseReleaseProfile(profileArgument)]
  : [...RELEASE_PROFILE_IDS];
const auditDirectory = resolve('tmp', 'release', 'audits');
mkdirSync(auditDirectory, { recursive: true });

for (const profile of profiles) {
  const audit = auditReleaseBundle(profile);
  writeBundleAudit(audit, resolve(auditDirectory, `${profile}.json`));
  console.log(`${profile} bundle audit passed.`);
  console.log(JSON.stringify(audit.metrics, null, 2));
}
