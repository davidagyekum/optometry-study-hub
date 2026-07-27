# Assessment System Specification

## Purpose

The assessment domain provides a versioned, validated foundation for replacing the legacy positional distractor generator in a later pull request. PR 3 does not change the live quiz. It introduces stable data contracts, authoring diagnostics, coverage reports, and pilot examples that can be reviewed before the production question bank is migrated.

## Stable identifiers and versions

Courses, modules, sections, objectives, questions, question families, options, matching items, image regions, and image labels use stable lowercase slug IDs. IDs must describe the entity and must not come from array indexes.

Every question records:

- `schemaVersion`, currently `1`;
- a stable question `id`;
- a stable `familyId` for related variants;
- a positive content `version`.

Learner records will refer to question and option IDs plus the question version. They will not depend on answer text or embed whole question objects.

Validation also enforces ownership: every objective belongs to a course declared by the bank, and every question must match its objective's course, module, optional section, and target Bloom levels.

## Supported formats

The schema supports:

- single-best-answer;
- multiple-response;
- ordering;
- matching;
- extended matching with a shared option list;
- image hotspot;
- image labelling;
- short answer with explicit normalization;
- open response with a non-automatic rubric.

The canonical Aqueous and Vitreous candidate bank contains 36 draft questions; the controlled pilot derives the exact original nine examples, one per format, by stable ID. These examples are not registered with the live quiz. PR 6 may register them only through a clearly named draft-only registry inside an exact-string, default-disabled pilot boundary.
Image-hotspot regions separate interactionLabel and neutral marker (used before submission) from the anatomical label (feedback only). Validation rejects duplicate markers/interaction labels and interaction text that repeats the answer label.

Image-labelling answers are one-to-one: every declared target maps to one existing label, and each label may appear at most once in `correctLabels`. The persisted response contract also prohibits label reuse, so an authored correct answer is always representable by a valid response.


## Bloom taxonomy

Questions declare one Bloom level:

- `remember`: retrieve a fact, term, location, or sequence;
- `understand`: explain, classify, summarize, or compare;
- `apply`: use knowledge in a new but bounded situation;
- `analyze`: distinguish relationships, mechanisms, or causes;
- `evaluate`: judge evidence or a decision against stated criteria;
- `create`: produce a new plan, model, or synthesis.

The level describes the cognitive work required by the question, not the complexity of its wording. The linter warns when a recall-style stem is labelled Apply, Analyze, or Evaluate.

## Difficulty

- `foundation`: essential knowledge with a direct task and limited integration;
- `intermediate`: connects concepts or requires a short application;
- `advanced`: integrates mechanisms, clinical context, or competing explanations.

Difficulty and Bloom level are separate. A detailed fact may still be Remember, while an accessible clinical interpretation may be Apply.

## Review statuses

- `draft`: authored but not independently approved;
- `reviewed`: independently checked and supplied with a reviewer, sources, and option rationales;
- `approved`: accepted for future production use;
- `retired`: retained for history but excluded from a production bank unless archival inclusion is explicit.

Naming a lecturer or source does not imply that person approved a rewritten question.

## Sources and evidence

Every source has a stable ID, title, kind, optional locator, and optional valid URL. Reviewed and approved questions require at least one registered source. Lecture, textbook, guideline, and journal references should carry a slide, page, chapter, figure, or section locator.

Questions may cite registered sources directly. Learning objectives refer to the same source registry by stable ID. Validation rejects missing references and duplicate source IDs within a question or objective.

A question citation must retain the registry source's title, kind, and URL. Its locator may be narrowed for the particular item, for example from a lecture section to a specific slide.

## Question families

A family groups variants that test the same underlying objective or misconception. Family IDs support later exposure control, parallel forms, and reporting. Variants retain independent question IDs and versions; a family is not a license to duplicate stems.

## Diagnostics and reports

`npm run questions:validate` performs structural and semantic validation, then prints non-failing authoring warnings. `--strict` also fails on warnings.

The validator rejects duplicate normalized prompt, stem, option, and accepted-answer text; duplicate stable references; and incomplete or extra matching keys. Mapping formats require exact set equality between declared prompts or stems and answer-map keys.

`npm run questions:report` reports coverage by course, module, composite `course/module/section` key, objective, Bloom level, difficulty, format, stimulus type, and review status. It also reports missing misconception tags, missing source locators, and families with multiple variants.

## Future modes

Study, Exam, and Mastery modes are planned future consumers of this domain:
## Versioned grading

Strict version 1 and diagnostic version 1 are immutable built-in policies. New Study attempts default to diagnostic; Exam and Mastery attempts default to strict. Attempts lock a copied policy reference, and results preserve it.

Every question has a normalized maximum of one. Strict scoring is all-or-nothing for the eight automatic formats. Diagnostic scoring permits component fractions only for matching, extended matching, and image labelling. Partial outcomes retain numerator and denominator; aggregates sum those exact fractions before rounding once to six decimals. Open responses remain manual, and no outcome can be negative.

Historical snapshots without a policy remain loadable but require explicit policy adoption before graded finalization. The pure lock operation validates and copies the attempt, never guesses a mode default, rejects unavailable or conflicting policies, and returns the exact locked attempt that must be persisted before atomic finalization.

Short-answer normalization may remove terminal Unicode punctuation but preserves Unicode symbols. Accepted answers that normalize to empty are invalid, and an empty normalized learner response cannot receive credit.

A result may store a compact version-1 grading snapshot. Its grade keys, question IDs, versions, policy, component fractions, totals, counts, and complete/manual status must agree with the result. Regrading requires exact question versions, recomputes the canonical report from persisted responses, and rejects any disagreement with the snapshot instead of silently returning different grading.

See [Assessment Grading Policies](ASSESSMENT_GRADING_POLICIES.md) for per-format rules and persistence semantics.


- Study mode may provide immediate explanations and note links.
- Exam mode may defer feedback and apply a fixed blueprint.
- Mastery mode may use question history and objective coverage.

PR 3 defines persisted attempt fields for these modes but does not implement an assembler or adaptive algorithm. Later reviewed layers add the session engine, grading policies, and a controlled renderer pilot. Persisted attempts and results require non-empty unique question order, exact question-version coverage, valid ISO timestamps, stable response IDs, and references limited to questions in the snapshot. Attempt indices must be in range, scores cannot exceed a numeric maximum, and history counts cannot report more correct responses than attempts.

Active attempts may optionally store format-discriminated `draftResponses` for incomplete UI work. Draft keys must belong to the attempt, and draft IDs, mappings, limits, reuse rules, versions, course, and module are validated against the registry. Drafts never appear in results and never substitute for a complete response during grading. Resolution derives the complete response represented by each valid draft and rejects missing, extra, or semantically different paired responses with `DRAFT_RESPONSE_MISMATCH`; response-only historical/headless records remain valid.

At the StoreV2 boundary, each active-attempt key must equal its attempt ID, each result key must equal its result ID, and each question-history key must equal its question ID. Atomic finalization additionally requires the result to be an exact course, module, ordered-question, version, and response snapshot of the active attempt and rejects result-ID collisions.

## AIKEN and Aiken’s V
The grading layer does not update question history because the current history schema cannot represent partial, manual, policy-version, and question-version semantics safely.


AIKEN is a text interchange format with limited metadata and question-format support. It may later be offered as an export, but it is not the source of truth for this schema.

Aiken’s V is an expert content-validity statistic. It requires planned expert ratings and cannot be inferred from schema validation or automated linting. It belongs in a later, documented review process.

## What remains legacy

The live application still uses the 400 generated legacy questions, legacy single-question renderer, and current score rules. The generator is intentionally unchanged. PR 6 adds a default-disabled Aqueous engineering pilot beside that workflow; it does not convert or replace any legacy question.

## PR 7 canonical authoring boundary

The canonical Aqueous and Vitreous bank is an authoring and expert-review source, not a runtime catalogue. It declares a 36-item blueprint across section, format, Bloom, difficulty, and stimulus dimensions. Thirteen objectives are used because the preserved conventional-outflow objective deliberately covers both tracing and pathway comparison; this is the documented equivalent decomposition that keeps every objective at two or more items without changing pilot content.

Structured table stimulus data is optional at the base schema level and mandatory by candidate-bank integrity tests whenever `stimulusType` is `table`. The data carries a caption, stable columns, and stable rows/cells for accessible future rendering.

The review domain exports only applicable stable criteria and validates ordinal 1–5 ratings. Aiken’s V output is review evidence, never an automatic status transition. All 36 candidates remain draft, and the pilot’s `diagnostic@1` behavior is unchanged.
## Exact expert-review evidence contract

The canonical review export binds each rated row to the bank ID, question ID, positive integer version, deterministic question evidence hash, section, objective, format, Bloom level, and difficulty. The hash covers the complete review-relevant question, objective, and registered source identities. Completed rows from a stale or edited pack are rejected.

The expected matrix is derived from the canonical bank. Per-question Aiken's V is calculated only from `overall-content-validity`; all other applicable criteria are reported separately. Reports retain version/hash evidence and include zero-rating coverage rather than silently omitting it. Review output remains expert-only under ignored `tmp/` and does not alter the renderer, grading, storage, or status contracts.
