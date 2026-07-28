# AI Handoff — PR 12

## Pull request

- Branch: `codex/pr12-release-hardening-sites`
- Base branch: `main`
- Exact base commit: `e8b9810ff6f2898c9bc85d37da72f069ee049115`
- Draft PR: pending
- Suggested title: `Harden the HVP release and prepare the Sites production rollout`
- The final implementation SHA, manifest checksum, test totals, and Actions
  identifiers are reported in the draft PR and final handoff because this
  committed file cannot contain its own resulting commit SHA.

## Implemented scope

- Added exact disabled and HVP public-beta profiles. Every release profile
  rejects Aqueous exposure; committed defaults remain false.
- Added cross-platform dual-build, bundle-audit, clean-tree manifest, checksum,
  report, and complete release-verification scripts.
- Added canonical counts, HVP checksum, draft-status, ten-format, storage,
  hosting, D1/R2, route, and import-isolation assertions.
- Recorded PR 11 byte baselines and enforce ten-per-cent output budgets. Build
  duration remains observational.
- Added Worker HTML security headers while preserving status, body, content
  type, redirects, cache behavior, and image responses.
- Added semantic landmarks, skip navigation, route-aware titles, explicit
  not-found rendering, main-content focus after client/history navigation,
  reduced-motion behavior, and visible focus treatment.
- Centralized HVP learner status: internally verified and slide-aligned
  curated study practice, not lecturer-approved examination items, stored only
  on this device.
- Added upgrade, rollback-key, reset, profile, route, accessibility, content,
  bundle, manifest, and security regression tests.
- Added a manual release-candidate workflow and release, rollback, security,
  budget, and checklist documentation.

## Preserved contracts

- Five courses, eight modules, 39 sections, and 400 legacy questions.
- Aqueous: 36 draft questions, 13 draft objectives, exact nine-item disabled
  engineering pilot.
- HVP: 120 draft questions, 23 draft objectives, 19 sources, six SVG diagrams,
  and canonical checksum
  `029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a`.
- StoreV2 key `optometry-study-hub:v2`, version 2, rollback key
  `opt376-study-state:v1`, legacy scoring, HVP question history, and
  device-local privacy.
- No question or objective review status changed. No D1, R2, backend,
  analytics, account, migration, deployment, merge, or later PR was added.

## Production baseline

- Inspected read-only in Chrome on 2026-07-28.
- URL: https://opt-376-eye-anatomy-review.davorion7.chatgpt.site
- Sites project: `appgprj_6a5614a4d1288191966f6f3570f99f22`
- Published version: 3
- Recorded source commit: `18ba5aebdef82402e26c1937d4e2bb1638a7a116`
- Recorded archive content hash:
  `sha256:06cf3d451a20b183fa0b0a8493795b75262498515f3b6de9dcf06dac31061688`
- No D1 or R2 binding. The old production UI exposes the five-course legacy
  experience; `/practice` falls back to Home and produced no console errors.
- Production state and storage were not mutated.

## Automated validation

- Runtime: bundled Node.js 24.
- Focused PR 12 suite: 15 files and 108 passing tests.
- Lint: passed with the four pre-existing `<img>` warnings.
- TypeScript: passed after focused corrections.
- `npm ci`: passed under bundled Node.js 24. npm reported 23 existing audit
  findings and two non-fatal Windows cleanup warnings.
- Lint: passed with the four pre-existing `<img>` warnings.
- TypeScript: passed.
- Full Vitest suite: **127 files and 752 passing tests**.
- Aqueous validation and strict validation: 36 draft questions, 13 draft
  objectives, zero errors, zero warnings.
- HVP validation: 120 draft questions, 23 draft objectives, 19 sources, zero
  errors, and the unchanged 79 authoring warnings.
- Aqueous and HVP reports and blueprint reports: passed.
- Disabled and HVP public-beta production builds: passed with Aqueous false.
- Bundle isolation and performance audits: passed for both profiles.
- Final ordinary production build, `npm run check`, and
  `git diff --check`: passed.
- Clean-tree release verification, the final manifest checksum, final branch
  SHA, and GitHub Actions status are reported in the draft PR and final handoff.

## Browser QA

- Chrome only; the in-app browser was never initialized.
- Read-only live baseline: Home and the legacy HVP quiz worked, controlled
  HVP was unavailable, `/practice` fell back to the old Home experience, and
  no console errors appeared. Production storage was not read or changed.
- Disabled local profile: Home, Practice, Progress, module detail, legacy quiz,
  HVP unavailable state, Aqueous unavailable state, direct routes, and absence
  of curated analytics passed.
- HVP public-beta profile: release warning, Quick start, answer and flag
  autosave, hard-refresh resume, incomplete-submission review, exact result
  review, Written Practice `Not scored`, Progress analytics, Aqueous
  isolation, and legacy quiz preservation passed.
- Keyboard skip navigation, route focus, back/forward titles and focus, direct
  deep links, explicit not-found state, figure enlargement/Escape/focus
  restoration, hotspot keyboard selection, multiple-response rendering, and
  390×844, 768×1024, 1024×768, and 1440×900 overflow checks passed.
- Chrome logs contained only Vite/React development information and no errors.
  Automated coverage supplies deterministic malformed-storage, reduced-motion,
  ten-format renderer, reset, and no-answer-leak checks.
- No production mutation or deployment is authorized.

## Publishing

- Production deployment: not performed.
- Publication requires merge, exact clean `main` verification, reviewer
  approval, and separate explicit authorization under
  `docs/RELEASE_RUNBOOK.md`.
- No subsequent PR was started.

## Remaining release-audit review corrections

- Added strict, atomic build metadata binding each copied release output to its schema version, exact profile and flags, clean Git commit and tree, Node/npm versions, timestamp, duration, output directory, and SHA-256 fingerprint.
- Made release builds remove stale profile metadata before work starts and withhold final metadata after any failed or explicitly dirty development build.
- Made standalone bundle auditing reject missing, malformed, stale, wrong-profile, wrong-flag, Aqueous-enabled, wrong-commit, wrong-tree, dirty-tree, wrong-directory, and wrong-fingerprint evidence.
- Bound manifest creation independently to the audit profile, validated build identity, current clean Git identity, required flags, and copied-output fingerprint. The human report includes the complete bound identity.
- Audited both `HvpPracticeRouter` and `HvpProgressPanel` dynamic entries, with separate initial, controlled, analytics, and combined closures.
- Corrected disabled and HVP-enabled Practice/Progress measurements, separated controlled and analytics incremental bytes, and used a union to avoid double-counting shared chunks.
- Re-measured the untouched PR 11 base `e8b9810ff6f2898c9bc85d37da72f069ee049115` with the corrected algorithm and reset byte budgets to approximately ten per cent headroom.
- Expanded isolation scans across multiple sections and formats, including representative answer identities. Reports expose only marker counts and pass/fail details.
- Added enabled Home, Practice, and Progress DOM tests proving that stems, explanations, correct-answer identifiers, and option rationales are not rendered before controlled practice.
- Added regression coverage for identity mismatches, missing/malformed metadata, both lazy-entry failures and eagerness, route closure inclusion, and shared-chunk de-duplication.
- `release:verify` now requires a clean tree before deleting all prior release evidence, rebuilds both profiles, and confirms the fresh manifest matches the HVP build metadata.

## Review-correction validation

- Locked dependency reinstall: passed under bundled Node.js 24; npm retained the existing 23 audit findings and non-fatal Windows cleanup warnings.
- Lint: passed with the four pre-existing `<img>` warnings.
- TypeScript: passed.
- Full Vitest suite after the correction: **128 files and 774 passing tests**.
- Corrected untouched-PR-11 baselines and approximately ten-per-cent budgets are recorded in `docs/RELEASE_BASELINE_AND_BUDGETS.md`.
- Final question validation, dual clean builds, audits, source-bound manifest, `release:verify`, `npm run check`, Chrome QA, final head, and GitHub Actions status are recorded after the clean final validation.
