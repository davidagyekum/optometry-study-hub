// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useHvpCuratedPractice } from '@/hooks/useHvpCuratedPractice';
import { HVP_CURATED_BLUEPRINT_ID } from '@/lib/assessment/hvp/config';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { StoreV2 } from '@/lib/storage/schemas';

describe('useHvpCuratedPractice StoreV2 boundary', () => {
  it('starts, resumes, restarts and submits without mutating legacy metrics or history', () => {
    let latest = createEmptyStoreV2();
    latest.read['human-visual-perception'] = ['hvp-foundations'];
    latest.results['human-visual-perception'] = [{
      id: 'legacy-result',
      moduleId: 'human-visual-perception',
      startedAt: '2026-07-27T00:00:00.000Z',
      submittedAt: '2026-07-27T00:30:00.000Z',
      order: [],
      optionOrder: {},
      answers: {},
      flags: [],
      current: 0,
      score: 44,
      total: 50,
    }];
    latest.assessment.questionHistory['history-sentinel'] = {
      questionId: 'history-sentinel',
      version: 1,
      attemptCount: 2,
      correctCount: 1,
    };
    const setStore = vi.fn((next: StoreV2 | ((current: StoreV2) => StoreV2)) => {
      latest = typeof next === 'function' ? next(latest) : next;
    });
    const go = vi.fn();
    const { result } = renderHook(() => useHvpCuratedPractice({
      store: latest,
      setStore,
      go,
    }));

    let started: ReturnType<typeof result.current.start> | undefined;
    act(() => {
      started = result.current.start();
    });
    expect(started?.ok).toBe(true);
    if (!started?.ok) return;
    expect(started.value.blueprintId).toBe(HVP_CURATED_BLUEPRINT_ID);
    expect(started.value.orderedQuestionIds).toHaveLength(50);
    expect(latest.assessment.activeAttempts[started.value.id]).toEqual(started.value);

    act(() => {
      const resumed = result.current.start();
      expect(resumed.ok && resumed.value.id).toBe(started?.ok && started.value.id);
    });

    let restarted: ReturnType<typeof result.current.start> | undefined;
    act(() => {
      restarted = result.current.start(true);
    });
    expect(restarted?.ok).toBe(true);
    if (!restarted?.ok) return;
    expect(restarted.value.id).not.toBe(started.value.id);
    expect(latest.assessment.activeAttempts[started.value.id]).toBeUndefined();
    expect(latest.assessment.activeAttempts[restarted.value.id]).toBeDefined();

    act(() => {
      const submitted = result.current.submit(restarted?.ok ? restarted.value.id : '');
      expect(submitted.ok).toBe(true);
      if (submitted.ok) {
        expect(submitted.value.blueprintId).toBe(HVP_CURATED_BLUEPRINT_ID);
      }
    });
    expect(latest.assessment.activeAttempts[restarted.value.id]).toBeUndefined();
    expect(Object.values(latest.assessment.results)).toHaveLength(1);
    expect(latest.results['human-visual-perception'][0].score).toBe(44);
    expect(latest.read['human-visual-perception']).toEqual(['hvp-foundations']);
    expect(latest.assessment.questionHistory['history-sentinel']).toEqual({
      questionId: 'history-sentinel',
      version: 1,
      attemptCount: 2,
      correctCount: 1,
    });
  });

  it('never discards unrelated assessment IDs', () => {
    let latest = createEmptyStoreV2();
    latest.assessment.activeAttempts.unrelated = {
      id: 'unrelated',
      mode: 'study',
      courseId: 'neuro-anatomy',
      moduleId: 'aqueous-vitreous',
      blueprintId: 'aqueous-vitreous-pilot-v1',
      gradingPolicy: { id: 'diagnostic', version: 1 },
      startedAt: '2026-07-27T00:00:00.000Z',
      orderedQuestionIds: ['unrelated-question'],
      questionVersions: { 'unrelated-question': 1 },
      optionOrder: {},
      responses: {},
      flags: [],
      currentIndex: 0,
    };
    const setStore = vi.fn((next: StoreV2 | ((current: StoreV2) => StoreV2)) => {
      latest = typeof next === 'function' ? next(latest) : next;
    });
    const { result } = renderHook(() => useHvpCuratedPractice({
      store: latest,
      setStore,
      go: vi.fn(),
    }));
    const discarded = result.current.discard('unrelated');
    expect(discarded.ok).toBe(false);
    expect(latest.assessment.activeAttempts.unrelated).toBeDefined();
  });
});
