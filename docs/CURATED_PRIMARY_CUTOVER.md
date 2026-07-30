# Curated-primary learner experience

The release learner path treats curated practice as the recommended assessment
for all eight modules while preserving all browser-local legacy data.

## Primary path

- Study pages open each module's curated practice landing through **Practice
  this module**.
- Course cards send learners to curated practice before legacy assessment.
- The Practice Hub presents curated module summaries and their Quick, Standard,
  Full, Custom, targeted and Written Practice choices before the legacy
  archive.
- The Progress Hub continues to calculate curated and legacy evidence
  independently, with one deterministic recommendation and one de-duplicated
  activity feed.

## Compatibility archive

`/legacy` lists all frozen 50-question quizzes. `/legacy/:moduleId` opens the
module-scoped archive. Existing active attempts can resume and saved historical
results remain reviewable. The archive explicitly describes curated practice
as the recommended assessment and does not migrate, average or delete legacy
records.

The StoreV2 identity, version-1 rollback key, question history, saved responses,
review statuses and canonical assessment identities are unchanged.
