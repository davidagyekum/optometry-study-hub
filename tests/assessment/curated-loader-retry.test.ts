import { describe, expect, it, vi } from 'vitest';
import {
  loadCuratedPracticeModule,
  loadCuratedProgressModule,
} from '@/lib/assessment/curated/loaders';
import {
  makeDummyCuratedExperience,
} from '@/tests/fixtures/assessment/dummyCuratedExperience';

describe('curated lazy-loader recovery', () => {
  it('retries practice loading after rejection and caches success', async () => {
    const PracticeRouter = () => null;
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('temporary import failure'))
      .mockResolvedValue({ PracticeRouter });
    const adapter = makeDummyCuratedExperience({ practiceLoader: loader });

    await expect(loadCuratedPracticeModule(adapter)).rejects.toThrow(
      'temporary import failure',
    );
    await expect(loadCuratedPracticeModule(adapter)).resolves.toEqual({
      PracticeRouter,
    });
    await loadCuratedPracticeModule(adapter);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('retries progress loading after an invalid shape', async () => {
    const ProgressPanel = () => null;
    const getContribution = vi.fn();
    const loader = vi.fn()
      .mockResolvedValueOnce({ ProgressPanel })
      .mockResolvedValue({ ProgressPanel, getContribution });
    const adapter = makeDummyCuratedExperience({ progressLoader: loader as never });

    await expect(loadCuratedProgressModule(adapter)).rejects.toThrow(
      'CURATED_PROGRESS_MODULE_INVALID',
    );
    await expect(loadCuratedProgressModule(adapter)).resolves.toEqual({
      ProgressPanel,
      getContribution,
    });
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('keys successful caches by adapter identity rather than experience ID', async () => {
    const first = vi.fn().mockResolvedValue({ PracticeRouter: () => null });
    const second = vi.fn().mockResolvedValue({ PracticeRouter: () => null });
    await loadCuratedPracticeModule(
      makeDummyCuratedExperience({ practiceLoader: first }),
    );
    await loadCuratedPracticeModule(
      makeDummyCuratedExperience({ practiceLoader: second }),
    );
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });
});
