// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PracticeHub } from '@/components/practice/PracticeHub';
import { CuratedProgressPanel } from '@/components/progress/CuratedProgressPanel';
import { createCuratedExperienceRegistry } from '@/lib/assessment/curated/experienceRegistry';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import {
  dummyCuratedSummary,
  makeDummyCuratedExperience,
} from '@/tests/fixtures/assessment/dummyCuratedExperience';

afterEach(cleanup);

describe('generic curated Practice Hub discovery', () => {
  it('represents a synthetic registered experience without an HVP branch', async () => {
    const store = createEmptyStoreV2();
    store.assessment.activeAttempts['dummy-active'] = {
      id: 'dummy-active',
      blueprintId: 'dummy-automatic-v1',
    } as never;
    const registry = createCuratedExperienceRegistry([
      makeDummyCuratedExperience(),
    ]);
    render(
      <PracticeHub
        curatedExperiences={[dummyCuratedSummary]}
        curatedPanel={(
          <CuratedProgressPanel
            experienceId="dummy-curated"
            go={vi.fn()}
            registry={registry}
            store={store}
            variant="summary"
          />
        )}
        curatedResumePanel={<article>Dummy resumable session</article>}
        go={vi.fn()}
        store={store}
      />,
    );
    expect(screen.getByRole('heading', {
      name: 'Resume active sessions',
    })).toBeInTheDocument();
    expect(screen.getByText('Dummy resumable session')).toBeInTheDocument();
    expect(screen.getByRole('heading', {
      name: 'Curated practice',
    })).toBeInTheDocument();
    expect(await screen.findByText('Current question mastery')).toBeInTheDocument();
  });

  it('discloses disabled curated data while another experience remains enabled', () => {
    const store = createEmptyStoreV2();
    store.assessment.activeAttempts['dummy-active'] = {
      id: 'dummy-active',
      blueprintId: 'dummy-automatic-v1',
    } as never;
    const enabledHvp = {
      ...dummyCuratedSummary,
      experienceId: 'human-visual-perception',
      courseId: 'human-visual-perception',
      moduleId: 'human-visual-perception',
      routeSegment: 'human-visual-perception-curated',
      blueprintIds: ['opt374-hvp-curated-v1'],
      enabled: true,
    };
    render(
      <PracticeHub
        allCuratedExperiences={[
          enabledHvp,
          { ...dummyCuratedSummary, enabled: false },
        ]}
        curatedExperiences={[enabledHvp]}
        go={vi.fn()}
        store={store}
      />,
    );
    expect(screen.getByText(/currently disabled curated module remains on this device/i))
      .toBeInTheDocument();
  });
});
