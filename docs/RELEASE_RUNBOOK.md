# Release runbook

This runbook prepares a reviewed HVP public-beta release for the existing
OpenAI Sites project. It does not authorize publication.

## Pre-publish

- Obtain explicit reviewer approval and separate publication authorization.
- Record the exact reviewed, merged `main` SHA. The PR 12 base is
  `e8b9810ff6f2898c9bc85d37da72f069ee049115`; do not publish a PR branch.
- Fetch `origin`, switch to `main`, and require a clean working tree.
- Run `npm ci` and `npm run release:verify` with Node.js 22.13.0 or newer.
- Inspect `tmp/release/release-manifest.json`,
  `tmp/release/release-manifest.sha256`, and
  `tmp/release/release-report.md`.
- Require the manifest commit and tree to match the reviewed clean checkout.
- Require `NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false` and
  `NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=true`.
- Require the HVP bank checksum
  `029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a`.
- Require five courses, eight modules, 39 sections, 400 legacy questions, 36
  draft Aqueous questions, and 120 draft HVP questions.
- Require StoreV2 key `optometry-study-hub:v2`, rollback key
  `opt376-study-state:v1`, and no release migration.
- Require Sites project `appgprj_6a5614a4d1288191966f6f3570f99f22`
  with no D1 and no R2 binding.
- Record the currently published release as the rollback target. At PR 12
  inspection time this was Sites version 3, source commit
  `18ba5aebdef82402e26c1937d4e2bb1638a7a116`, archive content hash
  `sha256:06cf3d451a20b183fa0b0a8493795b75262498515f3b6de9dcf06dac31061688`.
- Preserve the current public URL:
  `https://opt-376-eye-anatomy-review.davorion7.chatgpt.site`.

## Publish

OpenAI Sites publication is a save-then-deploy operation; there is no
repository CLI command to invent or substitute.

1. Build the exact reviewed merged `main` source with the HVP public-beta
   profile. Confirm Aqueous is false and HVP is true in the manifest.
2. Push that exact source state to the repository. The commit supplied to
   Sites must identify the same reviewed state.
3. Package the source with the tracked Sites Vite packaging integration.
4. In the Sites publishing interface, select the existing project ID above,
   save a new version from that exact source archive and commit SHA, and record
   the returned version ID. Do not create a new site.
5. Deploy only the saved version after explicit publication authorization.
   Retain public access and the current URL unless a separately reviewed change
   requires otherwise.
6. Poll the deployment until it reaches a terminal successful state. Record
   the deployed commit, Sites version, deployment timestamp, URL, manifest
   checksum, and operator.
7. Do not add D1, R2, accounts, analytics, or any environment variable beyond
   the two reviewed feature flags.

## Post-publish

Use Chrome and capture evidence for:

- Home, Practice Hub, Progress Hub, HVP study notes, the legacy HVP quiz, and
  direct-route refresh.
- HVP status wording: curated study practice, internally verified and
  slide-aligned, not lecturer-approved examination items, device-local data.
- HVP Quick practice, all rendered answer controls, flags, autosave, resume,
  submission, results, and integrity handling.
- Written Practice remaining manual-only and visibly `Not scored`.
- Reading progress and both legacy and curated persistence after refresh.
- Mobile layout, keyboard focus, skip navigation, modal focus, reduced motion,
  200% zoom, and no document-level horizontal overflow.
- Zero new console exceptions and no unexpected external network requests.
- Production response security headers.
- Production manifest identity and checksum against reviewed release evidence.

## Stop conditions

Abort or roll back if any of these is observed:

- wrong commit, dirty tree, wrong manifest, wrong checksum, or wrong flags;
- Aqueous is visible or HVP status wording is missing;
- storage is reset, migrated unexpectedly, or existing progress disappears;
- HVP identity, grading, history, or compatibility checks fail;
- the legacy quiz is unavailable or changed;
- direct routes fail to refresh;
- answer content leaks into disabled/initial bundles;
- console exceptions or unexpected external requests appear;
- a significant accessibility, layout, or keyboard regression appears.

No production action is permitted from the draft PR.
