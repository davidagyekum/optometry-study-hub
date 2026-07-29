import { describe, expect, it } from 'vitest';
import { createCuratedExperienceRegistry } from '@/lib/assessment/curated/experienceRegistry';
import {
  resolveCuratedExperienceForControlledRoute,
} from '@/lib/assessment/curated/resolveExperience';
import { makeDummyCuratedExperience } from '@/tests/fixtures/assessment/dummyCuratedExperience';

describe('curated route resolution', () => {
  const registry = createCuratedExperienceRegistry([
    makeDummyCuratedExperience(),
  ]);

  it('uses the route identity only on curated landing routes', () => {
    expect(resolveCuratedExperienceForControlledRoute(
      'practice',
      'dummy-curated',
      undefined,
      registry,
    )?.summary.experienceId).toBe('dummy-curated');
    expect(resolveCuratedExperienceForControlledRoute(
      'practice',
      'dummy-module',
      undefined,
      registry,
    )).toBeUndefined();
  });

  it('uses persisted blueprint identity for attempts and results', () => {
    expect(resolveCuratedExperienceForControlledRoute(
      'assessment',
      'opaque-attempt-id',
      'dummy-automatic-v1',
      registry,
    )?.summary.experienceId).toBe('dummy-curated');
    expect(resolveCuratedExperienceForControlledRoute(
      'assessment-result',
      'opaque-result-id',
      'dummy-written-v1',
      registry,
    )?.summary.experienceId).toBe('dummy-curated');
  });
});
