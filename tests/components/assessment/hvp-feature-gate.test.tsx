// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HvpPracticeUnavailable } from '@/components/assessment/hvp/HvpPracticeUnavailable';
import { StudyView } from '@/components/study/StudyView';
import { moduleMap } from '@/content/legacy/moduleCatalog';

afterEach(cleanup);

describe('HVP curated-practice UI gate', () => {
  it('shows the secondary entry only for HVP when enabled', () => {
    const hvp = moduleMap.get('human-visual-perception');
    const aqueous = moduleMap.get('aqueous-vitreous');
    if (!hvp || !aqueous) throw new Error('required legacy modules should exist');
    const props = {
      read: [],
      onToggle: vi.fn(),
      go: vi.fn(),
      startQuiz: vi.fn(),
      openPilot: vi.fn(),
      openHvpPractice: vi.fn(),
      pilotEnabled: false,
    };
    const { rerender } = render(
      <StudyView
        {...props}
        hvpPracticeEnabled={false}
        module={hvp}
      />,
    );
    expect(screen.queryByText('Curated slide-aligned practice')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start 50-question quiz' })).toBeInTheDocument();

    rerender(<StudyView {...props} hvpPracticeEnabled module={hvp} />);
    expect(screen.getByText('Curated slide-aligned practice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open curated practice' })).toBeInTheDocument();

    rerender(<StudyView {...props} hvpPracticeEnabled module={aqueous} />);
    expect(screen.queryByText('Curated slide-aligned practice')).not.toBeInTheDocument();
  });

  it('shows a neutral disabled direct-route screen without answer content', () => {
    render(<HvpPracticeUnavailable go={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Curated practice unavailable' }))
      .toBeInTheDocument();
    expect(screen.queryByText(/which statement best defines sensation/i))
      .not.toBeInTheDocument();
    expect(screen.queryByText(/detection and neural encoding/i))
      .not.toBeInTheDocument();
  });
});
