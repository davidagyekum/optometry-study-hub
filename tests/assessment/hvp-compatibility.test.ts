import { describe, expect, it } from 'vitest';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import {
  assembleHvpCuratedPractice,
  createHvpSeededRandom,
  HVP_MINIMUM_HIGHER_ORDER_QUESTIONS,
  HVP_PRACTICE_DIFFICULTY_TARGETS,
  HVP_PRACTICE_FORMAT_TARGETS,
  HVP_PRACTICE_SECTION_TARGETS,
} from '@/lib/assessment/hvp/assembler';
import {
  validateHvpCuratedAttempt,
  validateHvpCuratedResult,
} from '@/lib/assessment/hvp/compatibility';
import {
  HVP_CURATED_BLUEPRINT_ID,
  HVP_CURATED_COURSE_ID,
  HVP_CURATED_MODULE_ID,
  HVP_CURATED_POLICY,
} from '@/lib/assessment/hvp/config';
import { buildDraftOnlyHvpRegistry } from '@/lib/assessment/hvp/registry';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import type { QuestionRegistry } from '@/lib/assessment/session/registry';

const HIGHER_ORDER = new Set(['apply', 'analyze', 'evaluate', 'create']);
const QUESTION_BY_ID = new Map(
  humanVisualPerceptionCandidateBank.questions.map((question) => [question.id, question]),
);

function countBy<T>(values: T[], key: (value: T) => string) {
  return values.reduce<Record<string, number>>((counts, value) => ({
    ...counts,
    [key(value)]: (counts[key(value)] ?? 0) + 1,
  }), {});
}

function createAttemptForIds(
  registry: QuestionRegistry,
  questionIds: string[],
  id: string,
) {
  const attempt = createAssessmentAttempt({
    registry,
    questionIds,
    mode: 'study',
    courseId: HVP_CURATED_COURSE_ID,
    moduleId: HVP_CURATED_MODULE_ID,
    blueprintId: HVP_CURATED_BLUEPRINT_ID,
    gradingPolicy: HVP_CURATED_POLICY,
    initializeDraftResponses: true,
    allowedReviewStatuses: ['draft'],
    random: createHvpSeededRandom(id),
    now: () => new Date('2026-07-27T01:00:00.000Z'),
    idFactory: () => id,
  });
  if (!attempt.ok) throw new Error('HVP attempt should build');
  return attempt.value;
}

function fixture() {
  const registryResult = buildDraftOnlyHvpRegistry();
  const assembly = assembleHvpCuratedPractice({
    questions: humanVisualPerceptionCandidateBank.questions,
    seed: 'compatibility',
    allowDifficultyRelaxation: false,
  });
  if (!registryResult.ok || !assembly.ok) throw new Error('HVP fixtures should build');
  return {
    registry: registryResult.value,
    attempt: createAttemptForIds(
      registryResult.value,
      assembly.value.questionIds,
      'attempt-hvp-compatibility',
    ),
  };
}

function questionsFor(questionIds: string[]) {
  return questionIds.map((id) => {
    const question = QUESTION_BY_ID.get(id);
    if (!question) throw new Error(`Question ${id} should be canonical`);
    return question;
  });
}

function replacementPreservesFamilyLimit(
  questionIds: string[],
  fromId: string,
  toId: string,
): boolean {
  const replaced = questionIds.map((id) => (id === fromId ? toId : id));
  const families = countBy(questionsFor(replaced), (question) => question.familyId);
  return Object.values(families).every((count) => count <= 2);
}

function replaceForDifficultyDrift(questionIds: string[]): string[] {
  const selected = new Set(questionIds);
  for (const current of questionsFor(questionIds)) {
    const replacement = humanVisualPerceptionCandidateBank.questions.find((candidate) => (
      !selected.has(candidate.id)
      && candidate.format !== 'open_response'
      && candidate.sectionId === current.sectionId
      && candidate.format === current.format
      && candidate.difficulty !== current.difficulty
      && replacementPreservesFamilyLimit(questionIds, current.id, candidate.id)
    ));
    if (replacement) {
      return questionIds.map((id) => (id === current.id ? replacement.id : id));
    }
  }
  throw new Error('A quota-preserving difficulty mutation should exist');
}

function replaceForHigherOrderDrift(questionIds: string[]): string[] {
  let mutated = [...questionIds];
  while (
    questionsFor(mutated).filter((question) => HIGHER_ORDER.has(question.bloomLevel)).length
    >= HVP_MINIMUM_HIGHER_ORDER_QUESTIONS
  ) {
    const selected = new Set(mutated);
    let replacement: { fromId: string; toId: string } | undefined;
    for (const current of questionsFor(mutated).filter(
      (question) => HIGHER_ORDER.has(question.bloomLevel),
    )) {
      const candidate = humanVisualPerceptionCandidateBank.questions.find((question) => (
        !selected.has(question.id)
        && !HIGHER_ORDER.has(question.bloomLevel)
        && question.sectionId === current.sectionId
        && question.format === current.format
        && question.difficulty === current.difficulty
        && replacementPreservesFamilyLimit(mutated, current.id, question.id)
      ));
      if (candidate) {
        replacement = { fromId: current.id, toId: candidate.id };
        break;
      }
    }
    if (!replacement) break;
    mutated = mutated.map((id) => (
      id === replacement?.fromId ? replacement.toId : id
    ));
  }
  if (
    questionsFor(mutated).filter((question) => HIGHER_ORDER.has(question.bloomLevel)).length
    >= HVP_MINIMUM_HIGHER_ORDER_QUESTIONS
  ) {
    throw new Error('A quota-preserving higher-order mutation should exist');
  }
  return mutated;
}

function expectExistingQuotaContracts(questionIds: string[]) {
  const questions = questionsFor(questionIds);
  expect(countBy(questions, (question) => question.sectionId)).toEqual(
    HVP_PRACTICE_SECTION_TARGETS,
  );
  expect(countBy(questions, (question) => question.format)).toEqual(
    HVP_PRACTICE_FORMAT_TARGETS,
  );
  expect(Math.max(...Object.values(countBy(
    questions,
    (question) => question.familyId,
  )))).toBeLessThanOrEqual(2);
}

function expectAttemptAndResultRejected(
  registry: QuestionRegistry,
  questionIds: string[],
  id: string,
) {
  const attempt = createAttemptForIds(registry, questionIds, id);
  expect(validateHvpCuratedAttempt(attempt, registry).ok).toBe(false);
  const finalized = finalizeGradedAssessmentAttempt({
    attempt,
    registry,
    idFactory: () => `result-${id}`,
  });
  expect(finalized.ok).toBe(true);
  if (!finalized.ok) return;
  expect(validateHvpCuratedResult(finalized.value.result, registry).ok).toBe(false);
}

describe('HVP curated-practice compatibility', () => {
  it('accepts exact attempts and fails closed on identity or quota drift', () => {
    const { registry, attempt } = fixture();
    expect(validateHvpCuratedAttempt(attempt, registry).ok).toBe(true);
    expect(validateHvpCuratedAttempt({
      ...attempt,
      blueprintId: 'unrelated-blueprint',
    }, registry).ok).toBe(false);
    expect(validateHvpCuratedAttempt({
      ...attempt,
      orderedQuestionIds: attempt.orderedQuestionIds.slice(0, 49),
      questionVersions: Object.fromEntries(
        attempt.orderedQuestionIds.slice(0, 49).map((id) => [id, attempt.questionVersions[id]]),
      ),
    }, registry).ok).toBe(false);
  });

  it('rejects attempt and result mutations that preserve existing quotas but drift difficulty', () => {
    const { registry, attempt } = fixture();
    const questionIds = replaceForDifficultyDrift(attempt.orderedQuestionIds);
    expectExistingQuotaContracts(questionIds);
    expect(countBy(questionsFor(questionIds), (question) => question.difficulty))
      .not.toEqual(HVP_PRACTICE_DIFFICULTY_TARGETS);
    expectAttemptAndResultRejected(registry, questionIds, 'attempt-hvp-difficulty-drift');
  });

  it('rejects attempt and result mutations that preserve existing quotas but lose higher order', () => {
    const { registry, attempt } = fixture();
    const questionIds = replaceForHigherOrderDrift(attempt.orderedQuestionIds);
    const questions = questionsFor(questionIds);
    expectExistingQuotaContracts(questionIds);
    expect(countBy(questions, (question) => question.difficulty)).toEqual(
      HVP_PRACTICE_DIFFICULTY_TARGETS,
    );
    expect(questions.filter((question) => HIGHER_ORDER.has(question.bloomLevel)).length)
      .toBeLessThan(HVP_MINIMUM_HIGHER_ORDER_QUESTIONS);
    expectAttemptAndResultRejected(registry, questionIds, 'attempt-hvp-higher-order-drift');
  });

  it('persists blueprint identity and deterministically regrades results', () => {
    const { registry, attempt } = fixture();
    const finalized = finalizeGradedAssessmentAttempt({
      attempt,
      registry,
      now: () => new Date('2026-07-27T02:00:00.000Z'),
      idFactory: () => 'result-hvp-compatibility',
    });
    expect(finalized.ok).toBe(true);
    if (!finalized.ok) return;
    expect(finalized.value.result.blueprintId).toBe(HVP_CURATED_BLUEPRINT_ID);
    expect(validateHvpCuratedResult(finalized.value.result, registry).ok).toBe(true);
    expect(validateHvpCuratedResult({
      ...finalized.value.result,
      blueprintId: 'unrelated-blueprint',
    }, registry).ok).toBe(false);
  });
});
