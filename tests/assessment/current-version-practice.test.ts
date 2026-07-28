import { describe, expect, it } from 'vitest';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { assembleHvpCuratedPractice } from '@/lib/assessment/hvp/assembler';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { gradeAssessmentResult } from '@/lib/assessment/grading/gradeResult';
import { assemblePractice } from '@/lib/assessment/practice/assembler';
import { practiceBlueprintSchema } from '@/lib/assessment/practice/schemas';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { buildQuestionRegistry } from '@/lib/assessment/session/registry';
import { finalizeAssessmentStore, putActiveAssessmentAttempt } from '@/lib/storage/assessmentStore';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { correctResponseFor } from '@/tests/fixtures/grading';
import { makePilotBank } from '@/tests/fixtures/session-engine';

describe('current authored question versions in practice', () => {
  it('keeps current version-2 questions eligible in the preserved Full assembler', () => {
    const currentQuestions = humanVisualPerceptionCandidateBank.questions
      .filter((question) => question.format !== 'open_response')
      .map((question) => ({ ...structuredClone(question), version: 2 }));
    const assembled = assembleHvpCuratedPractice({
      questions: currentQuestions,
      seed: 'all-current-version-two',
    });
    expect(assembled.ok).toBe(true);
    if (!assembled.ok) return;
    expect(assembled.value.questions).toHaveLength(50);
    expect(assembled.value.questions.every((question) => question.version === 2)).toBe(true);
  });

  it('assembles and finalizes version 2, replaces version-1 history, and rejects downgrade', () => {
    const bank = makePilotBank();
    const question = bank.questions.find((candidate) => candidate.format === 'single_best_answer')!;
    question.version = 2;
    const built = buildQuestionRegistry({ banks: [bank], allowedReviewStatuses: ['draft'] });
    expect(built.ok).toBe(true);
    if (!built.ok) return;
    const blueprint = practiceBlueprintSchema.parse({
      schemaVersion: 1,
      id: 'version-two-practice',
      practiceFamilyId: 'version-two-family',
      courseId: question.courseId,
      moduleId: question.moduleId,
      allowedReviewStatuses: ['draft'],
      defaultMode: 'study',
      gradingPolicy: { id: 'diagnostic', version: 1 },
      eligibleFormats: [question.format],
      resultMode: 'automatic',
      profiles: [{ id: 'custom', label: 'Custom', count: 1, higherOrderMinimum: 0 }],
      maximumFamilyRepetition: 2,
      historyPolicy: 'scored',
      sectionIds: [question.sectionId],
      custom: { minimumCount: 1, maximumCount: 1 },
    });
    const selection = {
      schemaVersion: 1 as const,
      blueprintId: blueprint.id,
      practiceFamilyId: blueprint.practiceFamilyId,
      profileId: 'custom',
      strategy: 'custom' as const,
      requestedCount: 1,
      sectionIds: [question.sectionId],
      formats: [question.format],
      difficulties: [question.difficulty],
      seed: 'version-two',
      resultMode: 'automatic' as const,
      historyPolicy: 'scored' as const,
    };
    const assembled = assemblePractice({ questions: bank.questions, blueprint, selection });
    expect(assembled.ok).toBe(true);
    if (!assembled.ok) return;
    expect(assembled.value.questions[0].version).toBe(2);
    const attempt = createAssessmentAttempt({
      registry: built.value,
      questionIds: assembled.value.questionIds,
      mode: 'study',
      courseId: question.courseId,
      moduleId: question.moduleId,
      blueprintId: blueprint.id,
      practiceSelection: assembled.value.selection,
      gradingPolicy: blueprint.gradingPolicy,
      allowedReviewStatuses: ['draft'],
      idFactory: () => 'attempt-version-two',
    });
    expect(attempt.ok).toBe(true);
    if (!attempt.ok) return;
    expect(attempt.value.questionVersions[question.id]).toBe(2);
    attempt.value.responses[question.id] = correctResponseFor(question);
    const finalized = finalizeGradedAssessmentAttempt({
      attempt: attempt.value,
      registry: built.value,
      idFactory: () => 'result-version-two',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(gradeAssessmentResult({ result: finalized.value.result, registry: built.value }).ok).toBe(true);
    const inserted = putActiveAssessmentAttempt(createEmptyStoreV2(), attempt.value.id, attempt.value);
    if (!inserted.ok) throw new Error('insert');
    inserted.value.assessment.questionHistory[question.id] = {
      questionId: question.id,
      version: 1,
      attemptCount: 4,
      correctCount: 3,
    };
    const stored = finalizeAssessmentStore(
      inserted.value,
      attempt.value.id,
      finalized.value.result.id,
      finalized.value.result,
      { historyPolicy: 'scored', registry: built.value },
    );
    expect(stored.ok).toBe(true);
    if (!stored.ok) return;
    expect(stored.value.assessment.questionHistory[question.id]).toMatchObject({
      version: 2,
      attemptCount: 1,
      correctCount: 1,
    });
    const downgradeStore = structuredClone(inserted.value);
    downgradeStore.assessment.questionHistory[question.id] = stored.value.assessment.questionHistory[question.id];
    const downgrade = finalizeAssessmentStore(
      downgradeStore,
      attempt.value.id,
      finalized.value.result.id,
      {
        ...finalized.value.result,
        questionVersions: { [question.id]: 1 },
        grading: {
          ...finalized.value.result.grading!,
          questionGrades: {
            [question.id]: {
              ...finalized.value.result.grading!.questionGrades[question.id],
              questionVersion: 1,
            },
          },
        },
      },
      { historyPolicy: 'scored', registry: built.value },
    );
    expect(downgrade.ok).toBe(false);
  });
});
