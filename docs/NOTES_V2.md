# Notes V2

Notes V2 is the answer-free study-content layer for all eight current modules. It structures the supplied teaching notes without becoming a source of assessment answers.

## Model and rendering

`content/notes-v2/` defines a strict schema-version-2 module and section model. Supported blocks include paragraphs, key points, ordered processes, mechanisms, comparison tables, clinical vignettes, warnings, formula or relationship callouts, figures, general callouts, glossaries and source notes. The study UI renders these blocks with semantic headings, keyboard-accessible tables, the existing focus-managed figure dialog and responsive layouts.

Every Notes V2 section keeps the legacy top-level section ID. Reading completion therefore remains in the unchanged `StoreV2.read[moduleId]` array. Unknown historical IDs are neither filtered nor rewritten.

## Compatibility boundaries

- Notes V2 imports only the answer-free legacy module catalog; it does not import a curated question bank, answer key or rationale.
- The legacy fact generator, legacy 50-question quiz and legacy scores remain unchanged.
- Invalid or mismatched Notes V2 data resolves to the original legacy notes without writing storage.
- StoreV2 stays at version 2 and both storage keys are unchanged.
- Systemic Pathology uses the five current bank-aligned sections as primary notes. The historical lymphoreticular and respiratory sections remain available under `Legacy supplemental notes` and retain their reading IDs.

## Learner experience

The module page provides a breadcrumb, objectives, sticky desktop and collapsible mobile contents, structured study blocks, clinical and safety cues, misconception corrections, glossary, sources, section completion controls and a primary visible `Practice this module` call to action when curated practice is enabled. The original quiz is retained in a secondary legacy archive.

## Validation

`tests/content/notes-v2.test.ts` validates every module, stable anchor, curated section mapping, source and figure reference, fallback behavior, reading-data round trips and answer isolation. `tests/components/study/notes-v2-study-view.test.tsx` checks the learner-facing structure and completion controls.