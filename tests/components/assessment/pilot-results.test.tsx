// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssessmentPilotResults } from '@/components/assessment/pilot/AssessmentPilotResults';
import { finalizeGradedAssessmentAttempt } from '@/lib/assessment/grading/finalizeGradedAttempt';
import { sessionSuccess } from '@/lib/assessment/session/errors';
import { addCorrectResponses } from '@/tests/fixtures/grading';
import { makeAttempt, makeDraftRegistry } from '@/tests/fixtures/session-engine';

afterEach(cleanup);

describe('AssessmentPilotResults', () => {
  it('shows manual-required summary, all review cards, explanations and related notes', () => {
    const registry = makeDraftRegistry();
    const attempt = addCorrectResponses(makeAttempt(), registry, true);
    const finalized = finalizeGradedAssessmentAttempt({
      attempt,
      registry,
      now: () => new Date('2026-07-26T10:30:00.000Z'),
      idFactory: () => 'result-pilot-ui',
    });
    if (!finalized.ok) throw new Error('graded fixture should finalize');
    render(
      <AssessmentPilotResults
        go={vi.fn()}
        registry={registry}
        resultResult={sessionSuccess(finalized.value.result)}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Manual review required' })).toBeInTheDocument();
    expect(screen.getByText(/Automatic subtotal:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Question \d/)).toHaveLength(9);
    expect(screen.getAllByText('Review related notes')).toHaveLength(9);
  });

  it('renders an integrity state for a corrupted grading snapshot', () => {
    const registry = makeDraftRegistry();
    const attempt = addCorrectResponses(makeAttempt(), registry);
    const finalized = finalizeGradedAssessmentAttempt({
      attempt,
      registry,
      idFactory: () => 'result-corrupt-ui',
    });
    if (!finalized.ok) throw new Error('graded fixture should finalize');
    const corrupted = {
      ...finalized.value.result,
      grading: finalized.value.result.grading
        ? { ...finalized.value.result.grading, correctCount: 0 }
        : undefined,
    };
    render(
      <AssessmentPilotResults
        go={vi.fn()}
        registry={registry}
        resultResult={sessionSuccess(corrupted)}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Assessment result integrity check failed' })).toBeInTheDocument();
    expect(screen.getByText(/No score has been fabricated/i)).toBeInTheDocument();
  });
});
