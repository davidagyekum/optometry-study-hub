// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudyApp from '@/app/StudyApp';

describe('Ocular Adnexa curated experience', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT', 'false');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE', 'false');
    vi.stubEnv(
      'NEXT_PUBLIC_ENABLE_OCULAR_ADNEXA_CURATED_PRACTICE',
      'true',
    );
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
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('shows the generic study entry with curated practice as the only new assessment', () => {
    window.history.replaceState({}, '', '/study/ocular-adnexa');
    render(<StudyApp />);
    expect(screen.getByRole('heading', {
      name: 'Curated slide-aligned practice',
    })).toBeInTheDocument();
    expect(screen.queryByRole('button', {
      name: 'Start 50-question quiz',
    })).not.toBeInTheDocument();
    expect(screen.getByRole('button', {
      name: 'Open curated practice',
    })).toBeInTheDocument();
  });

  it('opens curated practice from the study-page entry', async () => {
    window.history.replaceState({}, '', '/study/ocular-adnexa');
    render(<StudyApp />);
    fireEvent.click(screen.getByRole('button', {
      name: 'Open curated practice',
    }));
    expect(await screen.findByRole('heading', {
      name: 'Curated slide-aligned practice',
    }, { timeout: 5_000 })).toBeInTheDocument();
    expect(window.location.pathname).toBe(
      '/practice/ocular-adnexa-curated',
    );
  });
  it('loads the generic route lazily and starts a valid Quick 10 session', async () => {
    window.history.replaceState({}, '', '/practice/ocular-adnexa-curated');
    render(<StudyApp />);
    expect(await screen.findByRole('heading', {
      name: 'Curated slide-aligned practice',
    }, { timeout: 5_000 })).toBeInTheDocument();
    expect(screen.getByText('Question pool').nextSibling).toHaveTextContent('80');
    fireEvent.click(screen.getByRole('button', { name: /Quick practice/i }));
    expect(await screen.findByText(
      /Question 1 of 10/,
      {},
      { timeout: 5_000 },
    )).toBeInTheDocument();
  });

  it('fails closed without importing the learner experience when disabled', () => {
    vi.stubEnv(
      'NEXT_PUBLIC_ENABLE_OCULAR_ADNEXA_CURATED_PRACTICE',
      'false',
    );
    window.history.replaceState({}, '', '/practice/ocular-adnexa-curated');
    render(<StudyApp />);
    expect(screen.getByRole('heading', {
      name: 'Curated practice unavailable',
    })).toBeInTheDocument();
    expect(screen.queryByText(
      'A clinician describes the opening exposed between the upper and lower eyelids.',
    )).not.toBeInTheDocument();
  });
});
