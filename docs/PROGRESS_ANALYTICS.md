# Progress Analytics

## Scope and privacy

PR 11 derives learner progress entirely from the existing browser-local
StoreV2 record. It adds no analytics cache, activity log, reading timestamp,
dashboard preference, account, telemetry, backend, or storage migration. The
key remains `optometry-study-hub:v2`, the rollback key remains
`opt376-study-state:v1`, and reset behavior is unchanged.

The public routes are:

- `/practice` for the always-available Practice Hub;
- `/progress` for the overall Progress Hub;
- `/progress/:moduleId` for module detail;
- `/practice/:experienceId` for an existing controlled experience.

## Legacy and curated boundaries

Legacy quiz statistics are never combined with curated-practice statistics.
Legacy analytics expose reading completion, an active quiz, and the retained
results currently present on the device. Because each module retains at most
20 results, the interface says **Saved attempts** and **Recent average**, not
lifetime attempts or lifetime average. Recent average is the arithmetic mean
of each retained session percentage; cross-module raw scores are never pooled.

Legacy questions do not have stable assessment IDs, difficulty, Bloom level,
objective identity, or trustworthy question history. The dashboard therefore
does not fabricate legacy objective mastery, weak-question lists, format
accuracy, or Bloom performance. Detailed question-level analytics begin with
curated practice.

## Curated result integrity

Detailed HVP analytics load only when
`NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=true`. The ordinary dashboard graph
does not statically import the HVP bank, registry, objectives, or answer keys.

Each HVP result is included only after:

1. its persisted snapshot passes the assessment-result schema;
2. its blueprint is the curated automatic or written HVP blueprint;
3. HVP compatibility validates exact identity and current versions;
4. deterministic grading against the current draft-only registry reproduces
   its grading state.

Malformed, incompatible, tampered, or stale results are omitted and counted.
Aqueous results do not enter normal practice statistics. Full PR 9 results
without PR 10 selection metadata remain compatible. Written practice is
reported separately as **Not scored** and never enters numeric performance or
mastery.

Average session percentage is the arithmetic mean of compatible session
percentages. Weighted answered accuracy is exact earned grade points divided
by exact possible grade points for answered automatically gradable responses.
Unanswered and manual-required prompts are excluded from its denominator and
reported separately. Exact partial-credit fractions are retained internally;
the interface rounds only for display.

## Current-version evidence

Each automatic HVP question receives derived evidence for current authored
version only: encounters, gradable attempts, exact points, unanswered count,
latest status, and last real activity time. Compatible verified results supply
score evidence. Current-version question history may supply coverage, latest
status, and recency when older result detail is no longer retained. When
history has encounters but no verifiable result grades, the evidence remains
coverage-only and accuracy is limited rather than invented.

### Question mastery

- **Unseen:** zero current-version encounters.
- **Learning:** fewer than two gradable attempts, or accuracy below 60%.
- **Developing:** at least two attempts and accuracy from 60% to below 75%.
- **Proficient:** accuracy from 75% to below 90%; or accuracy at least 90%
  with fewer than three attempts; or the latest status is not correct.
- **Mastered:** at least three attempts, at least 90% accuracy, and latest
  status correct.

### Section and objective mastery

Group evidence always displays accuracy, coverage, answered encounters, and
questions encountered. A recent miss means the current-version latest status
is incorrect or partial.

- **Unseen:** zero coverage.
- **Learning:** fewer than three gradable encounters, fewer than two distinct
  gradable questions, accuracy below 60%, or coverage below 25%.
- **Developing:** accuracy from 60% to below 75% with at least 25% coverage.
- **Proficient:** accuracy from 75% to below 90%; or at least 90% accuracy with
  coverage below 60%, fewer than three distinct gradable questions, or a
  recent miss.
- **Mastered:** at least 90% accuracy, at least 60% coverage, at least three
  distinct gradable questions, at least five gradable encounters, and no
  recent miss.

These labels are deterministic rules, not AI conclusions, and are never
persisted.

## Activity and recommendations

Recent activity uses only timestamps that exist: legacy and assessment
`startedAt`, plus submitted-result `submittedAt`. Reading completion has no
timestamp and is never placed on the activity timeline. Lists are sorted
newest first, deterministically tie-broken, and limited to eight items.

Recommendations are also pure and deterministic. Priority is: resume active
HVP, resume active legacy, retry missed HVP when at least ten
family-compatible questions exist, practice weak HVP topics at the same
threshold, practice unseen HVP questions at the same threshold, start HVP
Quick practice, continue the least-complete notes, take a first legacy quiz,
then retake a latest legacy score below 70%. Ties follow authored course and
module order and stable ID. Dashboard actions route to the authoritative
practice or quiz page; they do not silently replace or start assessments.

## Release boundary

Both committed assessment feature flags remain `false`. PR 11 adds the
read-only hubs and analytics but does not deploy or promote any question.
PR 12 is the current draft release-hardening and reviewed rollout-preparation
phase. It does not deploy.

## Unified recommendation coordinator

The overall Progress Hub renders exactly one primary recommendation. With HVP
disabled, it selects from pure legacy candidates without importing the HVP
bank or registry. With HVP enabled, the lazy HVP coordinator merges those
legacy candidates with verified HVP signals and applies this order:

1. recover or resume one compatible scored or Written HVP session;
2. resume a legacy quiz;
3. retry missed HVP questions when at least ten family-compatible items exist;
4. practise weak HVP topics at the same threshold;
5. practise unseen HVP questions at the same threshold;
6. offer HVP Quick only when no compatible scored HVP result exists;
7. continue the least-complete notes;
8. take a legacy quiz with no saved result;
9. retake a latest valid legacy score below 70%;
10. review the latest result.

Reading percentage is compared before authored course/module order for priority
seven. Other ties use authored course order, module order, then stable ID.
Recovery routes to the controlled landing; dashboard actions never create,
discard or replace an attempt.

## Unified recent activity

The enabled coordinator merges compatible legacy, scored HVP and Written HVP
events before sorting and applying the eight-item maximum. It uses only stored
`startedAt` and `submittedAt`, excludes reading and the Aqueous pilot, and
deterministically tie-breaks equal timestamps. Written events always say
`Not scored`. Compatible HVP results link to their exact assessment-result ID.
Only the currently routable latest legacy result says `Review latest`; older
retained results say `View module history` and route to module progress.

## Failure safety

Invalid dates and non-finite percentages render as an em dash. Legacy score
math requires a finite score, finite total and `total > 0`; malformed records
remain stored but are excluded from averages and score-driven recommendations.
HVP registry construction returns an explicit failure result, and the UI shows
a neutral analytics-unavailable state without rewriting saved data.

## PR 12 release profile

The Progress Hub remains read-only. The HVP public-beta release profile exposes
its lazy, compatibility-checked analytics without persisting dashboard state or
combining curated mastery with legacy Latest/Best scores. Disabling HVP again
hides the panels but preserves compatible StoreV2 attempts, results, and
question history. PR 12 does not publish the profile.

## Registry-driven curated analytics

PR 13 adds a generic read-only progress contribution boundary. Practice and
Progress hubs discover enabled experiences from answer-free registry summaries,
while each experience's result compatibility, registry construction and
question-level calculation remain in its lazy module. Module panels render
only resume, summary and detail variants through a shared mastery presentation.
The outer coordinator loads every enabled contribution, combines all candidates
with legacy evidence, selects one deterministic recommendation, and merges,
deduplicates, sorts and caps one global activity feed at eight items. A failed
contribution cannot rewrite storage or suppress valid evidence from other
modules.

HVP is the sole production analytics adapter and retains all existing
inclusion, omission, mastery, recommendation, activity and exact-result
behavior. Legacy and curated metrics remain separate, Written Practice remains
**Not scored**, malformed records remain stored but omitted, and no analytics
state is persisted. Aqueous remains excluded. No storage migration or legacy
score conversion is introduced.
