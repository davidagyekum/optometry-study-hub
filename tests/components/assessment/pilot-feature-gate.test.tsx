// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssessmentPilotUnavailable } from '@/components/assessment/pilot/AssessmentPilotUnavailable';
import { StudyView } from '@/components/study/StudyView';
import { moduleMap } from '@/content/legacy/moduleCatalog';

afterEach(cleanup);

describe('pilot feature gate UI', () => {
  const aqueous = moduleMap.get('aqueous-vitreous');
  const adnexa = moduleMap.get('ocular-adnexa');

  it('hides the pilot entry when disabled and shows it only for Aqueous when enabled', () => {
    if (!aqueous || !adnexa) throw new Error('legacy modules should exist');
    const props = {
      read: [],
      onToggle: vi.fn(),
      go: vi.fn(),
      startQuiz: vi.fn(),
      openPilot: vi.fn(),
    };
    const { rerender } = render(
      <StudyView {...props} module={aqueous} pilotEnabled={false} />,
    );
    expect(screen.queryByText('Experimental mixed-format pilot')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start 50-question quiz' })).toBeInTheDocument();

    rerender(<StudyView {...props} module={aqueous} pilotEnabled />);
    expect(screen.getByText('Experimental mixed-format pilot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open experimental pilot' })).toBeInTheDocument();

    rerender(<StudyView {...props} module={adnexa} pilotEnabled />);
    expect(screen.queryByText('Experimental mixed-format pilot')).not.toBeInTheDocument();
  });

  it('shows a neutral unavailable screen without draft question content', () => {
    render(<AssessmentPilotUnavailable go={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Experimental assessment unavailable' })).toBeInTheDocument();
    expect(screen.queryByText(/principal resistance site/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/diagnostic@1/i)).not.toBeInTheDocument();
  });
});
