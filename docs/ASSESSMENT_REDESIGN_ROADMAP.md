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
- PR 10 — reusable practice, targeted selection, and question history: merged.

## PR 11 — mastery dashboard and unified progress UI

Status: current draft implementation.

- Add always-available Practice and Progress hubs plus module progress detail.
- Keep legacy saved-result statistics separate from curated evidence.
- Derive fail-closed HVP analytics, transparent current-version mastery,
  recent activity, and deterministic recommendations without storage changes.
- Lazy-load HVP analytics only when its feature flag is enabled.
- Keep both assessment feature flags disabled and do not deploy.

## Next phase

- PR 12 — release hardening, controlled enablement, and deployment.

Real independent expert evidence is still required before any question moves
to `reviewed` or `approved`. Each phase starts from merged `main` and stops for
review before the next phase begins.
