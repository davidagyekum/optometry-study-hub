import {
  releaseProfileIdSchema,
  type ReleaseFlags,
  type ReleaseProfileId,
} from '@/lib/release/types';

export const RELEASE_FLAG_NAMES = {
  assessmentPilot: 'NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT',
  hvpCuratedPractice: 'NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE',
} as const;

export const RELEASE_PROFILES: Record<ReleaseProfileId, ReleaseFlags> = {
  disabled: {
    assessmentPilot: false,
    hvpCuratedPractice: false,
  },
  'hvp-public-beta': {
    assessmentPilot: false,
    hvpCuratedPractice: true,
  },
};

export class ReleaseProfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReleaseProfileError';
  }
}

export function parseReleaseFlag(name: string, value: string | undefined): boolean {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new ReleaseProfileError(
    `${name} must be the exact string "true" or "false"; received ${JSON.stringify(value)}.`,
  );
}

export function parseReleaseProfile(value: string): ReleaseProfileId {
  const parsed = releaseProfileIdSchema.safeParse(value);
  if (!parsed.success) {
    throw new ReleaseProfileError(
      `Unknown release profile ${JSON.stringify(value)}. Expected disabled or hvp-public-beta.`,
    );
  }
  return parsed.data;
}

export function releaseFlagsFromEnvironment(
  environment: NodeJS.ProcessEnv,
): ReleaseFlags {
  return {
    assessmentPilot: parseReleaseFlag(
      RELEASE_FLAG_NAMES.assessmentPilot,
      environment[RELEASE_FLAG_NAMES.assessmentPilot],
    ),
    hvpCuratedPractice: parseReleaseFlag(
      RELEASE_FLAG_NAMES.hvpCuratedPractice,
      environment[RELEASE_FLAG_NAMES.hvpCuratedPractice],
    ),
  };
}

export function assertReleaseProfile(
  profile: ReleaseProfileId,
  flags: ReleaseFlags,
): ReleaseFlags {
  if (flags.assessmentPilot) {
    throw new ReleaseProfileError(
      'The Aqueous engineering pilot must remain disabled in every release profile.',
    );
  }
  const expected = RELEASE_PROFILES[profile];
  if (
    flags.assessmentPilot !== expected.assessmentPilot
    || flags.hvpCuratedPractice !== expected.hvpCuratedPractice
  ) {
    throw new ReleaseProfileError(
      `Release profile ${profile} does not match its required feature flags.`,
    );
  }
  return flags;
}

export function environmentForReleaseProfile(
  profile: ReleaseProfileId,
  base: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const flags = RELEASE_PROFILES[profile];
  return {
    ...base,
    [RELEASE_FLAG_NAMES.assessmentPilot]: String(flags.assessmentPilot),
    [RELEASE_FLAG_NAMES.hvpCuratedPractice]: String(flags.hvpCuratedPractice),
    OPTOMETRY_RELEASE_PROFILE: profile,
  };
}
