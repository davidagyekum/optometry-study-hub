import type {
  CuratedExperienceAdapter,
  CuratedExperienceSummary,
} from '@/lib/assessment/curated/types';

export const dummyCuratedSummary: CuratedExperienceSummary = {
  experienceId: 'dummy-curated',
  courseId: 'dummy-course',
  moduleId: 'dummy-module',
  title: 'Dummy curated practice',
  shortTitle: 'Dummy practice',
  courseCode: 'TEST 000',
  routeSegment: 'dummy-curated',
  blueprintIds: ['dummy-automatic-v1', 'dummy-written-v1'],
  statusLabel: 'Test-only curated practice',
  enabled: true,
  supportsAutomaticPractice: true,
  supportsWrittenPractice: true,
  studyEntryTitle: 'Dummy practice entry',
  studyEntryDescription: 'Test-only copy with no educational content.',
  releaseStatus: {
    ariaLabel: 'Dummy release status',
    title: 'Test-only status',
    lines: ['Synthetic fixture.', 'Not part of the production registry.'],
  },
};

export function makeDummyCuratedExperience({
  enabled = true,
  onPracticeLoad,
  onProgressLoad,
}: {
  enabled?: boolean;
  onPracticeLoad?: () => void;
  onProgressLoad?: () => void;
} = {}): CuratedExperienceAdapter {
  return {
    summary: { ...dummyCuratedSummary, enabled },
    loadPracticeModule: async () => {
      onPracticeLoad?.();
      return { PracticeRouter: () => <div>Dummy practice adapter</div> };
    },
    loadProgressModule: async () => {
      onProgressLoad?.();
      return { ProgressPanel: () => <div>Dummy progress adapter</div> };
    },
  };
}
