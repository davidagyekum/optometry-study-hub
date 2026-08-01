# AI Handoff - Full-curated release hardening

## Checkpoint

- Branch: `codex/full-curated-release`
- Base main: `11f178dbd50e66881fc73b13cad5251f14cf5f8e`
- Scope: source-bound full eight-module release profile, global assertions and release runbook
- Deployment: none

## Contracts

- Added publishable profile `full-curated-public-beta` with all eight curated flags true and the Aqueous engineering pilot false.
- Kept every preview profile non-publishable and every committed feature default false.
- Bound release assertions to exactly 680 curated questions, 400 legacy questions, all canonical hashes, draft statuses, preserved Aqueous pilot identities, unchanged StoreV2 and no backend bindings.
- Added the full public build and audit to fresh release verification; the manifest now targets this profile.
- Retained the HVP public-beta profile for historical reproducibility.

## Validation

- Focused release tests: 14 files, 117 tests passed.
- TypeScript and release-profile guardrails passed.
- Clean full public-beta build and bundle audit passed: 9,322,516 total bytes; 2,161,281 client JavaScript bytes; 529,208 initial-route bytes; 192 files.
- Pilot disabled; all eight curated adapters are distinct lazy closures; initial/server closure answer isolation passed.
- Preliminary manifest SHA-256: `60cd4bfe70e817cb1b9358b8b56075900fb78d4bf40dd47f4e9117f174445516`.
- Preliminary deterministic identity: `387a4794f7fb69a25bc2a10a79543e791755241b688c450ec5eb7049a5e910ec`.
- The first comprehensive run passed `npm run check` (182 files, 969 tests) and all module reports, then correctly stopped on stale disabled-profile total/client byte ceilings before any publish step. The measured eight-module ceilings were updated; the exact final release verification and browser matrix are recorded in the PR because a committed handoff cannot contain its own resulting commit SHA.

## Curated-primary cutover

All eight modules now present curated practice as the recommended learner path. The Practice Hub lists curated evidence before the explicit /legacy compatibility archive; active legacy attempts, historical results, the frozen generator, StoreV2 and all canonical identities remain unchanged. See docs/CURATED_PRIMARY_CUTOVER.md.

### Cutover validation

- npm run check: passed with 183 test files and 975 tests.
- All eight curated validators and blueprint reports passed.
- Production build passed; four accepted legacy <img> lint warnings remain.
- git diff --check: passed.
- No deployment was performed in this checkpoint.

## PR26 hard learner-path cutover

- New assessment sessions are curated-only. Existing legacy attempts and results remain read-only compatibility data; direct legacy quiz routes never create or restart an attempt.
- Learner-facing approval language was removed. Curated status copy is neutral and course-aligned; internal draft metadata is unchanged.
- The mobile site header now wraps the Home, Practice, and Progress navigation into a visible second row with 44px touch targets, preventing clipped navigation on narrow screens.
- Added regression coverage for curated-only entry, direct legacy-route safety, resumable legacy attempts, neutral status copy, and all eight course cards.
- npm run check passed: 184 test files and 979 tests, all question validators and blueprints, and production build. Lint retains four known image warnings; git diff --check passed.
- Release verification is run after committing the final source so the clean-tree release identity can be recorded.


## Notes V3 Batch 1 — Environmental Vision and Autonomic Pharmacology

- Branch: `codex/notes-v3-environmental-pharmacology`
- Base main: `ec534496a038ea72f0eae01363eef8f60415c75e`
- Scope: authored self-teaching Notes V3 and safe Notes V2 fallback only
- Deployment: none

### Content and compatibility

- Preserved the reviewed Environmental Vision manuscript byte-for-byte at SHA-256 `067cd76956aa1d71ee07630db409eed2e76a47d943bc2961fe2fd24bf843a074`.
- Preserved the reviewed Autonomic Pharmacology manuscript byte-for-byte at SHA-256 `60750407cc64ffb1c41aac6c9279bd3fe6f9f9751ff67d5f9ed2af42ce25fee6`.
- Added a route-lazy authored Notes V3 catalog that loads only the requested module, resolves before the untouched Notes V2 catalog and falls back to Notes V2 when authored content is missing or malformed.
- Preserved all eight stable section IDs and device-local reading progress.
- Added safe typed teaching blocks, responsive tables, textual priority labels, accessible native active-recall reveals and inert raw-HTML handling.
- No production Notes V3 file imports an assessment bank or answer-key field.
- No question content, canonical identity, StoreV2 contract, attempt, result, question history, feature flag or deployment profile changed.

### Validation

- Bundled Node 24.14.0 `npm ci`: passed after stopping an old local preview process that held dependency locks.
- Focused Notes V3 tests: 2 files, 8 tests passed.
- Full Vitest suite: 186 files, 988 tests passed.
- Focused lint and TypeScript checking: passed; the four accepted legacy image warnings remain outside the new renderer files.
- `npm run check`: passed with 186 test files and 988 tests, all eight validators and blueprints, canonical bank checksums and the production build. Four accepted legacy image warnings remain.
- Chrome QA passed at 390x844, 768x1024, 1024x768 and 1440x900 for both study routes: 8 sections, 8 figures, 8 focus maps, 8 recall controls and 19 responsive tables; no document overflow or console errors.
- Chrome interaction checks passed for keyboard recall reveal, figure dialog focus, Escape close, focus restoration and back/forward navigation.
- Qualification and course-correction callouts render without raw Markdown markers.
- Source-bound `npm run release:verify` is run from the clean implementation commit and recorded in the draft PR because its identity is commit-bound.
