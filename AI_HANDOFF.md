# AI Handoff

## Pull request

- PR: [#3 — Introduce the assessment schema, validation tooling, and storage migration](https://github.com/davidagyekum/optometry-study-hub/pull/3)
- Branch: `codex/pr3-assessment-domain`
- Base branch: `main`
- Base commit: `5b1762c20dcaaabd0505081b972586f0c3b283ab`
- Initial implementation commit: `75e172d7914de15aea71b3f823498b7eceeadc37`.
- Review-correction commit and the exact final branch head are recorded in the draft PR and final Codex report because a committed file cannot contain its own resulting commit hash.
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
- GitHub Actions `Quality` run [30173040423](https://github.com/davidagyekum/optometry-study-hub/actions/runs/30173040423) failed with zero job steps and no repository commands executed, consistent with the existing external account restriction.

## Recommended next step

Review and approve the assessment schema, migration behavior, validator diagnostics, pilot quality, and authoring documentation. Do not begin PR 4 or migrate the 400 live questions until PR 3 is reviewed and merged into `main`.
