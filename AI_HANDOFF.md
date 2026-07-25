# AI Handoff

## Pull request

- Repository: `davidagyekum/optometry-study-hub`
- Branch: `codex/pr2-modularise-legacy-app`
- Base branch: `main`
- Exact base commit: `4194f69530766314015a921c49210478ffa10a6c`
- Final head commit: Recorded in the draft pull request and final Codex report. A committed file cannot contain the hash produced by its own commit.
- Status: Draft pending review

## Objective completed

Modularise the existing Optometry Study Hub application without changing its routes, educational content, legacy question output, quiz behavior, progress calculations, version-1 device storage, styling, or public deployment.

PR 3 has not been started.

## Files moved and created

### Legacy content

- `content/legacy/courseCatalog.ts` contains the five course summaries in their existing order.
- `content/legacy/additionalModules.ts` contains the five newer course modules moved from `app/additionalCourses.ts`.
- `content/legacy/opt376Modules.ts` contains the three original OPT 376 modules moved from `app/StudyApp.tsx`.
- `content/legacy/imageCatalog.ts` contains the shared OPT 376 figure metadata.
- `content/legacy/moduleCatalog.ts` combines the two module sources and exposes the existing module lookup map.
- `app/additionalCourses.ts` is removed after its content and imports were moved.

### Legacy domain and pure logic

- `lib/legacy/types.ts` provides named legacy type exports.
- `lib/legacy/questionGenerator.ts` preserves the positional distractor generator and cache with an explicit legacy-only warning.
- `lib/legacy/attempts.ts` contains shuffle, attempt creation, scoring, and unanswered-result helpers. An injected random function supports deterministic tests while production still uses `Math.random`.
- `lib/legacy/progress.ts` contains the existing reading and score calculations as pure helpers.

### Navigation and storage

- `lib/navigation/clientRoute.ts` parses and builds the five existing client route shapes.
- `hooks/useClientRoute.ts` owns pushState, popstate, direct-path hydration, and the existing smooth scroll-to-top behavior.
- `lib/storage/legacyStore.ts` owns the unchanged key, empty store, version-1 loading, saving, and parsing fallback.
- `hooks/useLegacyStore.ts` owns React hydration and persistence integration.

### Components

- `components/layout/SiteHeader.tsx`
- `components/layout/SiteFooter.tsx`
- `components/home/HomeView.tsx`
- `components/course/CourseView.tsx`
- `components/study/StudyView.tsx`
- `components/study/FigureDialog.tsx`
- `components/quiz/LegacyQuizView.tsx`
- `components/results/LegacyResultsView.tsx`

`app/StudyApp.tsx` is now the orchestration layer for route resolution, store actions, reset confirmations, quiz creation, and view selection.

### Tests

- `tests/content/legacy-content-integrity.test.ts`
- `tests/legacy/question-generator.test.ts`
- `tests/legacy/attempts.test.ts`
- `tests/legacy/progress.test.ts`
- `tests/navigation/client-route.test.ts`
- `tests/storage/legacy-store.test.ts`

The PR 1 smoke tests and Vitest alias configuration were updated for the new tracked paths.

## Preserved baseline proof

| Invariant | Verified result |
|---|---:|
| Courses | 5 |
| Modules | 8 |
| Study sections | 39 |
| Generated legacy questions | 400 |
| Questions per module | 50 |
| Options per generated question | 4 entries |
| Storage key | `opt376-study-state:v1` |
| Storage version | 1 |

Tests also verify unique course and module IDs, course-to-module resolution, section-local ID uniqueness, fact-to-section references, image-file existence, generated question IDs/order/content, deterministic attempt structure, score behavior, progress formulas, route parsing/building, and version-1 storage round trips.

## Storage impact

None.

- The key remains exactly `opt376-study-state:v1`.
- The stored shape and version remain unchanged.
- Existing reading progress, active attempts, flags, answers, result history, and timestamps remain readable.
- No schema validation or migration was introduced.
- JSON failures and non-version-1 values retain the existing empty-store fallback behavior.

## User-visible impact

No intentional user-visible change.

Visible wording, course/module/section order, IDs, questions, distractor behavior, image paths, source credits, CSS classes, confirmation prompts, quiz navigation, result review, and route shapes are preserved. No CSS, metadata, educational claims, public deployment, or production data were changed.

## Automated validation

All final validation used the bundled Node.js `v24.14.0` runtime.

| Command | Result |
|---|---|
| `npm ci` | Pass; 528 packages installed. npm reported the repository's current dependency advisories and two non-fatal Windows cleanup warnings. |
| `npm run lint` | Pass with the same four accepted `@next/next/no-img-element` warnings. |
| `npm run typecheck` | Pass. |
| `npm run test` | Pass: 9 files, 34 tests. |
| `npm run build` | Pass. |
| `npm run check` | Pass; reran lint, typecheck, all tests, and the production build. |

The first clean-install attempt was blocked by stale repository-local vinext/Worker validation processes left from earlier work. After stopping only those identified processes, the required Node 24 clean install passed.

## Chrome-only manual regression

Passed in Chrome on the local `vinext dev` server:

- homepage content and all five course cards;
- all five course dashboards and all eight module cards;
- all eight study-note modules, section counts, source figures, captions, and no desktop horizontal overflow;
- figure-dialog initial focus, focus trap, Escape close, backdrop close, body-scroll lock, and focus restoration;
- reading completion and refresh persistence;
- quiz start, 50-question navigator, answer selection, flagging, Previous/Next, save-and-exit, resume, and refresh persistence with identical question/option order;
- unanswered-submission warning dismissal and acceptance;
- score totals, unanswered/incorrect counts, answer review, explanations, and related-note navigation;
- shuffled retake and active-attempt restart dismissal/acceptance;
- browser back and forward behavior.

The Chrome extension's exact viewport override stopped applying after native confirmation dialogs stalled two controlled tabs. Desktop no-overflow checks passed, but the requested 1024 × 768 and 390 × 844 override passes could not be completed reliably in this run. Module-reset confirmation was opened, but the extension stalled while accepting it; course-reset and global-reset confirmations were therefore not repeated through Chrome. Their state transformations and storage behavior remain unchanged in source, and the extracted pure storage/progress behavior is covered by tests. The in-app browser was not used.

## GitHub Actions status

To be updated after the branch push. The repository's PR 1 Quality runs were blocked before executing any steps by the external GitHub account billing lock; any identical zero-step PR 2 failure must be reported as an external runner restriction, not a code failure.

## Deviations from the requested structure

- Added `content/legacy/moduleCatalog.ts` as a small aggregation boundary so view and orchestration code share one ordered module list and lookup map without reintroducing content composition into `StudyApp.tsx`.
- Exact tablet/mobile Chrome overrides and the three reset confirmation completions are recorded as manual-QA limitations above; no browser fallback was used because Chrome was explicitly required.

## Known limitations

- The four existing `<img>` lint warnings remain intentionally unchanged.
- The legacy generator still permits duplicate distractor text and remains unsuitable for the future assessment schema.
- The live quiz remains fixed at 50 questions and the storage schema remains version 1 by design.
- npm currently reports 23 dependency advisories (4 moderate, 19 high); dependency remediation is outside this behavior-neutral refactor.
- No production deployment was performed.

## Recommendation

Review this behavior-preserving refactor and stop before PR 3. Start PR 3 only after this pull request is reviewed and merged into `main`.
