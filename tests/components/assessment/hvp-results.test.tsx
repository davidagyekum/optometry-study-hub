// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HvpPracticeResults } from '@/components/assessment/hvp/HvpPracticeResults';
import { humanVisualPerceptionCandidateBank } from '@/content/question-bank/opt374/human-visual-perception/bank';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  assembleHvpCuratedPractice,
  createHvpSeededRandom,
} from '@/lib/assessment/hvp/assembler';
import {
  HVP_CURATED_BLUEPRINT_ID,
  HVP_CURATED_COURSE_ID,
  HVP_CURATED_MODULE_ID,
  HVP_CURATED_POLICY,
  HVP_CURATED_PRACTICE_ID,
} from '@/lib/assessment/hvp/config';
import { buildDraftOnlyHvpRegistry } from '@/lib/assessment/hvp/registry';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';
import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';

afterEach(cleanup);

function resultFixture() {
  const registryResult = buildDraftOnlyHvpRegistry();
  const assembly = assembleHvpCuratedPractice({
    questions: humanVisualPerceptionCandidateBank.questions,
    seed: 'hvp-results-route',
    allowDifficultyRelaxation: false,
  });
  if (!registryResult.ok || !assembly.ok) {
    throw new Error('HVP result fixture should assemble');
  }
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
    random: createHvpSeededRandom('hvp-results-route'),
    idFactory: () => 'attempt-hvp-results-route',
  });
  if (!attempt.ok) throw new Error('HVP result attempt should build');
  const finalized = finalizeGradedAssessmentAttempt({
    attempt: attempt.value,
    registry: registryResult.value,
    idFactory: () => 'result-hvp-results-route',
  });
  if (!finalized.ok) throw new Error('HVP result fixture should finalize');
  return {
    registry: registryResult.value,
    result: finalized.value.result,
  };
}

describe('HvpPracticeResults navigation', () => {
  it('returns a valid result to the canonical curated-practice landing route', () => {
    const { registry, result } = resultFixture();
    const go = vi.fn();
    render(
      <HvpPracticeResults
        go={go}
        registry={registry}
        resultResult={sessionSuccess(result)}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '← Back to curated practice' }));
    expect(go).toHaveBeenCalledWith('practice', HVP_CURATED_PRACTICE_ID);
  });

  it('returns an integrity failure to the canonical curated-practice landing route', () => {
    const registryResult = buildDraftOnlyHvpRegistry();
    if (!registryResult.ok) throw new Error('HVP registry should build');
    const go = vi.fn();
    render(
      <HvpPracticeResults
        go={go}
        registry={registryResult.value}
        resultResult={sessionFailure(sessionIssue(
          'PILOT_RESULT_INCOMPATIBLE',
          'Result integrity failed.',
        ))}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Return to curated practice' }));
    expect(go).toHaveBeenCalledWith('practice', HVP_CURATED_PRACTICE_ID);
  });
});
