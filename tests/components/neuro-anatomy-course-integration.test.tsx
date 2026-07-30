// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StudyApp from '@/app/StudyApp';
import { CourseView } from '@/components/course/CourseView';
import { courses } from '@/content/legacy/courseCatalog';
import { curatedExperienceSummaries } from '@/lib/assessment/curated/experienceRegistry';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { loadStore, saveStore } from '@/lib/storage/store';

const neuroFlags = [
  'NEXT_PUBLIC_ENABLE_TISSUE_FOUNDATIONS_CURATED_PRACTICE',
  'NEXT_PUBLIC_ENABLE_OCULAR_ADNEXA_CURATED_PRACTICE',
  'NEXT_PUBLIC_ENABLE_AQUEOUS_VITREOUS_CURATED_PRACTICE',
  'NEXT_PUBLIC_ENABLE_BLOOD_SUPPLY_CURATED_PRACTICE',
] as const;

const neuroCourse = courses.find((course) => course.id === 'neuro-anatomy');
if (!neuroCourse) throw new Error('Neuro Anatomy course is missing.');

describe('Neuro Anatomy course integration UI', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT', 'false');
    vi.stubEnv('NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE', 'false');
    neuroFlags.forEach((flag) => vi.stubEnv(flag, 'true'));
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('shows the exact four-module curated availability at course level', () => {
    render(
      <CourseView
        clearCourse={vi.fn()}
        clearModule={vi.fn()}
        course={neuroCourse}
        curatedExperiences={curatedExperienceSummaries()}
        go={vi.fn()}
        startQuiz={vi.fn()}
        store={createEmptyStoreV2()}
      />,
    );

    expect(screen.getByRole('heading', {
      name: 'Curated modules enabled: 4 of 4',
      level: 2,
    })).toBeInTheDocument();
    expect(screen.getByText(
      /Curated results and mastery evidence remain separate for each module/,
    )).toBeInTheDocument();
  });

  it('requires confirmation and clears only Neuro Anatomy browser-local data', async () => {
    const initial = createEmptyStoreV2();
    initial.read = {
      'tissue-foundations': ['tissue-nervous'],
      'ocular-adnexa': ['landmarks'],
      'aqueous-vitreous': ['flow'],
      'blood-supply': ['retinal'],
      'human-visual-perception': ['hvp-foundations'],
    };
    expect(saveStore(initial, window.localStorage)).toBe(true);
    const confirm = vi.spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    window.history.replaceState({}, '', '/course/neuro-anatomy');
    render(<StudyApp />);

    const reset = screen.getByRole('button', {
      name: `Clear ${neuroCourse.title}`,
    });
    fireEvent.click(reset);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm.mock.calls[0][0]).toContain(
      `saved controlled-practice attempts and results for ${neuroCourse.title}`,
    );
    expect(loadStore(window.localStorage).read['tissue-foundations'])
      .toEqual(['tissue-nervous']);

    fireEvent.click(reset);
    expect(confirm).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      const persisted = loadStore(window.localStorage);
      neuroCourse.moduleIds.forEach((moduleId) => {
        expect(persisted.read[moduleId]).toEqual([]);
      });
      expect(persisted.read['human-visual-perception'])
        .toEqual(['hvp-foundations']);
    });
  });
});
