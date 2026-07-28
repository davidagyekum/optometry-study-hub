import { describe, expect, it } from 'vitest';
import type { Store } from '@/lib/legacy/types';
import { isHvpCuratedPracticeEnabled } from '@/lib/assessment/hvp/config';
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from '@/lib/storage/keys';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import type {
  AssessmentAttemptSnapshot,
  AssessmentResultSnapshot,
  StoreV2,
} from '@/lib/storage/schemas';
import { loadStore, type StorageLike } from '@/lib/storage/store';

function memoryStorage(initial: Record<string, string>) {
  const values = new Map(Object.entries(initial));
  const writes: Array<[string, string]> = [];
  const storage: StorageLike = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      writes.push([key, value]);
      values.set(key, value);
    },
  };
  return { storage, values, writes };
}

function legacyAttempt(id = 'legacy-attempt') {
  return {
    id,
    moduleId: 'human-visual-perception',
    startedAt: '2026-07-27T09:00:00.000Z',
    order: ['human-visual-perception-1'],
    optionOrder: { 'human-visual-perception-1': ['answer-a', 'answer-b'] },
    answers: { 'human-visual-perception-1': 'answer-a' },
    flags: [],
    current: 0,
  };
}

function legacyResult(index = 1) {
  return {
    ...legacyAttempt(`legacy-attempt-${index}`),
    id: `legacy-result-${index}`,
    submittedAt: `2026-07-${String(index).padStart(2, '0')}T10:00:00.000Z`,
    score: index % 51,
    total: 50,
  };
}

function controlledAttempt(
  id: string,
  blueprintId = 'opt374-hvp-curated-v1',
): AssessmentAttemptSnapshot {
  const questionId = `question-${id}`;
  return {
    id,
    mode: 'study',
    courseId: 'human-visual-perception',
    moduleId: 'human-visual-perception',
    blueprintId,
    startedAt: '2026-07-27T11:00:00.000Z',
    orderedQuestionIds: [questionId],
    questionVersions: { [questionId]: 1 },
    optionOrder: { [questionId]: ['option-a', 'option-b'] },
    responses: {
      [questionId]: { format: 'single_best_answer', optionId: 'option-a' },
    },
    draftResponses: {
      [questionId]: { format: 'single_best_answer', optionId: 'option-a' },
    },
    flags: [],
    currentIndex: 0,
  };
}

function controlledResult(
  id: string,
  blueprintId = 'opt374-hvp-curated-v1',
): AssessmentResultSnapshot {
  const questionId = `question-${id}`;
  return {
    id,
    attemptId: `attempt-${id}`,
    courseId: 'human-visual-perception',
    moduleId: 'human-visual-perception',
    blueprintId,
    submittedAt: '2026-07-27T12:00:00.000Z',
    orderedQuestionIds: [questionId],
    questionVersions: { [questionId]: 1 },
    responses: {
      [questionId]: { format: 'single_best_answer', optionId: 'option-a' },
    },
    score: 1,
    maxScore: 1,
  };
}

function writtenAttempt(id: string): AssessmentAttemptSnapshot {
  const questionId = `question-${id}`;
  return {
    ...controlledAttempt(id, 'opt374-hvp-written-v1'),
    orderedQuestionIds: [questionId],
    questionVersions: { [questionId]: 1 },
    optionOrder: {},
    responses: {
      [questionId]: { format: 'open_response', text: 'Manual response' },
    },
    draftResponses: {
      [questionId]: { format: 'open_response', text: 'Manual response' },
    },
  };
}

function writtenResult(id: string): AssessmentResultSnapshot {
  const questionId = `question-${id}`;
  return {
    ...controlledResult(id, 'opt374-hvp-written-v1'),
    orderedQuestionIds: [questionId],
    questionVersions: { [questionId]: 1 },
    responses: {
      [questionId]: { format: 'open_response', text: 'Manual response' },
    },
    score: null,
    maxScore: null,
  };
}

function fixtureStores(): Record<string, StoreV2> {
  const empty = createEmptyStoreV2();
  const activeLegacy = legacyAttempt();
  const twentyResults = Array.from({ length: 20 }, (_, index) => legacyResult(index + 1));
  const full = controlledResult('full');
  const targeted = controlledResult('targeted');
  const written = writtenResult('written');
  const scoredAttempt = controlledAttempt('active-scored');
  const manualAttempt = writtenAttempt('active-written');
  const incompatible = controlledResult('incompatible', 'opt374-hvp-retired-v0');
  const secondCandidate = controlledAttempt('active-second');

  return {
    'valid V2 legacy-only': {
      ...empty,
      read: { 'human-visual-perception': ['hvp-foundations'] },
    },
    'V2 with active legacy quizzes': {
      ...empty,
      active: { 'human-visual-perception': activeLegacy },
    },
    'V2 with 20 saved results': {
      ...empty,
      results: { 'human-visual-perception': twentyResults },
    },
    'V2 with PR #9 Full HVP results': {
      ...empty,
      assessment: { ...empty.assessment, results: { [full.id]: full } },
    },
    'V2 with PR #10 targeted results': {
      ...empty,
      assessment: { ...empty.assessment, results: { [targeted.id]: targeted } },
    },
    'V2 with Written Practice': {
      ...empty,
      assessment: { ...empty.assessment, results: { [written.id]: written } },
    },
    'V2 with current-version question history': {
      ...empty,
      assessment: {
        ...empty.assessment,
        questionHistory: {
          'hvp-question-one': {
            questionId: 'hvp-question-one',
            version: 1,
            attemptCount: 2,
            correctCount: 1,
            encounterCount: 2,
            lastAnsweredAt: '2026-07-27T12:00:00.000Z',
          },
        },
      },
    },
    'V2 with incompatible HVP result': {
      ...empty,
      assessment: { ...empty.assessment, results: { [incompatible.id]: incompatible } },
    },
    'V2 with active scored HVP attempt': {
      ...empty,
      assessment: {
        ...empty.assessment,
        activeAttempts: { [scoredAttempt.id]: scoredAttempt },
      },
    },
    'V2 with active Written attempt': {
      ...empty,
      assessment: {
        ...empty.assessment,
        activeAttempts: { [manualAttempt.id]: manualAttempt },
      },
    },
    'V2 with multiple recovery candidates': {
      ...empty,
      assessment: {
        ...empty.assessment,
        activeAttempts: {
          [scoredAttempt.id]: scoredAttempt,
          [secondCandidate.id]: secondCandidate,
        },
      },
    },
    'malformed retained legacy timestamp/score data': {
      ...empty,
      results: {
        'human-visual-perception': [{
          ...legacyResult(1),
          submittedAt: 'not-a-date',
          score: 999,
          total: 0,
        }],
      },
    },
  };
}

describe('pre-release storage upgrade fixtures', () => {
  it.each(Object.entries(fixtureStores()))(
    'hydrates %s byte-for-byte without an initial write',
    (_name, store) => {
      const raw = JSON.stringify(store);
      const memory = memoryStorage({ [STORAGE_KEY]: raw });
      expect(loadStore(memory.storage)).toEqual(store);
      expect(memory.values.get(STORAGE_KEY)).toBe(raw);
      expect(memory.writes).toEqual([]);
    },
  );

  it('preserves the V1 source while retaining the existing V1-to-V2 migration', () => {
    const v1: Store = {
      version: 1,
      read: { 'human-visual-perception': ['hvp-foundations'] },
      active: { 'human-visual-perception': legacyAttempt() },
      results: { 'human-visual-perception': [legacyResult(1)] },
    };
    const raw = JSON.stringify(v1);
    const memory = memoryStorage({ [LEGACY_STORAGE_KEY]: raw });
    const migrated = loadStore(memory.storage);
    expect(memory.values.get(LEGACY_STORAGE_KEY)).toBe(raw);
    expect(memory.writes.map(([key]) => key)).toEqual([STORAGE_KEY]);
    expect(migrated).toMatchObject({
      version: 2,
      read: v1.read,
      active: v1.active,
      results: v1.results,
    });
  });

  it('feature rollback hides HVP without removing it and reactivation restores access', () => {
    const store = fixtureStores()['V2 with active scored HVP attempt'];
    const raw = JSON.stringify(store);
    const memory = memoryStorage({ [STORAGE_KEY]: raw });
    expect(isHvpCuratedPracticeEnabled('false')).toBe(false);
    expect(loadStore(memory.storage)).toEqual(store);
    expect(isHvpCuratedPracticeEnabled('true')).toBe(true);
    expect(loadStore(memory.storage)).toEqual(store);
    expect(memory.values.get(STORAGE_KEY)).toBe(raw);
    expect(memory.writes).toEqual([]);
  });
});
