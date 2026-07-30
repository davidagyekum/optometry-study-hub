# Expert Content Review

All 80 Aqueous and Vitreous candidates and all 13 objectives remain `draft`. Registration in the canonical bank is not academic approval.

## Self-contained review pack

Run:

```bash
npm run questions:review-pack
```

The command writes four ignored expert-only files under `tmp/question-review/`:

- `aqueous-vitreous-review-pack.csv` — 338 blank question/criterion rows;
- `aqueous-vitreous-review-guide.md` — scale, identity, and workflow instructions;
- `aqueous-vitreous-review-items.md` — complete human-readable item evidence;
- `aqueous-vitreous-review-items.json` — the same complete structured evidence.

The dossier includes every full question object, structured stimulus/table data, options or components, correct answer map, rationales, explanation, objective and statement, Bloom level, difficulty, misconception tags, source titles/locators/URLs, accepted short answers, open-response sample/rubric, and image path/alt/coordinates/current audit status. It is never imported by the student UI.

## Evidence binding

Every CSV row repeats the canonical bank ID, question ID, positive integer version, deterministic SHA-256 `questionHash`, section, objective, format, Bloom level, and difficulty. The hash covers the review-relevant question object, the complete objective, and registered source identities. A rated row is rejected if any evidence-binding field differs from the current canonical bank. Reviewers must begin from a freshly generated pack after an item, objective, or source changes.

Reviewer IDs are normalized by trimming and lowercasing, then validated as stable slug IDs such as `reviewer-a`. Case or surrounding whitespace cannot create a second reviewer identity. Only real project-supplied reviewer IDs and ratings may be entered.

## Criteria and scale

`overall-content-validity` is universal and is the only criterion used for a per-question Aiken's V. Relevance, factual accuracy, clarity, objective alignment, Bloom alignment, source traceability, and applicable format-specific criteria each retain a separate question/criterion value. Heterogeneous criteria are never pooled into one V.

The review scale is:

1 — unacceptable
2 — major revision required
3 — usable with revision
4 — strong
5 — excellent

Blank rows are retained so the report can show the complete expected coverage matrix. Zero ratings emit `NO_REVIEW_RATINGS`; one or two unique reviewers produce a provisional value plus `INSUFFICIENT_REVIEWERS`; three or more produce the normal value/status decision.

## Decision boundary

Ratings and Aiken's V support structured discussion. They do not change `reviewStatus`, replace factual discussion, establish a universal validity threshold, or prove that an item is safe for production. An independent subject expert must resolve comments, verify claims and images, and explicitly approve a later item version through the content-review policy.
## Objective-source completeness

The dossier and all criterion/image evidence use the union of question-level and objective-level registered source identities. This is the same source-identity union covered by the deterministic evidence hash, so an expert can inspect every source that contributes to the reviewed objective even when a particular question cites only a subset directly.

## PR 8 campaign boundary

Expert review is now organized through evidence-bound campaigns with one validated pack per registered reviewer. Ratings and qualitative comments are separate evidence: blank ratings never discard non-empty comments. Stable issues, explicit resolutions, review-chair decisions, and transition verification remain non-mutating. No current item has received real independent expert review.
