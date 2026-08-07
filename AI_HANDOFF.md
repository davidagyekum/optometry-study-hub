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
## Privacy-preserving Google Analytics 4

- Branch: codex/ga4-privacy-analytics
- Base main: 3d92faa8965a46d463419cb9cfae573dd80fbd28
- GA4 property: Optometry Study Hub; measurement ID G-PDTF3KS7SZ.
- Explicit opt-in is required before the Google script, cookie or analytics queue loads. Consent is isolated under optometry-study-hub:analytics-consent:v1.
- Google Signals, user-provided data and advertising personalization are disabled; event and user-data retention are 14 months.
- Manual client-route page views and allowlisted study_module_open, practice_start and practice_submit events exclude answers, scores, question IDs, attempt IDs and learner storage.
- Added a keyboard-accessible consent banner, persistent footer privacy control, revocation and cookie cleanup.
- StoreV2, legacy storage, learner progress, question banks, feature flags and assessment identities are unchanged.
- Focused analytics validation: 4 files, 15 tests passed; Node 24 TypeScript checking passed.
- Final full-suite, build, release verification, Chrome QA, PR, merge and deployment evidence are recorded after the reviewed release commit is produced.


## OPT 370 - Dispensing Optics II draft integration

- Branch: \`codex/add-opt370\`
- Base main: \`051790b10e865db126094ee47c3e9ece1247abeb\`
- Base tree: \`2c96de8b0fd658f0f145306ab1a1e21e7d27eb6a\`
- Package SHA-256: \`29383c4fa08ec0a9deffa55972005626935f7e7ebda15d1b49a767e77fbf68b0\`
- Scope: one course, five modules, 33 new study sections, 400 draft questions, 66 objectives, ten assessment formats, Notes V3, original SVGs, shared progress/results/history, and five default-disabled feature flags.
- Deployment: none.

### Implemented content and routes

- Course: \`dispensing-optics-ii\` (OPT 370), with lecturer attribution intentionally omitted because the supplied sources conflict.
- Modules: \`schematic-eye-refractive-states\`, \`multifocal-foundations\`, \`progressive-addition-lenses\`, \`pd-and-dispensing\`, and \`special-lenses\`.
- Added five route-lazy Notes V3 adapters and five route-lazy curated-practice adapters without introducing a parallel assessment or storage framework.
- Added Quick 10, Standard 25, Full 50, Custom 5-50, targeted 10, and Written 2 modes. Automatic practice uses nine scored formats; open response is restricted to Written practice.
- Preserved StoreV2, legacy migration/rollback identity, existing attempts/results/history, the 400-question frozen legacy generator, and all eight established bank hashes.
- Added six course/cover SVGs and ten assessment SVGs. The canonical source bank JSON remains unchanged; a deterministic runtime compatibility layer adds missing Bloom coverage to objective target lists required by the current registry.
- Updated learner-facing counts to six courses, 13 modules, 72 study sections, 680 established curated questions plus 400 OPT 370 draft questions.

### OPT 370 canonical bank SHA-256 values

- Schematic Eye and Refractive States: \`602b831f1206dedac93785041c13e8165370a19701ddf401908eb86503efc46a\`
- Multifocal Foundations: \`69ab5ea52c27977d78618c36f50aad1a5e46ccfdfcb1aca1082283bb4b3dee56\`
- Progressive Addition Lenses: \`d9c5cc2df7a59275a0a397f90e052638727ce453f4a4e8a676b1dc4f54057906\`
- PD and Dispensing: \`a9d29778d94101a883de9214f4a33b6883e9dd23951b150b3ddceb61f778e3e4\`
- Special Lenses: \`15c09a647968ab5a341992e194041ae955e5de40ef9439b086630c918249fc5a\`

### Authored Notes V3 SHA-256 values

- Schematic Eye and Refractive States: \`2a4973ee65637552a6ea17924940a10104d1f2b5495b1f8f56a2178a4e29a59e\`
- Multifocal Foundations: \`7040a230f39539561d0fdeb100a1389d1918ca379631d197fdf9d9c588f462f6\`
- Progressive Addition Lenses: \`9be3c5d4ad9704f1acd5955230587fc0e95c20ed90fad2fdd41f91fa3b0281e2\`
- PD and Dispensing: \`14ebfb0d0b9e94c11a341b6c039f679a79c22552ab0b523d9c8d8e7854edf809\`
- Special Lenses: \`76dbfda8121e9dcf64d6f55dd32661d9b502e29ac8c766120f5b00cb4b8e4d97\`

### Source register SHA-256 values

- \`bifocal lenses 1.pptx\`: \`cb23be57b84c1801c37991d98812d9508689a0599d865b43d489f35c90df1993\`
- \`Bifocal lenses 2.pptx\`: \`5c2f1794334c8b962c4fb610cf276ec99edb004626668fe1d34e1aed2a0bae54\`
- \`NON OPTICAL CONSIDERATION.pptx\`: \`61362d60ab7275c761d187b327fee4c965219f5a62dbc6bf0a134a510786a82f\`
- \`OPT 370 Multifocals 2021.pptx\`: \`b143bd8540e6eda4fe105144adb868d622a6360ceb0808f807e0d0f817d46912\`
- \`Progressive fitting cross.docx\`: \`ee5a453c233f622d083521ad648cbe5f5f5584dd33671f094b8e8e3e1beaa413\`
- \`Progressive lens fitting.pptx\`: \`1dc8254f03fd744d512ac9a1370a61f13df4370b1c4994d033ad5e59364a60a5\`
- \`Special lenses.pptx\`: \`f5bf58da4d7f7003eb54b000e698e60d6d2117a2ee33ac7fd350c51cc224bb6c\`
- \`The schematic eye  unaccommodated.pptx\`: \`f879060b642b8bbe06588e70ece002f7f1d6d91b2113ebc0c45fb7068be620d3\`

### Feature flags

All committed defaults are \`false\`, and only the exact string \`true\` enables a module:

- \`NEXT_PUBLIC_ENABLE_OPT370_SCHEMATIC_EYE_REFRACTIVE_STATES\`
- \`NEXT_PUBLIC_ENABLE_OPT370_MULTIFOCAL_FOUNDATIONS\`
- \`NEXT_PUBLIC_ENABLE_OPT370_PROGRESSIVE_ADDITION_LENSES\`
- \`NEXT_PUBLIC_ENABLE_OPT370_PD_AND_DISPENSING\`
- \`NEXT_PUBLIC_ENABLE_OPT370_SPECIAL_LENSES\`

### Source ambiguities retained for academic review

No silent correction was made for the OPT 370/OPT 358 course-code conflict, conflicting lecturer attribution, the exact 64 mm near-PD example, the stated 80% trifocal discrepancy, the PAL formula ambiguity, the iseikonic arithmetic inconsistency, the 7000 C statement, slab-off rounding, safety-standard claims, or broad tint/UV/blue-light claims. These remain review items rather than implied clinical endorsement.

### Validation evidence

- Package audit: bundled report PASS (6,615 checks); local package rerun PASS (6,613 checks), with only the two expected PDF page-count warnings.
- Repository package counts: 400 unique draft questions, 66 unique objectives, all ten formats, five Notes V3 modules, six cover/course SVGs, and ten assessment SVGs.
- Full supported-runtime suite: 197 files and 1,044 tests passed.
- TypeScript: passed under the bundled Node 24 runtime.
- Lint: passed with only the four pre-existing \`@next/next/no-img-element\` warnings.
- Production builds: passed with all OPT 370 flags disabled and with all five enabled.
- Release profiles and committed-default guardrails: passed.
- Browser QA: course plus five study routes and five practice routes loaded; four responsive viewports (360x800, 768x1024, 1280x800, 1440x900) had no horizontal overflow. Desktop and phone screenshots were inspected. The only console noise was Vinext dev-mode rejection of local \`file://\` Geist font URLs; production builds were unaffected.
- Clean-commit release verification and final Git identities are recorded in the draft PR because the release verifier intentionally rejects a dirty working tree.

### OPT 370 release-contract clarification

- The machine-readable release contract intentionally keeps `curatedQuestions: 680` scoped to the eight established curated banks through `curatedQuestionsScope: established-eight-bank-release`.
- It now separately attests 400 OPT 370 draft questions, 66 objectives, five modules, all five canonical bank checksums and draft-only review-status counts.
- `courseAlignedQuestionRecords: 1080` is explicitly 680 established curated plus 400 OPT 370 draft; the 400 frozen legacy questions remain compatibility-only and are reported separately.
- No OPT 370 release-profile matrix was added. Dedicated integration tests verify all five exact-string flags and all-enabled behavior, while the existing release verifier proves route-lazy bundle isolation and default-false tracked environments.
- This clarification changes release evidence only: no bank JSON, question ID, feature flag, route, storage identity, learner record or UI behavior changed.
