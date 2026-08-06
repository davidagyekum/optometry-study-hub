'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { moduleMap } from '@/content/legacy/moduleCatalog';
import { buildClientPath, type ClientRoute } from '@/lib/navigation/clientRoute';
import { readAnalyticsConsent, writeAnalyticsConsent } from '@/lib/analytics/consent';
import { ANALYTICS_CONSENT_KEY, type AnalyticsConsent } from '@/lib/analytics/config';
import { disableGoogleAnalytics, ensureGoogleAnalyticsLoaded, trackPageView, trackStudyModuleOpen } from '@/lib/analytics/googleAnalytics';

const AnalyticsPrivacyContext = createContext<(() => void) | undefined>(undefined);

function safeStorage(): Storage | undefined {
  try { return window.localStorage; } catch { return undefined; }
}

function focusableElements(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
}

export function useAnalyticsPrivacy(): () => void {
  return useContext(AnalyticsPrivacyContext) ?? (() => undefined);
}

const CONSENT_CHANGE_EVENT = 'optometry-study-hub:analytics-consent-change';

function subscribeToConsent(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ANALYTICS_CONSENT_KEY) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  };
}

function analyticsConsentSnapshot(): AnalyticsConsent {
  return readAnalyticsConsent(safeStorage());
}

export function AnalyticsProvider({ route, children }: { route: ClientRoute; children: ReactNode }) {
  const consent = useSyncExternalStore(subscribeToConsent, analyticsConsentSnapshot, () => 'unknown');
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const lastPageViewRef = useRef('');
  const lastModuleOpenRef = useRef('');


  useEffect(() => {
    if (consent !== 'granted') return;
    const path = buildClientPath(route);
    if (window.location.pathname !== path || lastPageViewRef.current === path) return;
    if (trackPageView(path, document.title)) lastPageViewRef.current = path;
    if (route.view === 'study') {
      const studyModule = moduleMap.get(route.moduleId);
      const key = studyModule ? `${studyModule.courseId}:${studyModule.id}` : '';
      if (studyModule && key !== lastModuleOpenRef.current && trackStudyModuleOpen(studyModule.courseId, studyModule.id)) lastModuleOpenRef.current = key;
    } else {
      lastModuleOpenRef.current = '';
    }
  }, [consent, route]);

  const closePrivacy = useCallback(() => {
    setPrivacyOpen(false);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, []);
  const openPrivacy = useCallback(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPrivacyOpen(true);
  }, []);

  useEffect(() => {
    if (!privacyOpen) return undefined;
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    focusableElements(dialog)[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closePrivacy(); return; }
      if (event.key !== 'Tab') return;
      const focusable = focusableElements(dialog);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closePrivacy, privacyOpen]);

  const chooseConsent = (next: Exclude<AnalyticsConsent, 'unknown'>) => {
    writeAnalyticsConsent(next, safeStorage());
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT));
    lastPageViewRef.current = '';
    lastModuleOpenRef.current = '';
    if (next === 'granted') ensureGoogleAnalyticsLoaded();
    else disableGoogleAnalytics();
  };

  return (
    <AnalyticsPrivacyContext.Provider value={openPrivacy}>
      {children}
      {consent === 'unknown' ? (
        <section className="analytics-consent" aria-label="Analytics consent" role="region">
          <div><strong>Help improve this study hub?</strong><p>With your permission, anonymous Google Analytics records pages visited, approximate location and device type. It never receives your answers, scores or study records.</p></div>
          <div className="analytics-consent-actions">
            <button className="secondary-button" onClick={() => chooseConsent('denied')} type="button">Decline analytics</button>
            <button className="text-button" onClick={openPrivacy} type="button">Privacy details</button>
            <button className="primary-button" onClick={() => chooseConsent('granted')} type="button">Accept analytics</button>
          </div>
        </section>
      ) : null}
      {privacyOpen ? (
        <div className="analytics-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closePrivacy(); }}>
          <div aria-describedby="analytics-privacy-description" aria-labelledby="analytics-privacy-title" aria-modal="true" className="analytics-dialog" ref={dialogRef} role="dialog">
            <button aria-label="Close privacy and analytics" className="dialog-close" onClick={closePrivacy} type="button">×</button>
            <p className="eyebrow">Your choice</p><h2 id="analytics-privacy-title">Privacy &amp; analytics</h2>
            <div id="analytics-privacy-description">
              <p>If you accept, Google Analytics uses a first-party analytics cookie to estimate unique and returning visitors. It receives the page route, course or module identifiers, practice type, question count, approximate country/region/city, device, browser and referral source.</p>
              <p>It never receives names, email addresses, answers, scores, question IDs, attempt IDs or the study records saved in this browser. Advertising features, Google Signals and advertising personalization are disabled. Google discards IP addresses before logging them.</p>
              <p>Your choice is stored separately on this device. You can change it below at any time. Declining or revoking analytics does not affect the study site.</p>
            </div>
            <p className="analytics-consent-state" role="status">Current choice: {consent === 'granted' ? 'Analytics accepted' : consent === 'denied' ? 'Analytics declined' : 'Not chosen'}</p>
            <div className="analytics-dialog-actions"><button className="secondary-button" onClick={() => chooseConsent('denied')} type="button">{consent === 'granted' ? 'Revoke analytics' : 'Decline analytics'}</button><button className="primary-button" onClick={() => chooseConsent('granted')} type="button">Accept analytics</button></div>
          </div>
        </div>
      ) : null}
    </AnalyticsPrivacyContext.Provider>
  );
}
