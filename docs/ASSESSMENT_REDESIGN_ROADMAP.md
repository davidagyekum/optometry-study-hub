# Assessment Redesign Roadmap

The redesign is staged so engineering, educational, and release changes remain
reviewable while device-local learner data stays compatible.

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
- PR 11 — mastery dashboard and unified Practice/Progress experience: merged.

## PR 12 — release hardening and Sites rollout preparation

Status: current draft, based on
`e8b9810ff6f2898c9bc85d37da72f069ee049115`.

- Define exact disabled and HVP public-beta release profiles.
- Verify both production bundles, answer-content isolation, and performance
  budgets.
- Generate a clean-tree release manifest and checksum.
- Harden Worker headers, route identity, keyboard focus, reduced motion, and
  learner-facing HVP release boundaries.
- Validate StoreV2 upgrade, reset, rollback-key, and question-history
  compatibility.
- Document the existing Sites production baseline, manual publish process,
  stop conditions, and two-level rollback.

Both committed feature defaults remain false. The intended future production
profile keeps Aqueous false and enables HVP only after merge, exact-commit
verification, review, and separate publication authorization. PR 12 itself
does not deploy.

Real independent expert evidence is still required before any question moves
to `reviewed` or `approved`. All current schema questions and objectives
remain draft.
