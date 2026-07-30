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
  statusLabel: 'Curated study practice',
  enabled: false,
  supportsAutomaticPractice: true,
  supportsWrittenPractice: true,
  studyEntryTitle: 'Curated slide-aligned practice',
  studyEntryDescription:
    'Build a 50-question mixed-format practice set from 120 questions aligned with the supplied OPT 374 slides. This does not affect your legacy quiz score.',
  documentTitles: {
    landing: 'HVP Curated Practice',
    session: 'HVP Practice Session',
    result: 'HVP Practice Result',
    unavailable: 'Curated Practice Unavailable',
  },
  releaseStatus: {
    ariaLabel: 'Curated practice release status',
    title: 'Curated study practice',
    lines: [
      'Internally verified and slide-aligned.',
      'Not lecturer-approved examination items.',
      'Stored only on this device.',
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
  statusLabel: 'Curated study practice',
  enabled: false,
  supportsAutomaticPractice: true,
  supportsWrittenPractice: true,
  studyEntryTitle: 'Curated slide-aligned practice',
  studyEntryDescription:
    'Build mixed-format practice from 80 Tissue Foundations questions while preserving the separate legacy quiz.',
  documentTitles: {
    landing: 'Tissue Foundations Curated Practice',
    session: 'Tissue Foundations Practice Session',
    result: 'Tissue Foundations Practice Result',
    unavailable: 'Tissue Foundations Curated Practice Unavailable',
  },
  releaseStatus: {
    ariaLabel: 'Tissue Foundations curated practice release status',
    title: 'Curated study practice',
    lines: [
      'Internally checked and slide-aligned.',
      'Not lecturer-approved examination items.',
      'Progress is stored only on this device.',
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
  statusLabel: 'Curated study practice',
  enabled: false,
  supportsAutomaticPractice: true,
  supportsWrittenPractice: true,
  studyEntryTitle: 'Curated slide-aligned practice',
  studyEntryDescription:
    'Build mixed-format practice from 80 Ocular Adnexa and Lacrimal Apparatus questions while preserving the separate legacy quiz.',
  documentTitles: {
    landing: 'Ocular Adnexa Curated Practice',
    session: 'Ocular Adnexa Practice Session',
    result: 'Ocular Adnexa Practice Result',
    unavailable: 'Ocular Adnexa Curated Practice Unavailable',
  },
  releaseStatus: {
    ariaLabel: 'Ocular Adnexa curated practice release status',
    title: 'Curated study practice',
    lines: [
      'Internally checked and slide-aligned.',
      'Not lecturer-approved examination items.',
      'Progress is stored only on this device.',
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
  statusLabel: 'Curated study practice',
  enabled: false,
  supportsAutomaticPractice: true,
  supportsWrittenPractice: true,
  studyEntryTitle: 'Curated slide-aligned practice',
  studyEntryDescription:
    'Build mixed-format practice from 80 Aqueous Humour and Vitreous Body questions while preserving the separate pilot and legacy quiz.',
  documentTitles: {
    landing: 'Aqueous and Vitreous Curated Practice',
    session: 'Aqueous and Vitreous Practice Session',
    result: 'Aqueous and Vitreous Practice Result',
    unavailable: 'Aqueous and Vitreous Curated Practice Unavailable',
  },
  releaseStatus: {
    ariaLabel: 'Aqueous and Vitreous curated practice release status',
    title: 'Curated study practice',
    lines: [
      'Internally checked and slide-aligned.',
      'Not lecturer-approved examination items.',
      'Progress is stored only on this device.',
    ],
  },
});
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
