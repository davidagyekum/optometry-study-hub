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
  it('guards unrelated IDs and reports failed pilot discard without data loss', () => {
    const pilot = makeAttempt([...AQUEOUS_PILOT_QUESTION_IDS], {
      blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
      gradingPolicy: AQUEOUS_PILOT_POLICY,
      idFactory: () => 'pilot-discard',
    });
    const unrelated = makeAttempt(undefined, { idFactory: () => 'unrelated-discard' });
    let latest = createEmptyStoreV2();
    latest.assessment.activeAttempts[pilot.id] = { ...pilot, mode: 'exam' };
    latest.assessment.activeAttempts[unrelated.id] = unrelated;
    const setStore = vi.fn((next: StoreV2 | ((current: StoreV2) => StoreV2)) => {
      latest = typeof next === 'function' ? next(latest) : next;
    });
    const { result } = renderHook(() => useAssessmentPilot({
      store: latest,
      setStore,
      go: vi.fn(),
    }));

    const protectedResult = result.current.discard(unrelated.id);
    expect(protectedResult.ok).toBe(false);
    if (!protectedResult.ok) {
      expect(protectedResult.issues.map((issue) => issue.code))
        .toContain('PILOT_BLUEPRINT_MISMATCH');
    }
    expect(latest.assessment.activeAttempts[unrelated.id]).toEqual(unrelated);

    const missingResult = result.current.discard('missing-pilot');
    expect(missingResult.ok).toBe(false);
    expect(latest.assessment.activeAttempts[pilot.id]).toBeDefined();

    expect(result.current.discard(pilot.id).ok).toBe(true);
    expect(latest.assessment.activeAttempts[pilot.id]).toBeUndefined();
    expect(latest.assessment.activeAttempts[unrelated.id]).toEqual(unrelated);
  });

  it('atomically replaces incompatible pilot candidates and preserves unrelated state', () => {
    const pilot = makeAttempt([...AQUEOUS_PILOT_QUESTION_IDS], {
      blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
      gradingPolicy: AQUEOUS_PILOT_POLICY,
      idFactory: () => 'pilot-incompatible',
    });
    const unrelated = makeAttempt(undefined, { idFactory: () => 'unrelated-preserved' });
    const unrelatedResult = { ...makeResult(unrelated), id: 'unrelated-result' };
    let latest = createEmptyStoreV2();
    latest.assessment.activeAttempts[pilot.id] = { ...pilot, mode: 'exam' };
    latest.assessment.activeAttempts[unrelated.id] = unrelated;
    latest.assessment.results[unrelatedResult.id] = unrelatedResult;
    const setStore = vi.fn((next: StoreV2 | ((current: StoreV2) => StoreV2)) => {
      latest = typeof next === 'function' ? next(latest) : next;
    });
    const go = vi.fn();
    const { result } = renderHook(() => useAssessmentPilot({
      store: latest,
      setStore,
      go,
    }));

    const replaced = result.current.replacePilotCandidates([pilot.id]);
    expect(replaced.ok).toBe(true);
    if (!replaced.ok) return;
    expect(latest.assessment.activeAttempts[pilot.id]).toBeUndefined();
    expect(latest.assessment.activeAttempts[replaced.value.id]).toEqual(replaced.value);
    expect(replaced.value.blueprintId).toBe(AQUEOUS_PILOT_BLUEPRINT_ID);
    expect(replaced.value.orderedQuestionIds).toHaveLength(9);
    expect(latest.assessment.activeAttempts[unrelated.id]).toEqual(unrelated);
    expect(latest.assessment.results[unrelatedResult.id]).toEqual(unrelatedResult);
    expect(go).toHaveBeenCalledWith('assessment', replaced.value.id);
  });
  it('rejects submission when a complete response diverges from its pilot draft', () => {
    const attempt = makeAttempt([...AQUEOUS_PILOT_QUESTION_IDS], {
      blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
      gradingPolicy: AQUEOUS_PILOT_POLICY,
      idFactory: () => 'pilot-mismatch',
    });
    const questionId = 'aqueous-flow-sba-001';
    const mismatched = {
      ...attempt,
      draftResponses: {
        [questionId]: {
          format: 'single_best_answer' as const,
          optionId: 'trabecular-meshwork',
        },
      },
      responses: {
        [questionId]: {
          format: 'single_best_answer' as const,
          optionId: 'posterior-chamber',
        },
      },
    };
    let latest = createEmptyStoreV2();
    latest.assessment.activeAttempts[mismatched.id] = mismatched;
    const setStore = vi.fn((next: StoreV2 | ((current: StoreV2) => StoreV2)) => {
      latest = typeof next === 'function' ? next(latest) : next;
    });
    const { result } = renderHook(() => useAssessmentPilot({
      store: latest,
      setStore,
      go: vi.fn(),
    }));

    const submitted = result.current.submit(mismatched.id);
    expect(submitted.ok).toBe(false);
    if (!submitted.ok) {
      expect(submitted.issues.map((issue) => issue.code))
        .toContain('DRAFT_RESPONSE_MISMATCH');
    }
    expect(latest.assessment.activeAttempts[mismatched.id]).toBeDefined();
    expect(Object.keys(latest.assessment.results)).toHaveLength(0);
  });
});
