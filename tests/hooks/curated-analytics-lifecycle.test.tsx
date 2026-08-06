// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCuratedPracticeController } from '@/hooks/useCuratedPracticeController';
import { ANALYTICS_CONSENT_KEY } from '@/lib/analytics/config';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { dummyCuratedDefinition } from '@/tests/fixtures/assessment/dummyCuratedExperience';

type DataLayer = Array<[string, unknown, Record<string, unknown>?]>;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(ANALYTICS_CONSENT_KEY, 'granted');
  delete (window as unknown as { dataLayer?: DataLayer }).dataLayer;
  delete (window as unknown as { gtag?: unknown }).gtag;
});

afterEach(cleanup);

describe('curated practice analytics lifecycle', () => {
  it('records one successful fresh start and one successful submission, but not a resume or failed retry', () => {
    const go = vi.fn();
    const { result } = renderHook(() => {
      const [store, setStore] = useState(createEmptyStoreV2());
      return {
        store,
        practice: useCuratedPracticeController({ definition: dummyCuratedDefinition, store, setStore, go }),
      };
    });

    act(() => {
      expect(result.current.practice.start({
        profileId: 'full', strategy: 'mixed', requestedCount: 1, seed: 'analytics-lifecycle',
      }).ok).toBe(true);
    });
    const attempt = Object.values(result.current.store.assessment.activeAttempts)[0];

    act(() => {
      expect(result.current.practice.start().ok).toBe(true);
    });

    const registry = result.current.practice.registry!;
    const question = registry.get(attempt.orderedQuestionIds[0]);
    if (!question || question.format !== 'single_best_answer') throw new Error('Fixture question missing');
    act(() => {
      expect(result.current.practice.updateDraft(attempt, question.id, {
        format: 'single_best_answer', optionId: question.options[0].id,
      }).ok).toBe(true);
    });
    act(() => {
      expect(result.current.practice.submit(attempt.id).ok).toBe(true);
    });
    act(() => {
      expect(result.current.practice.submit(attempt.id).ok).toBe(false);
    });

    const events = ((window as unknown as { dataLayer?: DataLayer }).dataLayer ?? [])
      .filter(([command]) => command === 'event');
    expect(events.map(([, name]) => name)).toEqual(['practice_start', 'practice_submit']);
    expect(events[0][2]).toEqual({
      module_id: 'dummy-module',
      practice_profile: 'full',
      practice_mode: 'mixed',
      question_count: 1,
    });
  });
});
