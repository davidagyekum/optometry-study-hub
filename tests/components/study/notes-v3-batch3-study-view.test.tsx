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

describe('Notes V3 Batch 3 study routes', () => {
  it('renders all Aqueous/Vitreous teaching blocks and preserves the selected completion ID', async () => {
    const user = userEvent.setup();
    const onToggle = renderStudy('aqueous-vitreous', ['flow', 'unknown-historical-id']);

    expect(await screen.findByRole('heading', { name: 'Transparent Media and Ocular Chambers' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /enlarge figure/i })).toHaveLength(6);
    expect(screen.getAllByRole('heading', { name: 'Must know' })).toHaveLength(6);
    expect(screen.getAllByText('Reveal answers')).toHaveLength(6);
    expect(screen.getAllByRole('region', { name: 'Scrollable study table' }).length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.notes-v3-sequence').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.notes-v3-qualification').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.notes-v3-block strong').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Sources and teaching scope' })).toBeInTheDocument();
    expect(document.body).toHaveTextContent('posterior vitreous detachment');

    const reveal = screen.getAllByText('Reveal answers')[0];
    const details = reveal.closest('details');
    expect(details).not.toHaveAttribute('open');
    await user.click(reveal);
    expect(details).toHaveAttribute('open');

    const reviewed = screen.getByRole('button', { name: /Reviewed/ });
    await user.click(reviewed);
    expect(onToggle).toHaveBeenCalledWith('flow');
  });

  it('renders Blood Supply and restores figure-trigger focus after Escape', async () => {
    const user = userEvent.setup();
    renderStudy('blood-supply');

    expect(await screen.findByRole('heading', { name: 'Arterial Origins and the Two Ocular Systems' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /enlarge figure/i })).toHaveLength(6);
    expect(screen.getAllByText('Reveal answers')).toHaveLength(6);
    expect(screen.getAllByRole('region', { name: 'Scrollable study table' }).length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.notes-v3-sequence').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.notes-v3-qualification').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.notes-v3-block strong').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('script, iframe, object, [onclick], [onerror]')).toHaveLength(0);
    expect(document.body).toHaveTextContent('sudden painless monocular visual loss');

    const trigger = screen.getAllByRole('button', { name: /enlarge figure/i })[0];
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
