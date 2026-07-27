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

## PR 8 — Evidence-bound expert-review campaigns

Status: current draft implementation.

- Register consent-aware reviewer profiles without inventing identities.
- Bind campaigns and reviewer packs to deterministic bank, policy, question, objective, and source evidence.
- Merge complete, partial, blank, rating-bearing, and comment-only submissions without mutating questions.
- Produce criterion-specific Aiken's V, stable issues, explicit resolutions, readiness reports, evidence-bundle hashes, and human chair decisions.
- Verify future status transitions without performing any transition.
- Preserve the 36-question draft bank, exact nine-question pilot, live 400-question quiz, storage, scoring, and disabled pilot flag.

## Later phases

- Real independent expert reviewers still need to be recruited; no real ratings or identities are committed.
- PR 9 may resolve genuine feedback and revise question versions.
- Only a later evidence-backed change may move selected items to `reviewed`.
- `approved` status and public pilot enablement remain separate decisions.
- The other seven modules remain unconverted.
- The pilot stays disabled until a separately reviewed release decision.

Every phase starts from the latest merged `main` and stops for review before the next phase begins.
