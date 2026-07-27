import { describe, expect, it } from 'vitest';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import {
  assembleHvpCuratedPractice,
  createHvpSeededRandom,
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

function fixture() {
  const registryResult = buildDraftOnlyHvpRegistry();
  const assembly = assembleHvpCuratedPractice({
    questions: humanVisualPerceptionCandidateBank.questions,
    seed: 'compatibility',
  });
  if (!registryResult.ok || !assembly.ok) throw new Error('HVP fixtures should build');
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
    random: createHvpSeededRandom('compatibility'),
    now: () => new Date('2026-07-27T01:00:00.000Z'),
    idFactory: () => 'attempt-hvp-compatibility',
  });
  if (!attempt.ok) throw new Error('HVP attempt should build');
  return { registry: registryResult.value, attempt: attempt.value };
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
