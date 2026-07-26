// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { AssessmentPilotSession } from '@/components/assessment/pilot/AssessmentPilotSession';
import { AQUEOUS_PILOT_BLUEPRINT_ID } from '@/lib/assessment/pilot/config';
import { sessionSuccess } from '@/lib/assessment/session/errors';
import { makeAttempt, makeDraftRegistry } from '@/tests/fixtures/session-engine';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe('AssessmentPilotSession', () => {
  it('shows stateful navigation, flags, save/exit and submission counts', () => {
    const registry = makeDraftRegistry();
    const base = makeAttempt(undefined, {
      blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
      initializeDraftResponses: true,
    });
    const attempt = {
      ...base,
      draftResponses: {
        [base.orderedQuestionIds[0]]: {
          format: registry.get(base.orderedQuestionIds[0])?.format === 'short_answer'
            ? 'short_answer' as const
            : 'open_response' as const,
          text: '',
        },
      },
      flags: [base.orderedQuestionIds[1]],
    };
    const go = vi.fn();
    const toggle = vi.fn(() => sessionSuccess(attempt));
    render(
      <AssessmentPilotSession
        attemptResult={sessionSuccess(attempt)}
        go={go}
        onClear={vi.fn(() => sessionSuccess(attempt))}
        onDiscard={vi.fn(() => sessionSuccess(undefined))}
        onMove={vi.fn(() => sessionSuccess(attempt))}
        onSubmit={vi.fn(() => sessionSuccess({
          id: 'result-test',
          attemptId: attempt.id,
          courseId: attempt.courseId,
          moduleId: attempt.moduleId,
          submittedAt: '2026-07-26T10:00:00.000Z',
          orderedQuestionIds: attempt.orderedQuestionIds,
          questionVersions: attempt.questionVersions,
          responses: {},
          score: 0,
          maxScore: 9,
        }))}
        onToggleFlag={toggle}
        onUpdateDraft={vi.fn(() => sessionSuccess(attempt))}
        registry={registry}
      />,
    );
    expect(screen.getByText(/1 in progress/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Question 2, unanswered, flagged/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Flag question|Unflag question/ }));
    expect(toggle).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save and exit' }));
    expect(go).toHaveBeenCalledWith('pilot', 'aqueous-vitreous');
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByRole('heading', { name: 'Review before submission' })).toBeInTheDocument();
    expect(screen.getByText(/Incomplete drafts will be treated as unanswered/i)).toBeInTheDocument();
  });
});
