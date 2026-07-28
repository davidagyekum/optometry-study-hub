// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { HvpProgressPanel } from '@/components/progress/HvpProgressPanel';
import { ProgressHub } from '@/components/progress/ProgressHub';
import type { ClientView } from '@/lib/navigation/clientRoute';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

afterEach(cleanup);

describe('reviewed dashboard UI contracts', () => {
  it('renders exactly one primary recommendation when the HVP coordinator is enabled', () => {
    const { container } = render(
      <ProgressHub
        store={createEmptyStoreV2()}
        go={vi.fn()}
        hvpEnabled
        curatedRecommendationPanel={(
          <article className="recommendation">
            <h2>Unified recommendation</h2>
          </article>
        )}
      />,
    );
    expect(container.querySelectorAll('.recommendation')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Unified recommendation' })).toBeInTheDocument();
  });

  it('shows all five mastery counts and separately labelled HVP summary metrics', () => {
    render(
      <HvpProgressPanel
        store={createEmptyStoreV2()}
        go={vi.fn()}
        variant="summary"
      />,
    );
    expect(screen.getByText('Current question mastery')).toBeInTheDocument();
    ['Unseen', 'Learning', 'Developing', 'Proficient', 'Mastered'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    expect(screen.getByText('Active practice')).toBeInTheDocument();
    expect(screen.getByText('Written submissions')).toBeInTheDocument();
    expect(screen.getByText('Not scored')).toBeInTheDocument();
  });

  it.each<ClientView>([
    'practice-hub',
    'practice',
    'quiz',
    'results',
    'pilot',
    'assessment',
    'assessment-result',
  ])('marks Practice current for %s', (view) => {
    render(<SiteHeader go={vi.fn()} view={view} />);
    expect(screen.getByRole('button', { name: 'Practice' }))
      .toHaveAttribute('aria-current', 'page');
    cleanup();
  });
});
