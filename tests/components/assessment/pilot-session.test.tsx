// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
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
    attemptResult: sessionSuccess(attempt),
    go: vi.fn(),
    onClear: vi.fn(() => sessionSuccess(attempt)),
    onDiscard: vi.fn(() => sessionSuccess(undefined)),
    onMove: vi.fn(() => sessionSuccess(attempt)),
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
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText(/Incomplete drafts will be treated as unanswered/i)).toBeInTheDocument();
  });

  it('focuses submission review, supports keyboard activation, and restores Submit focus', async () => {
    matchMedia(false);
    const user = userEvent.setup();
    renderSession();
    const submit = screen.getByRole('button', { name: 'Submit' });
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
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Submit pilot' }));
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Storage refused the update.');
    expect(alert).toHaveTextContent('INVALID_STORE');
    expect(screen.getByRole('heading', { name: 'Review before submission' })).toBeInTheDocument();
  });

  it('does not navigate when discarding an incompatible attempt fails', () => {
    matchMedia(false);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { registry, attempt } = pilotFixture();
    const incompatible = { ...attempt, mode: 'exam' as const };
    const go = vi.fn();
    renderSession({
      attemptResult: sessionSuccess(incompatible),
      registry,
      go,
      onDiscard: vi.fn(() => sessionFailure(sessionIssue('INVALID_STORE', 'Removal failed.'))),
    });
    fireEvent.click(screen.getByRole('button', { name: 'Discard saved attempt' }));
    expect(go).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Removal failed.');
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
        go={vi.fn()}
        onRestart={() => sessionSuccess(attempt)}
        onStart={onStart}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Start pilot' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Start failed.');
    fireEvent.click(screen.getByRole('button', { name: 'Start pilot' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});