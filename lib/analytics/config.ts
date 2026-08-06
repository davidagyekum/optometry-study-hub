export const ANALYTICS_CONSENT_KEY = 'optometry-study-hub:analytics-consent:v1';
export const GA_MEASUREMENT_ID = 'G-PDTF3KS7SZ';
export const GA_SCRIPT_ID = 'optometry-study-hub-ga4';

export type AnalyticsConsent = 'granted' | 'denied' | 'unknown';
export type EducationalEventName =
  | 'study_module_open'
  | 'practice_start'
  | 'practice_submit';

export type PracticeAnalyticsMetadata = {
  moduleId: string;
  practiceProfile: string;
  practiceMode: string;
  questionCount: number;
};
