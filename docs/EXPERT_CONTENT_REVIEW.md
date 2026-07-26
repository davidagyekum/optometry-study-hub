# Expert Content Review

All 36 Aqueous and Vitreous candidates remain `draft`. Registration in the canonical bank is not academic approval.

## Review pack

Run:

```bash
npm run questions:review-pack
```

This writes an uncommitted template, guide, and question summary under `tmp/question-review/`. The CSV contains one row per applicable criterion and leaves `reviewerId`, `rating`, and `comment` blank.

Universal criteria are relevance, factual accuracy, clarity, objective alignment, Bloom alignment, and source traceability. Applicable format-specific criteria cover distractors, rationales, component independence, image accessibility, image coordinate accuracy, image rights, and rubric quality.

The project’s ordinal review scale is:

1 — unacceptable
2 — major revision required
3 — usable with revision
4 — strong
5 — excellent

Omit a criterion when it is not applicable. Do not enter a fake rating. Reviewer IDs must be stable pseudonymous or organisational identifiers supplied by real reviewers; Codex must not invent them.

## Decision boundary

Ratings and Aiken’s V support structured discussion. They do not change `reviewStatus`, replace factual discussion, establish one universal validity threshold, or prove that an item is safe for production. An independent subject expert still needs to resolve comments, verify claims and images, and approve a subsequent version through the documented content policy.
