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
import { moduleMap } from '@/content/legacy/moduleCatalog';
import { curatedExperienceSummaries } from '@/lib/assessment/curated/experienceRegistry';
import { createAttempt } from '@/lib/legacy/attempts';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { STORAGE_KEY } from '@/lib/storage/keys';
import { loadStore, saveStore } from '@/lib/storage/store';

const curatedFlags = [
  'NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE',
  'NEXT_PUBLIC_ENABLE_TISSUE_FOUNDATIONS_CURATED_PRACTICE',
  'NEXT_PUBLIC_ENABLE_OCULAR_ADNEXA_CURATED_PRACTICE',
  'NEXT_PUBLIC_ENABLE_AQUEOUS_VITREOUS_CURATED_PRACTICE',
  'NEXT_PUBLIC_ENABLE_BLOOD_SUPPLY_CURATED_PRACTICE',
  'NEXT_PUBLIC_ENABLE_ENVIRONMENTAL_VISION_CURATED_PRACTICE',
  'NEXT_PUBLIC_ENABLE_AUTONOMIC_PHARMACOLOGY_CURATED_PRACTICE',
  'NEXT_PUBLIC_ENABLE_SYSTEMIC_PATHOLOGY_CURATED_PRACTICE',
] as const;

describe('hard curated learner-path cutover', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubEnv('NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT', 'false');
    curatedFlags.forEach((flag) => vi.stubEnv(flag, 'true'));
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

  it('uses curated practice as the only new assessment action across all eight module cards', () => {
    const store = createEmptyStoreV2();
    const summaries = curatedExperienceSummaries();
    render(
      <>
        {courses.map((course) => (
          <CourseView
            clearCourse={vi.fn()}
            clearModule={vi.fn()}
            course={course}
            curatedExperiences={summaries}
            go={vi.fn()}
            key={course.id}
            store={store}
          />
        ))}
      </>,
    );

    expect(screen.getAllByRole('button', { name: 'Practice this module' }))
      .toHaveLength(8);
    expect(document.body.textContent).not.toMatch(
      /Start legacy quiz|Start 50-question quiz|Take the quiz|Retake shuffled quiz/,
    );
    expect(screen.queryByText(/^Latest$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Best$/)).not.toBeInTheDocument();
  });

  it('does not create or rewrite storage when a retired quiz route is opened directly', () => {
    const store = createEmptyStoreV2();
    expect(saveStore(store, window.localStorage)).toBe(true);
    const before = window.localStorage.getItem(STORAGE_KEY);
    window.history.replaceState({}, '', '/quiz/environmental-vision');

    render(<StudyApp />);

    expect(screen.getByRole('heading', { name: 'Previous quiz path retired' }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open curated practice' }))
      .toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Start quiz/i }))
      .not.toBeInTheDocument();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(before);
  });

  it('still resumes and submits an active previous attempt without offering restart', async () => {
    const studyModule = moduleMap.get('environmental-vision');
    if (!studyModule) throw new Error('Environmental Vision module missing');
    const store = createEmptyStoreV2();
    store.active[studyModule.id] = createAttempt(studyModule, () => 0, () => new Date(0));
    expect(saveStore(store, window.localStorage)).toBe(true);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    window.history.replaceState({}, '', `/quiz/${studyModule.id}`);

    render(<StudyApp />);

    expect(await screen.findByRole('region', { name: 'Previous 50-question quiz' }))
      .toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restart' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit quiz now' }));

    expect(await screen.findByText('PREVIOUS QUIZ RESULT')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Answer review' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Practice this module' }))
      .toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retake/i })).not.toBeInTheDocument();
    await waitFor(() => {
      const persisted = loadStore(window.localStorage);
      expect(persisted.active[studyModule.id]).toBeUndefined();
      expect(persisted.results[studyModule.id]).toHaveLength(1);
    });
  });

  it('uses neutral course-aligned runtime status without changing internal review claims', () => {
    const summaries = curatedExperienceSummaries();
    expect(summaries).toHaveLength(8);
    summaries.forEach((summary) => {
      expect(summary.releaseStatus.title).toBe('Course-aligned practice');
      expect(summary.releaseStatus.lines).toEqual([
        'Built from the supplied course materials.',
        'Progress is stored on this device.',
      ]);
    });
    expect(JSON.stringify(summaries)).not.toMatch(/lecturer-approved/i);
  });
});
