// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SafeNoteText } from '@/components/study/SafeNoteText';
import { StudyBlockV3Renderer } from '@/components/study/StudyBlockV3Renderer';
import { StudyView } from '@/components/study/StudyView';
import { moduleMap } from '@/content/legacy/moduleCatalog';

afterEach(cleanup);

describe('Notes V3 study experience', () => {
  it('renders authored notes, priority labels, sources, figures and stable completion controls', async () => {
    const studyModule = moduleMap.get('environmental-vision');
    if (!studyModule) throw new Error('Environmental Vision module missing');
    const onToggle = vi.fn();
    render(
      <StudyView
        module={studyModule}
        read={['env-optics']}
        onToggle={onToggle}
        go={vi.fn()}
        pilotEnabled={false}
        openPilot={vi.fn()}
        hasLegacyAttempt={false}
        hasLegacyResults={false}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Physical Optics and Visual Function' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Must know' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: 'Should know' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('heading', { name: 'Useful extension' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Sources and teaching scope' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /enlarge figure/i })).toHaveLength(6);
    screen.getAllByRole('button', { name: '✓ Reviewed' })[0].click();
    expect(onToggle).toHaveBeenCalledWith('env-optics');
  });

  it('reveals active-recall answers from the keyboard and exposes responsive tables', async () => {
    const user = userEvent.setup();
    render(
      <StudyBlockV3Renderer
        block={{
          type: 'active-recall',
          title: 'Active recall checkpoint',
          questions: ['What is the first step?'],
          answers: ['Assess the source material.'],
        }}
      />,
    );
    const reveal = screen.getByText('Reveal answers');
    reveal.focus();
    await user.keyboard('{Enter}');
    expect(reveal).toHaveFocus();
    if (!reveal.closest('details')?.open) await user.click(reveal);
    expect(screen.getByText('Assess the source material.')).toBeVisible();

    cleanup();
    render(
      <StudyBlockV3Renderer
        block={{
          type: 'rich-explanation',
          title: 'Comparison',
          nodes: [{ type: 'table', columns: ['Feature', 'Meaning'], rows: [['Lux', 'Light at a surface']] }],
        }}
      />,
    );
    expect(screen.getByRole('region', { name: 'Scrollable study table' })).toHaveAttribute('tabindex', '0');
  });

  it('emphasizes trusted key terms without executing raw HTML', () => {
    render(<p><SafeNoteText text={'**Miosis** follows <script>window.bad = true</script> and `M3` activation.'} /></p>);
    expect(screen.getByText('Miosis').tagName).toBe('STRONG');
    expect(screen.getByText('M3').tagName).toBe('CODE');
    expect(screen.getByText(/<script>window\.bad = true<\/script>/)).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();

    cleanup();
    render(<StudyBlockV3Renderer block={{ type: 'rich-explanation', title: 'Qualification', nodes: [{ type: 'paragraph', text: '> **Course qualification:** approximate band, > not a sharp wall.' }] }} />);
    const qualification = document.querySelector('.notes-v3-qualification');
    expect(qualification).toHaveTextContent('Course qualification: approximate band, not a sharp wall.');
    expect(qualification).not.toHaveTextContent('>');
  });
});
