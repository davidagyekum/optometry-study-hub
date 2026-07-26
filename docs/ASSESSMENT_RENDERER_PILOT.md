# Assessment Renderer Pilot

## Purpose and status

PR 6 adds the first controlled student-facing use of the versioned assessment system. It renders the nine draft Aqueous Humour and Vitreous Body engineering examples, persists an in-progress attempt in StoreV2, grades complete responses with `diagnostic@1`, and provides a format-aware result review.

The pilot is disabled by default. Its questions are draft engineering examples, have not been academically approved as production course assessment items, do not affect the existing course score, and do not replace the current 50-question course-review quiz.

## Feature flag

The public build-time flag is:

```text
NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT
```

Only the exact string `true` enables the pilot. Undefined, empty, `false`, `TRUE`, `1`, `yes`, and every other value keep it disabled. `.env.example` records the safe default:

```text
NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false
```

For local review, create an untracked `.env.local` containing the flag set to `true`, then run `npm run dev`. Do not commit an enabled environment file.

The flag controls exposure, not authorization. Client-delivered environment values and draft content are not a security boundary. Sensitive or restricted assessment material must not be placed in the browser bundle.

## Routes and exposure

When enabled, the pilot uses:

- `/pilot/aqueous-vitreous` for the warning, start, resume, restart, and previous compatible result;
- `/assessment/:attemptId` for a persisted active attempt;
- `/assessment-result/:resultId` for deterministic result verification and review.

When disabled, the Aqueous notes page has no pilot entry and direct pilot URLs show a neutral unavailable view without registering or rendering the draft bank. Ordinary home, course, notes, legacy quiz, and legacy results routes remain unchanged. The client route `moduleId` field is retained as a generic route-resource ID to avoid a broad routing rewrite.

## Nine accessible renderers

`AssessmentQuestionRenderer` dispatches to one focused renderer for each schema format:

1. single-best-answer radios;
2. multiple-response checkboxes;
3. ordering with Move up, Move down, and explicit confirmation controls;
4. matching with associated selects;
5. extended matching with a shared option bank and associated selects;
6. image hotspot buttons with meaningful text labels and `aria-pressed`;
7. image labelling with target markers and associated selects;
8. short-answer text input;
9. open-response textarea.

All controls use stable authored IDs and the attempt’s stored presentation order. Renderers are presentational: they do not grade, reveal an answer key before submission, or write to local storage. Ordering and image labelling do not require drag-and-drop, so keyboard and touch users receive the same complete interaction.

New assessment diagrams use `next/image`, fixed dimensions, responsive containers, and alternative text that describes the diagram without revealing the answer.

## Draft responses and complete responses

Complete persisted responses remain the strict PR 4 contracts. PR 6 adds an optional active-attempt field:

```ts
draftResponses?: Record<string, AssessmentDraftResponse>
```

Drafts preserve valid incomplete work: a below-minimum multiple selection, a partial matching map, partial labels, typed text, or a learner-adjusted order. Every draft is validated against the exact registered question version, course, module, authored IDs, selection limits, and reuse rules.

An immutable draft update performs two coordinated operations:

- it stores the validated draft;
- it stores a complete response only when the format-specific completion rule is satisfied.

Making a formerly complete draft incomplete removes its committed response but retains the draft. Clearing removes both. Historical attempts without `draftResponses` remain valid. Malformed persisted drafts return structured resolution errors and are never silently repaired.

## Autosave, resume, and recovery

Every valid draft, flag, and navigation update replaces the active StoreV2 attempt through the existing immutable storage helpers. Renderers never access browser storage directly. Save and exit leaves the same active attempt available on the landing view.

Resume verifies the pilot blueprint, exact nine-question set, question versions, ownership, stored presentation order, `diagnostic@1`, complete responses, and drafts. A failed resolution produces a recovery view with human-readable and collapsible diagnostic details. The learner may return to the landing view or confirm discarding only the broken pilot attempt.

## Submission and grading

Submission summarizes answered, in-progress, unanswered, and flagged counts. It warns that incomplete drafts grade as unanswered and that an answered open response requires manual review.

`finalizeGradedAssessmentAttempt` grades only `attempt.responses`; drafts never become grading inputs. `finalizeAssessmentStore` then atomically removes the active attempt and adds the result. The result omits `draftResponses`, preserves exact question order and versions, and remains locked to `diagnostic@1`.

Automatically gradable responses receive the existing PR 5 policy outcomes. Diagnostic partial credit remains limited to matching, extended matching, and image labelling. An answered open response produces `manual_required`, an automatic subtotal, and no fabricated final percentage or automatically assigned open-response mark.

## Results review

The result route retrieves the exact result from StoreV2 and runs deterministic `gradeAssessmentResult` verification. A stale question, policy mismatch, or grading-snapshot mismatch displays an integrity error rather than trusting the stored totals.

The review follows stored question order and provides format-specific learner responses, expected automatic responses, component outcomes, explanations, relevant rationales, and links to the related study-note anchor. Open responses show the learner text, sample answer and rubric, plus the manual-review boundary.

## StoreV2 and legacy separation

Pilot attempts and results live only in:

```text
store.assessment.activeAttempts
store.assessment.results
```

They do not enter legacy `store.active` or `store.results`, do not update `assessment.questionHistory`, and do not affect homepage or module Latest and Best values. Existing reading progress, legacy attempts, and legacy results are preserved during pilot use and submission.

Module reset removes assessment attempts and results for that module. Course reset removes assessment attempts and results for that course. Both preserve unrelated assessment records and the deliberately unused question history. Global reset continues to clear the entire StoreV2 record and its rollback generation.

## Privacy

Pilot answers, flags, drafts, and results are private to the current browser storage. There are no learner accounts, analytics, server database, leaderboard, or cross-device synchronization. Clearing browser data or using the relevant confirmed reset removes the corresponding local record.

## What remains legacy

The existing 400 generated questions, distractor generator, legacy renderer, 50-question quiz flow, score calculations, history, Latest and Best metrics, and public course-review experience remain unchanged. No production conversion of those questions begins in PR 6.

## Academic review still required

The nine pilot questions remain `draft`. They demonstrate engineering contracts and accessibility across formats, not lecturer or clinical approval. Before any production enablement, each item and image needs source verification, independent subject review, option and rationale review, accessibility review, and an approved status with recorded reviewer metadata.

A future production pilot should be enabled only after:

- the relevant questions are academically reviewed and approved;
- image rights and clinical accuracy are confirmed;
- browser, assistive-technology, persistence, migration, and grading tests pass;
- production monitoring and recovery expectations are agreed;
- the legacy-replacement and score-history migration plan is separately reviewed.

PR 6 does not begin that conversion or PR 7.
