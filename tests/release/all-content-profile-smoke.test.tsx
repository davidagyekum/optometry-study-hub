// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudyApp from '@/app/StudyApp';
import { courses } from '@/content/legacy/courseCatalog';
import { modules } from '@/content/legacy/moduleCatalog';
import { enabledCuratedExperienceSummaries } from '@/lib/assessment/curated/experienceRegistry';
import { isAssessmentPilotEnabled } from '@/lib/assessment/pilot/config';

const describeAllContent = process.env.OPTOMETRY_RELEASE_PROFILE === 'all-course-content-public'
  ? describe
  : describe.skip;

describeAllContent('all-course-content production profile smoke', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
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

  it('exposes the exact 6/15/90 library and 15 controlled experiences', () => {
    expect(process.env.OPTOMETRY_RELEASE_PROFILE).toBe('all-course-content-public');
    expect(courses).toHaveLength(6);
    expect(modules).toHaveLength(15);
    expect(modules.reduce((total, module) => total + module.sections.length, 0)).toBe(90);
    expect(enabledCuratedExperienceSummaries()).toHaveLength(15);
    expect(isAssessmentPilotEnabled()).toBe(false);

    const hvp = courses.find((course) => course.id === 'human-visual-perception');
    const dispensing = courses.find((course) => course.id === 'dispensing-optics-ii');
    expect(hvp?.moduleIds).toEqual([
      'human-visual-perception',
      'hvp-depth-perception',
      'hvp-colour-perception',
    ]);
    expect(dispensing?.moduleIds).toEqual([
      'schematic-eye-refractive-states',
      'multifocal-foundations',
      'progressive-addition-lenses',
      'pd-and-dispensing',
      'special-lenses',
    ]);
  });

  it('renders the production homepage with six courses and 1,240 questions', () => {
    render(<StudyApp />);
    expect(document.querySelectorAll('.course-card')).toHaveLength(6);
    expect(screen.getByText(/1,240 draft course-aligned questions/i)).toBeInTheDocument();
  });

  it('renders three HVP modules and five Dispensing modules', () => {
    window.history.replaceState({}, '', '/course/human-visual-perception');
    const { unmount } = render(<StudyApp />);
    expect(document.querySelectorAll('.module-card')).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'Depth Perception' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Colour Perception' })).toBeInTheDocument();
    unmount();

    window.history.replaceState({}, '', '/course/dispensing-optics-ii');
    render(<StudyApp />);
    expect(document.querySelectorAll('.module-card')).toHaveLength(5);
    expect(screen.getAllByRole('button', { name: 'Practice this module' })).toHaveLength(5);
  });
});
