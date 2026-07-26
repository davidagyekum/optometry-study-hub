# Assessment Redesign Roadmap

The redesign is intentionally staged so engineering changes remain reviewable and the current student experience stays stable.

## PR 1 — Baseline quality and documentation

Status: merged.

- Establish npm-based clean installs, strict TypeScript checking, Vitest, repository integrity tests, and a single `npm run check` command.
- Document the current system, contribution rules, educational review policy, and known limitations.
- Make no intentional product changes.

## PR 2 — Modularize the legacy application

Status: merged.

- Separate legacy content, question generation, attempts, progress selectors, storage, navigation, hooks, and views.
- Preserve all five courses, eight modules, 400 questions, route behavior, and version-1 storage.
- Keep the flawed distractor generator unchanged but label it as legacy compatibility code.

## PR 3 — Assessment domain and migration foundation

Status: merged.

- Add stable IDs, learning objectives, Bloom levels, difficulty, sources, rationales, misconception tags, review status, and versioning.
- Define validated schemas for nine assessment formats.
- Add question-bank diagnostics, linting, coverage reports, and a version-1-to-version-2 storage migration.
- Keep the live quiz on the legacy engine.

## PR 4 — Headless assessment session engine

Status: merged.

- Add approved-by-default question registration and deterministic arbitrary-length session creation.
- Validate all nine persisted response formats without defining correctness.
- Add immutable answer, flag, navigation, resume-resolution, finalization, and StoreV2 operations.
- Keep the draft pilot disconnected from the public application and leave the live quiz unchanged.

## PR 5 — Versioned headless grading policies

Status: merged.

- Add immutable strict and diagnostic version-1 policies with mode defaults.
- Lock policy identity into new attempts and preserve it through results.
- Grade eight automatic formats, identify manual open responses, and persist validated compact grading snapshots.
- Support deterministic regrading against exact question versions.
- Keep renderers, routes, the draft pilot, question history, and the live legacy quiz unchanged.

## PR 6 — Accessible renderers and controlled pilot

Status: current draft implementation.

- Add accessible renderers for all nine assessment formats.
- Persist incomplete active-attempt drafts and complete responses separately.
- Add a default-disabled Aqueous and Vitreous engineering pilot with StoreV2 resume, diagnostic grading, and verified result review.
- Preserve the live 400-question legacy quiz and its score metrics.

## Later phases

- Keep the pilot disabled by default until its real questions and images complete academic review.
- Convert and academically review real questions module by module.
- Introduce study, exam, and mastery modes only after the domain model and migration are accepted.
- Add accessibility, browser, content-quality, and migration regression coverage as each capability becomes live.

Every phase starts from the latest merged `main` and waits for review before the next phase begins.

Production conversion of the 400 legacy questions has not started. Real Aqueous question expansion and academic review remain a separate later phase.
