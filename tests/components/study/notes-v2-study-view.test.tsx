// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudyView } from '@/components/study/StudyView';
import { moduleMap } from '@/content/legacy/moduleCatalog';

afterEach(cleanup);

describe('Notes V2 study experience', () => {
  it('renders structured notes, stable completion controls and the legacy archive', () => {
    const studyModule = moduleMap.get('systemic-pathology');
    if (!studyModule) throw new Error('Systemic Pathology module missing');
    const onToggle = vi.fn();
    render(
      <StudyView
        module={studyModule}
        read={['path-breast', 'unknown-historical-id']}
        onToggle={onToggle}
        go={vi.fn()}
        startQuiz={vi.fn()}
        pilotEnabled={false}
        openPilot={vi.fn()}
      />,
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Endocrine pathology' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Legacy supplemental notes' })).toBeInTheDocument();
    expect(screen.getByText(/current curated assessment does not cover them/i)).toBeInTheDocument();
    expect(screen.getByText('Legacy quiz and score archive')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start 50-question quiz' })).toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: 'Terms to distinguish' }).length).toBeGreaterThan(0);

    const reviewed = screen.getAllByRole('button', { name: '✓ Reviewed' })[0];
    fireEvent.click(reviewed);
    expect(onToggle).toHaveBeenCalledWith('path-breast');
  });
});