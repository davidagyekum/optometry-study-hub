# AI Handoff — PR 8

## Pull request

- Branch: `codex/pr8`
- Base branch: `main`
- Exact base commit: `a1b43c79adc92d2e2402c8913ee5f85b7931f5e0`
- Suggested title: **Add evidence-bound expert-review campaigns and promotion-readiness gates**
- Draft PR: https://github.com/davidagyekum/optometry-study-hub/pull/8
- Implementation commit: `a8b1d9a3aa8458be8aa0e6d8db4ee3d4a31bd695`.
- The exact final head remains in the PR description because a committed file cannot contain the SHA produced by its own commit.
- Status: implementation, local validation, and draft publication complete; no deployment; PR 9 not started.

## Implemented contracts

- Review policy: `opt376-expert-review@1`, minimum three independent unconflicted reviewers, project Aiken discussion flag 0.80, low-rating boundary 2.
- Reviewer profiles: consent-aware version-1 schema with stable pseudonymous IDs, roles, expertise, independence attestation, and declared conflicts.
- Campaigns: version-1 manifest bound to the canonical bank, exact blueprint, question versions and hashes, objectives, registered sources, criterion matrix, reviewers, and policy.
- Commands: `questions:review-campaign`, `questions:review-merge`, `questions:review-readiness`, `questions:review-verify`, and `questions:review-snapshot`.
- Stable states: `not-started`, `incomplete`, `requires-resolution`, and `ready-for-human-decision`.
- Human decisions: `revise`, `retain-draft`, `eligible-for-reviewed`, and `retire`; no approved decision exists.
- Transition verification is pure and never mutates a question.

## Synthetic command fixture

- Campaign: `test-aqueous-review`, fixed timestamp `2000-01-01T00:00:00.000Z`.
- Three fictional pseudonymous reviewers; no display names, affiliations, real ratings, comments, decisions, or academic evidence.
- 338 blank evidence-bound rows per reviewer; 1,014 merged coverage rows.
- Rating-free readiness result: 36 not started, 338 blocking no-rating issues, zero questions ready for a human decision.
- Empty decision verification is structurally valid, reports all 36 questions without decisions, and produces an evidence-bundle hash recorded in the final report.

## Preserved boundaries

- Exactly 36 candidate questions, 27 non-pilot candidates, nine preserved pilot questions, and 13 objectives.
- Every current question and objective remains `draft`; no reviewer field was added.
- All nine pilot semantic hashes remain unchanged.
- `.env.example` remains `NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false`.
- The live 400-question legacy quiz, scoring metrics, StoreV1/StoreV2, question history, routes, and learner UI are unchanged.
- Campaign code and generated `tmp` artifacts are not imported by the browser application.
- PR 8 includes no real reviewer registry, ratings, comments, resolutions, or decisions.

## Deterministic evidence

- Canonical campaign bank hash: `c17370c8e6a871120cf3db7571fd14b03032b1068557e6e54d8c5a8ac166e24d`.
- Rating-free synthetic evidence-bundle hash: `03bd9d16fb5198300d83953447b46b2fb32e7eb14179646f0befcbe2a31e4b1f`.
- The fixed synthetic campaign creates three 338-row reviewer packs and merges 1,014 coverage rows independent of input order.
- Readiness reports 36 `not-started` questions, 338 blocking no-rating issues, zero numeric ratings, zero real comments, and zero questions ready for human decision.
- Decision verification accepts the empty synthetic decision set as structurally valid, reports all 36 questions without decisions, and mutates no source.

## Final local validation

Validation used bundled Node.js 24.14.0 with Node 24 first on PATH for every child worker:

- `npm ci`: passed from the committed lockfile; npm reported 23 existing dependency advisories and harmless Windows optional-package cleanup warnings.
- `npm run lint`: passed with only the four pre-existing legacy `<img>` warnings.
- `npm run typecheck`: passed.
- `npm run test`: passed, 79 test files and 499 tests.
- `npm run questions:validate`: passed, 36 questions, 13 objectives, 0 errors, 0 warnings.
- `npm run questions:validate -- --strict`: passed.
- `npm run questions:report`: passed with exact declared coverage and 36 draft questions.
- `npm run questions:blueprint`: passed with 0 diagnostics and unchanged exact targets.
- `npm run questions:review-pack`: passed, 36 questions and 338 rows.
- `npm run questions:aiken -- --input tests/fixtures/review/valid-ratings.csv`: passed; the preserved 5, 5, 4 example remains numerator 11, denominator 12, V 0.916667.
- All five new campaign commands passed with the committed synthetic fixtures.
- `npm run build`: passed.
- `npm run check`: passed to completion.
- `git diff --check`: passed.

## Chrome-only application regression

Chrome tested the local site without using the in-app browser.

- With `NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false`: homepage rendered all five course cards; the Neuro Anatomy course rendered four modules; Aqueous notes rendered all six sections and attributed figures; the legacy 50-question quiz loaded, saved an answer and flag, and resumed identically after refresh; the direct pilot route showed the unavailable screen.
- With the flag temporarily set to `true` only for QA: the landing page exposed exactly nine draft questions; no 36-question launcher, reviewer profile, campaign data, review command, or hidden candidate appeared.
- The nine-question attempt saved and resumed one answered/flagged open response, then completed all nine formats and submitted normally. Results showed seven automatic correct, one automatic incorrect, zero unanswered, and one manual-review open response. This local QA result is not academic evidence and does not affect the legacy score.
- Current localhost console checks contained zero new warnings or errors. One historical log from an earlier localhost:3001 session was excluded by URL and timestamp.
- The source feature flag remains `NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false`.

## GitHub Actions

- Initial pull-request run: `30233643720` (`Quality` run 34).
- Job: `89877082067` (`quality`).
- GitHub marked the job failed before executing any steps; the connector returned `steps: null`.
- This is the repository's known external account restriction, not a failure of checkout, install, lint, type-checking, tests, question validation, or build.
- The PR description records the latest final-head run and job IDs after the handoff commit is pushed.

## Known limitations

- Real independent experts still need to be recruited and genuine feedback resolved.
- Aiken's V is descriptive project evidence and never automatic proof of validity.
- Current image rights and coordinate evidence still requires expert confirmation.
- A later evidence-backed pull request is required for any selected draft-to-reviewed transition.
- Approval and public pilot enablement remain separate future decisions.
- The other seven modules remain unconverted.
- GitHub Actions may remain blocked before checkout by the known external account restriction.
