// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCuratedPracticeController } from '@/hooks/useCuratedPracticeController';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import {
  dummyCuratedDefinition,
  getDummyProgressContribution,
} from '@/tests/fixtures/assessment/dummyCuratedExperience';

afterEach(cleanup);

describe('configuration-driven curated lifecycle', () => {
  it('launches, persists a draft, dispatches an exact result, and contributes progress', () => {
    const go = vi.fn();
    const { result } = renderHook(() => {
      const [store, setStore] = useState(createEmptyStoreV2());
      const practice = useCuratedPracticeController({
        definition: dummyCuratedDefinition,
        store,
        setStore,
        go,
      });
      return { store, practice };
    });

    act(() => {
      const started = result.current.practice.start({
        profileId: 'full',
        strategy: 'mixed',
        requestedCount: 1,
        seed: 'generic-lifecycle',
      });
      expect(started.ok).toBe(true);
    });
    const attempt = Object.values(result.current.store.assessment.activeAttempts)[0];
    expect(attempt).toMatchObject({
      id: 'dummy-attempt',
      blueprintId: 'dummy-automatic-v1',
      courseId: 'dummy-course',
      moduleId: 'dummy-module',
    });
    const registry = result.current.practice.registry!;
    const question = registry.get(attempt.orderedQuestionIds[0]);
    if (!question || question.format !== 'single_best_answer') {
      throw new Error('Synthetic single-best-answer question missing');
    }
    const optionId = question.options[0].id;
    act(() => {
      const updated = result.current.practice.updateDraft(
        attempt,
        question.id,
        { format: 'single_best_answer', optionId },
      );
      expect(updated.ok).toBe(true);
    });
    expect(
      result.current.store.assessment.activeAttempts[attempt.id]
        .draftResponses?.[question.id],
    ).toEqual({ format: 'single_best_answer', optionId });

    act(() => {
      const submitted = result.current.practice.submit(attempt.id);
      expect(submitted.ok).toBe(true);
    });
    const savedResult = Object.values(result.current.store.assessment.results)[0];
    expect(savedResult).toMatchObject({
      blueprintId: 'dummy-automatic-v1',
      courseId: 'dummy-course',
      moduleId: 'dummy-module',
    });
    expect(result.current.store.assessment.activeAttempts).toEqual({});
    expect(result.current.store.assessment.questionHistory[question.id]?.version)
      .toBe(question.version);
    expect(getDummyProgressContribution(result.current.store)).toMatchObject({
      experienceId: 'dummy-curated',
      moduleId: 'dummy-module',
      hasStoredData: true,
    });
    expect(go).toHaveBeenLastCalledWith('assessment-result', savedResult.id);
  });
});
