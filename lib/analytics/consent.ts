import { ANALYTICS_CONSENT_KEY, type AnalyticsConsent } from './config';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function readAnalyticsConsent(storage?: StorageLike): AnalyticsConsent {
  if (!storage) return 'unknown';
  try {
    const value = storage.getItem(ANALYTICS_CONSENT_KEY);
    return value === 'granted' || value === 'denied' ? value : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function writeAnalyticsConsent(
  consent: Exclude<AnalyticsConsent, 'unknown'>,
  storage?: StorageLike,
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(ANALYTICS_CONSENT_KEY, consent);
    return true;
  } catch {
    return false;
  }
}
