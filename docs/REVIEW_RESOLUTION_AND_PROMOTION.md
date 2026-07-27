# Review resolution and promotion readiness

Review evidence supports a human decision; it never changes a question automatically.

## Stable issues and resolutions

Issue IDs bind the campaign, exact question version and hash, criterion, reviewer, issue code, and normalized rating or comment evidence. Changing evidence makes the old issue identity stale.

`questions:review-readiness` generates an open `resolution-template.json`. A non-open resolution requires:

- a rationale;
- a campaign reviewer or review chair as resolver;
- a valid ISO timestamp;
- an issue ID from the current evidence.

Factual-accuracy and image-rights blocking concerns require review-chair authority for every no-change closure, whether labelled `resolved` or `not-actionable`. `NO_REVIEW_RATINGS`, `MISSING_REQUIRED_CRITERION`, `INSUFFICIENT_REVIEWERS`, `STALE_REVIEW_EVIDENCE`, and independence deficits cannot be waived textually. `accepted-for-discussion` never closes a blocking deficit. Meeting the Aiken project flag does not resolve a reviewer comment, and every non-empty comment must be addressed before readiness.

## Human decision manifests

The supported decisions are:

- `revise`;
- `retain-draft`;
- `eligible-for-reviewed`;
- `retire`.

There is no `approved` decision in PR 8. Every decision records a recomputed stable ID bound to the campaign hash and evidence-bundle hash, exact question evidence, review chair, ISO timestamp, rationale, and unique same-question issue IDs. Referenced issues must have current validated non-open resolutions, and eligibility decisions enumerate every closure that supports readiness.

`eligible-for-reviewed` requires complete independent reviewer coverage, the project reviewer minimum, exact current evidence, no unresolved blocking issue, and explicit resolution of every comment. A decision still does not mutate `reviewStatus`.

Incomplete evidence may support `revise` or `retain-draft`. Retirement requires an explicit human rationale.

## Evidence-bundle hashes

The deterministic evidence bundle covers the immutable campaign manifest, validated merged submissions and receipts, independent and all-reviewer analysis, stable issues, validated resolutions, and full review policy. Bundle validation recomputes every derived field and rejects mutated submissions, forged readiness, removed issues, altered resolutions, or an unchanged hash after mutation. It excludes paths, output directories, modification times, and JSON insertion order.

A change to question content, objective, source identity, rating, comment, resolution, or policy changes the relevant hash. Decisions with a stale hash are rejected.

Verify decisions with:

```bash
npm run questions:review-verify -- \
  --campaign tmp/question-review/aqueous-review-2026/campaign-manifest.json \
  --submissions tmp/question-review/aqueous-review-2026/merged-submissions.json \
  --resolutions path/to/resolutions.json \
  --decisions path/to/decisions.json
```

The command reports missing, stale, or unsupported decisions and never writes to question sources.

## Future status transitions

`verifyQuestionReviewTransition()` is a pure guard for a later pull request:

- meaningful question changes require a version increment;
- revised content returns to `draft` and invalidates old evidence;
- draft-to-reviewed requires an exact validated `eligible-for-reviewed` decision, current review question hash, zero unresolved issues, and explicit consent-aware attribution to a participating substantive reviewer; review-chair authority is recorded separately;
- draft-to-approved is forbidden;
- reviewed-to-approved remains outside PR 8;
- retirement requires a matching stable `retire` decision for the same campaign, question, hash, and evidence bundle; retired-to-reviewed requires a newer version and new evidence;
- inputs are never mutated.

Export the current comparison baseline with:

```bash
npm run questions:review-snapshot
```

The ignored snapshot records bank and question hashes, versions, current statuses, objectives, and source identities.

## Current boundary

All 36 Aqueous and Vitreous candidates and all 13 objectives remain draft. No real reviewer, rating, comment, resolution, decision, or approval is committed. Real experts still need to be recruited and their feedback resolved. A later evidence-backed change may move selected items to `reviewed`; approved status and public pilot enablement are separate decisions.
