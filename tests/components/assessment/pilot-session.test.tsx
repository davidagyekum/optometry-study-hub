// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ControlledAssessmentSession } from '@/components/assessment/controlled/ControlledAssessmentSession';
import { AssessmentPilotLanding } from '@/components/assessment/pilot/AssessmentPilotLanding';
import { AssessmentPilotSession } from '@/components/assessment/pilot/AssessmentPilotSession';
import { AQUEOUS_PILOT_BLUEPRINT_ID } from '@/lib/assessment/pilot/config';
import { sessionFailure, sessionIssue, sessionSuccess } from '@/lib/assessment/session/errors';
import { makeAttempt, makeDraftRegistry, makeResult } from '@/tests/fixtures/session-engine';

const scrollSpy = vi.fn();

beforeAll(() => {
  Element.prototype.scrollIntoView = scrollSpy;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  scrollSpy.mockClear();
});

function matchMedia(reduced: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: vi.fn(() => ({
      matches: reduced,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function pilotFixture() {
  const registry = makeDraftRegistry();
  const attempt = makeAttempt(undefined, {
    blueprintId: AQUEOUS_PILOT_BLUEPRINT_ID,
    initializeDraftResponses: true,
  });
  return { registry, attempt };
}

function renderSession(overrides: Partial<React.ComponentProps<typeof AssessmentPilotSession>> = {}) {
  const { registry, attempt } = pilotFixture();
  const props: React.ComponentProps<typeof AssessmentPilotSession> = {
    attemptSelection: { candidates: [attempt], compatibleAttempt: attempt, issues: [] },
    go: vi.fn(),
    onClear: vi.fn(() => sessionSuccess(attempt)),
    onDiscard: vi.fn(() => sessionSuccess(undefined)),
    onMove: vi.fn(() => sessionSuccess(attempt)),
    onReplace: vi.fn(() => sessionSuccess(attempt)),
    onSubmit: vi.fn(() => sessionSuccess(makeResult(attempt))),
    onToggleFlag: vi.fn(() => sessionSuccess(attempt)),
    onUpdateDraft: vi.fn(() => sessionSuccess(attempt)),
    registry,
    ...overrides,
  };
  return { ...render(<AssessmentPilotSession {...props} />), props, attempt, registry };
}

describe('AssessmentPilotSession', () => {
  it('shows navigation, flags, save/exit and submission counts', () => {
    matchMedia(false);
    const { props } = renderSession();
    expect(screen.getByRole('button', { name: /Question 2, unanswered/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Flag question|Unflag question/ }));
    expect(props.onToggleFlag).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Save and exit' }));
    expect(props.go).toHaveBeenCalledWith('pilot', 'aqueous-vitreous');
    fireEvent.click(screen.getByRole('button', { name: 'Review & submit' }));
    expect(screen.getByText(/Incomplete drafts will be treated as unanswered/i)).toBeInTheDocument();
  });

  it('keeps a final answer in the immediate submission review and shows a clear final action', () => {
    matchMedia(false);
    const { registry, attempt } = pilotFixture();
    const questionId = attempt.orderedQuestionIds.find(
      (id) => registry.get(id)?.format === 'single_best_answer',
    );
    if (!questionId) throw new Error('Expected a single-best-answer pilot question.');
    const question = registry.get(questionId);
    if (!question || question.format !== 'single_best_answer') {
      throw new Error('Expected a single-best-answer pilot question.');
    }
    const optionId = question.options[0].id;
    const finalAttempt = {
      ...attempt,
      orderedQuestionIds: [
        ...attempt.orderedQuestionIds.filter((id) => id !== questionId),
        questionId,
      ],
      currentIndex: attempt.orderedQuestionIds.length - 1,
    };
    const updatedAttempt = {
      ...finalAttempt,
      draftResponses: {
        ...finalAttempt.draftResponses,
        [questionId]: { format: 'single_best_answer' as const, optionId },
      },
      responses: {
        ...finalAttempt.responses,
        [questionId]: { format: 'single_best_answer' as const, optionId },
      },
    };
    const onUpdateDraft = vi.fn(() => sessionSuccess(updatedAttempt));
    const onSubmit = vi.fn(() => sessionSuccess(makeResult(updatedAttempt)));

    renderSession({
      attemptSelection: {
        candidates: [finalAttempt],
        compatibleAttempt: finalAttempt,
        issues: [],
      },
      onSubmit,
      onUpdateDraft,
      registry,
    });

    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    const reviewButton = screen.getByRole('button', { name: 'Review & submit' });
    expect(reviewButton).toHaveClass('pilot-submit-button');
    fireEvent.click(screen.getByRole('radio', { name: question.options[0].text }));
    fireEvent.click(reviewButton);

    const summary = screen.getByRole('region', { name: 'Review before submission' });
    expect(summary).toHaveTextContent(/Answered\s*1/);
    expect(summary).toHaveTextContent(
      new RegExp(`Unanswered\\s*${finalAttempt.orderedQuestionIds.length - 1}`),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit pilot' }));
    expect(onSubmit).toHaveBeenCalledWith(finalAttempt.id);
  });

  it('focuses submission review, supports keyboard activation, and restores Submit focus', async () => {
    matchMedia(false);
    const user = userEvent.setup();
    renderSession();
    const submit = screen.getByRole('button', { name: 'Review & submit' });
    submit.focus();
    await user.keyboard('{Enter}');
    const heading = screen.getByRole('heading', { name: 'Review before submission' });
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(heading).toHaveFocus();
    const continueButton = screen.getByRole('button', { name: 'Continue working' });
    continueButton.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(submit).toHaveFocus());
  });

  it.each([
    [true, 'auto'],
    [false, 'smooth'],
  ] as const)('uses %s reduced-motion preference for %s scrolling', (reduced, behavior) => {
    matchMedia(reduced);
    renderSession();
    expect(scrollSpy).toHaveBeenCalledWith({ block: 'start', behavior });
  });

  it('shows submission failures in a controller alert and preserves the session', async () => {
    matchMedia(false);
    const failure = sessionFailure(sessionIssue('INVALID_STORE', 'Storage refused the update.'));
    renderSession({ onSubmit: vi.fn(() => failure) });
    fireEvent.click(screen.getByRole('button', { name: 'Review & submit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit pilot' }));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Storage refused the update.');
    expect(alert).toHaveTextContent('INVALID_STORE');
    expect(screen.getByRole('heading', { name: 'Review before submission' })).toBeInTheDocument();
  });

  it('uses the configured experience name in shared recovery navigation', () => {
    const { registry, attempt } = pilotFixture();
    render(
      <ControlledAssessmentSession
        attemptSelection={{
          candidates: [{ ...attempt, mode: 'exam' }],
          issues: [sessionIssue('PILOT_MODE_MISMATCH', 'Mode mismatch.')],
        }}
        experience={{
          warning: null,
          landingView: 'practice',
          landingResourceId: 'human-visual-perception-curated',
          experienceName: 'curated practice',
          contextDescription: 'Curated practice context.',
        }}
        go={vi.fn()}
        onClear={() => sessionSuccess(attempt)}
        onDiscard={() => sessionSuccess(undefined)}
        onMove={() => sessionSuccess(attempt)}
        onReplace={() => sessionSuccess(attempt)}
        onSubmit={() => sessionSuccess(makeResult(attempt))}
        onToggleFlag={() => sessionSuccess(attempt)}
        onUpdateDraft={() => sessionSuccess(attempt)}
        registry={registry}
      />,
    );
    expect(screen.getByRole('button', { name: 'Return to curated practice' }))
      .toBeInTheDocument();
  });

  it('does not navigate when discarding an incompatible attempt fails', () => {
    matchMedia(false);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { registry, attempt } = pilotFixture();
    const incompatible = { ...attempt, mode: 'exam' as const };
    const go = vi.fn();
    renderSession({
      attemptSelection: {
        candidates: [incompatible],
        issues: [sessionIssue('PILOT_MODE_MISMATCH', 'Mode mismatch.')],
      },
      registry,
      go,
      onDiscard: vi.fn(() => sessionFailure(sessionIssue('INVALID_STORE', 'Removal failed.'))),
    });
    expect(screen.getByRole('button', { name: 'Return to pilot' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Discard saved attempt' }));
    expect(go).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Removal failed.');
  });

  it('routes draft validation beside its question, scopes it across navigation, and clears it on retry', () => {
    matchMedia(false);
    const { attempt } = pilotFixture();
    const questionId = 'aqueous-iop-short-answer-001';
    const focusedAttempt = {
      ...attempt,
      currentIndex: attempt.orderedQuestionIds.indexOf(questionId),
    };
    const onUpdateDraft = vi.fn()
      .mockReturnValueOnce(sessionFailure(sessionIssue(
        'DRAFT_FORMAT_MISMATCH',
        'Answer format needs attention.',
        { questionId },
      )))
      .mockReturnValueOnce(sessionSuccess(focusedAttempt));
    renderSession({
      attemptSelection: {
        candidates: [focusedAttempt],
        compatibleAttempt: focusedAttempt,
        issues: [],
      },
      onUpdateDraft,
    });
    const input = screen.getByRole('textbox', { name: 'Your answer' });
    fireEvent.change(input, { target: { value: 'first' } });
    const validation = screen.getByText('Answer format needs attention.');
    expect(validation).toHaveAttribute('id', `${questionId}-validation`);
    expect(input.closest('fieldset')).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining(`${questionId}-validation`),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.queryByText('Answer format needs attention.')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'second' } });
    expect(screen.queryByText('Answer format needs attention.')).not.toBeInTheDocument();
  });

  it.each([
    ['INVALID_STORE', 'Autosave storage failed.'],
    ['QUESTION_VERSION_MISMATCH', 'Question version changed.'],
  ] as const)('routes %s autosave failures to the session alert', (code, message) => {
    matchMedia(false);
    const { attempt } = pilotFixture();
    const questionId = 'aqueous-iop-short-answer-001';
    const focusedAttempt = {
      ...attempt,
      currentIndex: attempt.orderedQuestionIds.indexOf(questionId),
    };
    renderSession({
      attemptSelection: {
        candidates: [focusedAttempt],
        compatibleAttempt: focusedAttempt,
        issues: [],
      },
      onUpdateDraft: vi.fn(() => sessionFailure(sessionIssue(code, message, {
        questionId,
      }))),
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Your answer' }), {
      target: { value: 'answer' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByText(message, { selector: '.assessment-validation' }))
      .not.toBeInTheDocument();
  });
});

describe('AssessmentPilotLanding action failures', () => {
  it('shows a start failure and clears it after a later successful operation', () => {
    const { attempt } = pilotFixture();
    const onStart = vi.fn()
      .mockReturnValueOnce(sessionFailure(sessionIssue('INVALID_STORE', 'Start failed.')))
      .mockReturnValueOnce(sessionSuccess(attempt));
    render(
      <AssessmentPilotLanding
        attemptSelection={{ candidates: [], issues: [] }}
        go={vi.fn()}
        onDiscardCandidates={() => sessionSuccess(undefined)}
        onReplaceCandidates={() => sessionSuccess(attempt)}
        onRestart={() => sessionSuccess(attempt)}
        onStart={onStart}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start pilot' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Start failed.');
    fireEvent.click(screen.getByRole('button', { name: 'Start pilot' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('offers confirmed recovery for an incompatible landing candidate', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { attempt } = pilotFixture();
    const incompatible = { ...attempt, mode: 'exam' as const };
    const onDiscardCandidates = vi.fn(() => sessionSuccess(undefined));
    render(
      <AssessmentPilotLanding
        attemptSelection={{
          candidates: [incompatible],
          issues: [sessionIssue('PILOT_MODE_MISMATCH', 'Mode mismatch.')],
        }}
        go={vi.fn()}
        onDiscardCandidates={onDiscardCandidates}
        onReplaceCandidates={() => sessionSuccess(attempt)}
        onRestart={() => sessionSuccess(attempt)}
        onStart={() => sessionSuccess(attempt)}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Start pilot' })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Mode mismatch.');
    fireEvent.click(screen.getByRole('button', { name: 'Discard saved pilot' }));
    expect(onDiscardCandidates).toHaveBeenCalledWith([incompatible.id]);
  });

  it('updates landing issues when the selected candidate input changes', async () => {
    const { attempt } = pilotFixture();
    const props = {
      go: vi.fn(),
      onDiscardCandidates: vi.fn(() => sessionSuccess(undefined)),
      onReplaceCandidates: vi.fn(() => sessionSuccess(attempt)),
      onRestart: vi.fn(() => sessionSuccess(attempt)),
      onStart: vi.fn(() => sessionSuccess(attempt)),
    };
    const rendered = render(
      <AssessmentPilotLanding
        {...props}
        attemptSelection={{
          candidates: [{ ...attempt, mode: 'exam' }],
          issues: [sessionIssue('PILOT_MODE_MISMATCH', 'Old issue.')],
        }}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Old issue.');
    rendered.rerender(
      <AssessmentPilotLanding
        {...props}
        attemptSelection={{
          candidates: [{ ...attempt, mode: 'exam' }],
          issues: [sessionIssue('PILOT_POLICY_MISMATCH', 'Updated issue.')],
        }}
      />,
    );
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Updated issue.'));
  });
});
