// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCuratedPractice } from '@/hooks/useCuratedPractice';
import {
  sessionFailure,
  sessionIssue,
  sessionSuccess,
} from '@/lib/assessment/session/errors';
import { createEmptyStoreV2 } from '@/lib/storage/migrations';

afterEach(cleanup);

describe('generic curated-practice transaction composition', () => {
  it('commits successful transactions against the latest atomic snapshot', () => {
    const setStore = vi.fn();
    const store = createEmptyStoreV2();
    const { result } = renderHook(() => useCuratedPractice({ store, setStore }));

    act(() => {
      expect(result.current.transact((latest) => sessionSuccess({
        store: {
          ...latest,
          read: { ...latest.read, first: ['section-a'] },
        },
        value: 'first',
      }))).toEqual(sessionSuccess('first'));
      expect(result.current.transact((latest) => sessionSuccess({
        store: {
          ...latest,
          read: { ...latest.read, second: latest.read.first },
        },
        value: latest.read.first,
      }))).toEqual(sessionSuccess(['section-a']));
    });

    expect(setStore).toHaveBeenCalledTimes(2);
    expect(setStore.mock.calls[1][0].read).toEqual({
      first: ['section-a'],
      second: ['section-a'],
    });
  });

  it('does not commit a failed transaction', () => {
    const setStore = vi.fn();
    const { result } = renderHook(() => useCuratedPractice({
      store: createEmptyStoreV2(),
      setStore,
    }));
    const failure = sessionFailure(sessionIssue(
      'INVALID_STORE',
      'Synthetic persistence failure.',
    ));

    act(() => {
      expect(result.current.transact(() => failure)).toBe(failure);
    });
    expect(setStore).not.toHaveBeenCalled();
  });
});
