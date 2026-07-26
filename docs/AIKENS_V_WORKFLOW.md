# Aiken’s V Workflow

Aiken’s V summarizes how strongly ordinal expert ratings concentrate above the lowest point of a declared scale. For this project’s 1–5 rubric:

```text
s = r - 1
V = sum(s) / (n × (5 - 1))
```

The implementation retains numerator, denominator, reviewer count, submitted range, and the unrounded value; reports display V to six decimal places. For ratings 5, 5, and 4, the numerator is 11, denominator is 12, and displayed V is 0.916667.

## Commands

```bash
npm run questions:review-pack
npm run questions:aiken -- --input path/to/completed-review.csv
npm run questions:aiken -- --input path/to/completed-review.csv --flag-below 0.80
```

The optional threshold labels a result only as `needs-review`. It never marks a question reviewed or approved. Unknown questions or criteria, duplicate reviewer/question/criterion rows, missing reviewer IDs, and ratings outside 1–5 are rejected. Criteria omitted from the CSV receive no value. Fewer than three unique reviewers produces a warning.

Output is written to `tmp/question-review/aiken-report.md` and `.json` and summarized in the console. Generated review output is intentionally uncommitted.

## Interpretation

A high V is not guaranteed evidence of validity, and no threshold is universally correct for every panel or purpose. Reviewers still need to discuss factual accuracy, ambiguity, curriculum alignment, images, and clinical safety. V does not compensate for an unrepresentative panel or poor criteria.

## References

- Aiken, L. R. (1980). Content Validity and Reliability of Single Items or Questionnaires. *Educational and Psychological Measurement, 40*(4), 955–959. https://doi.org/10.1177/001316448004000419
- Aiken, L. R. (1985). Three Coefficients for Analyzing the Reliability and Validity of Ratings. *Educational and Psychological Measurement, 45*(1), 131–142. https://doi.org/10.1177/0013164485451012
