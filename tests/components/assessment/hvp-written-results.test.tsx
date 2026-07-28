// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HvpPracticeResults } from '@/components/assessment/hvp/HvpPracticeResults';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import {
  createHvpWrittenSelection,
  HVP_WRITTEN_BLUEPRINT_ID,
} from '@/lib/assessment/hvp/practiceBlueprint';
import { buildDraftOnlyHvpRegistry } from '@/lib/assessment/hvp/registry';
import { withStrategyEvidence } from '@/lib/assessment/practice/evidence';
import { createAssessmentAttempt } from '@/lib/assessment/session/createAttempt';

afterEach(cleanup);

describe('Written Practice result UI', () => {
  it.each([0, 1, 2] as const)('shows %i answered prompts without a percentage, numeric score, or scored breakdown', (answerCount) => {
    const built = buildDraftOnlyHvpRegistry();
    if (!built.ok) throw new Error('registry');
    const ids = built.value.questionIds().filter((id) => built.value.get(id)?.format === 'open_response').sort();
    const created = createAssessmentAttempt({
      registry: built.value,
      questionIds: ids,
      mode: 'study',
      courseId: 'human-visual-perception',
      moduleId: 'human-visual-perception',
      blueprintId: HVP_WRITTEN_BLUEPRINT_ID,
      practiceSelection: withStrategyEvidence(createHvpWrittenSelection('ui-unanswered'), ids),
      gradingPolicy: { id: 'diagnostic', version: 1 },
      allowedReviewStatuses: ['draft'],
      idFactory: () => 'attempt-written-ui',
    });
    if (!created.ok) throw new Error('attempt');
    ids.slice(0, answerCount).forEach((id) => {
      created.value.responses[id] = { format: 'open_response', text: `Response for ${id}` };
    });
    const finalized = finalizeGradedAssessmentAttempt({
      attempt: created.value,
      registry: built.value,
      idFactory: () => 'result-written-ui',
    });
    if (!finalized.ok) throw new Error('finalize');
    render(<HvpPracticeResults go={vi.fn()} registry={built.value} resultResult={{ ok: true, value: finalized.value.result }} />);
    expect(screen.getByRole('heading', { name: 'Written practice review' })).toBeInTheDocument();
    expect(screen.getByText('Manual review required')).toBeInTheDocument();
    expect(screen.queryByText('Curated practice result')).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*\/\s*\d+/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Not scored')).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: 'Practice-set breakdown' })).not.toBeInTheDocument();
  });
});
