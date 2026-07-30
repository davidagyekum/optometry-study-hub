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
- The exact final clean-commit `npm run check`, `npm run release:verify`, browser matrix and manifest identity are recorded in the PR because a committed handoff cannot contain its own resulting commit SHA.