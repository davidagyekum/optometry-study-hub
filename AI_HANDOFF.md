# AI Handoff - PR 10

## Pull request

- Branch: `codex/pr10-adaptive-practice-history`
- Base branch: `main`
- Exact base commit: `c30fcc67c14dccd14eff0fd5f821eada4e084fb9`
- Suggested title: **Add reusable practice blueprints, targeted practice, and question history**
- Draft PR: https://github.com/davidagyekum/optometry-study-hub/pull/10
- Status: implementation and local validation complete; awaiting review.

## Implemented scope

- Added a strict dedicated `true_false` domain, boolean draft/response
  contracts, accessible renderer, all-or-nothing grading, review rendering,
  validation, and isolated tests. No canonical question was converted.
- Added strict version-1 reusable practice blueprints and immutable persisted
  selection snapshots.
- Preserved legacy PR 9 Full attempts/results without selection metadata.
- Added deterministic HVP Quick 10, Standard 25, preserved Full 50, Custom
  5-50, unseen, retry-missed, weak-topic, challenge, and mixed practice.
- Added one-active-HVP-family recovery, explicit discard, and atomic
  replacement across scored and written HVP practice.
- Activated backward-compatible, version-aware question history only for HVP
  practice and made it atomic with result finalization.
- Added separate two-question written practice with manual-required outcomes,
  no fabricated percentage, local drafts, resume, flags, and rubric review.
- Added focused accessible practice-selection UI and result context.
- Added a pure controlled-experience routing boundary so both scored and
  written HVP snapshots are routed through the HVP flag, while the Aqueous
  pilot remains isolated.

## Preserved boundaries

- Five courses, eight modules, 39 study sections, 400 legacy-generated
  questions, legacy scoring, Latest/Best values, and legacy result history are
  unchanged.
- `optometry-study-hub:v2` and V1 rollback behavior are unchanged.
- HVP `bank.json` is byte-for-byte unchanged at SHA-256
  `029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a`.
- HVP remains 120 draft questions, 23 draft objectives, 19 sources, and six SVG
  diagrams.
- Aqueous remains 36 draft questions; its exact nine pilot items and semantic
  hashes are unchanged and its history policy remains disabled.
- Both committed assessment flags remain `false`.
- No reviewer identity, rating, decision, or status promotion was added.
- No deployment or PR 11 work occurred.

## Automated validation

- Runtime: bundled Node.js 24.14.0.
- `npm ci`: passed from the committed lockfile.
- `npm run lint`: passed with only the four documented legacy `<img>`
  warnings.
- `npm run typecheck`: passed.
- `npm run test`: 97 test files and 576 passing tests.
- Quick, Standard, and Full profiles each passed 1,000 deterministic seeds.
- `npm run questions:validate` and `--strict`: passed (36 questions,
  13 objectives, zero errors and zero warnings).
- `npm run questions:report` and `questions:blueprint`: passed.
- `npm run questions:validate:hvp`: passed (120 questions, 23 objectives,
  19 sources, zero errors; 79 preserved authoring warnings).
- `npm run questions:report:hvp` and `questions:blueprint:hvp`: passed.
- Production builds passed with HVP practice disabled and enabled while the
  Aqueous pilot remained disabled.
- `npm run check`: passed after the final routing correction.
- `git diff --check`: passed.

## Chrome-only QA

- Verified notes entry point and direct practice route.
- Verified Quick 10 answer, flag, refresh/resume, incomplete-submission
  warning, scored result, result context, and atomic history update.
- Verified Standard 25 creation and saved active-attempt recovery.
- Verified targeted availability changes truthfully and insufficient
  retry-missed/weak-topic pools stay disabled.
- Verified Custom 5 with a Foundations-only filter produces exactly five
  questions without filter expansion.
- Verified atomic replacement of a scored attempt with written practice.
- Chrome found and prompted correction of the written-attempt routing boundary;
  a regression test now covers scored and written HVP routes.
- Verified both written responses autosave across refresh, submit as exactly
  two manual-review outcomes, show rubrics, and display no fabricated
  percentage.
- Verified mobile layout without horizontal overflow and the unchanged legacy
  50-question HVP quiz entry point.
- Verified the disabled HVP feature-gate page with both flags false.
- Chrome console: zero new errors.

## Publishing state

- Production deployment: not performed.
- PR 11: not started.
- GitHub Actions run 30315678159 and job 90140567142 ended in the known
  external account restriction with zero executed steps. No repository
  checkout, install, test, validation, or build step ran. The PR description
  and final report record the latest observed run after the final push.
- The final branch-head SHA and draft PR URL are reported in the PR and final
  response because a committed file cannot embed its own resulting SHA.
