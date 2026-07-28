import { describe, expect, it } from 'vitest';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { assembleHvpCuratedPractice, HVP_SECTION_FORMAT_ALLOCATION } from '@/lib/assessment/hvp/assembler';
import {
  createHvpPracticeSelection,
  HVP_SECTIONS,
  hvpCuratedPracticeBlueprint,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { validatePracticeBlueprint, validatePracticeSelection } from '@/lib/assessment/practice/blueprint';
import {
  familyConstrainedCount,
  retryMissedQuestionIds,
  weakTopicQuestionIds,
  challengeQuestionIds,
} from '@/lib/assessment/practice/history';
import { assemblePractice } from '@/lib/assessment/practice/assembler';
import type { QuestionHistoryRecord } from '@/lib/storage/schemas';

const automatic = humanVisualPerceptionCandidateBank.questions.filter((question) => question.format !== 'open_response');
const record = (
  questionId: string,
  overrides: Partial<QuestionHistoryRecord> = {},
): QuestionHistoryRecord => ({
  questionId,
  version: 1,
  attemptCount: 2,
  correctCount: 2,
  encounterCount: 2,
  lastStatus: 'correct',
  lastEncounteredAt: '2026-07-28T10:00:00.000Z',
  ...overrides,
});

describe('truthful ranked practice targeting', () => {
  it('does not classify perfect or unanswered-only sections as weak', () => {
    const section = automatic.filter((question) => question.sectionId === 'hvp-retina').slice(0, 3);
    const perfect = Object.fromEntries(section.map((question) => [question.id, record(question.id)]));
    const unanswered = Object.fromEntries(section.map((question) => [question.id, record(question.id, {
      attemptCount: 0,
      correctCount: 0,
      unansweredCount: 2,
      lastStatus: 'unanswered',
    })]));
    expect(weakTopicQuestionIds(automatic, perfect)).toEqual([]);
    expect(weakTopicQuestionIds(automatic, unanswered)).toEqual([]);
  });

  it('ranks weaker qualifying sections before stronger sections and preserves miss recency', () => {
    const retina = automatic.filter((question) => question.sectionId === 'hvp-retina').slice(0, 2);
    const lgn = automatic.filter((question) => question.sectionId === 'hvp-lgn').slice(0, 2);
    const history = {
      [retina[0].id]: record(retina[0].id, { correctCount: 0, lastStatus: 'incorrect', lastEncounteredAt: '2026-07-28T12:00:00.000Z' }),
      [retina[1].id]: record(retina[1].id, { correctCount: 0, lastStatus: 'partial', lastEncounteredAt: '2026-07-28T11:00:00.000Z' }),
      [lgn[0].id]: record(lgn[0].id, { correctCount: 1, lastStatus: 'incorrect', lastEncounteredAt: '2026-07-28T09:00:00.000Z' }),
      [lgn[1].id]: record(lgn[1].id, { correctCount: 2 }),
    };
    const weak = weakTopicQuestionIds(automatic, history);
    expect(automatic.find((question) => question.id === weak[0])?.sectionId).toBe('hvp-retina');
    expect(retryMissedQuestionIds(automatic, history).slice(0, 3)).toEqual([
      retina[0].id,
      retina[1].id,
      lgn[0].id,
    ]);
  });

  it('applies family limits to availability and prioritises advanced higher-order challenge items', () => {
    const sameFamily = automatic.filter((question) => question.familyId === automatic[0].familyId);
    const ids = sameFamily.map((question) => question.id);
    expect(familyConstrainedCount(ids, automatic, 2)).toBe(Math.min(2, ids.length));
    const challenge = challengeQuestionIds(automatic);
    const first = automatic.find((question) => question.id === challenge[0])!;
    expect(first.difficulty).toBe('advanced');
    expect(['apply', 'analyze', 'evaluate', 'create']).toContain(first.bloomLevel);
  });
});

describe('strict profile and mixed-practice identity', () => {
  it('rejects same-length substituted Full filters and inappropriate strategies', () => {
    const full = createHvpPracticeSelection({
      profileId: 'full',
      requestedCount: 50,
      seed: 'invalid-full',
      sectionIds: [...HVP_SECTIONS.slice(0, -1), 'unknown-section'],
    });
    expect(validatePracticeSelection(full, hvpCuratedPracticeBlueprint).ok).toBe(false);
    expect(validatePracticeSelection({
      ...createHvpPracticeSelection({ profileId: 'quick', requestedCount: 10, seed: 'bad-strategy' }),
      strategy: 'challenge',
    }, hvpCuratedPracticeBlueprint).ok).toBe(false);
  });

  it('rejects malformed blueprint duplicates and impossible profile totals', () => {
    expect(validatePracticeBlueprint({
      ...hvpCuratedPracticeBlueprint,
      eligibleFormats: ['single_best_answer', 'single_best_answer'],
    }).ok).toBe(false);
    expect(validatePracticeBlueprint({
      ...hvpCuratedPracticeBlueprint,
      profiles: [{
        ...hvpCuratedPracticeBlueprint.profiles[0],
        higherOrderMinimum: 11,
        sectionTargets: { 'hvp-foundations': 1 },
      }],
    }).ok).toBe(false);
  });

  it.each([
    ['quick', 10, 0],
    ['standard', 25, 1],
  ] as const)('prefers unseen questions for %s while preserving every fixed quota', (profileId, requestedCount, profileIndex) => {
    const selection = createHvpPracticeSelection({ profileId, requestedCount, seed: `unseen-fixed-${profileId}` });
    const first = assemblePractice({
      questions: automatic,
      blueprint: hvpCuratedPracticeBlueprint,
      selection,
      sectionFormatAvailability: HVP_SECTION_FORMAT_ALLOCATION,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const history = Object.fromEntries(first.value.questionIds.map((id) => [id, record(id)]));
    const second = assemblePractice({
      questions: automatic,
      blueprint: hvpCuratedPracticeBlueprint,
      selection,
      history,
      sectionFormatAvailability: HVP_SECTION_FORMAT_ALLOCATION,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.questionIds.filter((id) => history[id]).length).toBeLessThan(requestedCount);
    expect(second.value.sectionCounts).toEqual(hvpCuratedPracticeBlueprint.profiles[profileIndex].sectionTargets);
    expect(second.value.formatCounts).toEqual(Object.fromEntries(
      Object.entries(hvpCuratedPracticeBlueprint.profiles[profileIndex].formatTargets ?? {})
        .filter(([, count]) => count > 0),
    ));
    expect(second.value.difficultyCounts).toEqual(hvpCuratedPracticeBlueprint.profiles[profileIndex].difficultyTargets);
  });

  it('prefers unseen questions in the preserved Full assembler without weakening its contracts', () => {
    const first = assembleHvpCuratedPractice({
      questions: automatic,
      seed: 'unseen-fixed-full',
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const history = Object.fromEntries(first.value.questionIds.map((id) => [id, record(id)]));
    const second = assembleHvpCuratedPractice({
      questions: automatic,
      seed: 'unseen-fixed-full',
      history,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.questionIds.filter((id) => history[id]).length).toBeLessThan(50);
    expect(second.value.questionIds).toHaveLength(50);
    expect(new Set(second.value.questionIds).size).toBe(50);
    expect(second.value.difficultyCounts).toEqual({
      foundation: 14,
      intermediate: 26,
      advanced: 10,
    });
    expect(second.value.higherOrderCount).toBeGreaterThanOrEqual(20);
    expect(second.value.usedDifficultyRelaxation).toBe(false);
  });
});
