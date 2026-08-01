# Notes V3 Batch 4

Batch 4 completes authored Notes V3 for all eight primary modules by adding
Human Visual Perception and Systemic Pathology. It preserves the restricted
compiler, answer-free route loaders, strict validation, safe Notes V2 fallback
and stable device-local reading IDs established by Batches 1–3.

## Dependency and canonical manuscripts

PR #31 was squash-merged before this work began. Batch 4 is based on merged
`main` commit `7be49e2fcdff331d59a6cebf1c61e9912553604d`.

| Module | Words | Bytes | SHA-256 |
|---|---:|---:|---|
| Human Visual Perception | 11,660 | 88,138 | `5c5361cba83a5db98024e444ebb47e0bb3e0de8f44d7b7f6ee057580c903f278` |
| Systemic Pathology | 19,111 | 158,881 | `5613703dc57e41d388c80e2b7d97d14d356b7e49127c14f27cbffe95283ca2a6` |

Both reviewed UTF-8 manuscripts are stored byte-for-byte under
`content/notes-v3/sources/`. Repository attributes retain LF line endings and
Markdown hard-break spaces.

## Stable identities and progress

Human Visual Perception retains four primary IDs in order:

- `hvp-foundations`
- `hvp-retina`
- `hvp-lgn`
- `hvp-extrastriate`

Systemic Pathology uses five authored primary IDs in order:

- `path-breast`
- `path-cardio`
- `path-endocrine`
- `path-gi`
- `path-renal`

Its exact Notes V2 `path-lymph` and `path-respiratory` sections remain readable
under **Legacy supplemental notes**. They are not represented as rewritten
Notes V3 and remain outside the current curated assessment. Reading percentage,
desktop and mobile navigation, sources and completion controls use all seven
Systemic IDs. Existing and unknown historical storage values are not migrated,
rewritten or removed.

## Teaching and source boundaries

Human Visual Perception preserves the four-block course sequence, 55 active
recall pairs and explicit corrections for melanopsin, S-cone distribution,
central midget connectivity, M/P/K pathway mapping, LGN response wording,
orientation versus direction, end-stopping and interacting visual streams.
Later-course and visual-stress topics retain their stated source limits.

Systemic Pathology preserves five focus maps, five summaries and 113 active
recall pairs across breast, cardiovascular, endocrine, gastrointestinal and
renal pathology. The direct endocrine deck was unavailable, so that lesson is
limited to the reviewed source package's documented topics and slide locators.
The incomplete inflammatory-bowel-disease source block is disclosed rather
than expanded from general knowledge.

The existing answer-neutral endocrine-axis SVG is reused with its established
dimensions, alternative text, caption and credit.

## Compatibility and isolation

`StudyModuleContentV3` now optionally carries validated `StudySectionV2`
supplementals. The strict module schema rejects duplicate primary/supplemental
IDs, unresolved section and source-note references, and malformed comparison
tables. Any invalid authored candidate falls back as a whole to Notes V2; no
partial V3 content renders and fallback does not write storage.

All eight primary modules now have independent dynamic Notes V3 adapters.
Production note adapters import no assessment bank, correct option, rationale,
accepted answer or rubric. The 680 curated questions, 400 frozen compatibility
questions, eight canonical bank hashes, StoreV2, rollback key, attempts,
results, question history, feature defaults and release profiles remain
unchanged.

## Progress ledger

Authored Notes V3 primary modules complete:

- Environmental Vision
- Autonomic Pharmacology
- Tissue Foundations
- Ocular Adnexa
- Aqueous and Vitreous
- Blood Supply
- Human Visual Perception
- Systemic Pathology

Preserved supplemental Notes V2:

- Systemic Lymphoreticular Pathology
- Systemic Respiratory Pathology

This content PR performs no deployment.
