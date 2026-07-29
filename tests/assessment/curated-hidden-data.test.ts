import { describe, expect, it } from 'vitest';
import { hiddenCuratedData } from '@/lib/assessment/curated/storedData';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import {
  dummyCuratedDefinition,
  dummyCuratedSummary,
} from '@/tests/fixtures/assessment/dummyCuratedExperience';

const hvp = {
  ...dummyCuratedSummary,
  experienceId: 'human-visual-perception',
  courseId: 'human-visual-perception',
  moduleId: 'human-visual-perception',
  routeSegment: 'human-visual-perception-curated',
  blueprintIds: ['opt374-hvp-curated-v1'],
};

function dummyAttempt() {
  if (!dummyCuratedDefinition.registryResult.ok) throw new Error('fixture registry');
  const store = createEmptyStoreV2();
  const created = dummyCuratedDefinition.createAttempt(
    dummyCuratedDefinition.defaultRequest(),
    store,
    dummyCuratedDefinition.registryResult.value,
  );
  if (!created.ok) throw new Error('fixture attempt');
  return created.value;
}

describe('disabled curated-data disclosure', () => {
  it('finds dummy attempts while HVP remains enabled', () => {
    const store = createEmptyStoreV2();
    store.assessment.activeAttempts['dummy-attempt'] = dummyAttempt();
    expect(hiddenCuratedData(store, [
      { ...hvp, enabled: true },
      { ...dummyCuratedSummary, enabled: false },
    ])).toMatchObject({
      activeAttemptCount: 1,
      resultCount: 0,
      experienceIds: ['dummy-curated'],
    });
  });

  it('finds disabled HVP results while dummy remains enabled', () => {
    const store = createEmptyStoreV2();
    store.assessment.results.hvp = {
      id: 'hvp',
      blueprintId: 'opt374-hvp-curated-v1',
    } as never;
    expect(hiddenCuratedData(store, [
      { ...hvp, enabled: false },
      { ...dummyCuratedSummary, enabled: true },
    ])).toMatchObject({ resultCount: 1, experienceIds: ['human-visual-perception'] });
  });

  it('reports both disabled owners and none when both are enabled', () => {
    const store = createEmptyStoreV2();
    store.assessment.activeAttempts.dummy = dummyAttempt();
    store.assessment.results.hvp = {
      id: 'hvp',
      blueprintId: 'opt374-hvp-curated-v1',
    } as never;
    expect(hiddenCuratedData(store, [
      { ...hvp, enabled: false },
      { ...dummyCuratedSummary, enabled: false },
    ]).experienceIds).toEqual(['dummy-curated', 'human-visual-perception']);
    expect(hiddenCuratedData(store, [
      { ...hvp, enabled: true },
      { ...dummyCuratedSummary, enabled: true },
    ])).toMatchObject({ activeAttemptCount: 0, resultCount: 0 });
  });
});
