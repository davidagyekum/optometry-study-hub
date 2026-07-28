import { describe, expect, it } from 'vitest';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import {
  validateHvpCuratedAttempt,
  validateHvpCuratedResult,
} from '@/lib/assessment/hvp/compatibility';
import {
  createHvpPracticeSelection,
  HVP_AUTOMATIC_FORMATS,
  HVP_DIFFICULTIES,
  HVP_SECTIONS,
  hvpCuratedPracticeBlueprint,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { buildDraftOnlyHvpRegistry } from '@/lib/assessment/hvp/registry';
import { assemblePractice } from '@/lib/assessment/practice/assembler';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import type { PracticeStrategy } from '@/lib/assessment/practice/types';
import type { QuestionHistoryRecord } from '@/lib/storage/schemas';

const questions = humanVisualPerceptionCandidateBank.questions.filter(
  (question) => question.format !== 'open_response',
);

function historyRecord(
  questionId: string,
  status: 'correct' | 'incorrect' = 'correct',
): QuestionHistoryRecord {
  return {
    questionId,
    version: 1,
    encounterCount: 2,
    attemptCount: 2,
    correctCount: status === 'correct' ? 2 : 0,
    incorrectCount: status === 'incorrect' ? 2 : 0,
    lastStatus: status,
    lastEncounteredAt: '2026-07-28T12:00:00.000Z',
  };
}

function strategyHistory(strategy: PracticeStrategy): Record<string, QuestionHistoryRecord> {
  if (strategy === 'unseen') {
    return Object.fromEntries(
      questions.slice(0, 20).map((question) => [question.id, historyRecord(question.id)]),
    );
  }
  if (strategy === 'retry-missed') {
    return Object.fromEntries(
      questions.slice(0, 20).map((question) => [
        question.id,
        historyRecord(question.id, 'incorrect'),
      ]),
    );
  }
  if (strategy === 'weak-topics') {
    const sectionId = questions[0].sectionId;
    return Object.fromEntries(
      questions.filter((question) => question.sectionId === sectionId).slice(0, 3)
        .map((question) => [question.id, historyRecord(question.id, 'incorrect')]),
    );
  }
  return {};
}

function incompatibleSnapshots(strategy: PracticeStrategy) {
  const built = buildDraftOnlyHvpRegistry();
  if (!built.ok) throw new Error('registry');
  const selection = createHvpPracticeSelection({
    profileId: 'targeted',
    strategy,
    requestedCount: 10,
    sectionIds: HVP_SECTIONS,
    formats: HVP_AUTOMATIC_FORMATS,
    difficulties: HVP_DIFFICULTIES,
    seed: `strategy-${strategy}`,
  });
  const assembled = assemblePractice({
    questions,
    blueprint: hvpCuratedPracticeBlueprint,
    selection,
    history: strategyHistory(strategy),
  });
  if (!assembled.ok) throw new Error(assembled.issues.map((issue) => issue.code).join(','));
  const eligible = new Set(assembled.value.selection.strategyEligibleQuestionIds);
  const replacement = questions.find((question) => (
    !eligible.has(question.id)
    && !assembled.value.questionIds.includes(question.id)
  ));
  if (!replacement) throw new Error(`No incompatible ${strategy} replacement`);
  const mutatedIds = [...assembled.value.questionIds];
  mutatedIds[0] = replacement.id;
  const created = createAssessmentAttempt({
    registry: built.value,
    questionIds: mutatedIds,
    mode: 'study',
    courseId: hvpCuratedPracticeBlueprint.courseId,
    moduleId: hvpCuratedPracticeBlueprint.moduleId,
    blueprintId: hvpCuratedPracticeBlueprint.id,
    practiceSelection: assembled.value.selection,
    gradingPolicy: hvpCuratedPracticeBlueprint.gradingPolicy,
    allowedReviewStatuses: ['draft'],
    idFactory: () => `attempt-${strategy}-mutation`,
  });
  if (!created.ok) throw new Error(created.issues.map((issue) => issue.code).join(','));
  const finalized = finalizeGradedAssessmentAttempt({
    attempt: created.value,
    registry: built.value,
    idFactory: () => `result-${strategy}-mutation`,
  });
  if (!finalized.ok) throw new Error(finalized.issues.map((issue) => issue.code).join(','));
  return {
    attempt: created.value,
    registry: built.value,
    result: finalized.value.result,
  };
}

describe('persisted targeted-strategy evidence', () => {
  it.each([
    'unseen',
    'retry-missed',
    'weak-topics',
    'challenge',
  ] as const)('rejects same-filter attempt and result substitutions for %s', (strategy) => {
    const fixture = incompatibleSnapshots(strategy);
    expect(validateHvpCuratedAttempt(fixture.attempt, fixture.registry).ok).toBe(false);
    expect(validateHvpCuratedResult(fixture.result, fixture.registry).ok).toBe(false);
  });
});
