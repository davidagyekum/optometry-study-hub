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

The committed Aqueous and Vitreous pilot contains one draft example of every format. These examples are not registered with the live quiz.

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

Questions may cite registered sources directly. Learning objectives refer to the same source registry by stable ID. Validation rejects missing references.

## Question families

A family groups variants that test the same underlying objective or misconception. Family IDs support later exposure control, parallel forms, and reporting. Variants retain independent question IDs and versions; a family is not a license to duplicate stems.

## Diagnostics and reports

`npm run questions:validate` performs structural and semantic validation, then prints non-failing authoring warnings. `--strict` also fails on warnings.

`npm run questions:report` reports coverage by course, module, section, objective, Bloom level, difficulty, format, stimulus type, and review status. It also reports missing misconception tags, missing source locators, and families with multiple variants.

## Future modes

Study, Exam, and Mastery modes are planned future consumers of this domain:

- Study mode may provide immediate explanations and note links.
- Exam mode may defer feedback and apply a fixed blueprint.
- Mastery mode may use question history and objective coverage.

PR 3 defines persisted attempt fields for these modes but does not implement an assembler, renderer, adaptive algorithm, or scoring workflow.

## AIKEN and Aiken’s V

AIKEN is a text interchange format with limited metadata and question-format support. It may later be offered as an export, but it is not the source of truth for this schema.

Aiken’s V is an expert content-validity statistic. It requires planned expert ratings and cannot be inferred from schema validation or automated linting. It belongs in a later, documented review process.

## What remains legacy

The live application still uses the 400 generated legacy questions, legacy single-question renderer, current scoring rules, and existing routes. The generator is intentionally unchanged. PR 3 only moves browser persistence to a backward-compatible V2 wrapper and adds an unused assessment foundation.
