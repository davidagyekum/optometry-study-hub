# OPT 370 - Interpupillary Distance and Dispensing Quality question package

- Module ID: `pd-and-dispensing`
- Candidate questions: 80
- Learning objectives: 14
- Review status: all questions are `draft`
- Feature flag default: disabled

## Exact format distribution

```json
{
  "extended_matching": 7,
  "image_hotspot": 5,
  "image_label": 4,
  "matching": 9,
  "multiple_response": 10,
  "open_response": 2,
  "ordering": 7,
  "short_answer": 4,
  "single_best_answer": 26,
  "true_false": 6
}
```

## Integration

1. Copy this directory under `content/question-bank/opt370/pd-and-dispensing/` or adapt to the current repository convention.
2. Copy the assessment SVG assets to the public paths referenced by `bank.json`.
3. Parse the JSON with `questionBankSchema` before registration.
4. Register the experience through the shared curated registry; do not create a parallel assessment framework.
5. Keep the feature flag disabled until content review and release approval.
