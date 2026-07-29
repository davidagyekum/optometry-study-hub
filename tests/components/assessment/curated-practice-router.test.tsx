// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CuratedPracticeRouter } from '@/components/assessment/curated/CuratedPracticeRouter';
import { createCuratedExperienceRegistry } from '@/lib/assessment/curated/experienceRegistry';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';
import {
  dummyCuratedDefinition,
  makeDummyCuratedExperience,
} from '@/tests/fixtures/assessment/dummyCuratedExperience';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

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
    expect(await screen.findByText('Dummy curated practice')).toBeInTheDocument();
    expect(load).toHaveBeenCalledOnce();
  });

  it('dispatches an attempt by its persisted blueprint identity', async () => {
    const store = createEmptyStoreV2();
    if (!dummyCuratedDefinition.registryResult.ok) {
      throw new Error('Dummy registry unavailable');
    }
    const created = dummyCuratedDefinition.createAttempt(
      dummyCuratedDefinition.defaultRequest(),
      store,
      dummyCuratedDefinition.registryResult.value,
    );
    if (!created.ok) throw new Error('Dummy attempt unavailable');
    store.assessment.activeAttempts[created.value.id] = created.value;
    const registry = createCuratedExperienceRegistry([
      makeDummyCuratedExperience(),
    ]);
    render(
      <CuratedPracticeRouter
        {...props()}
        registry={registry}
        resourceId="dummy-attempt"
        store={store}
        view="assessment"
      />,
    );
    expect(await screen.findByText(/Question 1 of 1/)).toBeInTheDocument();
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
