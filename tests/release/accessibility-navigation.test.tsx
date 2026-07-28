// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudyApp from '@/app/StudyApp';
import { useClientRoute } from '@/hooks/useClientRoute';

function FocusHarness() {
  const { route, go } = useClientRoute();
  const [answer, setAnswer] = useState('');
  return (
    <>
      <button onClick={() => go('practice-hub')} type="button">Navigate</button>
      <main id="main-content" tabIndex={-1}>
        <h1>{route.view}</h1>
        <label>
          Draft answer
          <input value={answer} onChange={(event) => setAnswer(event.target.value)} />
        </label>
      </main>
    </>
  );
}

describe('release accessibility and navigation focus', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    window.localStorage.clear();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('provides a skip link and stable semantic landmarks', () => {
    render(<StudyApp />);
    expect(screen.getByRole('link', { name: 'Skip to main content' }))
      .toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' }))
      .toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(document.title).toBe('Optometry Study Hub');
  });

  it('focuses main content after client navigation and browser history changes', () => {
    render(<FocusHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));
    expect(screen.getByRole('main')).toHaveFocus();
    expect(window.location.pathname).toBe('/practice');

    window.history.pushState({}, '', '/progress');
    act(() => window.dispatchEvent(new PopStateEvent('popstate')));
    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'progress' })).toBeInTheDocument();
  });

  it('does not steal focus during answer-field state updates', () => {
    render(<FocusHarness />);
    const input = screen.getByRole('textbox', { name: 'Draft answer' });
    input.focus();
    fireEvent.change(input, { target: { value: 'Retinal ganglion cell' } });
    expect(input).toHaveFocus();
    expect(input).toHaveValue('Retinal ganglion cell');
  });
});
