import { describe, expect, it } from 'vitest';
import {
  finalizeAssessmentStore,
  putActiveAssessmentAttempt,
  putAssessmentResult,
  removeActiveAssessmentAttempt,
} from '@/lib/storage/assessmentStore';
import { STORAGE_KEY } from '@/lib/storage/keys';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import {
  storeV2Schema,
  type StoreV2,
} from '@/lib/storage/schemas';
import {
  loadStore,
  type StorageLike,
} from '@/lib/storage/store';
import {
  makeAttempt,
  makeResult,
} from '@/tests/fixtures/session-engine';

function codes(result: { ok: true } | { ok: false; issues: { code: string }[] }): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

function paths(result: { ok: true } | { ok: false; issues: { path?: string }[] }): string[] {
  return result.ok ? [] : result.issues.flatMap((issue) => issue.path ?? []);
}

function withActiveAttempt(): { store: StoreV2; attempt: ReturnType<typeof makeAttempt> } {
  const attempt = makeAttempt();
  const store = createEmptyStoreV2();
  store.assessment.activeAttempts[attempt.id] = attempt;
  return { store, attempt };
}

describe('StoreV2 keyed identity invariants', () => {
  it.each([
    ['activeAttempts', (store: StoreV2) => {
      store.assessment.activeAttempts['wrong-key'] = makeAttempt();
    }],
    ['results', (store: StoreV2) => {
      store.assessment.results['wrong-key'] = makeResult();
    }],
    ['questionHistory', (store: StoreV2) => {
      store.assessment.questionHistory['wrong-key'] = {
        questionId: 'different-question',
        version: 1,
        attemptCount: 0,
        correctCount: 0,
      };
    }],
  ])('rejects a mismatched %s record key', (_name, mutate) => {
    const store = createEmptyStoreV2();
    mutate(store);
    expect(storeV2Schema.safeParse(store).success).toBe(false);
  });

  it('treats keyed identity mismatches as malformed V2 and preserves raw bytes', () => {
    const mutations = [
      (store: StoreV2) => {
        store.assessment.activeAttempts['wrong-key'] = makeAttempt();
      },
      (store: StoreV2) => {
        store.assessment.results['wrong-key'] = makeResult();
      },
      (store: StoreV2) => {
        store.assessment.questionHistory['wrong-key'] = {
          questionId: 'different-question',
          version: 1,
          attemptCount: 0,
          correctCount: 0,
        };
      },
    ];

    mutations.forEach((mutate) => {
      const malformed = createEmptyStoreV2();
      mutate(malformed);
      const raw = JSON.stringify(malformed);
      const values = new Map([[STORAGE_KEY, raw]]);
      const storage: StorageLike = {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
      };
      expect(loadStore(storage)).toEqual(createEmptyStoreV2());
      expect(values.get(STORAGE_KEY)).toBe(raw);
    });
  });

  it('makes every assessment-store write reject an unrelated keyed mismatch', () => {
    const malformed = createEmptyStoreV2();
    malformed.assessment.questionHistory['wrong-key'] = {
      questionId: 'different-question',
      version: 1,
      attemptCount: 0,
      correctCount: 0,
    };
    const active = makeAttempt(undefined, { idFactory: () => 'attempt-active' });
    malformed.assessment.activeAttempts[active.id] = active;
    const candidate = makeAttempt(undefined, { idFactory: () => 'attempt-candidate' });
    const result = { ...makeResult(candidate), id: 'result-candidate' };

    expect(codes(putActiveAssessmentAttempt(malformed, candidate.id, candidate)))
      .toContain('INVALID_STORE');
    expect(codes(removeActiveAssessmentAttempt(malformed, active.id)))
      .toContain('INVALID_STORE');
    expect(codes(putAssessmentResult(malformed, result.id, result)))
      .toContain('INVALID_STORE');
    expect(codes(finalizeAssessmentStore(
      malformed,
      active.id,
      makeResult(active).id,
      makeResult(active),
    ))).toContain('INVALID_STORE');
  });
});

describe('atomic assessment-result finalization', () => {
  it.each([
    ['attemptId', (result: ReturnType<typeof makeResult>) => {
      result.attemptId = 'different-attempt';
    }],
    ['courseId', (result: ReturnType<typeof makeResult>) => {
      result.courseId = 'different-course';
    }],
    ['moduleId', (result: ReturnType<typeof makeResult>) => {
      result.moduleId = 'different-module';
    }],
    ['orderedQuestionIds', (result: ReturnType<typeof makeResult>) => {
      result.orderedQuestionIds.reverse();
    }],
    ['questionVersions', (result: ReturnType<typeof makeResult>) => {
      result.questionVersions[result.orderedQuestionIds[0]] += 1;
    }],
    ['responses keys', (result: ReturnType<typeof makeResult>) => {
      delete result.responses['aqueous-flow-sba-001'];
    }],
    ['responses values', (result: ReturnType<typeof makeResult>) => {
      result.responses['aqueous-flow-sba-001'] = {
        format: 'single_best_answer',
        optionId: 'posterior-chamber',
      };
    }],
  ])('rejects a %s snapshot mismatch without changing source state', (field, mutate) => {
    const { store, attempt } = withActiveAttempt();
    attempt.responses['aqueous-flow-sba-001'] = {
      format: 'single_best_answer',
      optionId: 'trabecular-meshwork',
    };
    store.assessment.activeAttempts[attempt.id] = attempt;
    const result = makeResult(attempt);
    mutate(result);
    const before = structuredClone(store);

    const finalized = finalizeAssessmentStore(store, attempt.id, result.id, result);
    expect(codes(finalized)).toContain('RESULT_ATTEMPT_SNAPSHOT_MISMATCH');
    expect(paths(finalized)).toContain(field.split(' ')[0]);
    expect(store).toEqual(before);
  });

  it('rejects result ID collisions atomically while ordinary put still replaces', () => {
    const { store, attempt } = withActiveAttempt();
    const result = makeResult(attempt);
    store.assessment.results[result.id] = result;
    const before = structuredClone(store);

    expect(codes(finalizeAssessmentStore(store, attempt.id, result.id, result)))
      .toContain('RESULT_STORE_COLLISION');
    expect(store).toEqual(before);

    const replacement = { ...result, submittedAt: '2026-07-26T11:00:00.000Z' };
    const replaced = putAssessmentResult(store, result.id, replacement);
    expect(replaced.ok).toBe(true);
    if (replaced.ok) {
      expect(replaced.value.assessment.results[result.id]).toEqual(replacement);
    }
  });
});
