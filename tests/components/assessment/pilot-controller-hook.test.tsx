// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAssessmentPilot } from '@/hooks/useAssessmentPilot';
import {
  AQUEOUS_PILOT_POLICY,
  AQUEOUS_PILOT_QUESTION_IDS,
} from '@/lib/assessment/pilot/blueprint';
import { AQUEOUS_PILOT_BLUEPRINT_ID } from '@/lib/assessment/pilot/config';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type { StoreV2 } from '@/lib/storage/schemas';
import { makeAttempt, makeResult } from '@/tests/fixtures/session-engine';

describe('useAssessmentPilot atomic StoreV2 operations', () => {
  it('keeps consecutive draft, flag, and navigation changes plus unrelated records', () => {
    const attempt = makeAttempt([...AQUEOUS_PILOT_QUESTION_IDS], {
      blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
      gradingPolicy: AQUEOUS_PILOT_POLICY,
      idFactory: () => 'attempt-atomic',
      initializeDraftResponses: true,
    });
    const unrelated = makeAttempt(undefined, { idFactory: () => 'attempt-unrelated' });
    let latest: StoreV2 = createEmptyStoreV2();
    latest.read['ocular-adnexa'] = ['landmarks'];
    latest.results['ocular-adnexa'] = [];
    latest.assessment.activeAttempts[attempt.id] = attempt;
    latest.assessment.activeAttempts[unrelated.id] = unrelated;
    latest.assessment.results['result-unrelated'] = {
      ...makeResult(unrelated),
      id: 'result-unrelated',
    };
    latest.assessment.questionHistory['history-unrelated'] = {
      questionId: 'history-unrelated',
      version: 1,
      attemptCount: 3,
      correctCount: 2,
    };
    const setStore = vi.fn((next: StoreV2 | ((current: StoreV2) => StoreV2)) => {
      latest = typeof next === 'function' ? next(latest) : next;
    });
    const go = vi.fn();
    const { result } = renderHook(() => useAssessmentPilot({
      store: latest,
      setStore,
      go,
    }));
    const shortAnswerId = 'aqueous-iop-short-answer-001';

    act(() => {
      expect(result.current.updateDraft(attempt, shortAnswerId, {
        format: 'short_answer',
        text: '15 mmHg',
      }).ok).toBe(true);
      expect(result.current.toggleFlag(attempt, shortAnswerId).ok).toBe(true);
      expect(result.current.moveTo(attempt, 3).ok).toBe(true);
    });

    const stored = latest.assessment.activeAttempts[attempt.id];
    expect(stored.draftResponses?.[shortAnswerId]).toEqual({
      format: 'short_answer',
      text: '15 mmHg',
    });
    expect(stored.flags).toContain(shortAnswerId);
    expect(stored.currentIndex).toBe(3);
    expect(latest.assessment.activeAttempts[unrelated.id]).toEqual(unrelated);
    expect(latest.assessment.results['result-unrelated'].attemptId).toBe(unrelated.id);
    expect(latest.assessment.questionHistory['history-unrelated'].attemptCount).toBe(3);
    expect(latest.read['ocular-adnexa']).toEqual(['landmarks']);
  });
});