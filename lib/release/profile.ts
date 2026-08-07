import {
  releaseProfileIdSchema,
  type ReleaseFlags,
  type ReleaseProfileId,
} from '@/lib/release/types';

export const RELEASE_FLAG_NAMES = {
  assessmentPilot: 'NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT',
  hvpCuratedPractice: 'NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE',
  hvpDepthColourExpansion: 'NEXT_PUBLIC_ENABLE_HVP_DEPTH_COLOUR_EXPANSION',
  tissueFoundationsCuratedPractice:
    'NEXT_PUBLIC_ENABLE_TISSUE_FOUNDATIONS_CURATED_PRACTICE',
  ocularAdnexaCuratedPractice:
    'NEXT_PUBLIC_ENABLE_OCULAR_ADNEXA_CURATED_PRACTICE',
  aqueousVitreousCuratedPractice:
    'NEXT_PUBLIC_ENABLE_AQUEOUS_VITREOUS_CURATED_PRACTICE',
  bloodSupplyCuratedPractice:
    'NEXT_PUBLIC_ENABLE_BLOOD_SUPPLY_CURATED_PRACTICE',
  environmentalVisionCuratedPractice:
    'NEXT_PUBLIC_ENABLE_ENVIRONMENTAL_VISION_CURATED_PRACTICE',
  autonomicPharmacologyCuratedPractice:
    'NEXT_PUBLIC_ENABLE_AUTONOMIC_PHARMACOLOGY_CURATED_PRACTICE',
  systemicPathologyCuratedPractice:
    'NEXT_PUBLIC_ENABLE_SYSTEMIC_PATHOLOGY_CURATED_PRACTICE',
  opt370SchematicEyeRefractiveStates:
    'NEXT_PUBLIC_ENABLE_OPT370_SCHEMATIC_EYE_REFRACTIVE_STATES',
  opt370MultifocalFoundations:
    'NEXT_PUBLIC_ENABLE_OPT370_MULTIFOCAL_FOUNDATIONS',
  opt370ProgressiveAdditionLenses:
    'NEXT_PUBLIC_ENABLE_OPT370_PROGRESSIVE_ADDITION_LENSES',
  opt370PdAndDispensing:
    'NEXT_PUBLIC_ENABLE_OPT370_PD_AND_DISPENSING',
  opt370SpecialLenses:
    'NEXT_PUBLIC_ENABLE_OPT370_SPECIAL_LENSES',
} as const;

export const RELEASE_PROFILES: Record<ReleaseProfileId, ReleaseFlags> = {
  disabled: {
    assessmentPilot: false,
    hvpCuratedPractice: false,
    hvpDepthColourExpansion: false,
    tissueFoundationsCuratedPractice: false,
    ocularAdnexaCuratedPractice: false,
    aqueousVitreousCuratedPractice: false,
    bloodSupplyCuratedPractice: false,
    environmentalVisionCuratedPractice: false,
    autonomicPharmacologyCuratedPractice: false,
    systemicPathologyCuratedPractice: false,
    opt370SchematicEyeRefractiveStates: false,
    opt370MultifocalFoundations: false,
    opt370ProgressiveAdditionLenses: false,
    opt370PdAndDispensing: false,
    opt370SpecialLenses: false,
  },
  'hvp-public-beta': {
    assessmentPilot: false,
    hvpCuratedPractice: true,
    hvpDepthColourExpansion: false,
    tissueFoundationsCuratedPractice: false,
    ocularAdnexaCuratedPractice: false,
    aqueousVitreousCuratedPractice: false,
    bloodSupplyCuratedPractice: false,
    environmentalVisionCuratedPractice: false,
    autonomicPharmacologyCuratedPractice: false,
    systemicPathologyCuratedPractice: false,
    opt370SchematicEyeRefractiveStates: false,
    opt370MultifocalFoundations: false,
    opt370ProgressiveAdditionLenses: false,
    opt370PdAndDispensing: false,
    opt370SpecialLenses: false,
  },
  'tissue-foundations-preview': {
    assessmentPilot: false,
    hvpCuratedPractice: false,
    hvpDepthColourExpansion: false,
    tissueFoundationsCuratedPractice: true,
    ocularAdnexaCuratedPractice: false,
    aqueousVitreousCuratedPractice: false,
    bloodSupplyCuratedPractice: false,
    environmentalVisionCuratedPractice: false,
    autonomicPharmacologyCuratedPractice: false,
    systemicPathologyCuratedPractice: false,
    opt370SchematicEyeRefractiveStates: false,
    opt370MultifocalFoundations: false,
    opt370ProgressiveAdditionLenses: false,
    opt370PdAndDispensing: false,
    opt370SpecialLenses: false,
  },
  'hvp-tissue-preview': {
    assessmentPilot: false,
    hvpCuratedPractice: true,
    hvpDepthColourExpansion: false,
    tissueFoundationsCuratedPractice: true,
    ocularAdnexaCuratedPractice: false,
    aqueousVitreousCuratedPractice: false,
    bloodSupplyCuratedPractice: false,
    environmentalVisionCuratedPractice: false,
    autonomicPharmacologyCuratedPractice: false,
    systemicPathologyCuratedPractice: false,
    opt370SchematicEyeRefractiveStates: false,
    opt370MultifocalFoundations: false,
    opt370ProgressiveAdditionLenses: false,
    opt370PdAndDispensing: false,
    opt370SpecialLenses: false,
  },
  'neuro-anatomy-preview': {
    assessmentPilot: false,
    hvpCuratedPractice: false,
    hvpDepthColourExpansion: false,
    tissueFoundationsCuratedPractice: true,
    ocularAdnexaCuratedPractice: true,
    aqueousVitreousCuratedPractice: true,
    bloodSupplyCuratedPractice: true,
    environmentalVisionCuratedPractice: false,
    autonomicPharmacologyCuratedPractice: false,
    systemicPathologyCuratedPractice: false,
    opt370SchematicEyeRefractiveStates: false,
    opt370MultifocalFoundations: false,
    opt370ProgressiveAdditionLenses: false,
    opt370PdAndDispensing: false,
    opt370SpecialLenses: false,
  },
  'environmental-vision-preview': {
    assessmentPilot: false,
    hvpCuratedPractice: false,
    hvpDepthColourExpansion: false,
    tissueFoundationsCuratedPractice: false,
    ocularAdnexaCuratedPractice: false,
    aqueousVitreousCuratedPractice: false,
    bloodSupplyCuratedPractice: false,
    environmentalVisionCuratedPractice: true,
    autonomicPharmacologyCuratedPractice: false,
    systemicPathologyCuratedPractice: false,
    opt370SchematicEyeRefractiveStates: false,
    opt370MultifocalFoundations: false,
    opt370ProgressiveAdditionLenses: false,
    opt370PdAndDispensing: false,
    opt370SpecialLenses: false,
  },
  'autonomic-pharmacology-preview': {
    assessmentPilot: false,
    hvpCuratedPractice: false,
    hvpDepthColourExpansion: false,
    tissueFoundationsCuratedPractice: false,
    ocularAdnexaCuratedPractice: false,
    aqueousVitreousCuratedPractice: false,
    bloodSupplyCuratedPractice: false,
    environmentalVisionCuratedPractice: false,
    autonomicPharmacologyCuratedPractice: true,
    systemicPathologyCuratedPractice: false,
    opt370SchematicEyeRefractiveStates: false,
    opt370MultifocalFoundations: false,
    opt370ProgressiveAdditionLenses: false,
    opt370PdAndDispensing: false,
    opt370SpecialLenses: false,
  },
  'systemic-pathology-preview': {
    assessmentPilot: false,
    hvpCuratedPractice: false,
    hvpDepthColourExpansion: false,
    tissueFoundationsCuratedPractice: false,
    ocularAdnexaCuratedPractice: false,
    aqueousVitreousCuratedPractice: false,
    bloodSupplyCuratedPractice: false,
    environmentalVisionCuratedPractice: false,
    autonomicPharmacologyCuratedPractice: false,
    systemicPathologyCuratedPractice: true,
    opt370SchematicEyeRefractiveStates: false,
    opt370MultifocalFoundations: false,
    opt370ProgressiveAdditionLenses: false,
    opt370PdAndDispensing: false,
    opt370SpecialLenses: false,
  },
  'full-curated-preview': {
    assessmentPilot: false,
    hvpCuratedPractice: true,
    hvpDepthColourExpansion: false,
    tissueFoundationsCuratedPractice: true,
    ocularAdnexaCuratedPractice: true,
    aqueousVitreousCuratedPractice: true,
    bloodSupplyCuratedPractice: true,
    environmentalVisionCuratedPractice: true,
    autonomicPharmacologyCuratedPractice: true,
    systemicPathologyCuratedPractice: true,
    opt370SchematicEyeRefractiveStates: false,
    opt370MultifocalFoundations: false,
    opt370ProgressiveAdditionLenses: false,
    opt370PdAndDispensing: false,
    opt370SpecialLenses: false,
  },
  'full-curated-public-beta': {
    assessmentPilot: false,
    hvpCuratedPractice: true,
    hvpDepthColourExpansion: false,
    tissueFoundationsCuratedPractice: true,
    ocularAdnexaCuratedPractice: true,
    aqueousVitreousCuratedPractice: true,
    bloodSupplyCuratedPractice: true,
    environmentalVisionCuratedPractice: true,
    autonomicPharmacologyCuratedPractice: true,
    systemicPathologyCuratedPractice: true,
    opt370SchematicEyeRefractiveStates: false,
    opt370MultifocalFoundations: false,
    opt370ProgressiveAdditionLenses: false,
    opt370PdAndDispensing: false,
    opt370SpecialLenses: false,
  },
  'all-course-content-public': {
    assessmentPilot: false,
    hvpCuratedPractice: true,
    hvpDepthColourExpansion: true,
    tissueFoundationsCuratedPractice: true,
    ocularAdnexaCuratedPractice: true,
    aqueousVitreousCuratedPractice: true,
    bloodSupplyCuratedPractice: true,
    environmentalVisionCuratedPractice: true,
    autonomicPharmacologyCuratedPractice: true,
    systemicPathologyCuratedPractice: true,
    opt370SchematicEyeRefractiveStates: true,
    opt370MultifocalFoundations: true,
    opt370ProgressiveAdditionLenses: true,
    opt370PdAndDispensing: true,
    opt370SpecialLenses: true,
  },
};

export const PUBLISHABLE_RELEASE_PROFILES: ReadonlySet<ReleaseProfileId> =
  new Set<ReleaseProfileId>([
    'hvp-public-beta',
    'full-curated-public-beta',
    'all-course-content-public',
  ]);

export function isPublishableReleaseProfile(
  profile: ReleaseProfileId,
): boolean {
  return PUBLISHABLE_RELEASE_PROFILES.has(profile);
}

export function assertPublishableReleaseProfile(
  profile: ReleaseProfileId,
): ReleaseProfileId {
  if (!isPublishableReleaseProfile(profile)) {
    throw new ReleaseProfileError(
      `Release profile ${profile} is preview-only and cannot produce a publishable manifest.`,
    );
  }
  return profile;
}

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
      `Unknown release profile ${JSON.stringify(value)}. Expected one of the registered release profiles.`,
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
    hvpDepthColourExpansion: parseReleaseFlag(
      RELEASE_FLAG_NAMES.hvpDepthColourExpansion,
      environment[RELEASE_FLAG_NAMES.hvpDepthColourExpansion],
    ),
    tissueFoundationsCuratedPractice: parseReleaseFlag(
      RELEASE_FLAG_NAMES.tissueFoundationsCuratedPractice,
      environment[RELEASE_FLAG_NAMES.tissueFoundationsCuratedPractice],
    ),
    ocularAdnexaCuratedPractice: parseReleaseFlag(
      RELEASE_FLAG_NAMES.ocularAdnexaCuratedPractice,
      environment[RELEASE_FLAG_NAMES.ocularAdnexaCuratedPractice],
    ),
    aqueousVitreousCuratedPractice: parseReleaseFlag(
      RELEASE_FLAG_NAMES.aqueousVitreousCuratedPractice,
      environment[RELEASE_FLAG_NAMES.aqueousVitreousCuratedPractice],
    ),
    bloodSupplyCuratedPractice: parseReleaseFlag(
      RELEASE_FLAG_NAMES.bloodSupplyCuratedPractice,
      environment[RELEASE_FLAG_NAMES.bloodSupplyCuratedPractice],
    ),
    environmentalVisionCuratedPractice: parseReleaseFlag(
      RELEASE_FLAG_NAMES.environmentalVisionCuratedPractice,
      environment[RELEASE_FLAG_NAMES.environmentalVisionCuratedPractice],
    ),
    autonomicPharmacologyCuratedPractice: parseReleaseFlag(
      RELEASE_FLAG_NAMES.autonomicPharmacologyCuratedPractice,
      environment[RELEASE_FLAG_NAMES.autonomicPharmacologyCuratedPractice],
    ),
    systemicPathologyCuratedPractice: parseReleaseFlag(
      RELEASE_FLAG_NAMES.systemicPathologyCuratedPractice,
      environment[RELEASE_FLAG_NAMES.systemicPathologyCuratedPractice],
    ),
    opt370SchematicEyeRefractiveStates: parseReleaseFlag(
      RELEASE_FLAG_NAMES.opt370SchematicEyeRefractiveStates,
      environment[RELEASE_FLAG_NAMES.opt370SchematicEyeRefractiveStates],
    ),
    opt370MultifocalFoundations: parseReleaseFlag(
      RELEASE_FLAG_NAMES.opt370MultifocalFoundations,
      environment[RELEASE_FLAG_NAMES.opt370MultifocalFoundations],
    ),
    opt370ProgressiveAdditionLenses: parseReleaseFlag(
      RELEASE_FLAG_NAMES.opt370ProgressiveAdditionLenses,
      environment[RELEASE_FLAG_NAMES.opt370ProgressiveAdditionLenses],
    ),
    opt370PdAndDispensing: parseReleaseFlag(
      RELEASE_FLAG_NAMES.opt370PdAndDispensing,
      environment[RELEASE_FLAG_NAMES.opt370PdAndDispensing],
    ),
    opt370SpecialLenses: parseReleaseFlag(
      RELEASE_FLAG_NAMES.opt370SpecialLenses,
      environment[RELEASE_FLAG_NAMES.opt370SpecialLenses],
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
  if (Object.entries(expected).some(([key, value]) => (
    flags[key as keyof ReleaseFlags] !== value
  ))) {
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
    [RELEASE_FLAG_NAMES.hvpDepthColourExpansion]: String(flags.hvpDepthColourExpansion),
    [RELEASE_FLAG_NAMES.tissueFoundationsCuratedPractice]:
      String(flags.tissueFoundationsCuratedPractice),
    [RELEASE_FLAG_NAMES.ocularAdnexaCuratedPractice]:
      String(flags.ocularAdnexaCuratedPractice),
    [RELEASE_FLAG_NAMES.aqueousVitreousCuratedPractice]:
      String(flags.aqueousVitreousCuratedPractice),
    [RELEASE_FLAG_NAMES.bloodSupplyCuratedPractice]:
      String(flags.bloodSupplyCuratedPractice),
    [RELEASE_FLAG_NAMES.environmentalVisionCuratedPractice]:
      String(flags.environmentalVisionCuratedPractice),
    [RELEASE_FLAG_NAMES.autonomicPharmacologyCuratedPractice]:
      String(flags.autonomicPharmacologyCuratedPractice),
    [RELEASE_FLAG_NAMES.systemicPathologyCuratedPractice]:
      String(flags.systemicPathologyCuratedPractice),
    [RELEASE_FLAG_NAMES.opt370SchematicEyeRefractiveStates]:
      String(flags.opt370SchematicEyeRefractiveStates),
    [RELEASE_FLAG_NAMES.opt370MultifocalFoundations]:
      String(flags.opt370MultifocalFoundations),
    [RELEASE_FLAG_NAMES.opt370ProgressiveAdditionLenses]:
      String(flags.opt370ProgressiveAdditionLenses),
    [RELEASE_FLAG_NAMES.opt370PdAndDispensing]:
      String(flags.opt370PdAndDispensing),
    [RELEASE_FLAG_NAMES.opt370SpecialLenses]:
      String(flags.opt370SpecialLenses),
    OPTOMETRY_RELEASE_PROFILE: profile,
  };
}
