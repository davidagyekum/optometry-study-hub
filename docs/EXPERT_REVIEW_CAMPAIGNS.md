# Expert review campaigns

PR 8 operationalizes expert review without performing or simulating it. Every current Aqueous and Vitreous question and objective remains `draft`; the committed reviewer fixtures are fictional, rating-free test data.

## Review policy

Campaigns resolve the immutable `opt376-expert-review@1` policy:

- at least three unique, independent, unconflicted reviewers per applicable criterion;
- integer ratings from 1 to 5;
- a project discussion flag when Aiken's V is below 0.80;
- individual ratings of 1 or 2 require discussion;
- low factual-accuracy or image-rights ratings block readiness until explicitly resolved.

The reviewer minimum and 0.80 flag are project workflow choices. They are not universal academic thresholds, and meeting them never validates, reviews, or approves an item. Human judgment remains mandatory.

The required criterion matrix comes from `applicableCriteria(question.format)`. The campaign layer does not maintain a competing list.

## Prepare reviewer profiles

Create an uncommitted JSON array of reviewer profiles. Each profile needs a stable lowercase slug ID, at least one role, stable expertise tags, an independence attestation or declared conflict, and an attribution-consent choice. Display names and affiliations are optional and must not be stored without consent.

Pseudonymous IDs are suitable for working packs. The future human attribution process is still required before a question can move to `reviewed`. Do not commit a real reviewer registry.

## Create a campaign

```bash
npm run questions:review-campaign -- \
  --campaign-id aqueous-review-2026 \
  --reviewers path/to/reviewers.json
```

Tests may supply `--created-at <ISO timestamp>` for deterministic output. The command writes ignored artifacts under `tmp/question-review/<campaign-id>/`:

- `campaign-manifest.json`;
- `campaign-summary.md`;
- one prefilled CSV and guide per reviewer;
- complete expert-only Markdown and JSON item dossiers.

The canonical bank produces 338 question/criterion rows per reviewer. Each row binds the campaign, bank, question ID, version, evidence hash, section, objective, format, Bloom level, difficulty, criterion, and reviewer ID. Never edit those evidence columns.

## Complete and merge packs

A row may contain a numeric rating and optional comment, a comment without a rating, or neither. Blank rows remain part of coverage accounting. Comment-only evidence is retained exactly after CSV decoding.

```bash
npm run questions:review-merge -- \
  --campaign tmp/question-review/aqueous-review-2026/campaign-manifest.json \
  --input path/to/reviewer-a.csv \
  --input path/to/reviewer-b.csv \
  --input path/to/reviewer-c.csv
```

Input order does not affect output. The merge rejects unregistered or duplicate reviewers, duplicate question/criterion evidence, stale hashes, missing or unexpected rows, changed metadata, malformed CSV, and ratings outside 1–5. The canonical output is `merged-submissions.json`; the CSV is a convenience export.

Reviewer comments are untrusted text. The workflow does not render them as executable HTML or evaluate spreadsheet formulas. Inspect untrusted CSV cells before opening them in spreadsheet software.

## Analyze readiness

```bash
npm run questions:review-readiness -- \
  --campaign tmp/question-review/aqueous-review-2026/campaign-manifest.json \
  --submissions tmp/question-review/aqueous-review-2026/merged-submissions.json
```

Optional arguments are `--resolutions <file>` and `--require-ready`. The default command reports incomplete evidence successfully. `--require-ready` exits nonzero unless every question is ready for a human decision.

Aiken's V is calculated separately for every applicable criterion. Only `overall-content-validity` is used as the per-question V; ratings are never pooled across unlike criteria. Zero ratings remain explicitly unrated. Every qualitative comment, conflict, low rating, missing criterion, independence failure, and project-flag result becomes a stable issue.

Calculated states are deliberately limited to:

- `not-started`;
- `incomplete`;
- `requires-resolution`;
- `ready-for-human-decision`.

No calculated state is named `valid`, `reviewed`, or `approved`.

## Privacy and generated evidence

Campaign output is device-local repository tooling, not an online portal. It is ignored by Git and must not be imported into browser code. The workflow adds no accounts, database, analytics, or cloud storage. Preserve only the minimum identity data reviewers consented to share.
