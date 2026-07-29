// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CuratedPracticeRouter } from '@/components/assessment/curated/CuratedPracticeRouter';
import { createCuratedExperienceRegistry } from '@/lib/assessment/curated/experienceRegistry';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import { makeDummyCuratedExperience } from '@/tests/fixtures/assessment/dummyCuratedExperience';

afterEach(cleanup);

function props() {
  return {
    go: vi.fn(),
    resourceId: 'dummy-curated',
    setStore: vi.fn(),
    store: createEmptyStoreV2(),
    view: 'practice' as const,
  };
}

describe('generic curated-practice router', () => {
  it('loads a non-HVP adapter by its registered route', async () => {
    const load = vi.fn();
    const registry = createCuratedExperienceRegistry([
      makeDummyCuratedExperience({ onPracticeLoad: load }),
    ]);
    render(<CuratedPracticeRouter {...props()} registry={registry} />);
    expect(await screen.findByText('Dummy practice adapter')).toBeInTheDocument();
    expect(load).toHaveBeenCalledOnce();
  });

  it('dispatches an attempt by its persisted blueprint identity', async () => {
    const store = createEmptyStoreV2();
    store.assessment.activeAttempts['attempt-dummy'] = {
      id: 'attempt-dummy',
      blueprintId: 'dummy-automatic-v1',
    } as never;
    const registry = createCuratedExperienceRegistry([
      makeDummyCuratedExperience(),
    ]);
    render(
      <CuratedPracticeRouter
        {...props()}
        registry={registry}
        resourceId="attempt-dummy"
        store={store}
        view="assessment"
      />,
    );
    expect(await screen.findByText('Dummy practice adapter')).toBeInTheDocument();
  });

  it('fails closed without loading disabled or unknown experiences', () => {
    const load = vi.fn();
    const disabled = createCuratedExperienceRegistry([
      makeDummyCuratedExperience({ enabled: false, onPracticeLoad: load }),
    ]);
    const { rerender } = render(
      <CuratedPracticeRouter {...props()} registry={disabled} />,
    );
    expect(screen.getByRole('heading', {
      name: 'Curated practice unavailable',
    })).toBeInTheDocument();
    expect(load).not.toHaveBeenCalled();

    rerender(
      <CuratedPracticeRouter
        {...props()}
        registry={disabled}
        resourceId="unknown-curated"
      />,
    );
    expect(screen.getByText(
      'The requested curated-practice experience is unavailable.',
    )).toBeInTheDocument();
    expect(load).not.toHaveBeenCalled();
  });
});
