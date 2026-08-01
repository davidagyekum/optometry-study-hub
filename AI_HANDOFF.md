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
## Notes V3 Batch 2 — Tissue Foundations and Ocular Adnexa

- Branch: `codex/notes-v3-tissue-ocular-adnexa`
- Base main: `220605976e5a15a7fcf95dcb665a06c32fad3009`
- Scope: two authored Notes V3 modules, typed route-lazy registry and safe Notes V2 fallback
- Deployment: none

### Content and compatibility

- Tissue manuscript: 7,231 words, 56,334 bytes, SHA-256 `d5e6401d89cb6ae6d618f7ec04c9092cab82c1257f4fc39d55b48680e4029152`.
- Ocular manuscript: 7,162 words, 53,502 bytes, SHA-256 `7e81766be4986edbdd601962b12c9f8c7552111aca1414b0a4ba33e049b30cfc`.
- Preserved three Tissue and six Ocular stable section IDs, figures, source scope and device-local reading completion.
- Preserved Tissue scope boundaries and six labelled qualifications; preserved Ocular autonomic, petrosal and reflex-pathway correction labels.
- Replaced module conditionals with an answer-free typed loader registry. Each manuscript remains a separate dynamic route chunk and failed loads return Notes V2.
- Prevented Markdown section separators from leaking into the last revealed recall answer while preserving Batch 1 rendering.
- No assessment bank, answer-key field, storage contract, learner history, feature flag or deployment profile changed.

### Validation

- Focused Notes V3 tests cover exact manuscript hashes, structure, source ownership, recall/summary completeness, fallback, lazy imports, reading percentages, safe rendering, completion controls and figure-dialog keyboard behavior.
- The exact final test totals, release manifest identity, bundle evidence and Chrome matrix are recorded in the draft PR after the clean implementation commit is validated.
## Notes V3 Batch 3 — Aqueous/Vitreous and Blood Supply

- Branch: `codex/notes-v3-aqueous-blood-supply`
- Base main: `5f994c717f32fb9171c4b045db31654e73eeb206`
- Scope: two canonical Notes V3 manuscripts, two answer-free dynamic adapters, tests and documentation
- Deployment: none

### Content and compatibility

- Aqueous/Vitreous manuscript: 7,730 words, 58,227 bytes, SHA-256 `4bf0b843da02d34c50c53bf67f8022ca66589a699171272725c3208d8f4e7120`.
- Blood Supply manuscript: 7,160 words, 56,006 bytes, SHA-256 `6ce9debccc5dc85305ae8782549974daf5261d2483722fd31848498698f01074`.
- Preserved all 12 stable section IDs, existing figures, course qualifications, source boundaries and device-local reading completion.
- Extended the typed loader registry without importing audit documents, curated banks or answer-key fields into production Notes V3.
- Missing entries, thrown route loaders and malformed authored candidates return Notes V2 without a storage migration.
- All 680 curated questions, 400 frozen legacy questions, eight canonical bank hashes, StoreV2, rollback identity, attempts, results, question history and feature flags remain unchanged.

### Validation

- Focused tests cover exact manuscript hashes, section/source structure, all 89 recall pairs, content fidelity, fallbacks, lazy imports, progress compatibility, safe rendering, native reveal controls and figure-dialog keyboard recovery.
- Exact final test totals, source-bound release identity, bundle evidence and the browser QA matrix are recorded in the draft PR after the clean implementation commit is validated.

## Notes V3 Batch 4 — Human Visual Perception and Systemic Pathology

- Branch: codex/notes-v3-hvp-systemic-pathology
- Base main: 7be49e2fcdff331d59a6cebf1c61e9912553604d
- Scope: two canonical Notes V3 manuscripts, V2 supplemental compatibility, two answer-free dynamic adapters, tests and documentation
- Deployment: none

### Content and compatibility

- Human Visual Perception manuscript: 11,660 words, 88,138 bytes, SHA-256 5c5361cba83a5db98024e444ebb47e0bb3e0de8f44d7b7f6ee057580c903f278.
- Systemic Pathology manuscript: 19,111 words, 158,881 bytes, SHA-256 5613703dc57e41d388c80e2b7d97d14d356b7e49127c14f27cbffe95283ca2a6.
- Preserved four HVP and five Systemic primary IDs, plus exact Notes V2 path-lymph and path-respiratory supplemental sections and all seven completion identities.
- Added strict cross-collection duplicate/source validation. Malformed primary or supplemental authored candidates fail as a whole to Notes V2.
- Reused the established answer-neutral endocrine-axis figure and disclosed the missing direct endocrine-deck boundary.
- Completed all eight primary modules in separate route-lazy, answer-free Notes V3 adapters.
- Preserved 680 curated questions, 400 frozen legacy questions, eight assessment hashes, StoreV2, rollback identity, attempts, results, question history, flags and release profiles.

### Validation

- Focused Batch 4 and Notes V3 regression suite: 4 files, 21 tests passed.
- Node 24 TypeScript checking passed.
- Lint passed with the four accepted legacy image warnings.
- Exact final full-suite totals, source-bound release identity, route-chunk evidence and browser QA matrix are recorded in the draft PR after validation from the clean implementation commit.
