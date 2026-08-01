// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudyView } from '@/components/study/StudyView';
import { moduleMap } from '@/content/legacy/moduleCatalog';

afterEach(cleanup);

function renderStudy(moduleId: string, read: string[] = [], onToggle = vi.fn()) {
  const studyModule = moduleMap.get(moduleId);
  if (!studyModule) throw new Error(`Missing module: ${moduleId}`);
  const view = render(
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
  return { ...view, onToggle };
}

describe('Notes V3 Batch 4 study routes', () => {
  it('renders the four HVP sections, study structures and accessible figure dialog', async () => {
    const user = userEvent.setup();
    renderStudy('human-visual-perception', ['hvp-retina', 'unknown-historical-id']);

    expect(await screen.findByRole('heading', { name: 'Sensation, Perception and Visual-System Organisation' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /enlarge figure/i })).toHaveLength(4);
    expect(screen.getAllByRole('heading', { name: 'Must know' })).toHaveLength(4);
    expect(screen.getAllByText('Reveal answers')).toHaveLength(4);
    expect(screen.getAllByRole('region', { name: 'Scrollable study table' }).length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.notes-v3-sequence').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.notes-v3-qualification').length).toBeGreaterThan(0);
    expect(document.querySelectorAll('.notes-toc a')).toHaveLength(4);
    expect(document.querySelectorAll('.notes-toc-mobile a')).toHaveLength(4);
    expect(document.querySelectorAll('script, iframe, object, [onclick], [onerror]')).toHaveLength(0);

    const trigger = screen.getAllByRole('button', { name: /enlarge figure/i })[0];
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('renders five Systemic V3 sections plus two preserved V2 supplementals', async () => {
    const user = userEvent.setup();
    const { container, onToggle } = renderStudy('systemic-pathology', ['path-lymph']);

    expect(await screen.findByRole('heading', { name: 'Breast Pathology' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Legacy supplemental notes' })).toBeInTheDocument();
    expect(screen.getByText(/historical sections remain readable/i)).toBeInTheDocument();
    expect(screen.getByText(/current curated assessment does not cover them/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Lymphoreticular/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Respiratory/i })).toBeInTheDocument();
    expect(document.querySelectorAll('.notes-toc a')).toHaveLength(7);
    expect(document.querySelectorAll('.notes-toc-mobile a')).toHaveLength(7);
    expect(screen.getAllByText('Reveal answers')).toHaveLength(5);
    expect(screen.getAllByRole('button', { name: /enlarge figure/i })).toHaveLength(7);
    expect(screen.getByText('14%')).toBeInTheDocument();
    expect(screen.getAllByText(/Systemic Pathology Review teaching sources/i).length).toBeGreaterThan(0);

    const supplemental = container.querySelector('#path-lymph');
    if (!supplemental) throw new Error('Lymphoreticular supplemental section missing');
    const completion = within(supplemental as HTMLElement).getByRole('button', { name: /Reviewed/ });
    await user.click(completion);
    expect(onToggle).toHaveBeenCalledWith('path-lymph');
  });

  it('uses the answer-neutral endocrine figure and restores its trigger focus', async () => {
    const user = userEvent.setup();
    renderStudy('systemic-pathology');

    await screen.findByRole('heading', { name: 'Endocrine Pathology' });
    const trigger = screen.getByRole('button', { name: /endocrine feedback axes help localise/i });
    const image = within(trigger).getByRole('img');
    expect(image).toHaveAttribute('src', '/images/courses/systemic-pathology/assessment/endocrine-axis.svg');
    expect(image).toHaveAttribute('alt', expect.stringMatching(/answer-neutral diagram/i));

    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });
});
