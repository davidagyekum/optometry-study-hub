// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudyApp from '@/app/StudyApp';

describe('release feature-profile smoke', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT', 'false');
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

  it.each([
    ['/', 'Five courses.One focused study hub.'],
    ['/practice', 'Practice Hub'],
    ['/progress', 'Progress Hub'],
    ['/course/human-visual-perception', 'Human Visual Perception'],
    ['/study/human-visual-perception', 'Human Visual Perception'],
    ['/quiz/human-visual-perception', 'No active attempt'],
    ['/results/human-visual-perception', 'No submitted result yet'],
  ])('loads the disabled learner route %s', (path, heading) => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE', 'false');
    window.history.replaceState({}, '', path);
    render(<StudyApp />);
    expect(screen.getByRole('heading', { name: heading, level: 1 })).toBeInTheDocument();
  });

  it('keeps both controlled experiences unavailable in the disabled profile', () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE', 'false');
    window.history.replaceState({}, '', '/practice/human-visual-perception-curated');
    const { unmount } = render(<StudyApp />);
    expect(screen.getByRole('heading', { name: 'Curated practice unavailable' }))
      .toBeInTheDocument();
    unmount();

    window.history.replaceState({}, '', '/pilot/aqueous-vitreous');
    render(<StudyApp />);
    expect(screen.getByRole('heading', { name: 'Experimental assessment unavailable' }))
      .toBeInTheDocument();
  });

  it('loads the HVP landing lazily with release status while Aqueous stays unavailable', async () => {
    vi.stubEnv('NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE', 'true');
    window.history.replaceState({}, '', '/practice/human-visual-perception-curated');
    const { unmount } = render(<StudyApp />);
    expect(await screen.findByRole(
      'heading',
      { name: 'Curated slide-aligned practice' },
      { timeout: 5_000 },
    )).toBeInTheDocument();
    expect(screen.getByText('Not lecturer-approved examination items.'))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quick practice/i })).toBeInTheDocument();
    unmount();

    window.history.replaceState({}, '', '/pilot/aqueous-vitreous');
    render(<StudyApp />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Experimental assessment unavailable' }))
        .toBeInTheDocument();
    });
  });


  it.each(['/', '/practice', '/progress'])(
    'renders no HVP answer content on the enabled pre-practice route %s',
    async (path) => {
      vi.stubEnv('NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE', 'true');
      window.history.replaceState({}, '', path);
      const { unmount } = render(<StudyApp />);
      if (path !== '/') {
        await screen.findAllByRole(
          'heading',
          { name: 'Curated practice' },
          { timeout: 5_000 },
        );
      }
      const rendered = document.body.textContent ?? '';
      expect(rendered).not.toContain('Which statement best defines sensation?');
      expect(rendered).not.toContain(
        'Sensation is the immediate detection and neural encoding of physical stimulation',
      );
      expect(rendered).not.toContain('detect-and-encode');
      expect(rendered).not.toContain('This describes sensory registration.');
      unmount();
    },
  );
});
