# AI Handoff — PR 7 review correction

## Pull request

- Branch: `codex/pr7`
- Base branch: `main`
- Exact base commit: `1b3fe4911c366b80bac42d3327e7f780cf3cfce9`
- Draft PR: [#7 — Add the Aqueous and Vitreous candidate bank and expert-review workflow](https://github.com/davidagyekum/optometry-study-hub/pull/7)
- Review-correction implementation commit: `7a087a6b650b78a726da118333cf0491f5a92a4c`
- The exact final head is recorded in the PR description and final Codex report because a committed file cannot contain the SHA produced by the commit that contains it.
- Status: review corrections complete; PR remains draft; no deployment; PR 8 not started.

## Review corrections

### Encoding integrity

All detected learner-facing, reviewer-facing, diagnostic, and changed-tree mojibake was corrected, including the IOP quotations, the 98–99% vitreous wording, and both normalized-coordinate diagnostics. A new automated UTF-8 guard scans application source, content, scripts, documentation, and fixtures for common single/double-encoded sequences and the replacement character while allowing valid Unicode punctuation and scientific symbols.

### Self-contained evidence-bound review pack

`npm run questions:review-pack` now writes exactly four ignored expert-only artifacts under `tmp/question-review/`:

- a 338-row CSV template;
- a review guide;
- a complete Markdown item dossier;
- a complete JSON item dossier.

Every dossier entry contains the full discriminated question object, table/stimulus data, answer structures and maps, all rationales, explanation, objective and statement, Bloom/difficulty metadata, misconceptions, full source identities, short-answer normalization/accepted answers, open-response sample/rubric, and image path/alt/dimensions/coordinates/current rights-audit status. Generated output is not committed or imported into the learner UI.

Every review row carries a deterministic SHA-256 `questionHash` over the complete review-relevant question, objective, and registered source identities. Rated rows must exactly match canonical bank ID, question ID/version/hash, section, objective, format, Bloom level, and difficulty. Structured mismatch diagnostics reject stale or edited packs.

The CSV parser now reports deterministic row-numbered issues for bad widths, extra columns, invalid quotes, unterminated fields, non-positive/non-integer versions, malformed reviewer IDs, and existing rating errors. Reviewer IDs are trimmed, lowercased, and validated as stable slugs before duplicate detection, storage, warnings, or unique-reviewer counts.

### Correct Aiken semantics and complete coverage

`overall-content-validity` is a new universal criterion and the only source of per-question Aiken's V. Other criteria remain independent question/criterion values and are never pooled. The number-only calculation reports `ratingCount`; summary logic separately reports unique normalized reviewers.

The report builds all 338 canonical question/criterion pairs. Zero-rating pairs have no V and emit `NO_REVIEW_RATINGS`; one or two unique reviewers receive a provisional V and `INSUFFICIENT_REVIEWERS`; three or more receive a normal complete/needs-review status. Console, Markdown, and JSON include applicable/rated/unrated counts, reviewer/question coverage, question versions, and evidence hashes. The deterministic 5, 5, 4 fixture still yields numerator 11, denominator 12, and V 0.916667.

### Candidate quality correction

The two answer-revealing matching tables now use neutral trial/specimen identifiers and raw observations; targeted tests prove no row reproduces its mapped correct answer. IOP error analysis now has exactly one unique overlooked determinant/context per prompt. IOP measurement includes central corneal thickness. The blood-aqueous barrier item uses plausible anterior-segment mechanisms. New SBAs use homogeneous misconception-based alternatives. Vitreous ordering ends at posterior vitreous cortex rather than the optic disc, and the short-answer item now applies examination findings.

All 27 new candidates received documented author self-review for one defensible answer/map, Bloom alignment, homogeneous responses, misconceptions, explanations, source support, variable qualification, leakage, and category clues. This is not independent academic approval.

## Preserved boundaries and integrity

- Canonical bank: exactly 36 questions (27 new + 9 preserved pilot), 13 objectives.
- Exact blueprint: unchanged section, format, Bloom, difficulty, stimulus, higher-order, and objective coverage.
- Questions and objectives: all `draft`; no reviewer field or real rating added.
- Preserved pilot: all nine semantic SHA-256 fixtures unchanged.
- Feature gate: `.env.example` remains `NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false` and the default remains disabled.
- Live 400-question bank, storage, scoring, renderer, routes, and student UI: unchanged.
- Other modules: not converted.
- Deployment: not performed.

## Final local validation

Validation used bundled Node.js 24.14.0:

- `npm ci --include=optional`: passed; npm reported existing dependency advisories and harmless Windows optional-package cleanup warnings.
- `npm run lint`: passed with only the four pre-existing legacy `<img>` warnings.
- `npm run typecheck`: passed.
- `npm run test`: passed, 66 test files and 412 tests.
- `npm run questions:validate`: passed, 36 questions, 13 objectives, 0 errors, 0 warnings.
- `npm run questions:validate -- --strict`: passed.
- `npm run questions:report`: passed with exact declared coverage.
- `npm run questions:blueprint`: passed with 0 diagnostics.
- `npm run questions:review-pack`: passed, 36 questions and 338 rows; all four dossiers generated under ignored `tmp/`.
- `npm run questions:aiken -- --input tests/fixtures/review/valid-ratings.csv`: passed; 338 applicable, 1 rated, 337 explicitly unrated, 3 fixture reviewers, V 0.916667.
- `npm run build`: passed.
- `npm run check`: passed to completion.
- `git diff --check`: passed.

The CSV fixture uses deterministic test-only reviewer IDs and ratings; it does not represent a real review and does not mutate bank metadata.

## GitHub Actions

Correction run [30228425600](https://github.com/davidagyekum/optometry-study-hub/actions/runs/30228425600), job `89862672143`, completed as a zero-step failure against implementation commit `7a087a6b650b78a726da118333cf0491f5a92a4c`. Its `steps` array is empty: checkout, npm install, lint, type-check, tests, validation, and build did not execute. This is the existing external account restriction, not a repository test failure.

## Remaining limitations

- Every candidate still requires real independent expert review and explicit approval in a later change.
- Image reuse basis and coordinates remain pending expert confirmation.
- Aiken's V is descriptive evidence only and never approves an item automatically.
- The four existing `<img>` lint warnings remain outside this PR's behavior-preserving scope.
- GitHub Actions cannot execute until the external account restriction is resolved.
## Final four-finding correction

A subsequent review identified four remaining contracts, all now corrected on `codex/pr7`:

1. `pilotSubset.ts` no longer imports the assembled 36-question bank. A recursive import-graph test proves that its only question module is `questions/preservedPilot.ts` and that `bank.ts` plus all 27 hidden candidate modules are unreachable.
2. `aqueous-flow-extended-001` now uses mutually exclusive conventional-route, unconventional-route, and downstream venous-pressure-constraint categories with three unique mappings and explicit `reuseOptions: false`.
3. The UTF-8 guard now detects the broader `U+00C3 U+0080–U+00BF` corruption family plus common Windows-1252 punctuation variants. Predicate tests cover misdecoded é, multiplication-sign, and pound-sign byte pairs while valid `é`, `×`, `£`, punctuation, and scientific text remain allowed.
4. The expert dossier, every criterion evidence object, and image source candidates now contain the registered union of question and objective sources—the same union used by the evidence hash. A real image-label candidate test proves an objective-only source is present throughout the exported evidence.

Final post-correction validation passed with 66 test files and 412 tests, strict question validation, blueprint/report generation, the 338-row dossier export, Aiken fixture, production build, and `git diff --check`. The exact final commit and PR head are recorded in the draft PR and final Codex report. All prior scope boundaries remain: 36 draft candidates, nine unchanged pilot semantic hashes, disabled pilot flag, no deployment, no PR 8, and no live quiz/storage/UI change.
