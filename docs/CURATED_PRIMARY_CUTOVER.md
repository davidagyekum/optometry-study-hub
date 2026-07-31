# Curated-primary learner experience

The release learner path treats curated practice as the only assessment that can start a new session
for all eight modules while preserving all browser-local previous quiz data.

## Primary path

- Study pages open each module's curated practice landing through **Practice
  this module**.
- Course cards expose curated practice as the only new-assessment action.
- The Practice Hub presents curated module summaries and their Quick, Standard,
  Full, Custom, targeted and Written Practice choices, plus one read-only
  Previous quiz history entry.
- The Progress Hub presents curated evidence first and keeps previous quiz
  metrics in a collapsed, explicitly labelled compatibility section.

## Compatibility archive

`/legacy` and `/legacy/:moduleId` are read-only Previous quiz history routes.
Existing active attempts can resume once and saved historical results remain
reviewable. No route, recommendation or visible control can create or restart a
legacy attempt. The archive does not migrate, average or delete previous data.

The StoreV2 identity, version-1 rollback key, question history, saved responses,
review statuses and canonical assessment identities are unchanged.


PR #26 completes the hard cutover. See [Curated hard cutover](CURATED_HARD_CUTOVER.md).
