// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegacyArchive } from '@/components/legacy/LegacyArchive';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

afterEach(cleanup);

describe('legacy compatibility archive', () => {
  it('keeps all frozen module quizzes available without presenting them as primary', () => {
    const go = vi.fn();
    const startQuiz = vi.fn();
    render(
      <LegacyArchive
        store={createEmptyStoreV2()}
        go={go}
        startQuiz={startQuiz}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Legacy quiz archive' })).toBeInTheDocument();
    expect(screen.getByText(/curated practice is the recommended assessment path/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Start legacy quiz' })).toHaveLength(8);

    fireEvent.click(screen.getAllByRole('button', { name: 'Start legacy quiz' })[0]);
    expect(startQuiz).toHaveBeenCalledTimes(1);
  });

  it('supports a module-scoped archive route', () => {
    render(
      <LegacyArchive
        moduleId="ocular-adnexa"
        store={createEmptyStoreV2()}
        go={vi.fn()}
        startQuiz={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Ocular Adnexa & Lacrimal Apparatus' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Blood Supply to the Eye' })).not.toBeInTheDocument();
  });
});
