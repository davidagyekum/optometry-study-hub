# Aiken's V Workflow

Aiken's V summarizes how strongly ordinal expert ratings concentrate above the lowest point of a declared scale. For this project's 1–5 rubric:

```text
s = r - 1
V = sum(s) / (n × (5 - 1))
```

For ratings 5, 5, and 4, the numerator is 11, denominator is 12, and displayed V is 0.916667. The number-only calculation returns `ratingCount`; the summary layer separately computes unique normalized reviewers.

## Commands

```bash
npm run questions:review-pack
npm run questions:aiken -- --input path/to/completed-review.csv
npm run questions:aiken -- --input path/to/completed-review.csv --flag-below 0.80
```

The parser rejects malformed CSV, wrong row widths, extra columns, unterminated quotes, non-positive/non-integer versions, malformed reviewer IDs, duplicate normalized reviewer/question/criterion rows, ratings outside 1–5, unknown questions/criteria, and any canonical bank/version/hash/section/objective/format/Bloom/difficulty mismatch.

## Correct summary semantics

The canonical bank defines the complete expected question/criterion matrix. Reports include all 338 applicable pairs, including unrated pairs:

- zero reviewers: no V, status `unrated`, and `NO_REVIEW_RATINGS`;
- one or two unique reviewers: provisional V and `INSUFFICIENT_REVIEWERS`;
- three or more: normal V, with the optional threshold producing only `needs-review`.

Per-question V uses only `overall-content-validity`. Every other criterion is reported independently per question and criterion. Relevance, accuracy, clarity, rights, Bloom alignment, and other heterogeneous ratings are not pooled. Reports retain the question version and evidence hash and show applicable, rated, and unrated criterion counts plus unique-reviewer and question coverage.

Output is written to ignored `tmp/question-review/aiken-report.md` and `.json` and summarized in the console. No report mutates review status.

## Interpretation

A high V is not guaranteed evidence of validity, and no threshold is universally correct for every panel or purpose. Reviewers still need to discuss factual accuracy, ambiguity, curriculum alignment, images, and clinical safety. V does not compensate for an unrepresentative panel or poor criteria.

## References

- Aiken, L. R. (1980). Content Validity and Reliability of Single Items or Questionnaires. *Educational and Psychological Measurement, 40*(4), 955–959. https://doi.org/10.1177/001316448004000419
- Aiken, L. R. (1985). Three Coefficients for Analyzing the Reliability and Validity of Ratings. *Educational and Psychological Measurement, 45*(1), 131–142. https://doi.org/10.1177/0013164485451012

## Campaign analysis in PR 8

Campaign readiness calculates Aiken's V separately for each applicable criterion and uses only `overall-content-validity` for per-question V. The 0.80 value is a project discussion flag, not universal proof of validity. Numeric ratings alone enter V; all comments remain qualitative issues until explicitly addressed.
