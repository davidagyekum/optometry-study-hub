import {
  HVP_CURATED_BLUEPRINT_ID,
  HVP_CURATED_PRACTICE_ID,
  HVP_CURATED_COURSE_ID,
  HVP_CURATED_MODULE_ID,
  HVP_WRITTEN_BLUEPRINT_ID,
  isHvpCuratedPracticeEnabled,
} from '@/lib/assessment/hvp/config';
import {
  TISSUE_CURATED_BLUEPRINT_ID,
  TISSUE_CURATED_COURSE_ID,
  TISSUE_CURATED_EXPERIENCE_ID,
  TISSUE_CURATED_MODULE_ID,
  TISSUE_CURATED_ROUTE_ID,
  TISSUE_WRITTEN_BLUEPRINT_ID,
  isTissueFoundationsCuratedPracticeEnabled,
} from '@/lib/assessment/tissue-foundations/config';
import {
  OCULAR_ADNEXA_BLUEPRINT_ID,
  OCULAR_ADNEXA_COURSE_ID,
  OCULAR_ADNEXA_EXPERIENCE_ID,
  OCULAR_ADNEXA_MODULE_ID,
  OCULAR_ADNEXA_ROUTE_ID,
  OCULAR_ADNEXA_WRITTEN_BLUEPRINT_ID,
  isOcularAdnexaCuratedPracticeEnabled,
} from '@/lib/assessment/ocular-adnexa/config';
import {
  AQUEOUS_VITREOUS_CURATED_BLUEPRINT_ID,
  AQUEOUS_VITREOUS_CURATED_COURSE_ID,
  AQUEOUS_VITREOUS_CURATED_EXPERIENCE_ID,
  AQUEOUS_VITREOUS_CURATED_MODULE_ID,
  AQUEOUS_VITREOUS_CURATED_ROUTE_ID,
  AQUEOUS_VITREOUS_WRITTEN_BLUEPRINT_ID,
  isAqueousVitreousCuratedPracticeEnabled,
} from '@/lib/assessment/aqueous-vitreous-curated/config';
import {
  BLOOD_SUPPLY_BLUEPRINT_ID,
  BLOOD_SUPPLY_COURSE_ID,
  BLOOD_SUPPLY_EXPERIENCE_ID,
  BLOOD_SUPPLY_MODULE_ID,
  BLOOD_SUPPLY_ROUTE_ID,
  BLOOD_SUPPLY_WRITTEN_BLUEPRINT_ID,
  isBloodSupplyCuratedPracticeEnabled,
} from '@/lib/assessment/blood-supply/config';
import {
  ENVIRONMENTAL_VISION_BLUEPRINT_ID,
  ENVIRONMENTAL_VISION_COURSE_ID,
  ENVIRONMENTAL_VISION_EXPERIENCE_ID,
  ENVIRONMENTAL_VISION_MODULE_ID,
  ENVIRONMENTAL_VISION_ROUTE_ID,
  ENVIRONMENTAL_VISION_WRITTEN_BLUEPRINT_ID,
  isEnvironmentalVisionCuratedPracticeEnabled,
} from '@/lib/assessment/environmental-vision/config';
import {
  AUTONOMIC_PHARMACOLOGY_BLUEPRINT_ID,
  AUTONOMIC_PHARMACOLOGY_COURSE_ID,
  AUTONOMIC_PHARMACOLOGY_EXPERIENCE_ID,
  AUTONOMIC_PHARMACOLOGY_MODULE_ID,
  AUTONOMIC_PHARMACOLOGY_ROUTE_ID,
  AUTONOMIC_PHARMACOLOGY_WRITTEN_BLUEPRINT_ID,
  isAutonomicPharmacologyCuratedPracticeEnabled,
} from '@/lib/assessment/autonomic-pharmacology/config';
import {
  SYSTEMIC_PATHOLOGY_BLUEPRINT_ID,
  SYSTEMIC_PATHOLOGY_COURSE_ID,
  SYSTEMIC_PATHOLOGY_EXPERIENCE_ID,
  SYSTEMIC_PATHOLOGY_MODULE_ID,
  SYSTEMIC_PATHOLOGY_ROUTE_ID,
  SYSTEMIC_PATHOLOGY_WRITTEN_BLUEPRINT_ID,
  isSystemicPathologyCuratedPracticeEnabled,
} from '@/lib/assessment/systemic-pathology/config';
import {
  isOpt370ExperienceEnabled,
  type Opt370ModuleId,
} from '@/lib/assessment/opt370/config';
import type { CoursePracticeExperience, Opt370PracticeExperience } from '@/lib/assessment/opt370/createPracticeExperience';
import {
  isHvpDepthColourExpansionEnabled,
  type HvpDepthColourModuleId,
} from '@/lib/assessment/hvp-depth-colour/config';
import { hvpDepthColourSummaries } from '@/lib/assessment/hvp-depth-colour/summaries';
import { opt370CuratedSummaries } from '@/lib/assessment/opt370/summaries';
import {
  curatedExperienceSummarySchema,
  type CuratedExperienceAdapter,
  type CuratedExperienceSummary,
} from '@/lib/assessment/curated/types';


function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  }
  return value;
}

function duplicateValue(
  entries: readonly CuratedExperienceAdapter[],
  value: (entry: CuratedExperienceAdapter) => string,
): string | undefined {
  const seen = new Set<string>();
  for (const entry of entries) {
    const candidate = value(entry);
    if (seen.has(candidate)) return candidate;
    seen.add(candidate);
  }
  return undefined;
}

export function createCuratedExperienceRegistry(
  input: readonly CuratedExperienceAdapter[],
): readonly CuratedExperienceAdapter[] {
  const entries = input.map((entry) => {
    const summary = deepFreeze(structuredClone(
      curatedExperienceSummarySchema.parse(entry.summary),
    ));
    return Object.freeze({
      summary,
      isEnabled: entry.isEnabled,
      loadPracticeModule: entry.loadPracticeModule,
      loadProgressModule: entry.loadProgressModule,
    });
  });
  const duplicateExperience = duplicateValue(
    entries,
    (entry) => entry.summary.experienceId,
  );
  if (duplicateExperience) {
    throw new Error(
      `CURATED_DUPLICATE_EXPERIENCE: "${duplicateExperience}" is registered more than once.`,
    );
  }
  const duplicateRoute = duplicateValue(
    entries,
    (entry) => entry.summary.routeSegment,
  );
  if (duplicateRoute) {
    throw new Error(
      `CURATED_DUPLICATE_ROUTE: "${duplicateRoute}" is registered more than once.`,
    );
  }
  const duplicateModule = duplicateValue(
    entries,
    (entry) => entry.summary.moduleId,
  );
  if (duplicateModule) {
    throw new Error(
      `CURATED_DUPLICATE_MODULE: "${duplicateModule}" is registered more than once.`,
    );
  }
  const duplicateBinding = duplicateValue(
    entries,
    (entry) => `${entry.summary.courseId}/${entry.summary.moduleId}`,
  );
  if (duplicateBinding) {
    throw new Error(
      `CURATED_DUPLICATE_MODULE_BINDING: "${duplicateBinding}" is registered more than once.`,
    );
  }
  const blueprintIds = new Set<string>();
  for (const entry of entries) {
    const local = new Set<string>();
    for (const blueprintId of entry.summary.blueprintIds) {
      if (local.has(blueprintId) || blueprintIds.has(blueprintId)) {
        throw new Error(
          `CURATED_DUPLICATE_BLUEPRINT: "${blueprintId}" is registered more than once.`,
        );
      }
      local.add(blueprintId);
      blueprintIds.add(blueprintId);
    }
  }
  return Object.freeze([...entries]);
}

export const hvpCuratedSummary: CuratedExperienceSummary = deepFreeze({
  experienceId: 'human-visual-perception',
  courseId: HVP_CURATED_COURSE_ID,
  moduleId: HVP_CURATED_MODULE_ID,
  title: 'Human Visual Perception curated practice',
  shortTitle: 'HVP curated practice',
  courseCode: 'OPT 374',
  routeSegment: HVP_CURATED_PRACTICE_ID,
  blueprintIds: [HVP_CURATED_BLUEPRINT_ID, HVP_WRITTEN_BLUEPRINT_ID],
  statusLabel: 'Course-aligned practice',
  enabled: false,
  supportsAutomaticPractice: true,
  supportsWrittenPractice: true,
  studyEntryTitle: 'Curated slide-aligned practice',
  studyEntryDescription:
    'Build a 50-question mixed-format practice set from 120 questions aligned with the supplied OPT 374 slides..',
  documentTitles: {
    landing: 'HVP Curated Practice',
    session: 'HVP Practice Session',
    result: 'HVP Practice Result',
    unavailable: 'Curated Practice Unavailable',
  },
  releaseStatus: {
    ariaLabel: 'Curated practice release status',
    title: 'Course-aligned practice',
    lines: [
      'Built from the supplied course materials.',
      'Progress is stored on this device.',
    ],
  },
});

export const tissueCuratedSummary: CuratedExperienceSummary = deepFreeze({
  experienceId: TISSUE_CURATED_EXPERIENCE_ID,
  courseId: TISSUE_CURATED_COURSE_ID,
  moduleId: TISSUE_CURATED_MODULE_ID,
  title: 'OPT 376 Tissue Foundations curated practice',
  shortTitle: 'Tissue curated practice',
  courseCode: 'OPT 376',
  routeSegment: TISSUE_CURATED_ROUTE_ID,
  blueprintIds: [
    TISSUE_CURATED_BLUEPRINT_ID,
    TISSUE_WRITTEN_BLUEPRINT_ID,
  ],
  statusLabel: 'Course-aligned practice',
  enabled: false,
  supportsAutomaticPractice: true,
  supportsWrittenPractice: true,
  studyEntryTitle: 'Curated slide-aligned practice',
  studyEntryDescription:
    'Build mixed-format practice from 80 Tissue Foundations questions.',
  documentTitles: {
    landing: 'Tissue Foundations Curated Practice',
    session: 'Tissue Foundations Practice Session',
    result: 'Tissue Foundations Practice Result',
    unavailable: 'Tissue Foundations Curated Practice Unavailable',
  },
  releaseStatus: {
    ariaLabel: 'Tissue Foundations curated practice release status',
    title: 'Course-aligned practice',
    lines: [
      'Built from the supplied course materials.',
      'Progress is stored on this device.',
    ],
  },
});

export const ocularAdnexaCuratedSummary: CuratedExperienceSummary = deepFreeze({
  experienceId: OCULAR_ADNEXA_EXPERIENCE_ID,
  courseId: OCULAR_ADNEXA_COURSE_ID,
  moduleId: OCULAR_ADNEXA_MODULE_ID,
  title: 'OPT 376 Ocular Adnexa curated practice',
  shortTitle: 'Ocular Adnexa curated practice',
  courseCode: 'OPT 376',
  routeSegment: OCULAR_ADNEXA_ROUTE_ID,
  blueprintIds: [
    OCULAR_ADNEXA_BLUEPRINT_ID,
    OCULAR_ADNEXA_WRITTEN_BLUEPRINT_ID,
  ],
  statusLabel: 'Course-aligned practice',
  enabled: false,
  supportsAutomaticPractice: true,
  supportsWrittenPractice: true,
  studyEntryTitle: 'Curated slide-aligned practice',
  studyEntryDescription:
    'Build mixed-format practice from 80 Ocular Adnexa and Lacrimal Apparatus questions.',
  documentTitles: {
    landing: 'Ocular Adnexa Curated Practice',
    session: 'Ocular Adnexa Practice Session',
    result: 'Ocular Adnexa Practice Result',
    unavailable: 'Ocular Adnexa Curated Practice Unavailable',
  },
  releaseStatus: {
    ariaLabel: 'Ocular Adnexa curated practice release status',
    title: 'Course-aligned practice',
    lines: [
      'Built from the supplied course materials.',
      'Progress is stored on this device.',
    ],
  },
});
export const aqueousVitreousCuratedSummary: CuratedExperienceSummary = deepFreeze({
  experienceId: AQUEOUS_VITREOUS_CURATED_EXPERIENCE_ID,
  courseId: AQUEOUS_VITREOUS_CURATED_COURSE_ID,
  moduleId: AQUEOUS_VITREOUS_CURATED_MODULE_ID,
  title: 'OPT 376 Aqueous and Vitreous curated practice',
  shortTitle: 'Aqueous and Vitreous curated practice',
  courseCode: 'OPT 376',
  routeSegment: AQUEOUS_VITREOUS_CURATED_ROUTE_ID,
  blueprintIds: [
    AQUEOUS_VITREOUS_CURATED_BLUEPRINT_ID,
    AQUEOUS_VITREOUS_WRITTEN_BLUEPRINT_ID,
  ],
  statusLabel: 'Course-aligned practice',
  enabled: false,
  supportsAutomaticPractice: true,
  supportsWrittenPractice: true,
  studyEntryTitle: 'Curated slide-aligned practice',
  studyEntryDescription:
    'Build mixed-format practice from 80 Aqueous Humour and Vitreous Body questions.',
  documentTitles: {
    landing: 'Aqueous and Vitreous Curated Practice',
    session: 'Aqueous and Vitreous Practice Session',
    result: 'Aqueous and Vitreous Practice Result',
    unavailable: 'Aqueous and Vitreous Curated Practice Unavailable',
  },
  releaseStatus: {
    ariaLabel: 'Aqueous and Vitreous curated practice release status',
    title: 'Course-aligned practice',
    lines: [
      'Built from the supplied course materials.',
      'Progress is stored on this device.',
    ],
  },
});
export const bloodSupplyCuratedSummary: CuratedExperienceSummary = deepFreeze({
  experienceId: BLOOD_SUPPLY_EXPERIENCE_ID,
  courseId: BLOOD_SUPPLY_COURSE_ID,
  moduleId: BLOOD_SUPPLY_MODULE_ID,
  title: 'OPT 376 Blood Supply curated practice',
  shortTitle: 'Blood Supply curated practice',
  courseCode: 'OPT 376',
  routeSegment: BLOOD_SUPPLY_ROUTE_ID,
  blueprintIds: [
    BLOOD_SUPPLY_BLUEPRINT_ID,
    BLOOD_SUPPLY_WRITTEN_BLUEPRINT_ID,
  ],
  statusLabel: 'Course-aligned practice',
  enabled: false,
  supportsAutomaticPractice: true,
  supportsWrittenPractice: true,
  studyEntryTitle: 'Curated slide-aligned practice',
  studyEntryDescription:
    'Build mixed-format practice from 80 Blood Supply to the Eye questions.',
  documentTitles: {
    landing: 'Blood Supply Curated Practice',
    session: 'Blood Supply Practice Session',
    result: 'Blood Supply Practice Result',
    unavailable: 'Blood Supply Curated Practice Unavailable',
  },
  releaseStatus: {
    ariaLabel: 'Blood Supply curated practice release status',
    title: 'Course-aligned practice',
    lines: [
      'Built from the supplied course materials.',
      'Progress is stored on this device.',
    ],
  },
});

export const environmentalVisionCuratedSummary: CuratedExperienceSummary =
  deepFreeze({
    experienceId: ENVIRONMENTAL_VISION_EXPERIENCE_ID,
    courseId: ENVIRONMENTAL_VISION_COURSE_ID,
    moduleId: ENVIRONMENTAL_VISION_MODULE_ID,
    title: 'Environmental Vision curated practice',
    shortTitle: 'Environmental Vision',
    courseCode: 'OPT 508',
    routeSegment: ENVIRONMENTAL_VISION_ROUTE_ID,
    blueprintIds: [
      ENVIRONMENTAL_VISION_BLUEPRINT_ID,
      ENVIRONMENTAL_VISION_WRITTEN_BLUEPRINT_ID,
    ],
    statusLabel: 'Course-aligned practice',
    enabled: false,
    supportsAutomaticPractice: true,
    supportsWrittenPractice: true,
    studyEntryTitle: 'Curated slide-aligned practice',
    studyEntryDescription:
      'Build mixed-format practice from 80 Environmental Vision questions.',
    documentTitles: {
      landing: 'Environmental Vision Curated Practice',
      session: 'Environmental Vision Practice Session',
      result: 'Environmental Vision Practice Result',
      unavailable: 'Environmental Vision Curated Practice Unavailable',
    },
    releaseStatus: {
      ariaLabel: 'Environmental Vision curated practice release status',
      title: 'Course-aligned practice',
      lines: [
        'Built from the supplied course materials.',
        'Progress is stored on this device.',
      ],
    },
  });

export const autonomicPharmacologyCuratedSummary: CuratedExperienceSummary =
  deepFreeze({
    experienceId: AUTONOMIC_PHARMACOLOGY_EXPERIENCE_ID,
    courseId: AUTONOMIC_PHARMACOLOGY_COURSE_ID,
    moduleId: AUTONOMIC_PHARMACOLOGY_MODULE_ID,
    title: 'Autonomic Pharmacology curated practice',
    shortTitle: 'Autonomic Pharmacology',
    courseCode: 'Pharmacology',
    routeSegment: AUTONOMIC_PHARMACOLOGY_ROUTE_ID,
    blueprintIds: [
      AUTONOMIC_PHARMACOLOGY_BLUEPRINT_ID,
      AUTONOMIC_PHARMACOLOGY_WRITTEN_BLUEPRINT_ID,
    ],
    statusLabel: 'Course-aligned practice',
    enabled: false,
    supportsAutomaticPractice: true,
    supportsWrittenPractice: true,
    studyEntryTitle: 'Curated slide-aligned practice',
    studyEntryDescription:
      'Build mixed-format practice from 80 Autonomic Pharmacology questions.',
    documentTitles: {
      landing: 'Autonomic Pharmacology Curated Practice',
      session: 'Autonomic Pharmacology Practice Session',
      result: 'Autonomic Pharmacology Practice Result',
      unavailable: 'Autonomic Pharmacology Curated Practice Unavailable',
    },
    releaseStatus: {
      ariaLabel: 'Autonomic Pharmacology curated practice release status',
      title: 'Course-aligned practice',
      lines: [
        'Built from the supplied course materials.',
        'Progress is stored on this device.',
      ],
    },
  });
export const systemicPathologyCuratedSummary: CuratedExperienceSummary =
  deepFreeze({
    experienceId: SYSTEMIC_PATHOLOGY_EXPERIENCE_ID,
    courseId: SYSTEMIC_PATHOLOGY_COURSE_ID,
    moduleId: SYSTEMIC_PATHOLOGY_MODULE_ID,
    title: 'Systemic Pathology curated practice',
    shortTitle: 'Systemic Pathology',
    courseCode: 'PATHOLOGY',
    routeSegment: SYSTEMIC_PATHOLOGY_ROUTE_ID,
    blueprintIds: [
      SYSTEMIC_PATHOLOGY_BLUEPRINT_ID,
      SYSTEMIC_PATHOLOGY_WRITTEN_BLUEPRINT_ID,
    ],
    statusLabel: 'Course-aligned practice',
    enabled: false,
    supportsAutomaticPractice: true,
    supportsWrittenPractice: true,
    studyEntryTitle: 'Curated slide-aligned practice',
    studyEntryDescription:
      'Build mixed-format practice from 80 questions aligned to the five current Systemic Pathology decks.',
    documentTitles: {
      landing: 'Systemic Pathology Curated Practice',
      session: 'Systemic Pathology Practice Session',
      result: 'Systemic Pathology Practice Result',
      unavailable: 'Systemic Pathology Curated Practice Unavailable',
    },
    releaseStatus: {
      ariaLabel: 'Systemic Pathology curated practice release status',
      title: 'Course-aligned practice',
      lines: [
        'Built from the supplied course materials.',
        'Progress is stored on this device.',
      ],
    },
  });
function createHvpDepthColourAdapter(
  moduleId: HvpDepthColourModuleId,
  loadExperience: () => Promise<CoursePracticeExperience>,
): CuratedExperienceAdapter {
  return {
    summary: hvpDepthColourSummaries[moduleId],
    isEnabled: isHvpDepthColourExpansionEnabled,
    loadPracticeModule: async () => {
      const [factory, experience] = await Promise.all([
        import('@/components/assessment/curated/createCuratedPracticeModule'),
        loadExperience(),
      ]);
      return factory.createCuratedPracticeModule(experience.definition);
    },
    loadProgressModule: async () => {
      const [factory, experience] = await Promise.all([
        import('@/lib/progress/createOpt370ProgressModule'),
        loadExperience(),
      ]);
      return factory.createCourseProgressModule(experience);
    },
  };
}
function createOpt370Adapter(
  moduleId: Opt370ModuleId,
  loadExperience: () => Promise<Opt370PracticeExperience>,
): CuratedExperienceAdapter {
  return {
    summary: opt370CuratedSummaries[moduleId],
    isEnabled: () => isOpt370ExperienceEnabled(moduleId),
    loadPracticeModule: async () => {
      const [factory, experience] = await Promise.all([
        import('@/components/assessment/curated/createCuratedPracticeModule'),
        loadExperience(),
      ]);
      return factory.createCuratedPracticeModule(experience.definition);
    },
    loadProgressModule: async () => {
      const [factory, experience] = await Promise.all([
        import('@/lib/progress/createOpt370ProgressModule'),
        loadExperience(),
      ]);
      return factory.createOpt370ProgressModule(experience);
    },
  };
}

export const curatedExperienceRegistry = createCuratedExperienceRegistry([
  {
    summary: hvpCuratedSummary,
    isEnabled: isHvpCuratedPracticeEnabled,
    loadPracticeModule: async () => {
      const loadedModule = await import(
        '@/components/assessment/hvp/HvpPracticeRouter'
      );
      return { PracticeRouter: loadedModule.HvpPracticeRouter };
    },
    loadProgressModule: async () => {
      const loadedModule = await import('@/components/progress/HvpProgressPanel');
      return {
        ProgressPanel: loadedModule.HvpProgressPanel,
        getContribution: loadedModule.getHvpProgressContribution,
      };
    },
  },
  {
    summary: tissueCuratedSummary,
    isEnabled: isTissueFoundationsCuratedPracticeEnabled,
    loadPracticeModule: async () => {
      const [factory, tissue] = await Promise.all([
        import('@/components/assessment/curated/createCuratedPracticeModule'),
        import('@/lib/assessment/tissue-foundations/definition'),
      ]);
      return factory.createCuratedPracticeModule(
        tissue.tissuePracticeDefinition,
      );
    },
    loadProgressModule: async () => {
      const loadedModule = await import(
        '@/lib/progress/tissueFoundationsProgressModule'
      );
      return loadedModule.tissueFoundationsProgressModule;
    },
  },
  {
    summary: ocularAdnexaCuratedSummary,
    isEnabled: isOcularAdnexaCuratedPracticeEnabled,
    loadPracticeModule: async () => {
      const [factory, ocular] = await Promise.all([
        import('@/components/assessment/curated/createCuratedPracticeModule'),
        import('@/lib/assessment/ocular-adnexa/definition'),
      ]);
      return factory.createCuratedPracticeModule(
        ocular.ocularAdnexaPracticeDefinition,
      );
    },
    loadProgressModule: async () => {
      const loadedModule = await import(
        '@/lib/progress/ocularAdnexaProgressModule'
      );
      return loadedModule.ocularAdnexaProgressModule;
    },
  },
  {
    summary: aqueousVitreousCuratedSummary,
    isEnabled: isAqueousVitreousCuratedPracticeEnabled,
    loadPracticeModule: async () => {
      const [factory, aqueousVitreous] = await Promise.all([
        import('@/components/assessment/curated/createCuratedPracticeModule'),
        import('@/lib/assessment/aqueous-vitreous-curated/definition'),
      ]);
      return factory.createCuratedPracticeModule(
        aqueousVitreous.aqueousVitreousCuratedPracticeDefinition,
      );
    },
    loadProgressModule: async () => {
      const loadedModule = await import(
        '@/lib/progress/aqueousVitreousCuratedProgressModule'
      );
      return loadedModule.aqueousVitreousCuratedProgressModule;
    },
  },
  {
    summary: bloodSupplyCuratedSummary,
    isEnabled: isBloodSupplyCuratedPracticeEnabled,
    loadPracticeModule: async () => {
      const [factory, bloodSupply] = await Promise.all([
        import('@/components/assessment/curated/createCuratedPracticeModule'),
        import('@/lib/assessment/blood-supply/definition'),
      ]);
      return factory.createCuratedPracticeModule(
        bloodSupply.bloodSupplyPracticeDefinition,
      );
    },
    loadProgressModule: async () => {
      const loadedModule = await import(
        '@/lib/progress/bloodSupplyProgressModule'
      );
      return loadedModule.bloodSupplyProgressModule;
    },
  },
  {
    summary: environmentalVisionCuratedSummary,
    isEnabled: isEnvironmentalVisionCuratedPracticeEnabled,
    loadPracticeModule: async () => {
      const [factory, environmentalVision] = await Promise.all([
        import('@/components/assessment/curated/createCuratedPracticeModule'),
        import('@/lib/assessment/environmental-vision/definition'),
      ]);
      return factory.createCuratedPracticeModule(
        environmentalVision.environmentalVisionPracticeDefinition,
      );
    },
    loadProgressModule: async () => {
      const loadedModule = await import(
        '@/lib/progress/environmentalVisionProgressModule'
      );
      return loadedModule.environmentalVisionProgressModule;
    },
  },
  {
    summary: autonomicPharmacologyCuratedSummary,
    isEnabled: isAutonomicPharmacologyCuratedPracticeEnabled,
    loadPracticeModule: async () => {
      const [factory, pharmacology] = await Promise.all([
        import('@/components/assessment/curated/createCuratedPracticeModule'),
        import('@/lib/assessment/autonomic-pharmacology/definition'),
      ]);
      return factory.createCuratedPracticeModule(
        pharmacology.autonomicPharmacologyPracticeDefinition,
      );
    },
    loadProgressModule: async () => {
      const loadedModule = await import(
        '@/lib/progress/autonomicPharmacologyProgressModule'
      );
      return loadedModule.autonomicPharmacologyProgressModule;
    },
  },
  {
    summary: systemicPathologyCuratedSummary,
    isEnabled: isSystemicPathologyCuratedPracticeEnabled,
    loadPracticeModule: async () => {
      const [factory, pathology] = await Promise.all([
        import('@/components/assessment/curated/createCuratedPracticeModule'),
        import('@/lib/assessment/systemic-pathology/definition'),
      ]);
      return factory.createCuratedPracticeModule(
        pathology.systemicPathologyPracticeDefinition,
      );
    },
    loadProgressModule: async () => {
      const loadedModule = await import(
        '@/lib/progress/systemicPathologyProgressModule'
      );
      return loadedModule.systemicPathologyProgressModule;
    },
  },
  createHvpDepthColourAdapter('hvp-depth-perception', async () =>
    (await import('@/lib/assessment/hvp-depth-colour/definitions')).hvpDepthPerceptionExperience,
  ),
  createHvpDepthColourAdapter('hvp-colour-perception', async () =>
    (await import('@/lib/assessment/hvp-depth-colour/definitions')).hvpColourPerceptionExperience,
  ),
  createOpt370Adapter('schematic-eye-refractive-states', async () =>
    (await import('@/lib/assessment/opt370/schematic-eye-refractive-states/definition')).schematicEyeRefractiveStatesExperience,
  ),
  createOpt370Adapter('multifocal-foundations', async () =>
    (await import('@/lib/assessment/opt370/multifocal-foundations/definition')).multifocalFoundationsExperience,
  ),
  createOpt370Adapter('progressive-addition-lenses', async () =>
    (await import('@/lib/assessment/opt370/progressive-addition-lenses/definition')).progressiveAdditionLensesExperience,
  ),
  createOpt370Adapter('pd-and-dispensing', async () =>
    (await import('@/lib/assessment/opt370/pd-and-dispensing/definition')).pdAndDispensingExperience,
  ),
  createOpt370Adapter('special-lenses', async () =>
    (await import('@/lib/assessment/opt370/special-lenses/definition')).specialLensesExperience,
  ),
]);

export function isCuratedExperienceEnabled(
  adapter: CuratedExperienceAdapter,
): boolean {
  return adapter.isEnabled?.() ?? adapter.summary.enabled;
}

export function curatedExperienceSummaries(): CuratedExperienceSummary[] {
  return curatedExperienceRegistry.map((entry) => ({
    ...structuredClone(entry.summary),
    enabled: isCuratedExperienceEnabled(entry),
  }));
}

export function enabledCuratedExperienceSummaries(): CuratedExperienceSummary[] {
  return curatedExperienceSummaries().filter((summary) => summary.enabled);
}
