import { describe, expect, it } from 'vitest';
import { bestScore } from '@/lib/legacy/progress';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { makeAttempt, makeResult } from '@/tests/fixtures/session-engine';

describe('pilot results stay outside legacy metrics', () => {
  it('does not include assessment results in legacy latest or best scores', () => {
    const store = createEmptyStoreV2();
    const attempt = makeAttempt();
    store.assessment.results['result-pilot'] = {
      ...makeResult(attempt),
      id: 'result-pilot',
      score: 9,
      maxScore: 9,
    };
    expect(store.results['aqueous-vitreous']).toBeUndefined();
    expect(bestScore(store.results['aqueous-vitreous'] ?? [])).toBeUndefined();
  });
});
