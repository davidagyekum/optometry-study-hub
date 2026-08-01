# Notes V3 Batch 1

Notes V3 provides manually authored, self-teaching study material for:

- Environmental Vision
- Autonomic Pharmacology

The canonical manuscripts are retained under `content/notes-v3/sources/` so
lecturers can review the exact prose. A restricted compiler converts headings,
lists, tables, teaching priorities, worked examples, cause-and-effect sequences,
memory hooks, exam traps, summaries, definitions and active-recall checkpoints
into validated typed content. The renderer never executes manuscript HTML.

## Resolution and compatibility

The study route loads only the requested authored Notes V3 module and resolves a valid entry first. If an authored entry is
absent, the existing Notes V2 catalog is used. If an authored entry is present
but malformed, it fails safely to Notes V2 with a short status message. The
legacy renderer remains the final fallback already defined by Notes V2.

Section completion continues to use the existing stable IDs. No local-storage
key, schema, assessment attempt, result, question history or score is migrated.

## Stable sections

Environmental Vision keeps:

- `env-optics`
- `env-task`
- `env-ergonomics`
- `env-hazards`
- `env-protection`
- `env-lighting`

Autonomic Pharmacology keeps:

- `pharm-adrenergic`
- `pharm-cholinergic`

## Safety and accessibility

- Trusted emphasis and inline code are tokenized into React elements.
- Raw HTML and scripts remain inert text.
- Tables are horizontally scrollable, keyboard focusable regions.
- Focus priorities include ordered labels and text, not colour alone.
- Active-recall answers use native `details` and `summary` controls.
- Existing figure enlargement, captions, alternative text and source credits
  remain available.
- The two source manuscripts are byte-bound by SHA-256 regression tests.

Notes V3 has no production import of any assessment bank and does not change
the 680 curated questions, 400 frozen legacy questions or Aqueous pilot.
## Rewrite progress

Complete: Environmental Vision, Autonomic Pharmacology, Tissue Foundations and Ocular Adnexa.

Remaining: Aqueous and Vitreous, Blood Supply, Human Visual Perception and Systemic Pathology. Batch 2 details are recorded in `docs/NOTES_V3_BATCH2.md`.
