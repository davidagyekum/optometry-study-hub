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
  HVP_CURATED_BLUEPRINT_ID,
  HVP_CURATED_COURSE_ID,
  HVP_CURATED_MODULE_ID,
  HVP_CURATED_POLICY,
} from '@/lib/assessment/hvp/config';
import { buildDraftOnlyHvpRegistry } from '@/lib/assessment/hvp/registry';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { resolveAssessmentAttempt } from '@/lib/assessment/session/resolveAttempt';

function countBy<T>(values: T[], key: (value: T) => string) {
  return values.reduce<Record<string, number>>((counts, value) => ({
    ...counts,
    [key(value)]: (counts[key(value)] ?? 0) + 1,
  }), {});
}

describe('OPT 374 curated-practice assembler', () => {
  it('builds the exact 50-question quota matrix and difficulty target', () => {
    const result = assembleHvpCuratedPractice({
      questions: humanVisualPerceptionCandidateBank.questions,
      seed: 'quota-proof',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { questions } = result.value;
    expect(questions).toHaveLength(50);
    expect(new Set(result.value.questionIds).size).toBe(50);
    expect(countBy(questions, (question) => question.sectionId)).toEqual(
      HVP_PRACTICE_SECTION_TARGETS,
    );
    expect(countBy(questions, (question) => question.format)).toEqual(
      HVP_PRACTICE_FORMAT_TARGETS,
    );
    expect(countBy(questions, (question) => question.difficulty)).toEqual(
      HVP_PRACTICE_DIFFICULTY_TARGETS,
    );
    expect(questions.some((question) => question.format === 'open_response')).toBe(false);
    expect(result.value.higherOrderCount).toBeGreaterThanOrEqual(20);
    expect(result.value.usedDifficultyRelaxation).toBe(false);
    expect(Math.max(...Object.values(countBy(
      questions,
      (question) => question.familyId,
    )))).toBeLessThanOrEqual(2);
  });


  it('satisfies every hard assembly contract across 1,000 deterministic seeds', () => {
    for (let index = 0; index < 1_000; index += 1) {
      const seed = `seed-robustness-${index}`;
      const result = assembleHvpCuratedPractice({
        questions: humanVisualPerceptionCandidateBank.questions,
        seed,
        allowDifficultyRelaxation: false,
      });
      expect(result.ok, seed).toBe(true);
      if (!result.ok) continue;
      const { questions } = result.value;
      expect(questions, seed).toHaveLength(50);
      expect(new Set(result.value.questionIds).size, seed).toBe(50);
      expect(countBy(questions, (question) => question.sectionId), seed).toEqual(
        HVP_PRACTICE_SECTION_TARGETS,
      );
      expect(countBy(questions, (question) => question.format), seed).toEqual(
        HVP_PRACTICE_FORMAT_TARGETS,
      );
      expect(countBy(questions, (question) => question.difficulty), seed).toEqual(
        HVP_PRACTICE_DIFFICULTY_TARGETS,
      );
      expect(result.value.higherOrderCount, seed)
        .toBeGreaterThanOrEqual(HVP_MINIMUM_HIGHER_ORDER_QUESTIONS);
      expect(result.value.usedDifficultyRelaxation, seed).toBe(false);
      expect(Math.max(...Object.values(countBy(
        questions,
        (question) => question.familyId,
      ))), seed).toBeLessThanOrEqual(2);
    }
  }, 30_000);

  it('is stable for one seed and varies under another seed', () => {
    const first = assembleHvpCuratedPractice({
      questions: humanVisualPerceptionCandidateBank.questions,
      seed: 'same-seed',
    });
    const repeated = assembleHvpCuratedPractice({
      questions: humanVisualPerceptionCandidateBank.questions,
      seed: 'same-seed',
    });
    const different = assembleHvpCuratedPractice({
      questions: humanVisualPerceptionCandidateBank.questions,
      seed: 'different-seed',
    });
    expect(first.ok && repeated.ok && different.ok).toBe(true);
    if (!first.ok || !repeated.ok || !different.ok) return;
    expect(repeated.value.questionIds).toEqual(first.value.questionIds);
    expect(different.value.questionIds).not.toEqual(first.value.questionIds);
  });

  it('returns structured diagnostics if a required matrix cell is unavailable', () => {
    const questions = humanVisualPerceptionCandidateBank.questions.filter(
      (question) => !(
        question.sectionId === 'hvp-foundations'
        && question.format === 'matching'
      ),
    );
    const result = assembleHvpCuratedPractice({ questions, seed: 'failure' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: 'HVP_CELL_UNAVAILABLE',
      sectionId: 'hvp-foundations',
      format: 'matching',
    }));
  });

  it('creates a valid exact-version session-engine snapshot', () => {
    const registryResult = buildDraftOnlyHvpRegistry();
    const assembly = assembleHvpCuratedPractice({
      questions: humanVisualPerceptionCandidateBank.questions,
      seed: 'session-proof',
    });
    expect(registryResult.ok && assembly.ok).toBe(true);
    if (!registryResult.ok || !assembly.ok) return;
    const attempt = createAssessmentAttempt({
      registry: registryResult.value,
      questionIds: assembly.value.questionIds,
      mode: 'study',
      courseId: HVP_CURATED_COURSE_ID,
      moduleId: HVP_CURATED_MODULE_ID,
      blueprintId: HVP_CURATED_BLUEPRINT_ID,
      gradingPolicy: HVP_CURATED_POLICY,
      initializeDraftResponses: true,
      allowedReviewStatuses: ['draft'],
      random: createHvpSeededRandom('session-proof'),
      now: () => new Date('2026-07-27T00:00:00.000Z'),
      idFactory: () => 'attempt-hvp-session-proof',
    });
    expect(attempt.ok).toBe(true);
    if (!attempt.ok) return;
    expect(attempt.value.blueprintId).toBe(HVP_CURATED_BLUEPRINT_ID);
    expect(attempt.value.gradingPolicy).toEqual(HVP_CURATED_POLICY);
    expect(resolveAssessmentAttempt(attempt.value, registryResult.value).ok).toBe(true);
  });
});
