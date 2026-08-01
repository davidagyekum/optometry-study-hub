# Notes V3 Batch 3

Batch 3 adds manually authored, self-teaching Notes V3 for Aqueous and
Vitreous and Blood Supply to the Eye. It reuses the restricted compiler,
renderer, safe Notes V2 fallback and stable reading-progress model established
by the first two batches.

## Canonical manuscripts

| Module | Words | Bytes | SHA-256 |
|---|---:|---:|---|
| Aqueous and Vitreous | 7,730 | 58,227 | `4bf0b843da02d34c50c53bf67f8022ca66589a699171272725c3208d8f4e7120` |
| Blood Supply | 7,160 | 56,006 | `6ce9debccc5dc85305ae8782549974daf5261d2483722fd31848498698f01074` |

Both UTF-8 manuscripts are retained byte-for-byte under
`content/notes-v3/sources/`. Repository attributes force LF checkout while
preserving Markdown hard-break spaces across platforms.

## Stable section identities

Aqueous and Vitreous retains, in order:

- `media-chambers`
- `production`
- `flow`
- `iop`
- `vitreous-anatomy`
- `vitreous-clinical`

Blood Supply retains, in order:

- `arterial-origins`
- `ciliary`
- `retinal`
- `barriers`
- `microcirculation`
- `clinical-blood`

These 12 IDs continue to drive device-local reading completion. Unknown
historical IDs are ignored by percentage calculation but are never removed or
migrated.

## Teaching and source scope

Aqueous and Vitreous follows the supplied OPT 376 transparent-media lecture
and the existing source audit. Labelled qualifications cover course values for
chamber dimensions, aqueous turnover, conventional/unconventional outflow,
IOP reference ranges, vitreous volume and water content, attachment wording,
synchysis/syneresis terminology and urgent retinal warning symptoms.

Blood Supply follows the supplied ocular-circulation lecture and cites the
existing six-section curated blueprint only as an answer-free coverage check.
Labelled qualifications distinguish retinal depth approximations, variable
Zinn-Haller anatomy, vortex drainage, controlled permeability, capillary scale
values, the diabetic pericyte extension and urgent arterial presentations.
No lecture artwork or assessment content is copied.

## Loading, fallback and isolation

The typed loader registry maps each of the six authored modules to its own
dynamic adapter. No manuscript is imported by the app shell, and opening one
study route does not load another module's manuscript. Missing entries,
rejected loaders and malformed authored content return Notes V2 without
writing storage.

Production Notes V3 modules import no question bank, correct option,
rationale, accepted answer or rubric. The 680 curated questions, 400 frozen
legacy questions, all eight canonical hashes, StoreV2, the rollback key,
attempts, results, question history and assessment flags remain unchanged.

## Progress ledger

This checkpoint was merged as PR #31 at
7be49e2fcdff331d59a6cebf1c61e9912553604d. Batch 4 completes the remaining
Human Visual Perception and Systemic Pathology primary modules; see
docs/NOTES_V3_BATCH4.md.

This content PR performed no deployment.