# Assessment Redesign Roadmap

The redesign is staged so engineering and educational changes remain
reviewable while the live student experience stays stable.

## Merged foundation

- PR 1 — baseline quality and documentation: merged.
- PR 2 — modularized legacy application: merged.
- PR 3 — assessment domain and storage migration: merged.
- PR 4 — headless assessment session engine: merged.
- PR 5 — versioned grading policies: merged.
- PR 6 — accessible renderers and controlled pilot: merged.
- PR 7 — canonical Aqueous and Vitreous bank and review packs: merged.
- PR 8 — evidence-bound expert-review campaigns: merged.
- PR 9 — canonical OPT 374 HVP bank and deterministic curated practice: merged.

## PR 10 — reusable practice, targeted selection, and question history

Status: current draft implementation.

- Add a tenth, dedicated boolean True/False format while preserving all nine
  existing formats and both canonical banks.
- Add reusable versioned practice blueprints and immutable selection snapshots.
- Preserve the exact HVP Full 50 contract and add deterministic Quick 10,
  Standard 25, Custom, and history-targeted practice.
- Atomically update version-aware device-local question history.
- Expose the two HVP open responses as separate unscored Written practice.
- Preserve PR 9 attempts/results without selection metadata.
- Keep both assessment feature flags disabled and do not deploy.

## Next phases

- PR 11 — mastery dashboard and unified progress UI.
- PR 12 — release hardening, controlled enablement, and deployment.

Real independent expert evidence is still required before any question moves
to `reviewed` or `approved`. Each phase starts from merged `main` and stops for
review before the next phase begins.
