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
