# Assessment Redesign Roadmap

The redesign is intentionally staged so engineering and educational changes remain reviewable while the live student experience stays stable.

## Merged foundation

- PR 1 — baseline quality and documentation: merged.
- PR 2 — modularized legacy application: merged.
- PR 3 — assessment domain and storage migration: merged.
- PR 4 — headless assessment session engine: merged.
- PR 5 — versioned grading policies: merged.
- PR 6 — accessible renderers and controlled pilot: merged.
- PR 7 — canonical Aqueous and Vitreous candidate bank and expert-review pack: merged.
- PR 8 — evidence-bound expert-review campaigns and promotion-readiness gates: merged.

## PR 9 — OPT 374 curated visual-perception practice bank

Status: current draft implementation.

- Preserve the exact 120-question package, 23 objectives, 19 sources, and all draft statuses.
- Add six original coordinate-aligned SVG diagrams.
- Assemble deterministic 50-question sets with exact section and format quotas.
- Reuse StoreV2, the session engine, grading policies, and nine renderers.
- Keep the secondary practice route false by default and outside the ordinary learner import graph.
- Preserve the legacy HVP quiz, all 400 generated questions, Aqueous content and hashes, and PR 8 review tooling.
- Treat later depth, stereopsis, colour, motion, entoptic, and illusion decks as future tranches.

## Later phases

- Real independent expert reviewers still need to be recruited; no real ratings or identities are committed.
- PR 9 may resolve genuine feedback and revise question versions.
- Only a later evidence-backed change may move selected items to `reviewed`.
- `approved` status and public pilot enablement remain separate decisions.
- The other seven modules remain unconverted.
- The pilot stays disabled until a separately reviewed release decision.

Every phase starts from the latest merged `main` and stops for review before the next phase begins.
