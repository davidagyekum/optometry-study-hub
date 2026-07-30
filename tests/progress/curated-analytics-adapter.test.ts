import { describe, expect, it } from 'vitest';
import {
  calculateCuratedProgress,
  type CuratedProgressDataAdapter,
} from '@/lib/progress/curatedAnalytics';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

describe('curated progress data adapter', () => {
  it('composes an experience-specific calculator without HVP assumptions', () => {
    const adapter: CuratedProgressDataAdapter<
      { sectionLabels: string[]; savedResults: number },
      { code: string }
    > = {
      experienceId: 'dummy-curated',
      courseId: 'dummy-course',
      moduleId: 'dummy-module',
      calculate: (store) => ({
        ok: true,
        summary: {
          sectionLabels: ['Synthetic A', 'Synthetic B'],
          savedResults: Object.keys(store.assessment.results).length,
        },
      }),
    };
    expect(calculateCuratedProgress(adapter, createEmptyStoreV2())).toEqual({
      ok: true,
      summary: {
        sectionLabels: ['Synthetic A', 'Synthetic B'],
        savedResults: 0,
      },
    });
  });
});
