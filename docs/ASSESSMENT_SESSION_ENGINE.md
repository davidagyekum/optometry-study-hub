# Assessment Session Engine

## Purpose and boundary

PR 4 introduces a headless, pure assessment-session engine over the versioned question domain and StoreV2 persistence foundation. It creates, validates, resumes, updates, and finalizes assessment snapshots without rendering a new quiz or deciding whether an answer is correct.

The public application remains on the 400-question legacy quiz. PR 6 adds a default-disabled, feature-gated route that may explicitly register the nine draft Aqueous and Vitreous engineering examples; the legacy quiz never registers them.

## Registry and eligibility

`QuestionRegistry` is built from one or more validated question banks and provides stable lookup by question ID. Each registry entry preserves its question version, family, course, module, section, objective, review status, and format.

The default production eligibility is `approved` only. Draft and reviewed questions require an explicit `allowedReviewStatuses` override. Retired questions additionally require the clearly named `allowRetiredForArchival` override, so they cannot enter normal sessions accidentally.
Registry construction is the validation boundary: callers receive an interface, not a public constructor. The registry copies validated bank content on entry and returns defensive copies from `get`, `getEntry`, and `lookup`; mutating a source bank or returned question, metadata entry, option, or bank-ID list cannot change later lookup, eligibility, version checks, ownership checks, or presentation order.


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
- a copied, versioned grading-policy reference selected explicitly or from the session-mode default.
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

This validation answers “can this response safely resume with this question?” It remains separate from correctness. PR 5 adds a headless grading layer that first calls response validation and then applies the attempt's locked policy.

PR 6 adds a separate optional `draftResponses` layer to active attempts. Drafts may represent valid incomplete work and are validated against the exact question version, ownership, authored IDs, limits, and reuse rules. A complete draft is also stored through the existing complete-response validator; an incomplete draft removes any formerly complete response without being discarded. Historical snapshots without drafts remain valid, result snapshots never contain drafts, and final grading continues to read only `responses`. For snapshots that do contain a valid draft, the resolver derives its complete response and requires exact format-aware coherence with the stored response; response-only historical/headless data remains valid.

Strict version 1 is all-or-nothing. Diagnostic version 1 differs only for matching, extended matching, and image labelling, where independent component coverage yields bounded partial credit. Component numerators and denominators are retained so exact fractions are summed before one aggregate rounding step. No policy uses negative marking or fuzzy comparison.

## Immutable attempt operations

Pure actions set or replace a validated response, clear a response, toggle a unique flag, move to a direct index, and move next or previous within bounds. They return a new snapshot and never mutate their input. The response setter defensively checks the attempt's stored question version, course, and module against the current registry entry before validating the response. Questions outside the attempt, stale ownership or version data, invalid responses, and out-of-range direct navigation produce structured errors.

Clearing an unanswered question is harmless. Moving previous at the first question and next at the last question remains at the relevant boundary.

## Resume and snapshot resolution

`resolveAssessmentAttempt` compares a persisted attempt with the current registry. A valid snapshot resolves to its questions in the original stored order. Invalid snapshots return structured issues such as:

- `MISSING_QUESTION`;
- `QUESTION_VERSION_MISMATCH`;
- `QUESTION_COURSE_MISMATCH`;
- `QUESTION_MODULE_MISMATCH`;
- `INVALID_OPTION_ORDER`;
- `INVALID_PERSISTED_RESPONSE`;
- INVALID_DRAFT_RESPONSE;
- DRAFT_RESPONSE_MISMATCH;
- `INVALID_CURRENT_INDEX`.

Resolution never substitutes a missing question, upgrades a version, discards a response, regenerates presentation order, or changes question order. The caller decides how to present or recover from an issue.

## Finalization and external evaluation
A resumed attempt must resolve successfully before the caller permits further interaction or finalization. Setters still repeat the relevant version and ownership checks as a defensive boundary; callers must surface and resolve stale-snapshot diagnostics rather than silently updating, repairing, or submitting the attempt.


Finalization first validates the complete attempt snapshot, then preserves the attempt ID relationship, course, module, question order, question versions, and responses in an `AssessmentResultSnapshot`. It adds an injected stable result ID and ISO submission time.

Evaluation is supplied externally as either:

```ts
{ score: null, maxScore: null }
```

or a numeric pair with positive `maxScore` and `0 <= score <= maxScore`. Mixed null/numeric states are invalid in both the engine and StoreV2 schema.

`lockAttemptGradingPolicy` provides the explicit adoption path for historical attempts without a policy. It validates and copies the attempt, requires an available policy, rejects a conflicting lock, and never guesses from session mode.

`finalizeGradedAssessmentAttempt` can accept that explicit historical policy, grades the resulting locked snapshot, converts a complete report to numeric evaluation or a manual-required report to null evaluation, calls the existing finalizer, and attaches an internally generated compact grading snapshot. Its output includes `lockedAttempt`; callers persist that exact snapshot before atomic finalization so the active attempt and result retain the same policy.

## StoreV2 helpers

Pure helpers insert, replace, retrieve, and remove active assessment attempts; insert, replace, and retrieve results; and atomically move a matching active attempt into results. Store validation requires every active-attempt, result, and question-history record key to match the record's own stable ID.

Atomic finalization requires the result's attempt ID, course, module, ordered question IDs, question-version map, complete response map, and grading-policy reference to match the active attempt exactly. Historical callers first store the returned `lockedAttempt`, then atomically finalize its matching result. It refuses an existing result ID instead of overwriting it; ordinary `putAssessmentResult` remains the explicit insert-or-replace helper. Every write preserves reading progress, legacy attempts, legacy results, unrelated assessment records, and question history. Key/ID disagreement, snapshot disagreement, collisions, and invalid final stores return structured failures without mutating the source.

Retrieved values are cloned so callers cannot mutate the store through a returned reference.

The PR 6 controller adds a latest-StoreV2 transaction boundary around every pilot mutation. It validates the exact controlled-pilot identity before active selection, direct routing, update, submission, and result display; only successful operations publish the new store. Structured failures preserve the latest state. Candidate-aware pilot selection retains incompatible exact-blueprint snapshots, protects unrelated assessments, diagnoses multiple active pilot candidates, and supports guarded discard or atomic replacement. A pure partitioner routes originating draft/response validation to the renderer and controller, persistence, compatibility, result, and grading failures to the session alert.

Persisted grading snapshots are not trusted as independent truth: result regrading recomputes the canonical report from exact stored responses, question versions, ownership, and policy, then rejects any structural disagreement with `GRADING_SNAPSHOT_MISMATCH`.

## What remains legacy

Atomic finalization also requires the result grading-policy reference to match the active attempt whenever either snapshot has one.

The current React quiz and result views, 400 generated questions, distractor logic, scoring, routes, CSS, and device-local learner workflow remain unchanged. No pilot question is registered with `LegacyQuizView`.

The versioned engines remain separate from the legacy quiz. PR 6 connects them only to an exact-string, default-off Aqueous pilot with accessible multi-format renderers, StoreV2 autosave, deterministic result verification, and draft-only registration. Production question conversion remains future reviewed work.
