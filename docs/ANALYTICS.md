# Privacy-preserving traffic analytics

The public Optometry Study Hub uses Google Analytics 4 only after a visitor explicitly selects **Accept analytics**. Before that choice—and after a decline or revocation—the Google script, cookies and analytics requests are not loaded.

## What is collected

Accepted analytics may report page routes, referral source, approximate country/region/city, device category, browser and operating system. Three educational events are allowlisted:

- `study_module_open`: `course_id` and `module_id`;
- `practice_start`: `module_id`, `practice_profile`, `practice_mode` and `question_count`;
- `practice_submit`: the same non-answer practice metadata after successful submission.

Names, email addresses, answers, scores, question IDs, attempt IDs and browser-local study records are never sent. Google Signals, user-provided data collection and advertising personalization are disabled. Consent is stored separately under `optometry-study-hub:analytics-consent:v1`; StoreV2 and legacy learner storage are unchanged.

Visitors can open **Privacy & analytics** in the footer to accept, decline or revoke analytics. Revocation disables collection, removes the GA script and deletes first-party `_ga` cookies visible to the site. Clearing browser data also removes the choice.

## Owner guide

Open [Google Analytics](https://analytics.google.com), select the **Optometry Study Hub** property and use:

- **Reports → Realtime** for current visitors and incoming learning events;
- **Reports → Engagement → Pages and screens** for popular routes, courses and notes;
- **Reports → Acquisition** for referrals and traffic sources;
- **Reports → Tech** for mobile/desktop/tablet, browser and operating system;
- **Reports → User attributes → Demographic details** for privacy-thresholded country, region and approximate city data;
- **Explore** for the `study_module_open` → `practice_start` → `practice_submit` learning funnel.

The registered event-scoped custom dimensions are `course_id`, `module_id`, `practice_profile`, `practice_mode` and `question_count`. Use those dimensions to break down learning events by module or practice configuration.

GA4 begins collecting only after deployment and consent; it cannot reconstruct earlier Sites traffic. Keep the Sites Analytics dashboard for its historical counts. Sites and GA4 counts will differ because GA4 requires consent and applies different visitor, thresholding and bot-processing rules.

## Configuration

- Property: **Optometry Study Hub**
- Reporting timezone: Africa/Lagos
- Measurement ID: `G-PDTF3KS7SZ`
- Event and user-data retention: 14 months
- Google Signals: off
- Advertising personalization: off for all regions
- Enhanced measurement: off; this single-page app records page views manually
