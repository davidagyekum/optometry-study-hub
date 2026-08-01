# Notes V3 Batch 2

Batch 2 adds manually authored, self-teaching Notes V3 for Tissue Foundations
and Ocular Adnexa. The restricted compiler and renderer introduced in Batch 1
remain the safety boundary; only one horizontal-rule parsing correction was
needed so section separators cannot appear in the final active-recall answer.

## Canonical manuscripts

| Module | Words | Bytes | SHA-256 |
|---|---:|---:|---|
| Tissue Foundations | 7,231 | 56,334 | `d5e6401d89cb6ae6d618f7ec04c9092cab82c1257f4fc39d55b48680e4029152` |
| Ocular Adnexa | 7,162 | 53,502 | `7e81766be4986edbdd601962b12c9f8c7552111aca1414b0a4ba33e049b30cfc` |

Both UTF-8 manuscripts are retained byte-for-byte under
`content/notes-v3/sources/`. Repository attributes force LF checkout while
preserving Markdown hard-break spaces across platforms.

## Stable section identities

Tissue Foundations retains, in order:

- `tissue-nervous`
- `tissue-connective`
- `tissue-epithelium`

Ocular Adnexa retains, in order:

- `landmarks`
- `muscles`
- `tarsus-glands`
- `lower-lid-blood`
- `lacrimal-gland`
- `tears`

The nine IDs continue to drive device-local reading completion. Unknown
historical IDs are ignored by percentage calculation but are never removed or
migrated.

## Teaching and source scope

Tissue Foundations covers nervous tissue, connective tissue proper and
epithelium. It explicitly keeps cartilage, bone and muscle expansion outside
the current module. Labelled qualifications address glia-to-neuron ratios,
fixed anoxia timing, axonal protein-synthesis wording, microglial origin, CNS
repair and variable connective-tissue vascularity.

Ocular Adnexa follows the supplied Brien Holden teaching sequence. Its labelled
course corrections identify parasympathetic dominance of lacrimal secretion,
greater petrosal parasympathetic fibres, deep petrosal sympathetic fibres and
separate trigeminal afferent/facial efferent reflex limbs. Existing cleared site
figures are reused; copyrighted deck diagrams are not copied.

## Loading, fallback and isolation

An answer-free typed loader registry maps each of the four authored modules to
its own dynamic adapter. No manuscript is imported by the app shell, and
opening one study route does not load another module's manuscript. Missing
entries continue through Notes V2; failed loaders and malformed authored
content fail safely to Notes V2 without writing storage.

Production Notes V3 modules import no assessment bank, correct option,
rationale, accepted answer or rubric. The 680 curated questions, 400 frozen
legacy questions, all canonical question hashes, StoreV2, the rollback key,
attempts, results, question history and assessment flags remain unchanged.

## Progress ledger

Complete:

- Environmental Vision
- Autonomic Pharmacology
- Tissue Foundations
- Ocular Adnexa

Remaining:

- Aqueous and Vitreous
- Blood Supply
- Human Visual Perception
- Systemic Pathology

This content PR performs no deployment.
