// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useClientRoute } from '@/hooks/useClientRoute';

describe('useClientRoute browser history', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  it('pushes hub routes and restores progress routes on popstate', () => {
    const { result } = renderHook(() => useClientRoute());
    act(() => result.current.go('practice-hub'));
    expect(window.location.pathname).toBe('/practice');
    expect(result.current.route).toEqual({ view: 'practice-hub', moduleId: '' });

    window.history.pushState({}, '', '/progress/human-visual-perception');
    act(() => window.dispatchEvent(new PopStateEvent('popstate')));
    expect(result.current.route).toEqual({
      view: 'progress',
      moduleId: 'human-visual-perception',
    });
  });
});
