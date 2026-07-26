# Assessment Session Engine

## Purpose and boundary

PR 4 introduces a headless, pure assessment-session engine over the versioned question domain and StoreV2 persistence foundation. It creates, validates, resumes, updates, and finalizes assessment snapshots without rendering a new quiz or deciding whether an answer is correct.

The public application remains on the 400-question legacy quiz. The nine-question Aqueous and Vitreous pilot remains a draft engineering fixture and has no public route or entry point.

## Registry and eligibility

`QuestionRegistry` is built from one or more validated question banks and provides stable lookup by question ID. Each registry entry preserves its question version, family, course, module, section, objective, review status, and format.

The default production eligibility is `approved` only. Draft and reviewed questions require an explicit `allowedReviewStatuses` override. Retired questions additionally require the clearly named `allowRetiredForArchival` override, so they cannot enter normal sessions accidentally.

Registry construction rejects malformed banks, duplicate bank IDs, duplicate question IDs, and conflicting definitions. Missing lookups return no question; session creation and resolution convert that condition into structured diagnostics.

## Deterministic session creation

Session creation accepts an explicit list of stable question IDs and supports any positive length. It verifies question existence, version availability, course and module ownership, status eligibility, and uniqueness before creating a StoreV2-compatible snapshot.

Randomness, time, and ID generation are injectable. A repeatable random source therefore produces the same question and presentation order in tests. Production defaults use browser-safe randomness, the current time, and a stable UUID-based attempt ID. Attempt IDs never depend on array positions.

The created snapshot records:

- an independently generated stable attempt ID;
- the exact question IDs and versions used;
- the deterministic learner-facing order;
- empty responses and flags;
- `currentIndex` zero;
- an ISO `startedAt` value.

## Presentation order by format

Only stable IDs are stored:

| Format | Stored presentation order |
|---|---|
| Single best answer | Shuffled option IDs |
| Multiple response | Shuffled option IDs |
| Ordering | Shuffled item IDs as the learner's initial arrangement |
| Matching | Shuffled choice IDs; authored prompt order remains intact |
| Extended matching | Shuffled shared option IDs; authored stem order remains intact |
| Image label | Shuffled label IDs; authored targets and coordinates remain intact |
| Image hotspot | No artificial region or coordinate order |
| Short answer | No option order |
| Open response | No option order |

The engine never mutates authored question content while deriving these orders.

## Response integrity is not correctness

`validateResponseForQuestion` verifies that a stored response belongs structurally to its question. It enforces exact format discrimination, valid stable references, selection limits, exact permutations, mapping-key equality, reuse policy, hotspot and label references, and nonblank written responses.

This validation answers “can this response safely resume with this question?” It does not answer “is this response correct?” No scoring, fuzzy matching, partial credit, or format-specific grading policy exists in PR 4.

## Immutable attempt operations

Pure actions set or replace a validated response, clear a response, toggle a unique flag, move to a direct index, and move next or previous within bounds. They return a new snapshot and never mutate their input. Questions outside the attempt, invalid responses, and out-of-range direct navigation produce structured errors.

Clearing an unanswered question is harmless. Moving previous at the first question and next at the last question remains at the relevant boundary.

## Resume and snapshot resolution

`resolveAssessmentAttempt` compares a persisted attempt with the current registry. A valid snapshot resolves to its questions in the original stored order. Invalid snapshots return structured issues such as:

- `MISSING_QUESTION`;
- `QUESTION_VERSION_MISMATCH`;
- `QUESTION_COURSE_MISMATCH`;
- `QUESTION_MODULE_MISMATCH`;
- `INVALID_OPTION_ORDER`;
- `INVALID_PERSISTED_RESPONSE`;
- `INVALID_CURRENT_INDEX`.

Resolution never substitutes a missing question, upgrades a version, discards a response, regenerates presentation order, or changes question order. The caller decides how to present or recover from an issue.

## Finalization and external evaluation

Finalization preserves the attempt ID relationship, course, module, question order, question versions, and responses in an `AssessmentResultSnapshot`. It adds an injected stable result ID and ISO submission time.

Evaluation is supplied externally as either:

```ts
{ score: null, maxScore: null }
```

or a numeric pair with positive `maxScore` and `0 <= score <= maxScore`. Mixed null/numeric states are invalid in both the engine and StoreV2 schema.

PR 5 is expected to define real correctness and grading policies. Deferring those policies keeps PR 4 focused on session integrity and avoids embedding unreviewed scoring assumptions in the storage layer.

## StoreV2 helpers

Pure helpers insert, replace, retrieve, and remove active assessment attempts; insert, replace, and retrieve results; and atomically move a matching active attempt into results. Every write preserves reading progress, legacy attempts, legacy results, unrelated assessment records, and question history. Key/ID disagreement and invalid final stores return structured failures.

Retrieved values are cloned so callers cannot mutate the store through a returned reference.

## What remains legacy

The current React quiz and result views, 400 generated questions, distractor logic, scoring, routes, CSS, and device-local learner workflow remain unchanged. No pilot question is registered with `LegacyQuizView`.

PR 5 may add headless grading policies and related tests after this PR is reviewed and merged. It must still be separately reviewed before any new assessment format becomes visible to students.
