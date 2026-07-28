# Release checklist

## Completed in PR

- [x] Identity assertions cover the base, project, storage, and content model.
- [x] Content counts, HVP checksum, and draft review statuses are automated.
- [x] Committed feature-flag defaults remain false.
- [x] StoreV2 upgrade, malformed-record, reset, and rollback-key behavior is tested.
- [x] Quality tests and strict question-bank checks are wired into release verification.
- [x] Disabled and HVP public-beta builds have dedicated cross-platform scripts.
- [x] Every release build records a strict clean commit/tree/profile/flags/fingerprint identity.
- [x] Metadata is removed before building and written atomically only after copied-output fingerprinting.
- [x] Standalone audit and manifest commands reject stale or mismatched evidence.
- [x] Both HVP lazy entries, their separate closures, and their combined union are audited.
- [x] Disabled and enabled Practice/Progress route sizes are measured correctly.
- [x] Multiple authored and answer-identity markers enforce bundle isolation without report leakage.
- [x] Enabled Home, Practice, and Progress DOM tests prohibit pre-practice answer rendering.
- [x] Corrected PR 11 performance baselines and byte budgets are recorded and enforced.
- [x] Accessibility, focus, reduced-motion, route identity, and not-found behavior are hardened.
- [x] Worker security headers are covered by response-preservation tests.
- [x] Existing live production was inspected read-only in Chrome.
- [x] Rollback levels and stop conditions are documented.

## Required after merge

- [ ] Confirm the reviewed squash commit is the exact new `main` head.
- [ ] Confirm the checkout and tree are clean.
- [ ] Run `npm ci` and `npm run release:verify` on that exact commit.
- [ ] Confirm release verification removed all stale evidence before rebuilding.
- [ ] Review both build-metadata records and bundle audits.
- [ ] Confirm the HVP manifest matches its audit and build metadata for commit,
  tree, profile, flags, output directory, and fingerprint.
- [ ] Review the generated manifest checksum and every budget.
- [ ] Complete Chrome QA on the exact release candidate at all required sizes.
- [ ] Obtain reviewer approval for the generated release evidence.
- [ ] Record the currently published Sites version and commit again.

## Required during publish

- [ ] Obtain explicit publish authorization.
- [ ] Confirm Aqueous false and HVP true in the release artifact.
- [ ] Confirm the existing Sites project ID, public URL, no D1, and no R2.
- [ ] Save a new Sites version from the exact reviewed source and commit.
- [ ] Deploy only that saved version.
- [ ] Record deployment ID, Sites version, commit, tree, output fingerprint,
  timestamp, operator, and manifest checksum.
- [ ] Keep the previous production version available for rollback.

## Required after publish

- [ ] Confirm Home, Practice, Progress, notes, legacy quiz, and direct routes.
- [ ] Confirm HVP status wording, Quick practice, Written Practice, and results.
- [ ] Confirm persistence, refresh, and device-local privacy behavior.
- [ ] Confirm mobile layout, keyboard focus, reduced motion, modal behavior, and zoom.
- [ ] Confirm production response security headers.
- [ ] Confirm zero new console errors and no unexpected external requests.
- [ ] Compare the deployed release with the approved source-bound manifest.
- [ ] Close or initiate rollback based on the documented stop conditions.
