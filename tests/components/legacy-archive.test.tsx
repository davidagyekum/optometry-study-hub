// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegacyArchive } from '@/components/legacy/LegacyArchive';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import { curatedExperienceSummaries } from '@/lib/assessment/curated/experienceRegistry';
import { createAttempt } from '@/lib/legacy/attempts';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

afterEach(cleanup);

describe('previous quiz compatibility archive', () => {
  it('is read-only for a clean device and offers curated practice instead', () => {
    const go = vi.fn();
    render(
      <LegacyArchive
        store={createEmptyStoreV2()}
        go={go}
        curatedExperiences={curatedExperienceSummaries()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Previous quiz history' })).toBeInTheDocument();
    expect(screen.getAllByText('No previous quiz activity on this device.')).toHaveLength(moduleMap.size);
    expect(screen.queryByRole('button', { name: /Start legacy quiz/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Practice this module' })).toHaveLength(moduleMap.size);
  });

  it('resumes only an existing attempt and keeps a module-scoped route', () => {
    const studyModule = moduleMap.get('ocular-adnexa');
    if (!studyModule) throw new Error('Ocular Adnexa module missing');
    const store = createEmptyStoreV2();
    store.active[studyModule.id] = createAttempt(studyModule, () => 0, () => new Date(0));
    const go = vi.fn();
    render(
      <LegacyArchive
        moduleId={studyModule.id}
        store={store}
        go={go}
        curatedExperiences={curatedExperienceSummaries()}
      />,
    );

    expect(screen.getByRole('heading', { name: studyModule.title })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Blood Supply to the Eye' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume previous quiz' }));
    expect(go).toHaveBeenCalledWith('quiz', studyModule.id);
  });
});
