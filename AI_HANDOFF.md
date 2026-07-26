# AI Handoff - PR 5

## Pull request

- Branch: `codex/pr5-grading-policies`
- Base branch: `main`
- Exact base commit: `850d77b6e5673ca895caa55d247dc35df9ca7141`
- Suggested title: `Add versioned headless grading policies`
- Publication: pending the focused implementation commit and draft pull request.
- The implementation commit, final branch head, pull-request URL, and GitHub Actions status will be added after publication.

## Objective completed

Add a pure, deterministic, versioned grading layer over the PR 4 assessment-session engine while leaving the live 400-question legacy quiz and public experience unchanged.

PR 6 has not been started.

## Implementation

### Versioned policies and attempt locking

- Added immutable `strict` version 1 and `diagnostic` version 1 policies.
- Mode defaults are study to diagnostic v1, exam to strict v1, and mastery to strict v1.
- The registry uses a module-private implementation, private storage, a frozen public instance, defensive copies, and structured unknown-ID/unsupported-version failures.
- Newly created attempts lock a validated policy reference; historical attempts and results without one remain schema-valid but require an explicit policy when graded.
- Finalization preserves the locked reference, and atomic StoreV2 finalization includes it in exact attempt/result comparison.

### Pure grading and deterministic aggregation

- Added pure grading for single-best-answer, multiple-response, ordering, matching, extended-matching, image-hotspot, image-label, and short-answer questions.
- Answered open responses are `manual_required`; unanswered open responses remain numeric unanswered outcomes.
- Strict v1 is all-or-nothing for every automatic format.
- Diagnostic v1 adds conservative component fractions only for matching, extended matching, and image labelling.
- Every automatic question has a normalized maximum of one point; no negative marking is possible.
- Six-decimal deterministic rounding is used for partial and aggregate scores.
- Absent responses are unanswered, while malformed present responses fail structurally instead of being silently reclassified.
- Short-answer authoring validation and live grading now share one deterministic normalizer.

### Reports, persistence, and regrading

- Added deterministic per-question reports and aggregate complete/manual-required summaries with automatic subtotals.
- Added exact-version attempt grading and stored-result regrading with course/module ownership checks.
- Added graded finalization that delegates to the PR 4 finalizer, attaches a validated compact grading snapshot, and returns both result and report.
- Extended result persistence backward-compatibly with optional policy and grading fields plus cross-record semantic validation.
- Persisted grading contains outcomes and summaries only; it does not copy questions, answer keys, rationales, accepted answers, or rubrics.
- `assessment.questionHistory` is deliberately unchanged because policy, partial-credit, manual-outcome, and version semantics need a later reviewed design.

## Tests

The suite now contains 37 test files and 254 tests.

PR 5 coverage includes:

- immutable policy registration, mode defaults, unsupported references, mutation isolation, and absence of a public raw constructor;
- policy locking, explicit overrides, historical-policy compatibility, and locked-policy mismatch rejection;
- every short-answer normalization switch, combined and Unicode punctuation behavior, authoring/grading parity, and rejection of fuzzy or substring matches;
- correct, incorrect, and unanswered strict outcomes for all nine formats;
- exact set, sequence, mapping, hotspot, short-answer, and manual-open-response rules;
- diagnostic zero, partial, and full component credit for the three approved formats, deterministic fractions, and nonnegative scores;
- one-question, all-nine, all-unanswered, all-automatic-correct, mixed, manual-required, malformed, stale, missing, and ownership-mismatched attempt grading;
- deterministic result regrading, exact stored versions, set-order independence, policy mismatches, and source immutability;
- complete, fractional, and manual graded finalization; schema validation; atomic StoreV2 finalization; and tamper rejection;
- backward-compatible result loading plus negative grading-snapshot key, version, ID, status, count, total, finiteness, policy, and top-level score cases;
- preserved five-course, eight-module, 39-section, 400-question, 50-per-module, nine-format pilot, and public-route boundaries.

## Behavior and scope

- Intended user-visible changes: none.
- No React component, route, CSS file, educational content, live question, legacy distractor generator, legacy score rule, storage key, storage version, deployment file, account, analytics, backend, or cloud persistence changed.
- The nine-question pilot remains draft and publicly unreachable.
- No renderer, policy selector, public pilot entry point, assembler, adaptive behavior, history update, or manual-grading UI was added.

## Validation

All commands used bundled Node.js `v24.14.0`.

| Command | Result |
|---|---|
| `npm ci` | PASS - 528 packages installed; npm reported three dependency deprecation notices and non-fatal Windows cleanup warnings. |
| `npm run lint` | PASS - zero errors and the same four accepted `<img>` warnings. |
| `npm run typecheck` | PASS. |
| `npm run test` | PASS - 37 files, 254 tests. |
| `npm run questions:validate` | PASS - 9 questions, 8 objectives, 0 errors, 0 warnings. |
| `npm run questions:validate -- --strict` | PASS - 9 questions, 8 objectives, 0 errors, 0 warnings. |
| `npm run questions:report` | PASS - deterministic coverage output, including one objective with zero questions. |
| `npm run build` | PASS. |
| `npm run check` | PASS - lint, typecheck, 254 tests, question validation, and production build. |
| `git diff --check` | PASS. |

## Chrome-only manual regression

The local Vinext application was checked in the user's Chrome browser. The in-app browser was never initialized.

Passed:

- homepage and all five course cards;
- OPT 376 dashboard and all four module cards;
- Aqueous and Vitreous notes, all six figures, captions, source links, dialog focus, focus containment, Escape close, and focus restoration;
- reading-progress update from two to three reviewed sections and persistence at 50% after reload;
- legacy answer selection, flagging, Next, Previous, numbered navigation, and identical refresh/resume;
- a fully answered 50-question submission, legacy score summary, all 50 review entries, and expanded selected-answer/explanation review;
- browser Back and Forward between quiz and result routes;
- module-reset confirmation dismissal with reading progress and latest score preserved;
- responsive homepage and notes checks at mobile and tablet overrides with no horizontal document overflow;
- no console errors;
- no visible grading-policy selector, pilot question, or new assessment entry point.

## Review focus

- Confirm strict and diagnostic format rules match the documented conservative boundary.
- Confirm historical snapshots require an explicit policy rather than receiving a guessed default.
- Confirm persisted grade summaries are compact, cross-validated, and backward-compatible.
- Confirm `questionHistory` and every live legacy UI/scoring path remain untouched.

# AI Handoff — PR 4

## Pull request

- PR: [#4 — Add the headless assessment session engine](https://github.com/davidagyekum/optometry-study-hub/pull/4)
- Branch: `codex/pr4-assessment-session-engine`
- Base branch: `main`
- Exact base commit: `e3d089a22640ecf7b40a1e0a1d5a8f7b79330925`
- Implementation commit: `61bf41b30af2c3d65b9228a4fdaf940fde34b737`.
- Latest pre-correction GitHub Actions Quality run [30183537341](https://github.com/davidagyekum/optometry-study-hub/actions/runs/30183537341) failed before repository execution: its `quality` job reports no steps, consistent with the existing external account restriction rather than a code/test failure. The correction push will trigger a new run whose final status is recorded in the PR and final Codex report.
- The exact final documentation-only branch head is recorded in the draft PR and final Codex report because a committed file cannot contain its own resulting commit hash.
- Status: DRAFT

## Objective completed

Add a pure, headless assessment-session engine over the PR 3 question schema and StoreV2 foundation while leaving the live 400-question quiz, routes, content, styling, and public student experience unchanged.

PR 5 has not been started.

## Review corrections

The PR 4 review feedback is addressed without connecting the headless engine to the live application:

- replaced the exported registry class with an interface backed by a module-private validated implementation;
- copied registry input and returned defensive question, entry, and bank-ID values so external mutation cannot affect later lookup, eligibility, version, ownership, or presentation order;
- enforced StoreV2 key/record identity for active attempts, results, and question history, including malformed-load preservation and rejection by every assessment-store write;
- made atomic finalization compare attempt ID, course, module, exact ordered questions, exact versions, and exact response keys and values, and reject result-ID collisions;
- rejected duplicate authored image-label answer values so every correct mapping remains representable by the no-reuse response contract;
- made response writes repeat version, course, and module checks against the current registry entry;
- validated attempt snapshots at finalization and rejected non-string ID-factory values before regular-expression checks;
- retained persistence dirty state after failed saves so a later call can retry;
- documented the registry boundary, stale-attempt workflow, one-to-one image labels, keyed storage identity, and atomic finalization contract.

## Implementation

### Registry and deterministic creation

- `lib/assessment/session/registry.ts` validates one or more banks, rejects malformed or duplicate input, exposes structured missing-question lookup, retains stable question metadata, and isolates internal validated content from caller mutation.
- Production eligibility defaults to `approved`. Draft/reviewed questions require an explicit status override, and retired questions additionally require `allowRetiredForArchival`.
- `lib/assessment/session/createAttempt.ts` creates arbitrary positive-length StoreV2 attempt snapshots from explicit question IDs.
- Randomness, time, and IDs are injectable. Question order and the six applicable option/item orders are deterministic for a deterministic random source.

### Response integrity and immutable actions

- `lib/assessment/session/responseValidation.ts` validates all nine persisted response formats without grading them.
- Multiple-response limits come only from explicit authored limits; the engine does not infer grading policy from correct answers.
- `lib/assessment/session/attemptActions.ts` immutably sets, replaces, and clears responses; verifies stored version/course/module identity before response writes; toggles unique flags; and bounds direct, next, and previous navigation.
- Structured issues use stable codes and include attempt, question, or field context when applicable.

### Resume, finalization, and storage

- `lib/assessment/session/resolveAttempt.ts` detects missing/stale questions, course/module disagreement, invalid presentation order, invalid responses, and invalid current indexes without repairing persisted data.
- `lib/assessment/session/finalizeAttempt.ts` validates the attempt, preserves attempt content, rejects non-string result IDs, and accepts only an externally supplied null/null or bounded numeric evaluation.
- `lib/storage/schemas.ts` rejects mixed score states, nonpositive numeric maximum scores, and assessment-map key/record identity disagreement.
- `lib/storage/assessmentStore.ts` provides immutable active-attempt/result CRUD plus collision-safe, exact-snapshot atomic finalization while preserving legacy fields and unrelated assessment records.

### Reporting and documentation

- Question-bank reports now include every declared objective, including objectives with zero questions.
- Added `docs/ASSESSMENT_SESSION_ENGINE.md`.
- Updated the README, current-state document, and redesign roadmap to describe PR 4 as a headless draft implementation.

## Tests

The suite now contains 28 test files and 197 tests.

PR 4 coverage includes:

- registry status policy, duplicate/conflict diagnostics, missing lookup, deterministic defensive copies, mutation isolation, and absence of a public runtime constructor;
- one-, three-, and nine-question deterministic session creation;
- all six applicable presentation-order formats;
- positive and negative responses for all nine formats, plus authored image-label answerability;
- immutable answer, clear, flag, and navigation operations;
- exact resume plus every required stale/invalid snapshot issue;
- stale response-write version/course/module rejection and source immutability;
- ungraded and externally scored finalization boundaries, invalid attempt snapshots, and non-string ID factories;
- immutable StoreV2 insertion, replacement, retrieval, removal, keyed identity validation, malformed-byte preservation, and unrelated-record retention;
- exact atomic snapshot comparison, response-key/value mismatch diagnostics, and collision refusal without overwrites;
- uncovered learning-objective reporting;
- preserved five-course, eight-module, 39-section, 400-question, and 50-per-module legacy invariants;
- confirmation that `LegacyQuizView` does not import the pilot or session engine.

## Behavior and scope

- Intended user-visible changes: none.
- No React component, route, CSS file, legacy educational record, distractor generator, legacy storage key/version, live scoring rule, or deployment configuration changed.
- The nine-question pilot remains draft and publicly unreachable.
- No renderer, blueprint assembler, adaptive selection, grading policy, correctness-history update, account, analytics, database, or cloud storage was added.

## Validation

All commands used bundled Node.js `v24.14.0`.

| Command | Result |
|---|---|
| `npm ci` | PASS — 528 packages installed; npm reported three dependency deprecation notices, one non-fatal Windows cleanup warning, and 23 existing dependency advisories. |
| `npm run lint` | PASS — zero errors and the same four accepted `<img>` warnings. |
| `npm run typecheck` | PASS. |
| `npm run test` | PASS — 28 files, 197 tests. |
| `npm run questions:validate` | PASS — 9 questions, 8 objectives, 0 errors, 0 warnings. |
| `npm run questions:validate -- --strict` | PASS — 9 questions, 8 objectives, 0 errors, 0 warnings. |
| `npm run questions:report` | PASS — deterministic output includes `vitreous-identify-anatomy: 0`. |
| `npm run build` | PASS. |
| `npm run check` | PASS — lint, typecheck, 197 tests, question validation, and production build. |
| `git diff --check` | PASS. |

## Chrome-only manual regression

The local Vinext application was checked only in Chrome; the in-app browser was not used.

Passed:

- homepage and all five course cards;
- OPT 376 dashboard and all four module cards;
- Aqueous and Vitreous notes, six figures, captions, source links, dialog focus, Escape close, and focus restoration;
- reading-progress update and persistence after reload;
- existing 50-question quiz, answer selection, flagging, Next and numbered navigation, refresh, and identical resume;
- a fully answered 50-question submission, score summary, all 50 review entries, and retained latest/best score;
- browser Back and Forward between quiz and result routes;
- global-reset confirmation presence;
- zero new Chrome console errors;
- no visible pilot or assessment-session entry point.

The destructive global reset was not accepted during manual QA so existing browser-local study data would be preserved. The confirmation appeared correctly, and the existing automated reset tests remain green.

## Known limitations and next step

- The public quiz still uses the isolated legacy generator and legacy scoring.
- The pilot remains an engineering fixture pending academic review.
- PR 4 validates response integrity but deliberately does not determine correctness.
- Four existing `<img>` warnings remain.
- npm dependency advisories and Windows cleanup warnings are outside this PR.

Review the pure engine contracts, error model, snapshot compatibility, and StoreV2 helpers. Do not begin PR 5 until this draft PR is reviewed and merged.

---

## Previous PR 3 handoff


## Pull request

- PR: [#3 — Introduce the assessment schema, validation tooling, and storage migration](https://github.com/davidagyekum/optometry-study-hub/pull/3)
- Branch: `codex/pr3-assessment-domain`
- Base branch: `main`
- Base commit: `5b1762c20dcaaabd0505081b972586f0c3b283ab`
- Initial implementation commit: `75e172d7914de15aea71b3f823498b7eceeadc37`.
- Review-correction commit: `d6ed14719a10bac427dc335135c81045e0a5f9a4`.
- The exact final documentation-only branch head is recorded in the draft PR and final Codex report because a committed file cannot contain its own resulting commit hash.
- Status: DRAFT

## Objective completed

Introduce the versioned assessment domain, question-bank validation/lint/report tooling, a nine-format Aqueous and Vitreous pilot, and a backward-compatible V1-to-V2 device-storage migration while leaving the production quiz on the legacy 400-question engine.

The PR 3 review corrections now prevent hydration rewrites, clear both storage generations on global reset, enforce objective ownership and format-reference integrity, and validate persisted assessment semantics.

PR 4 has not been started.

## Files changed

### Assessment source

- `lib/assessment/constants.ts`
- `lib/assessment/schemas.ts`
- `lib/assessment/types.ts`
- `lib/assessment/diagnostics.ts`
- `lib/assessment/validateQuestionBank.ts`
- `lib/assessment/lintQuestionBank.ts`
- `lib/assessment/reportQuestionBank.ts`

The domain defines stable IDs, nine discriminated question formats, objective/source registries, Bloom levels, difficulty, review states, option rationales, misconception tags, question families, and content versions. Semantic validation returns structured error codes; deterministic linting returns non-failing warnings by default.

### Pilot content

- `content/question-bank/pilot/sources.ts`
- `content/question-bank/pilot/objectives.ts`
- `content/question-bank/pilot/questions.ts`
- `content/question-bank/pilot/bank.ts`

The non-production Aqueous and Vitreous pilot contains 9 draft questions, 8 learning objectives, and one example of every supported format. The two new Remember objectives separate outflow-resistance recall and IOP measurement from higher-level pathway and IOP-determinant objectives. It is not imported by the live quiz registry.

### Storage

- `lib/storage/keys.ts`
- `lib/storage/schemas.ts`
- `lib/storage/migrations.ts`
- `lib/storage/store.ts`
- `lib/storage/persistenceCoordinator.ts`
- `hooks/useLegacyStore.ts`
- `app/StudyApp.tsx`
- `lib/legacy/types.ts`
- `lib/legacy/progress.ts`
- `components/home/HomeView.tsx`
- `components/course/CourseView.tsx`
- `lib/storage/legacyStore.ts`

The UI now reads and saves validated `optometry-study-hub:v2` data. Valid V1 `read`, `active`, and `results` fields migrate exactly; ordinary migration leaves V1 untouched for rollback. Initial hydration is not marked dirty, so malformed V1/V2 bytes and valid V2 data are not rewritten. Learner-originated changes still save. The confirmed global reset writes valid empty V1 and V2 records so rollback cannot restore cleared data. The live components continue to consume the same structural legacy fields and the same quiz engine.

### Scripts and configuration

- `scripts/validate-question-bank.ts`
- `scripts/report-question-bank.ts`
- `package.json`
- `package-lock.json`
- `tests/smoke/package-scripts.test.ts`

Added `zod`, `tsx`, `questions:validate`, and `questions:report`. The aggregate `check` command now includes question-bank validation.

### Tests

- `tests/assessment/schema.test.ts`
- `tests/assessment/validation.test.ts`
- `tests/assessment/lint.test.ts`
- `tests/assessment/report.test.ts`
- `tests/storage/migration-v1-v2.test.ts`
- `tests/storage/store-v2.test.ts`
- `tests/storage/persistence-coordinator.test.ts`
- `tests/storage/persisted-state-semantics.test.ts`
- `tests/assessment/validation-regressions.test.ts`
- `tests/fixtures/valid-question-bank.ts`
- `tests/fixtures/invalid-question-bank.ts`

The final suite contains 18 test files and 118 tests. Coverage includes all nine formats, stable response IDs, objective ownership and Bloom alignment, duplicate/reference adversaries, source identity, deterministic reports, pure migration, exact V1 field preservation, rollback-key retention, clean hydration, two-generation reset, semantic attempt/result/history invariants, corruption handling, round trips, and throwing storage access.

### Documentation

- `docs/ASSESSMENT_SPEC.md`
- `docs/QUESTION_AUTHORING_GUIDE.md`
- `docs/STORAGE_MIGRATION.md`
- `docs/CURRENT_STATE.md`
- `docs/ASSESSMENT_REDESIGN_ROADMAP.md`
- `README.md`
- `AI_HANDOFF.md`

The current-state and README architecture/storage descriptions were updated because they still described the pre-PR-2 monolith and V1 as the active record.

## Behaviour

- Intended user-visible changes: none.
- Confirmed preserved behaviour: five courses, eight modules, 39 sections, 400 live legacy questions, 50 live questions per module, current question wording/distractor generation, notes, images, routes, scoring, reset labels, and CSS.
- Storage impact: valid V1 progress automatically migrates to validated V2 and leaves V1 for rollback; hydration does not rewrite valid or malformed records; later learner actions save; global reset writes empty valid V1 and V2 records; unavailable storage does not crash.
- Content impact: nine draft pilot examples were added outside the live registry. No existing educational content or legacy question was edited.

## Validation

All commands used bundled Node.js `v24.14.0`.

| Command | Result |
|---|---|
| `npm ci` | PASS — 528 packages installed; npm retained 23 dependency advisories and emitted two non-fatal Windows cleanup warnings. |
| `npm run lint` | PASS — same four accepted `<img>` warnings, zero errors. |
| `npm run typecheck` | PASS. |
| `npm run test` | PASS — 18 files, 118 tests. |
| `npm run questions:validate` | PASS — 9 questions, 8 objectives, 0 errors, 0 warnings. |
| `npm run questions:validate -- --strict` | PASS — 9 questions, 8 objectives, 0 errors, 0 warnings. |
| `npm run questions:report` | PASS — deterministic report with composite course/module/section keys. |
| `npm run build` | PASS. |
| `npm run check` | PASS — lint, typecheck, tests, question validation, and production build. |

## Manual verification

Chrome-only checks on the local Vinext server passed for:

- homepage and all five course cards;
- OPT 376 course page and its four module cards;
- Aqueous and Vitreous notes, six sections, figures, captions, and source links;
- figure-dialog initial focus and Escape close;
- reading progress update and refresh persistence through the V2 wrapper;
- legacy 50-question quiz start;
- answer selection, flagging, Next navigation, refresh, identical active-attempt resume, and `1/50 answered` persistence;
- save-and-exit and course-card `Resume quiz` state;
- unanswered-submission warning appearance.

After the unanswered confirmation was accepted, Chrome control stalled before the results page could be re-read. Results rendering/scoring code was not changed, and the automated legacy result tests remain green. Back/forward and mobile-width checks were not repeated after the stall; CSS and route code are unchanged. The in-app browser was never used.

## Review corrections

- Added a persistence coordinator so hydration remains clean and only learner-originated updates are saved.
- Added a storage-level reset helper and wired the visible global reset to clear valid V1 and V2 records.
- Added deterministic objective ownership, Bloom, duplicate-reference, normalized-text, exact-set, and source-identity diagnostics.
- Split the two recall items into academically aligned Remember objectives, increasing the pilot from 6 to 8 objectives without changing its 9 questions.
- Added semantic Zod validation for assessment attempts, results, history, timestamps, stable IDs, snapshot references, counts, scores, and response-array uniqueness.

## Deviations from the brief

- Added `content/question-bank/pilot/sources.ts` as a small source-registry module so questions and objectives share identical stable references.
- Retained the public hook name `useLegacyStore` to avoid unnecessary orchestration churn even though it now returns the V2 store.
- If a V2 record exists but is malformed, loading does not overwrite it by migrating V1. This treats V1 fallback as valid only when V2 is absent and prevents silent destruction of corrupt V2 data.
- Current-state and README corrections were included because PR 3 changes the active persistence contract and the merged documents still described the old monolithic architecture.

## Known limitations

- The production quiz still uses the isolated positional legacy distractor generator.
- The pilot questions are draft engineering fixtures and require academic review before any future live use.
- No multi-format renderer, assessment assembler, adaptive mastery, spaced repetition, AIKEN export, Aiken’s V calculation, account, backend, or cloud storage was added.
- Four existing `<img>` lint warnings remain.
- npm reports 23 existing dependency advisories (4 moderate, 19 high); remediation is outside this PR.
- GitHub Actions `Quality` run [30178170009](https://github.com/davidagyekum/optometry-study-hub/actions/runs/30178170009) for review-correction commit `d6ed147` failed with zero job steps and no repository commands executed, consistent with the existing external account restriction.

## Recommended next step

Review and approve the assessment schema, migration behavior, validator diagnostics, pilot quality, and authoring documentation. Do not begin PR 4 or migrate the 400 live questions until PR 3 is reviewed and merged into `main`.
