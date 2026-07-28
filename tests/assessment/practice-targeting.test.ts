import { describe, expect, it } from 'vitest';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import {
  HVP_SECTION_FORMAT_ALLOCATION,
  createHvpSeededRandom,
} from '@/lib/assessment/hvp/assembler';
import {
  validateHvpCuratedAttempt,
  validateHvpCuratedResult,
} from '@/lib/assessment/hvp/compatibility';
import { withStrategyEvidence } from '@/lib/assessment/practice/evidence';
import {
  createHvpPracticeSelection,
  createHvpWrittenSelection,
  HVP_AUTOMATIC_FORMATS,
  HVP_DIFFICULTIES,
  HVP_SECTIONS,
  HVP_WRITTEN_BLUEPRINT_ID,
  hvpCuratedPracticeBlueprint,
  hvpWrittenPracticeBlueprint,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { buildDraftOnlyHvpRegistry } from '@/lib/assessment/hvp/registry';
import { assemblePractice } from '@/lib/assessment/practice/assembler';
import {
  challengeQuestionIds,
  retryMissedQuestionIds,
  unseenQuestionIds,
  weakTopicQuestionIds,
} from '@/lib/assessment/practice/history';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import type { QuestionHistoryRecord } from '@/lib/storage/schemas';

const automaticQuestions = humanVisualPerceptionCandidateBank.questions.filter(
  (question) => question.format !== 'open_response',
);

describe('history-aware deterministic practice selection', () => {
  it('treats old versions as unseen and selects current missed outcomes only', () => {
    const [firstSource, second, third] = automaticQuestions;
    const first = { ...firstSource, version: 2 };
    const history: Record<string, QuestionHistoryRecord> = {
      [first.id]: {
        questionId: first.id,
        version: 1,
        attemptCount: 3,
        correctCount: 2,
        lastStatus: 'incorrect',
      },
      [second.id]: {
        questionId: second.id,
        version: second.version,
        attemptCount: 2,
        correctCount: 1,
        encounterCount: 2,
        lastStatus: 'incorrect',
      },
      [third.id]: {
        questionId: third.id,
        version: third.version,
        attemptCount: 2,
        correctCount: 1,
        encounterCount: 2,
        lastStatus: 'partial',
      },
    };
    expect(unseenQuestionIds([first, second, third], history)).toEqual([first.id]);
    expect(new Set(retryMissedQuestionIds([first, second, third], history)))
      .toEqual(new Set([second.id, third.id]));
  });

  it('requires answered evidence before identifying weak topics', () => {
    const sameSection = automaticQuestions.filter(
      (question) => question.sectionId === automaticQuestions[0].sectionId,
    ).slice(0, 2);
    const history = Object.fromEntries(sameSection.map((question) => [
      question.id,
      {
        questionId: question.id,
        version: question.version,
        attemptCount: 2,
        correctCount: 0,
        encounterCount: 2,
        incorrectCount: 2,
        lastStatus: 'incorrect' as const,
      },
    ]));
    expect(weakTopicQuestionIds(sameSection, history)).toHaveLength(2);
    const unansweredOnly = {
      [sameSection[0].id]: {
        questionId: sameSection[0].id,
        version: sameSection[0].version,
        attemptCount: 0,
        correctCount: 0,
        encounterCount: 1,
        unansweredCount: 1,
        lastStatus: 'unanswered' as const,
      },
    };
    expect(weakTopicQuestionIds(sameSection, unansweredOnly)).toEqual([]);
  });

  it('selects challenge questions by difficulty or higher-order Bloom level', () => {
    const ids = new Set(challengeQuestionIds(automaticQuestions));
    automaticQuestions.forEach((question) => {
      const expected = question.difficulty === 'advanced'
        || ['apply', 'analyze', 'evaluate', 'create'].includes(question.bloomLevel);
      expect(ids.has(question.id)).toBe(expected);
    });
  });

  it('keeps Custom inside explicit filters and reports insufficient targeted pools', () => {
    const selection = createHvpPracticeSelection({
      profileId: 'custom',
      strategy: 'custom',
      requestedCount: 5,
      sectionIds: ['hvp-retina'],
      formats: ['single_best_answer'],
      difficulties: ['foundation'],
      seed: 'custom-filter',
    });
    const first = assemblePractice({
      questions: automaticQuestions,
      blueprint: hvpCuratedPracticeBlueprint,
      selection,
      sectionFormatAvailability: HVP_SECTION_FORMAT_ALLOCATION,
    });
    const repeated = assemblePractice({
      questions: automaticQuestions,
      blueprint: hvpCuratedPracticeBlueprint,
      selection,
      sectionFormatAvailability: HVP_SECTION_FORMAT_ALLOCATION,
    });
    expect(first.ok).toBe(true);
    expect(repeated.ok).toBe(true);
    if (!first.ok || !repeated.ok) return;
    expect(first.value.questionIds).toEqual(repeated.value.questionIds);
    first.value.questions.forEach((question) => {
      expect(question.sectionId).toBe('hvp-retina');
      expect(question.format).toBe('single_best_answer');
      expect(question.difficulty).toBe('foundation');
    });

    const history = Object.fromEntries(automaticQuestions.map((question) => [
      question.id,
      {
        questionId: question.id,
        version: question.version,
        attemptCount: 1,
        correctCount: 1,
        encounterCount: 1,
        lastStatus: 'correct' as const,
      },
    ]));
    const unseen = assemblePractice({
      questions: automaticQuestions,
      blueprint: hvpCuratedPracticeBlueprint,
      selection: createHvpPracticeSelection({
        profileId: 'targeted',
        strategy: 'unseen',
        requestedCount: 10,
        sectionIds: HVP_SECTIONS,
        formats: HVP_AUTOMATIC_FORMATS,
        difficulties: HVP_DIFFICULTIES,
        seed: 'no-unseen',
      }),
      history,
    });
    expect(unseen.ok).toBe(false);
    if (unseen.ok) return;
    expect(unseen.issues[0].code).toBe('PRACTICE_INSUFFICIENT_UNSEEN_POOL');
    expect(unseen.issues[0].availableCount).toBe(0);
  });
});

describe('separate HVP written practice', () => {
  it('persists exactly two open responses and produces manual-required review', () => {
    const built = buildDraftOnlyHvpRegistry();
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const registry = built.value;
    const ids = registry.questionIds()
      .filter((id) => registry.get(id)?.format === 'open_response')
      .sort();
    expect(ids).toHaveLength(2);
    const selection = createHvpWrittenSelection('written-seed');
    const created = createAssessmentAttempt({
      registry,
      questionIds: ids,
      mode: hvpWrittenPracticeBlueprint.defaultMode,
      courseId: hvpWrittenPracticeBlueprint.courseId,
      moduleId: hvpWrittenPracticeBlueprint.moduleId,
      blueprintId: HVP_WRITTEN_BLUEPRINT_ID,
      practiceSelection: withStrategyEvidence(selection, ids),
      gradingPolicy: hvpWrittenPracticeBlueprint.gradingPolicy,
      initializeDraftResponses: true,
      allowedReviewStatuses: ['draft'],
      random: createHvpSeededRandom(selection.seed),
      now: () => new Date('2026-07-27T12:00:00.000Z'),
      idFactory: () => 'attempt-written-test',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(validateHvpCuratedAttempt(created.value, registry).ok).toBe(true);
    const alteredHash = structuredClone(created.value);
    alteredHash.practiceSelection!.strategyEvidenceHash = '00000000';
    expect(validateHvpCuratedAttempt(alteredHash, registry).ok).toBe(false);
    const fabricatedPool = structuredClone(created.value);
    fabricatedPool.practiceSelection = withStrategyEvidence(selection, ids.slice(1));
    expect(validateHvpCuratedAttempt(fabricatedPool, registry).ok).toBe(false);
    ids.forEach((id) => {
      created.value.responses[id] = {
        format: 'open_response',
        text: `Self-study response for ${id}`,
      };
    });
    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry,
      now: () => new Date('2026-07-27T12:30:00.000Z'),
      idFactory: () => 'result-written-test',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(finalized.value.result.practiceSelection).toEqual(withStrategyEvidence(selection, ids));
    expect(finalized.value.report.status).toBe('manual_required');
    expect(finalized.value.result.score).toBeNull();
    expect(finalized.value.result.maxScore).toBeNull();
    expect(finalized.value.report.manualRequiredCount).toBe(2);
    expect(validateHvpCuratedResult(finalized.value.result, registry).ok).toBe(true);
  });
});
