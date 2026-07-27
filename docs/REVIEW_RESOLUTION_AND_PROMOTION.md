# Review resolution and promotion readiness

Review evidence supports a human decision; it never changes a question automatically.

## Stable issues and resolutions

Issue IDs bind the campaign, exact question version and hash, criterion, reviewer, issue code, and normalized rating or comment evidence. Changing evidence makes the old issue identity stale.

`questions:review-readiness` generates an open `resolution-template.json`. A non-open resolution requires:

- a rationale;
- a campaign reviewer or review chair as resolver;
- a valid ISO timestamp;
- an issue ID from the current evidence.

Factual-accuracy and image-rights blocking concerns may be marked `not-actionable` only by a review chair with an explicit rationale. Meeting the Aiken project flag does not resolve a reviewer comment. Every non-empty comment must be addressed before readiness.

## Human decision manifests

The supported decisions are:

- `revise`;
- `retain-draft`;
- `eligible-for-reviewed`;
- `retire`.

There is no `approved` decision in PR 8. Every decision records a stable ID, campaign and question evidence, the evidence-bundle hash, review chair, ISO timestamp, rationale, and referenced issue IDs.

`eligible-for-reviewed` requires complete independent reviewer coverage, the project reviewer minimum, exact current evidence, no unresolved blocking issue, and explicit resolution of every comment. A decision still does not mutate `reviewStatus`.

Incomplete evidence may support `revise` or `retain-draft`. Retirement requires an explicit human rationale.

## Evidence-bundle hashes

The deterministic evidence bundle covers the campaign manifest, normalized submissions, Aiken analysis, stable issues, resolutions, and review-policy identity. It excludes paths, output directories, modification times, and JSON insertion order.

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
- draft-to-reviewed requires an exact `eligible-for-reviewed` decision and explicit human reviewer attribution;
- draft-to-approved is forbidden;
- reviewed-to-approved remains outside PR 8;
- retirement requires a matching `retire` decision;
- inputs are never mutated.

Export the current comparison baseline with:

```bash
npm run questions:review-snapshot
```

The ignored snapshot records bank and question hashes, versions, current statuses, objectives, and source identities.

## Current boundary

All 36 Aqueous and Vitreous candidates and all 13 objectives remain draft. No real reviewer, rating, comment, resolution, decision, or approval is committed. Real experts still need to be recruited and their feedback resolved. A later evidence-backed change may move selected items to `reviewed`; approved status and public pilot enablement are separate decisions.
