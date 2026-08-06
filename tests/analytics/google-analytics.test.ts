// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYTICS_CONSENT_KEY, GA_MEASUREMENT_ID, GA_SCRIPT_ID } from '@/lib/analytics/config';

type DataLayer = Array<[string, unknown, Record<string, unknown>?]>;

function layer(): DataLayer {
  return ((window as unknown as { dataLayer?: DataLayer }).dataLayer ?? []);
}

async function analytics() {
  vi.resetModules();
  return import('@/lib/analytics/googleAnalytics');
}

beforeEach(() => {
  localStorage.clear();
  document.head.innerHTML = '';
  document.cookie = '_ga=; Max-Age=0; path=/';
  delete (window as unknown as { dataLayer?: DataLayer }).dataLayer;
  delete (window as unknown as { gtag?: unknown }).gtag;
});

describe('consent-gated Google Analytics', () => {
  it.each([null, 'denied', 'malformed'])('loads nothing for consent %s', async (consent) => {
    if (consent) localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);
    const { ensureGoogleAnalyticsLoaded, trackPageView } = await analytics();
    expect(ensureGoogleAnalyticsLoaded()).toBe(false);
    expect(trackPageView('/', 'Home')).toBe(false);
    expect(document.getElementById(GA_SCRIPT_ID)).toBeNull();
    expect(layer()).toEqual([]);
  });

  it('loads and configures GA4 exactly once after acceptance', async () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'granted');
    const { ensureGoogleAnalyticsLoaded } = await analytics();
    expect(ensureGoogleAnalyticsLoaded()).toBe(true);
    expect(ensureGoogleAnalyticsLoaded()).toBe(true);
    expect(document.querySelectorAll(`#${GA_SCRIPT_ID}`)).toHaveLength(1);
    expect((document.getElementById(GA_SCRIPT_ID) as HTMLScriptElement).src)
      .toContain(GA_MEASUREMENT_ID);
    expect(layer().filter(([command]) => command === 'config')).toHaveLength(1);
    expect(layer().find(([command]) => command === 'config')?.[2]).toMatchObject({
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  });

  it('emits only allowlisted page, module and practice fields', async () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'granted');
    window.history.replaceState({}, '', '/study/ocular-adnexa');
    const { trackPageView, trackPracticeEvent, trackStudyModuleOpen } = await analytics();
    expect(trackPageView('/study/ocular-adnexa', 'Ocular Adnexa Notes')).toBe(true);
    expect(trackStudyModuleOpen('opt-376', 'ocular-adnexa')).toBe(true);
    expect(trackPracticeEvent('practice_start', {
      moduleId: 'ocular-adnexa',
      practiceProfile: 'quick',
      practiceMode: 'mixed',
      questionCount: 10,
      score: 100,
      answers: ['secret'],
    } as never)).toBe(true);
    expect(trackPracticeEvent('practice_submit', {
      moduleId: 'ocular-adnexa',
      practiceProfile: 'quick',
      practiceMode: 'mixed',
      questionCount: 10,
    })).toBe(true);

    const events = layer().filter(([command]) => command === 'event');
    expect(events.map(([, name]) => name)).toEqual([
      'page_view', 'study_module_open', 'practice_start', 'practice_submit',
    ]);
    const practice = events.find(([, name]) => name === 'practice_start')?.[2];
    expect(practice).toEqual({
      module_id: 'ocular-adnexa',
      practice_profile: 'quick',
      practice_mode: 'mixed',
      question_count: 10,
    });
    expect(practice).not.toHaveProperty('score');
    expect(practice).not.toHaveProperty('answers');
  });

  it('rejects malformed event metadata', async () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'granted');
    const { trackPageView, trackPracticeEvent, trackStudyModuleOpen } = await analytics();
    expect(trackPageView('//external.example', 'Bad')).toBe(false);
    expect(trackStudyModuleOpen('Bad ID', 'ocular-adnexa')).toBe(false);
    expect(trackPracticeEvent('practice_start', {
      moduleId: 'ocular-adnexa', practiceProfile: 'quick', practiceMode: 'mixed', questionCount: 0,
    })).toBe(false);
    expect(layer().filter(([command]) => command === 'event')).toHaveLength(0);
  });

  it('revokes collection, removes the script and clears GA cookies', async () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, 'granted');
    const { disableGoogleAnalytics, ensureGoogleAnalyticsLoaded } = await analytics();
    ensureGoogleAnalyticsLoaded();
    document.cookie = '_ga=test; path=/';
    disableGoogleAnalytics();
    expect(document.getElementById(GA_SCRIPT_ID)).toBeNull();
    expect(document.cookie).not.toContain('_ga=');
    expect((window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`]).toBe(true);
  });
});
