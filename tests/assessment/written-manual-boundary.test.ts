import { describe, expect, it } from 'vitest';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { validateHvpCuratedResult } from '@/lib/assessment/hvp/compatibility';
import {
  createHvpWrittenSelection,
  HVP_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { buildDraftOnlyHvpRegistry } from '@/lib/assessment/hvp/registry';
import { withStrategyEvidence } from '@/lib/assessment/practice/evidence';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import { assessmentResultSnapshotSchema } from '@/lib/storage/schemas';

function writtenFixture(answerCount: 0 | 1 | 2) {
  const built = buildDraftOnlyHvpRegistry();
  if (!built.ok) throw new Error('registry');
  const ids = humanVisualPerceptionCandidateBank.questions
    .filter((question) => question.format === 'open_response')
    .map((question) => question.id)
    .sort();
  const selection = withStrategyEvidence(createHvpWrittenSelection(`written-${answerCount}`), ids);
  const created = createAssessmentAttempt({
    registry: built.value,
    questionIds: ids,
    mode: 'study',
    courseId: 'human-visual-perception',
    moduleId: 'human-visual-perception',
    blueprintId: HVP_WRITTEN_BLUEPRINT_ID,
    practiceSelection: selection,
    gradingPolicy: { id: 'diagnostic', version: 1 },
    allowedReviewStatuses: ['draft'],
    random: () => 0.5,
    idFactory: () => `attempt-written-${answerCount}`,
  });
  if (!created.ok) throw new Error('attempt');
  ids.slice(0, answerCount).forEach((id) => {
    created.value.responses[id] = { format: 'open_response', text: `Response ${id}` };
  });
  const finalized = finalizeGradedAssessmentAttempt({
    attempt: created.value,
    registry: built.value,
    idFactory: () => `result-written-${answerCount}`,
  });
  if (!finalized.ok) throw new Error(finalized.issues.map((issue) => issue.code).join(','));
  return { registry: built.value, ids, result: finalized.value.result };
}

describe('manual-only Written Practice results', () => {
  it.each([0, 1, 2] as const)('keeps %i supplied responses outside numeric scoring', (answerCount) => {
    const fixture = writtenFixture(answerCount);
    expect(fixture.result.score).toBeNull();
    expect(fixture.result.maxScore).toBeNull();
    expect(assessmentResultSnapshotSchema.safeParse(fixture.result).success).toBe(true);
    expect(validateHvpCuratedResult(fixture.result, fixture.registry).ok).toBe(true);
    const grades = fixture.ids.map((id) => fixture.result.grading!.questionGrades[id].status);
    expect(grades.filter((status) => status === 'manual_required')).toHaveLength(answerCount);
    expect(grades.filter((status) => status === 'unanswered')).toHaveLength(2 - answerCount);
  });

  it('rejects a written result carrying numeric totals', () => {
    const fixture = writtenFixture(0);
    expect(validateHvpCuratedResult({
      ...fixture.result,
      score: 0,
      maxScore: 2,
    }, fixture.registry).ok).toBe(false);
  });
});
