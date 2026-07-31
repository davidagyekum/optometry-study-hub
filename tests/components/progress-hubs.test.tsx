// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PracticeHub } from '@/components/practice/PracticeHub';
import { HvpProgressPanel } from '@/components/progress/HvpProgressPanel';
import { ModuleProgressView } from '@/components/progress/ModuleProgressView';
import { ProgressHub } from '@/components/progress/ProgressHub';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { moduleMap, modules } from '@/content/legacy/moduleCatalog';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

afterEach(cleanup);

describe('progress and practice learner UI', () => {
  it('renders curated-first Practice Hub with one read-only history entry', () => {
    render(
      <PracticeHub
        store={createEmptyStoreV2()}
        go={vi.fn()}
        curatedExperiences={[]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Practice Hub' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Previous quiz history' })).toBeInTheDocument();
    expect(screen.getByText('No previous quiz activity on this device.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Start legacy quiz/i })).not.toBeInTheDocument();
  });

  it('renders a populated active legacy practice without changing quiz behaviour', () => {
    const store = createEmptyStoreV2();
    const targetModule = modules[0];
    store.active[targetModule.id] = {
      id: 'active-legacy',
      moduleId: targetModule.id,
      startedAt: '2026-07-01T08:00:00.000Z',
      order: [],
      optionOrder: {},
      answers: { first: 'answer' },
      flags: ['first'],
      current: 0,
    };
    render(
      <PracticeHub
        store={store}
        go={vi.fn()}
        curatedExperiences={[]}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Resume active sessions' })).toBeInTheDocument();
    expect(screen.getByText(/1\/50 answered/i)).toBeInTheDocument();
  });

  it('renders an honest new-browser Progress Hub and legacy-only module detail', () => {
    const store = createEmptyStoreV2();
    const targetModule = moduleMap.get('aqueous-vitreous')!;
    const { rerender } = render(<ProgressHub store={store} go={vi.fn()} curatedExperiences={[]} />);
    expect(screen.getByRole('heading', { name: 'Progress Hub' })).toBeInTheDocument();
    expect(screen.getByText('No saved activity yet')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    rerender(
      <ModuleProgressView
        module={targetModule}
        store={store}
        go={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: targetModule.title })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Take legacy quiz/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Previous quiz history')).not.toBeInTheDocument();
  });

  it('shows HVP mastery evidence, written Not scored, and integrity omission notice', () => {
    const store = createEmptyStoreV2();
    store.assessment.results.invalid = {
      id: 'invalid',
      blueprintId: 'opt374-hvp-curated-v1',
    } as never;
    render(<HvpProgressPanel store={store} go={vi.fn()} variant="detail" />);
    expect(screen.getByRole('heading', { name: 'How mastery is calculated' })).toBeInTheDocument();
    expect(screen.getByText(/results were omitted/i)).toBeInTheDocument();
    expect(screen.getByText('Not scored')).toBeInTheDocument();
    expect(screen.getAllByText(/^unseen$/i).length).toBeGreaterThan(0);
  });

  it('marks the current accessible global navigation destination', () => {
    render(<SiteHeader go={vi.fn()} view="progress" />);
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Progress' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Practice' })).not.toHaveAttribute('aria-current');
  });
});
