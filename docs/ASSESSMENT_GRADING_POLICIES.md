# Assessment Grading Policies

## Purpose and boundary

PR 5 adds a pure, deterministic grading layer over the versioned question and session contracts. PR 6 invokes it from a default-disabled Aqueous engineering pilot without changing the live 400-question legacy quiz.

The grading layer returns structured data and errors. It does not update React state, browser storage, or `assessment.questionHistory`.

## Policy identity and mode defaults

Policies use a stable ID and positive version:

| Policy | Version | Purpose |
|---|---:|---|
| `strict` | 1 | All-or-nothing scoring for every automatically gradable format |
| `diagnostic` | 1 | Strict scoring except for three explicitly component-scored mapping formats |

New attempts lock a policy reference when they are created:

| Session mode | Default policy |
|---|---|
| Study | `diagnostic` version 1 |
| Exam | `strict` version 1 |
| Mastery | `strict` version 1 |

An explicit available policy may override the mode default at creation. Once stored, the policy cannot be changed for grading or finalization. Unknown IDs, unsupported versions, and malformed runtime references fail structurally; the engine never silently substitutes another policy.

Historical attempts and results without a policy remain schema-valid, but no mode default is guessed for them. `lockAttemptGradingPolicy` validates and copies a historical attempt, requires an explicit available policy, rejects conflict with an existing lock, and returns the new locked snapshot without mutating the source. `finalizeGradedAssessmentAttempt` accepts the same explicit policy and returns `lockedAttempt` so callers can persist that snapshot before atomic StoreV2 finalization.

Policy locking makes grading reproducible. A stored result can be regraded only with the exact question IDs, question versions, responses, course, module, and policy that produced it.

## Normalized weighting and statuses

Every question has a normalized maximum of one point. Outcomes are:

- `correct`: score 1;
- `incorrect`: score 0;
- `partial`: score strictly between 0 and 1;
- `unanswered`: score 0;
- `manual_required`: score `null`.

There is no negative marking. A partial outcome stores a six-decimal display score plus its exact `correctParts` and `totalParts`. Reports sum the exact component fractions first and round the aggregate once, preventing repeated thirds from becoming `0.999999`.

## Per-format rules

| Format | Strict version 1 | Diagnostic version 1 |
|---|---|---|
| Single best answer | Exact option ID | Same as strict |
| Multiple response | Exact selected-ID set; order ignored | Same as strict |
| Ordering | Exact sequence | Same as strict |
| Matching | Every prompt correct | Fraction of prompts correct |
| Extended matching | Every stem correct | Fraction of stems correct |
| Image hotspot | Exact region-ID set; order ignored | Same as strict |
| Image labelling | Every target correct | Fraction of targets correct |
| Short answer | Exact normalized accepted answer | Same as strict |
| Open response | Manual review when answered | Same as strict |

Diagnostic partial credit is deliberately limited to matching, extended matching, and image labelling because these formats already define independent components. Multiple-response penalties, adjacent-pair ordering scores, hotspot-area weighting, and fuzzy text similarity would introduce unreviewed assumptions, so they remain all-or-nothing.

## Short-answer normalization

Authoring validation and grading share one normalization function. Operations occur in this order:

1. optional leading and trailing trim;
2. optional internal whitespace collapse;
3. optional case-insensitive conversion;
4. optional removal of terminal Unicode punctuation.

Unicode symbols are preserved, so meaningful responses such as `Na+` and `15°` remain intact. Accepted answers that normalize to an empty string are authoring errors, and an empty normalized learner response can never receive credit.

The normalized response must equal a non-empty normalized accepted answer. Substrings, keywords, edit distance, spelling similarity, and fuzzy medical comparisons are not used.

## Unanswered and open responses

An absent response is `unanswered`, including an absent open response. It receives zero of one and remains part of the denominator.

A present nonblank open response is always `manual_required` with a null score and a one-point maximum. The engine preserves the response but does not inspect rubric length, sample answers, or keywords to infer points. Whitespace-only written responses are invalid persisted data, not valid answers.

PR 6 active attempts may also contain incomplete `draftResponses`. Grading deliberately ignores them and reads only structurally complete `responses`, so an incomplete draft is reported as unanswered. Result snapshots omit drafts.

## Session reports

The report contains one outcome for every question in stored order. It always provides:

- `autoScore`: the rounded sum of exact numeric contributions;
- `autoMaxScore`: sum of numeric outcome maxima;
- exact counts for correct, partial, incorrect, unanswered, and manual outcomes.

When no manual outcome exists, report status is `complete` and top-level score and maximum equal the automatic totals. When any manual outcome exists, report status is `manual_required`, top-level totals are null, and the automatic subtotal remains available.

## Persistence and deterministic regrading

Attempts and results may store `gradingPolicy`. Results may additionally store a compact version-1 grading snapshot containing the policy, per-question outcomes, totals, and counts.

Storage validation requires:

- grade keys to exactly cover the result question order;
- grade IDs and versions to match their result records;
- partial scores to equal their rounded component fraction;
- outcome status and score relationships to be valid;
- automatic totals, calculated from exact contributions, and status counts to equal the grade records;
- complete grading totals to equal the result totals;
- manual-required results to retain null top-level totals.

The snapshot never embeds question objects, answer keys, accepted-answer lists, rationales, or rubrics. There is no public API for attaching an arbitrary report to unrelated responses.

`gradeAssessmentResult` deterministically regrades stored responses only when exact registered question versions and ownership still match. When a stored grading snapshot exists, the canonical recomputed report must structurally equal it, ignoring only `schemaVersion` and object-key insertion order. Any disagreement returns `GRADING_SNAPSHOT_MISMATCH`; missing or newer questions and policy drift produce their own structured failures rather than silent upgrades.

## Why question history is unchanged

PR 5 does not update `assessment.questionHistory`. The current history record cannot safely distinguish partial credit, manual outcomes, policy versions, or question-version changes. A later reviewed migration must define those semantics before `attemptCount` or `correctCount` changes.

## What remains legacy and what comes next

The current legacy React quiz, legacy result page, scoring, generated distractors, and 400 live questions remain unchanged. The nine-format bank stays draft and is reachable only through the default-disabled controlled pilot when the feature flag is exactly `true`.

PR 6 adds accessible multi-format renderers, diagnostic grading, and verified result review for engineering evaluation. It does not add a public policy selector, automatic open-response scoring, question-history updates, or production question conversion.
