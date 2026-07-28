# AI Handoff - PR 10

## Pull request

- Branch: `codex/pr10-adaptive-practice-history`
- Base branch: `main`
- Exact base commit: `c30fcc67c14dccd14eff0fd5f821eada4e084fb9`
- Draft PR: https://github.com/davidagyekum/optometry-study-hub/pull/10
- Status: all requested correctness/integrity review findings addressed; draft
  retained for review.
- The exact correction commit and final branch head are recorded in the PR
  description and final report because a committed file cannot contain its own
  resulting SHA.

## Review corrections

- Made `opt374-hvp-written-v1` explicitly `manual-only`. Zero, one and two
  answered prompts always persist null score/maximum; unanswered and
  `manual_required` item statuses remain intact. Result routing uses
  `blueprintId`, and written summaries/cards expose no numeric score,
  percentage or scored breakdown.
- Corrected history semantics: manual responses increment encounter,
  supplied-response and manual-review metadata but never automatic attempt,
  correct, partial or incorrect counters.
- Defined section-level weakness as at least two gradable attempts plus either
  sub-80% accuracy or a current-version latest miss. Perfect and
  unanswered-only history is excluded; weak severity, miss recency and
  advanced higher-order challenge priority are preserved.
- Applied the family repetition cap to displayed targeted availability.
- Added immutable sorted strategy-eligible question-ID evidence and a
  deterministic integrity hash. Saved targeted/custom attempt and result
  compatibility now fails closed on evidence alteration or membership
  substitution.
- Strengthened blueprint/selection contracts, including exact fixed-profile
  sets, profile/strategy compatibility, known sections, unique formats/review
  states and valid target totals/minimums. The preserved Full bypass validates
  before assembly.
- Completed atomic finalization identity with `blueprintId`, selection-bound
  history policy and deterministic registry regrading before any attempt,
  result or history mutation.
- Removed generic version-1 eligibility assumptions. Current positive authored
  versions are assembled and persisted exactly; newer history replaces older
  mastery and downgrades fail.
- Quick, Standard and Full prefer unseen current-version candidates while
  preserving every quota, family limit and higher-order minimum.
- Chrome found one remaining per-item `0 / 1` display in an unanswered
  written result. Written review cards now say `Not scored`; a regression
  covers the stronger no-numeric-score boundary.

## Preserved boundaries

- Five courses, eight modules, 39 study sections, 400 legacy-generated
  questions, legacy quiz/scoring, Latest/Best values and legacy history are
  unchanged.
- StoreV2 remains `optometry-study-hub:v2`; no migration or storage-key
  change was introduced.
- The HVP canonical bank remains byte-for-byte unchanged at SHA-256
  `029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a`:
  120 draft questions, 23 draft objectives, 19 sources and six SVG diagrams.
- Aqueous remains 36 draft questions; its bank, nine pilot items, semantic
  hashes and disabled history boundary are unchanged.
- `.env.example` still commits
  `NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false` and
  `NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=false`.
- No review-status promotion, deployment or PR 11 work occurred.

## Automated validation

- Runtime: bundled Node.js 24.14.0.
- `npm ci`: passed from the committed lockfile. The Windows npm shim initially
  selected Node 22.11 and omitted an optional native dependency; the clean
  install and all child processes were rerun explicitly under Node 24.
- `npm run lint`: passed with only the four documented legacy `<img>`
  warnings.
- `npm run typecheck`: passed.
- `npm run test`: **103 test files and 600 passing tests**.
- `npm run questions:validate` and `--strict`: passed (36 questions,
  13 objectives, zero errors/warnings).
- `npm run questions:report` and `questions:blueprint`: passed.
- `npm run questions:validate:hvp`: passed (120 questions, 23 objectives,
  19 sources, zero errors; 79 preserved authoring warnings).
- `npm run questions:report:hvp` and `questions:blueprint:hvp`: passed.
- Production builds passed with HVP disabled and enabled while Aqueous was
  explicitly disabled.
- Final `npm run check` and `git diff --check`: passed after Chrome QA.
- Coverage includes zero/one/two written responses, manual-history isolation,
  perfect/unanswered/weak history, ranking/family availability, all four
  targeted strategy substitutions in attempts and results, evidence mutation,
  strict selection/blueprint rejection, atomic rollback, current version 2,
  and unseen preference for Quick/Standard/Full.

## Chrome-only QA

- Verified direct curated route and notes entry while HVP was enabled.
- Verified entirely unanswered, partially answered and fully answered Written
  Practice. All results showed manual review, correct item statuses and
  `Not scored` without percentages, numeric marks or scored breakdowns.
- Verified clean history disables weak-topic/retry practice and missed history
  enables the appropriate targeted state; family-aware availability is covered
  by the UI/domain regression.
- Verified saved Unseen practice resumed after refresh with the identical
  attempt URL and question position.
- Verified the unchanged legacy 50-question quiz entry remains beside the
  curated notes entry.
- Verified 390×844, 1024×768 and 1440×900 layouts without horizontal overflow.
- Verified enabled and explicitly disabled feature-gate routes in Chrome.
- Fresh enabled and disabled Chrome tabs reported zero console errors.

## GitHub Actions and publishing

- The pre-correction Actions run remains the known external account restriction
  with zero executed repository steps. No CI command failed in repository code.
- The post-push run and job IDs are recorded in the draft PR description and
  final report rather than causing an endless handoff-only commit/run cycle.
- Production deployment: not performed.
- PR 11: not started.
