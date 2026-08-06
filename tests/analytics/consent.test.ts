import { describe, expect, it, vi } from 'vitest';
import { ANALYTICS_CONSENT_KEY } from '@/lib/analytics/config';
import { readAnalyticsConsent, writeAnalyticsConsent } from '@/lib/analytics/consent';

describe('analytics consent storage', () => {
  it('accepts only the two versioned consent values', () => {
    expect(readAnalyticsConsent({ getItem: () => null, setItem: vi.fn() })).toBe('unknown');
    expect(readAnalyticsConsent({ getItem: () => 'malformed', setItem: vi.fn() })).toBe('unknown');
    expect(readAnalyticsConsent({ getItem: () => 'granted', setItem: vi.fn() })).toBe('granted');
    expect(readAnalyticsConsent({ getItem: () => 'denied', setItem: vi.fn() })).toBe('denied');
  });

  it('fails closed when browser storage is unavailable or throws', () => {
    expect(readAnalyticsConsent()).toBe('unknown');
    expect(readAnalyticsConsent({ getItem: () => { throw new Error('blocked'); }, setItem: vi.fn() })).toBe('unknown');
    expect(writeAnalyticsConsent('granted')).toBe(false);
    expect(writeAnalyticsConsent('granted', { getItem: vi.fn(), setItem: () => { throw new Error('blocked'); } })).toBe(false);
  });

  it('writes consent under its separate analytics key', () => {
    const setItem = vi.fn();
    expect(writeAnalyticsConsent('denied', { getItem: vi.fn(), setItem })).toBe(true);
    expect(setItem).toHaveBeenCalledWith(ANALYTICS_CONSENT_KEY, 'denied');
  });
});
