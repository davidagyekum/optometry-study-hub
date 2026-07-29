// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProgressHub } from '@/components/progress/ProgressHub';
import { modules } from '@/content/legacy/moduleCatalog';
import { createCuratedExperienceRegistry } from '@/lib/assessment/curated/experienceRegistry';
import type {
  CuratedExperienceAdapter,
  CuratedProgressContribution,
} from '@/lib/assessment/curated/types';
import { createAttempt } from '@/lib/legacy/attempts';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import {
  dummyCuratedSummary,
  makeDummyCuratedExperience,
} from '@/tests/fixtures/assessment/dummyCuratedExperience';

afterEach(cleanup);

function contribution(
  experienceId: string,
  moduleId: string,
  title: string,
  priority: number,
  activityId: string,
): CuratedProgressContribution {
  return {
    experienceId,
    moduleId,
    recommendationCandidates: [{
      id: `${experienceId}-recommendation`,
      title,
      reason: 'Synthetic coordinator evidence.',
      priority,
      moduleId,
      destination: { view: 'practice', moduleId: experienceId },
    }],
    activity: [{
      id: activityId,
      kind: 'curated-completed',
      moduleId,
      timestamp: '2026-07-29T11:00:00.000Z',
      label: `${title} activity`,
      actionLabel: 'Review',
      destination: { view: 'practice', moduleId: experienceId },
    }],
    hasStoredData: true,
    integrityOmissionCount: 0,
  };
}

function adapter(
  base: CuratedExperienceAdapter,
  value: CuratedProgressContribution,
): CuratedExperienceAdapter {
  return {
    ...base,
    loadProgressModule: async () => ({
      ProgressPanel: () => null,
      getContribution: () => value,
    }),
  };
}

describe('global curated progress coordination', () => {
  it('selects and renders global evidence exactly once across two experiences', async () => {
    const store = createEmptyStoreV2();
    const active = createAttempt(modules[0], () => 0.25, () => (
      new Date('2026-07-29T10:00:00.000Z')
    ));
    store.active[modules[0].id] = active;
    const legacyId = `legacy-started:${active.id}`;
    const dummy = makeDummyCuratedExperience();
    const hvp = {
      ...makeDummyCuratedExperience(),
      summary: {
        ...dummyCuratedSummary,
        experienceId: 'human-visual-perception',
        courseId: 'human-visual-perception',
        moduleId: 'human-visual-perception',
        routeSegment: 'human-visual-perception-curated',
        blueprintIds: ['opt374-hvp-curated-v1'],
      },
    };
    const hvpContribution = contribution(
      'human-visual-perception',
      'human-visual-perception',
      'HVP next step',
      1,
      legacyId,
    );
    hvpContribution.activity.push({
      id: 'hvp-activity',
      kind: 'curated-completed',
      moduleId: 'human-visual-perception',
      timestamp: '2026-07-29T10:30:00.000Z',
      label: 'HVP next step activity',
      actionLabel: 'Review',
      destination: {
        view: 'practice',
        moduleId: 'human-visual-perception-curated',
      },
    });
    const registry = createCuratedExperienceRegistry([
      adapter(hvp, hvpContribution),
      adapter(dummy, contribution(
        'dummy-curated',
        'dummy-module',
        'Dummy next step',
        0,
        'dummy-activity',
      )),
    ]);

    const { container } = render(
      <ProgressHub
        allCuratedExperiences={registry.map((entry) => entry.summary)}
        curatedExperiences={registry.map((entry) => entry.summary)}
        curatedRegistry={registry}
        go={vi.fn()}
        store={store}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Dummy next step' }))
      .toBeInTheDocument();
    expect(screen.getAllByText('Recommended next step')).toHaveLength(1);
    await waitFor(() => {
      expect(screen.getByText('Dummy next step activity')).toBeInTheDocument();
    });
    expect(screen.getAllByText('Legacy quiz started')).toHaveLength(1);
    expect(screen.getByText('HVP next step activity')).toBeInTheDocument();
    expect(container.querySelectorAll('.activity-list > article').length).toBeLessThanOrEqual(8);
  });

  it('retains valid evidence and storage when another contribution fails', async () => {
    const store = createEmptyStoreV2();
    const before = structuredClone(store);
    const valid = makeDummyCuratedExperience({
      progressLoader: async () => ({
        ProgressPanel: () => null,
        getContribution: () => contribution(
          'dummy-curated',
          'dummy-module',
          'Valid next step',
          0,
          'valid-activity',
        ),
      }),
    });
    const failed = makeDummyCuratedExperience({
      progressLoader: async () => {
        throw new Error('temporary');
      },
    });
    failed.summary = {
      ...failed.summary,
      experienceId: 'failed-curated',
      moduleId: 'failed-module',
      routeSegment: 'failed-curated',
      blueprintIds: ['failed-v1'],
    };
    const registry = createCuratedExperienceRegistry([valid, failed]);
    render(
      <ProgressHub
        curatedExperiences={registry.map((entry) => entry.summary)}
        curatedRegistry={registry}
        go={vi.fn()}
        store={store}
      />,
    );
    expect(await screen.findByRole('heading', { name: 'Valid next step' }))
      .toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Some curated progress is temporarily unavailable',
    );
    expect(store).toEqual(before);
  });

  it('does not duplicate global panels when an adapter contributes no data', async () => {
    const populated = makeDummyCuratedExperience({
      progressLoader: async () => ({
        ProgressPanel: () => null,
        getContribution: () => contribution(
          'dummy-curated',
          'dummy-module',
          'Only curated recommendation',
          0,
          'only-curated-activity',
        ),
      }),
    });
    const empty = makeDummyCuratedExperience({
      progressLoader: async () => ({
        ProgressPanel: () => null,
        getContribution: () => ({
          experienceId: 'empty-curated',
          moduleId: 'empty-module',
          recommendationCandidates: [],
          activity: [],
          hasStoredData: false,
          integrityOmissionCount: 0,
        }),
      }),
    });
    empty.summary = {
      ...empty.summary,
      experienceId: 'empty-curated',
      moduleId: 'empty-module',
      routeSegment: 'empty-curated',
      blueprintIds: ['empty-v1'],
    };
    const registry = createCuratedExperienceRegistry([populated, empty]);
    const { container } = render(
      <ProgressHub
        curatedExperiences={registry.map((entry) => entry.summary)}
        curatedRegistry={registry}
        go={vi.fn()}
        store={createEmptyStoreV2()}
      />,
    );
    expect(await screen.findByRole('heading', {
      name: 'Only curated recommendation',
    })).toBeInTheDocument();
    expect(screen.getAllByText('Recommended next step')).toHaveLength(1);
    expect(container.querySelectorAll('.activity-list')).toHaveLength(1);
  });

  it('withholds global recommendation and activity until all contributions settle', async () => {
    const store = createEmptyStoreV2();
    const active = createAttempt(modules[0], () => 0.25, () => (
      new Date('2026-07-29T10:00:00.000Z')
    ));
    store.active[modules[0].id] = active;
    let resolveProgress!: (value: {
      ProgressPanel: () => null;
      getContribution: () => CuratedProgressContribution;
    }) => void;
    const pendingProgress = new Promise<{
      ProgressPanel: () => null;
      getContribution: () => CuratedProgressContribution;
    }>((resolve) => {
      resolveProgress = resolve;
    });
    const pendingAdapter = makeDummyCuratedExperience({
      progressLoader: () => pendingProgress,
    });
    const registry = createCuratedExperienceRegistry([pendingAdapter]);

    const { container } = render(
      <ProgressHub
        curatedExperiences={registry.map((entry) => entry.summary)}
        curatedRegistry={registry}
        go={vi.fn()}
        store={store}
      />,
    );

    expect(screen.getByText('Loading curated progress…')).toBeInTheDocument();
    expect(screen.getByText('Loading recent activity…')).toBeInTheDocument();
    expect(screen.queryByRole('heading', {
      name: `Resume ${modules[0].shortTitle}`,
    })).not.toBeInTheDocument();
    expect(screen.queryByText('Legacy quiz started')).not.toBeInTheDocument();
    expect(container.querySelector('.activity-list')).not.toBeInTheDocument();

    await act(async () => {
      resolveProgress({
        ProgressPanel: () => null,
        getContribution: () => contribution(
          'dummy-curated',
          'dummy-module',
          'Curated recovery',
          1,
          'curated-settled-activity',
        ),
      });
      await pendingProgress;
    });

    expect(await screen.findByRole('heading', { name: 'Curated recovery' }))
      .toBeInTheDocument();
    expect(screen.getAllByText('Recommended next step')).toHaveLength(1);
    expect(screen.queryByText('Loading curated progress…')).not.toBeInTheDocument();
    expect(screen.queryByText('Loading recent activity…')).not.toBeInTheDocument();
    expect(screen.getByText('Curated recovery activity')).toBeInTheDocument();
    expect(screen.getByText('Legacy quiz started')).toBeInTheDocument();
    expect(container.querySelectorAll('.activity-list')).toHaveLength(1);
  });

  it('fails one invalid contribution closed without suppressing valid or legacy evidence', async () => {
    const store = createEmptyStoreV2();
    const active = createAttempt(modules[0], () => 0.25, () => (
      new Date('2026-07-29T10:00:00.000Z')
    ));
    store.active[modules[0].id] = active;
    const before = JSON.stringify(store);
    const valid = makeDummyCuratedExperience({
      progressLoader: async () => ({
        ProgressPanel: () => null,
        getContribution: () => contribution(
          'dummy-curated',
          'dummy-module',
          'Valid owned recommendation',
          1,
          'valid-owned-activity',
        ),
      }),
    });
    const invalid = makeDummyCuratedExperience({
      progressLoader: async () => ({
        ProgressPanel: () => null,
        getContribution: () => contribution(
          'copied-wrong-experience',
          'invalid-module',
          'Invalid copied recommendation',
          0,
          'invalid-copied-activity',
        ),
      }),
    });
    invalid.summary = {
      ...invalid.summary,
      experienceId: 'invalid-curated',
      moduleId: 'invalid-module',
      routeSegment: 'invalid-curated',
      blueprintIds: ['invalid-v1'],
    };
    const registry = createCuratedExperienceRegistry([valid, invalid]);

    render(
      <ProgressHub
        curatedExperiences={registry.map((entry) => entry.summary)}
        curatedRegistry={registry}
        go={vi.fn()}
        store={store}
      />,
    );

    expect(await screen.findByRole('heading', {
      name: 'Valid owned recommendation',
    })).toBeInTheDocument();
    expect(screen.queryByText('Invalid copied recommendation')).not.toBeInTheDocument();
    expect(screen.getByText('Valid owned recommendation activity')).toBeInTheDocument();
    expect(screen.getByText('Legacy quiz started')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Some curated progress is temporarily unavailable',
    );
    expect(JSON.stringify(store)).toBe(before);
  });

});
