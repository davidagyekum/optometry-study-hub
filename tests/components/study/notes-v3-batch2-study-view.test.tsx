// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudyView } from '@/components/study/StudyView';
import { moduleMap } from '@/content/legacy/moduleCatalog';

afterEach(cleanup);

function renderStudy(moduleId: string, read: string[] = [], onToggle = vi.fn()) {
  const studyModule = moduleMap.get(moduleId);
  if (!studyModule) throw new Error(`Missing module: ${moduleId}`);
  render(
    <StudyView
      module={studyModule}
      read={read}
      onToggle={onToggle}
      go={vi.fn()}
      pilotEnabled={false}
      openPilot={vi.fn()}
      hasLegacyAttempt={false}
      hasLegacyResults={false}
    />,
  );
  return onToggle;
}

describe('Notes V3 Batch 2 study routes', () => {
  it('renders all Ocular Adnexa sections, figures, corrections and stable completion controls', async () => {
    const user = userEvent.setup();
    const onToggle = renderStudy('ocular-adnexa', ['tears', 'unknown-historical-id']);

    expect(await screen.findByRole('heading', { name: 'Landmarks and Topography' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /enlarge figure/i })).toHaveLength(6);
    expect(screen.getAllByRole('heading', { name: 'Must know' })).toHaveLength(6);
    expect(screen.getAllByText('Reveal answers')).toHaveLength(6);
    expect(screen.getByRole('heading', { name: 'Sources and teaching scope' })).toBeInTheDocument();
    expect(document.querySelectorAll('.notes-v3-qualification').length).toBeGreaterThan(0);
    expect(document.body).toHaveTextContent('Parasympathetic secretomotor activity is the dominant driver');

    const reviewed = screen.getByRole('button', { name: /Reviewed/ });
    await user.click(reviewed);
    expect(onToggle).toHaveBeenCalledWith('tears');
  });

  it('renders Tissue Foundations and restores figure-trigger focus after Escape', async () => {
    const user = userEvent.setup();
    renderStudy('tissue-foundations');

    expect(await screen.findByRole('heading', { name: 'Nervous Tissue' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /enlarge figure/i })).toHaveLength(3);
    expect(screen.getAllByRole('region', { name: 'Scrollable study table' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reveal answers')).toHaveLength(3);

    const trigger = screen.getAllByRole('button', { name: /enlarge figure/i })[0];
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
