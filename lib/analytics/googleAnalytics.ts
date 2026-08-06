import { readAnalyticsConsent } from './consent';
import {
  GA_MEASUREMENT_ID,
  GA_SCRIPT_ID,
  type EducationalEventName,
  type PracticeAnalyticsMetadata,
} from './config';

type GtagArguments = [command: string, target: string | Date, parameters?: Record<string, unknown>];

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (...args: GtagArguments) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

let configured = false;

function browserStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function hasConsent(): boolean {
  return typeof window !== 'undefined' && readAnalyticsConsent(browserStorage()) === 'granted';
}

function installGtagQueue(): void {
  window.dataLayer ??= [];
  // Google Tag's command protocol requires the function's Arguments object.
  // A plain array looks similar in tests but is not processed as a gtag command.
  window.gtag ??= function gtag(): void {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  } as (...args: GtagArguments) => void;
}

function configure(): void {
  if (configured) return;
  installGtagQueue();
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
  window.gtag?.('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  window.gtag?.('js', new Date());
  window.gtag?.('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  configured = true;
}

export function ensureGoogleAnalyticsLoaded(): boolean {
  if (!hasConsent()) return false;
  configure();
  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement('script');
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }
  return true;
}

function isStableId(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
}

function emit(name: EducationalEventName, parameters: Record<string, string | number>): boolean {
  if (!ensureGoogleAnalyticsLoaded()) return false;
  window.gtag?.('event', name, parameters);
  return true;
}

export function trackPageView(path: string, title: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  if (!ensureGoogleAnalyticsLoaded()) return false;
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: title,
  });
  return true;
}

export function trackStudyModuleOpen(courseId: string, moduleId: string): boolean {
  if (!isStableId(courseId) || !isStableId(moduleId)) return false;
  return emit('study_module_open', { course_id: courseId, module_id: moduleId });
}

export function trackPracticeEvent(
  name: Extract<EducationalEventName, 'practice_start' | 'practice_submit'>,
  metadata: PracticeAnalyticsMetadata,
): boolean {
  const { moduleId, practiceProfile, practiceMode, questionCount } = metadata;
  if (
    !isStableId(moduleId)
    || !isStableId(practiceProfile)
    || !isStableId(practiceMode)
    || !Number.isInteger(questionCount)
    || questionCount < 1
    || questionCount > 200
  ) return false;
  return emit(name, {
    module_id: moduleId,
    practice_profile: practiceProfile,
    practice_mode: practiceMode,
    question_count: questionCount,
  });
}

export function disableGoogleAnalytics(): void {
  if (typeof window === 'undefined') return;
  window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  }
  document.getElementById(GA_SCRIPT_ID)?.remove();
  const cookieNames = document.cookie
    .split(';')
    .map((part) => part.split('=', 1)[0]?.trim())
    .filter((name) => name === '_ga' || name?.startsWith('_ga_'));
  for (const name of cookieNames) {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  }
  window.dataLayer = [];
  window.gtag = undefined;
  configured = false;
}
