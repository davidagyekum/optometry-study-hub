import { describe, expect, it } from 'vitest';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import {
  assembleHvpCuratedPractice,
  createHvpSeededRandom,
} from '@/lib/assessment/hvp/assembler';
import {
  HVP_CURATED_BLUEPRINT_ID,
  HVP_CURATED_COURSE_ID,
  HVP_CURATED_MODULE_ID,
  HVP_CURATED_POLICY,
} from '@/lib/assessment/hvp/config';
import {
  createHvpWrittenSelection,
  HVP_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { buildDraftOnlyHvpRegistry } from '@/lib/assessment/hvp/registry';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { withStrategyEvidence } from '@/lib/assessment/practice/evidence';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { calculateHvpProgress } from '@/lib/progress/hvpAnalytics';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import {
  correctResponseFor,
  incorrectResponseFor,
} from '@/tests/fixtures/grading';

function registry() {
  const built = buildDraftOnlyHvpRegistry();
  if (!built.ok) throw new Error('HVP registry fixture failed');
  return built.value;
}

function fullResult(
  id: string,
  submittedAt: string,
  answer: 'none' | 'mixed',
) {
  const currentRegistry = registry();
  const assembled = assembleHvpCuratedPractice({
    questions: humanVisualPerceptionCandidateBank.questions,
    seed: id,
    allowDifficultyRelaxation: false,
  });
  if (!assembled.ok) throw new Error('HVP assembly fixture failed');
  const created = createAssessmentAttempt({
    registry: currentRegistry,
    questionIds: assembled.value.questionIds,
    mode: 'study',
    courseId: HVP_CURATED_COURSE_ID,
    moduleId: HVP_CURATED_MODULE_ID,
    blueprintId: HVP_CURATED_BLUEPRINT_ID,
    gradingPolicy: HVP_CURATED_POLICY,
    initializeDraftResponses: true,
    allowedReviewStatuses: ['draft'],
    random: createHvpSeededRandom(id),
    now: () => new Date('2026-07-01T08:00:00.000Z'),
    idFactory: () => `attempt-${id}`,
  });
  if (!created.ok) throw new Error('HVP attempt fixture failed');
  if (answer === 'mixed') {
    const single = assembled.value.questions.find(
      (question) => question.format === 'single_best_answer',
    )!;
    const partial = assembled.value.questions.find(
      (question) => question.format === 'matching',
    )!;
    created.value.responses[single.id] = correctResponseFor(single);
    created.value.responses[partial.id] = incorrectResponseFor(partial);
  }
  const finalized = finalizeGradedAssessmentAttempt({
    attempt: created.value,
    registry: currentRegistry,
    now: () => new Date(submittedAt),
    idFactory: () => `result-${id}`,
  });
  if (!finalized.ok) throw new Error('HVP result fixture failed');
  return finalized.value.result;
}

function writtenResult() {
  const currentRegistry = registry();
  const ids = humanVisualPerceptionCandidateBank.questions
    .filter((question) => question.format === 'open_response')
    .map((question) => question.id)
    .sort();
  const selection = withStrategyEvidence(createHvpWrittenSelection('progress-written'), ids);
  const created = createAssessmentAttempt({
    registry: currentRegistry,
    questionIds: ids,
    mode: 'study',
    courseId: HVP_CURATED_COURSE_ID,
    moduleId: HVP_CURATED_MODULE_ID,
    blueprintId: HVP_WRITTEN_BLUEPRINT_ID,
    practiceSelection: selection,
    gradingPolicy: { id: 'diagnostic', version: 1 },
    initializeDraftResponses: true,
    allowedReviewStatuses: ['draft'],
    random: () => 0.5,
    now: () => new Date('2026-07-03T08:00:00.000Z'),
    idFactory: () => 'attempt-written-progress',
  });
  if (!created.ok) throw new Error('Written attempt fixture failed');
  created.value.responses[ids[0]] = {
    format: 'open_response',
    text: 'A response for manual self-review.',
  };
  const finalized = finalizeGradedAssessmentAttempt({
    attempt: created.value,
    registry: currentRegistry,
    now: () => new Date('2026-07-03T09:00:00.000Z'),
    idFactory: () => 'result-written-progress',
  });
  if (!finalized.ok) throw new Error('Written result fixture failed');
  return finalized.value.result;
}

describe('HVP curated progress analytics', () => {
  it('returns an explicit empty current-version summary', () => {
    const summary = calculateHvpProgress(createEmptyStoreV2());
    expect(summary.compatibleScoredResultCount).toBe(0);
    expect(summary.eligibleAutomaticQuestionTotal).toBe(118);
    expect(summary.coveragePercentage).toBe(0);
    expect(summary.weightedAnsweredAccuracy).toBeUndefined();
    expect(summary.masteryDistribution.unseen).toBe(118);
  });

  it('regrades compatible Full results, preserves partial points, and excludes unanswered', () => {
    const store = createEmptyStoreV2();
    const mixed = fullResult('mixed', '2026-07-01T09:00:00.000Z', 'mixed');
    const unanswered = fullResult('unanswered', '2026-07-02T09:00:00.000Z', 'none');
    store.assessment.results[mixed.id] = mixed;
    store.assessment.results[unanswered.id] = unanswered;
    const answeredGrades = Object.values(mixed.grading!.questionGrades)
      .filter((grade) => grade.status !== 'unanswered');
    const exactAccuracy = answeredGrades.reduce((sum, grade) => sum + (grade.score ?? 0), 0)
      / answeredGrades.reduce((sum, grade) => sum + grade.maxScore, 0) * 100;
    const summary = calculateHvpProgress(store);
    expect(summary.compatibleScoredResultCount).toBe(2);
    expect(summary.latestPercentage).toBe(0);
    expect(summary.partialCount).toBe(1);
    expect(summary.correctCount).toBe(1);
    expect(summary.unansweredCount).toBe(98);
    expect(summary.weightedAnsweredAccuracy).toBeCloseTo(exactAccuracy);
    expect(summary.distinctCurrentQuestionsEncountered).toBe(
      new Set([...mixed.orderedQuestionIds, ...unanswered.orderedQuestionIds]).size,
    );
  });

  it('keeps written practice unscored and omits incompatible HVP results', () => {
    const store = createEmptyStoreV2();
    const written = writtenResult();
    const valid = fullResult('valid', '2026-07-04T09:00:00.000Z', 'none');
    store.assessment.results[written.id] = written;
    store.assessment.results[valid.id] = valid;
    store.assessment.results.tampered = {
      ...structuredClone(valid),
      id: 'tampered',
      score: 999,
    };
    store.assessment.results.aqueous = {
      ...structuredClone(valid),
      id: 'aqueous',
      blueprintId: 'aqueous-vitreous-pilot-v1',
    };
    const summary = calculateHvpProgress(store);
    expect(summary.compatibleScoredResultCount).toBe(1);
    expect(summary.omittedResultCount).toBe(1);
    expect(summary.writtenSubmissions).toBe(1);
    expect(summary.writtenResponsesSupplied).toBe(1);
    expect(summary.writtenUnansweredPrompts).toBe(1);
  });
});
