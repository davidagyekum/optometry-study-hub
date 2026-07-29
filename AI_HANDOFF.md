# AI Handoff — PR 13

## Pull request

- Branch: `codex/pr13-generalize-curated-practice`
- Base branch: `main`
- Exact base commit: `14a884235e7a2976a7da8de881f4411b6265b1d5`
- Exact base tree: `8c35f84e6f842819a1c3c66851067adbbab74642`
- Draft PR: pending
- Suggested title: `Generalize curated practice for additional optometry modules`
- Final commit, tree, changed-file count, test totals and Actions identifiers
  will be recorded in the draft PR and final report.

## Baseline

- Working tree was clean and synchronized with the required main commit.
- Bundled Node.js 24 and npm 10.9 were used.
- `npm ci`, `npm run check` and `npm run release:verify` passed before
  branching.
- Baseline Vitest: 128 files and 774 tests.
- Lint retained the four known `<img>` warnings.
- Both committed feature flags were false.
- HVP checksum remained
  `029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a`.

## Implemented scope

- Added strict, answer-free curated-experience summary and lazy adapter types.
- Added a validated production registry containing HVP only; duplicate
  experience, route, module/composite binding and blueprint identities fail
  closed. One course may host multiple distinct modules.
- Added generic route and persisted-blueprint resolution, controlled router,
  unavailable state and release-status presentation.
- Added generic latest-store transaction composition and retained the complete
  HVP controller as the experience-specific adapter.
- Added generic Progress composition and retained HVP compatibility and
  analytics as the lazy data adapter.
- Updated Study, Practice and Progress discovery to use safe registry summaries
  without importing answer-bearing banks.
- Added a synthetic non-medical test-only adapter proving generic routing,
  lazy loading, progress composition and Practice Hub discovery.
- Preserved the existing Aqueous pilot as a separate disabled experience.

## Preserved contracts

- Five courses, eight modules, 39 sections and 400 legacy questions.
- HVP: 120 draft questions, 23 draft objectives, 19 sources, six SVG diagrams,
  canonical JSON bytes, IDs, versions, routes, profiles, quotas, compatibility,
  results and question-history semantics.
- Aqueous: 36 draft questions, 13 draft objectives and exact nine-question
  disabled engineering pilot.
- StoreV2 key `optometry-study-hub:v2`, version 2, rollback key
  `opt376-study-state:v1`, legacy Latest/Best scores and browser-local privacy.
- No question or objective content or review status changed.
- Both committed feature flags remain false.
- No new bank, D1, R2, backend, account, analytics, migration, deployment,
  publication or later PR was added.

## Validation

- `npm ci` passed with the committed lockfile under bundled Node.js 24.
- `npm run lint` passed with zero errors and the four existing `<img>`
  warnings.
- `npm run typecheck` passed.
- `npm run test` passed: 136 files and 797 tests.
- Aqueous validation and blueprint reporting passed: 36 draft questions,
  13 draft objectives and zero diagnostics.
- HVP validation and blueprint reporting passed: 120 draft questions,
  23 draft objectives, 19 sources, zero errors and the 79 unchanged advisory
  warnings.
- `npm run build` and `npm run check` passed.
- `git diff --check` passed.
- Chrome-only QA passed with the disabled profile and the HVP-enabled local
  profile. It covered Study, Practice, Progress, legacy quiz, curated landing,
  Quick 10 persistence and exact 1/10 result review, Written Practice,
  Aqueous isolation, unknown-route handling, responsive layouts, browser
  history and route-aware titles. No new console errors or horizontal overflow
  were observed.
- The first clean release audit identified three stale PR 11 lazy-boundary
  byte baselines after the generic adapter split. The affected controlled,
  analytics and combined boundaries were remeasured on the clean implementation
  commit, documented, and retained the standard ten-per-cent headroom.
- The final clean-commit `npm run release:verify` result and release-manifest
  identity will be added to the draft PR description and final report.

## Publishing

- Production deployment: not performed.
- PR 13 must remain a draft pending review.
- Do not merge or deploy without separate explicit authorization.
