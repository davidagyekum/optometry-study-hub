# Reusable Practice Platform

PR 10 adds a device-local, versioned practice layer around the existing
assessment session and grading engines. It does not change the legacy quiz
generator, the 400 legacy questions, legacy score selectors, either canonical
question bank, or the storage key/version.

## Supported assessment formats

The engine supports ten discriminated formats:

1. single best answer;
2. True/False;
3. multiple response;
4. ordering;
5. matching;
6. extended matching;
7. image hotspot;
8. image label;
9. short answer;
10. open response.

The canonical HVP package and the Aqueous pilot each continue to use their
existing nine-format distributions. Neither canonical bank contains a
True/False item in PR 10.

True/False questions author `correctAnswer: boolean` and do not author an
options array. Draft and persisted responses use `answer: boolean`; strings
such as `"true"` are invalid. Both `strict@1` and `diagnostic@1` grade the
format all-or-nothing.

## Practice blueprints

A strict version-1 practice blueprint identifies its course, module, practice
family, eligible review states and formats, grading policy, session profiles,
family repetition limit, history policy, custom range, and written-practice
boundary. A session stores a strict version-1 selection snapshot containing:

- blueprint and practice-family identity;
- profile and strategy;
- requested count;
- selected sections, formats, and difficulties;
- deterministic seed;
- an explicit automatic or manual-only result mode and matching history policy;
- a sorted strategy-eligible question-ID snapshot and deterministic integrity hash.

The snapshot is immutable, survives resume, is copied into the result, and is
included in exact attempt/result identity checks. Valid PR 9 Full attempts and
results without this field remain compatible and are interpreted as the
legacy Full profile.

## HVP profiles

Full remains the exact PR 9 contract: 50 questions with section targets
6/20/14/10, format targets 30/8/4/2/2/1/1/2, difficulty targets 14/26/10, at
least 20 Apply-or-higher items, no more than two items per family, no open
responses, current positive authored versions only, and no relaxation. Quick,
Standard, and Full prefer unseen current-version candidates inside quota cells
when feasibility permits; seeded ordering is retained among equal-priority
candidates.

Quick (10) and Standard (25) derive their section, format, and difficulty
targets using deterministic largest-remainder allocation from the Full
profile, followed by a capacity-aware section/format allocation. Their
higher-order minimums are four and ten. One thousand deterministic seeds per
profile verify exact totals, uniqueness, quotas, family limits, no open
response, no relaxation, and repeatability.

Custom practice accepts 5–50 questions and explicit nonempty section, automatic
format, and difficulty filters. It never expands outside the learner's
filters. Unseen, retry-missed, weak-topic, challenge, and mixed selection are
pure and deterministic. Targeting in PR 10 is section-level: a weak section
requires at least two automatically gradable attempts and either accuracy
below 80% or a current-version recent incorrect/partial outcome. Perfect and
unanswered-only sections are not weak. Weaker qualifying sections, more recent
misses, and advanced higher-order challenge questions rank first; seeded
variation occurs only inside equal-priority groups. Displayed availability
applies the two-per-family limit. Insufficient pools produce explicit
diagnostics instead of silently changing strategy.

Persisted targeted and custom attempts fail closed: compatibility checks the
strategy-evidence hash and requires every selected ID to belong to its saved
eligible pool, in addition to count, uniqueness, filters, quotas, family limits
and current versions. Evidence contains IDs and selection identity only—never
question bodies or answer keys.

## Question history

History remains keyed by question ID within `StoreV2.assessment.questionHistory`.
Existing records containing only `attemptCount`, `correctCount`, and optional
`lastAnsweredAt` remain valid. New records may add:

- encounter, supplied-response, partial, incorrect, unanswered, and
  manual-required counts;
- last encountered and last answered timestamps;
- last result ID and last outcome;
- the current authored question version.

`encounterCount` advances for every question in a submitted result.
`attemptCount` advances only for supplied, automatically gradable responses.
An answered manual response increments optional `responseCount`,
`manualRequiredCount`, encounter/answer timestamps and last-result metadata,
but cannot change automatic attempt, correct, partial or incorrect counts.
Unanswered questions do not increment `attemptCount`. Old records do not
receive invented historical breakdowns; new counters begin from the first PR
10 result.

A newer authored version replaces the current per-ID mastery record with fresh
counters. A version downgrade is rejected. This prevents correctness claims
from different authored versions being combined.

History updates are part of the same validated transaction that verifies and
stores a result and removes its active attempt. The transaction compares
blueprint identity, enforces the selection's history policy, and recomputes
grading against the current registry before history can change. A collision,
snapshot mismatch, grading disagreement, history-version conflict, malformed
history record, or final StoreV2 validation failure commits nothing. A
repeated finalization cannot double count. The Aqueous engineering pilot uses
the default disabled history policy.

## Written practice

`opt374-hvp-written-v1` contains exactly the two canonical HVP open-response
items. Drafts, navigation, flags, refresh resume, and local submission use the
same controlled session UI. Its blueprint declares `resultMode:
'manual-only'`: every result has null score and maximum, including a completely
unanswered submission. Unanswered prompts retain `unanswered`; answered
prompts retain `manual_required`. Result review is selected by blueprint
identity, never displays a percentage or scored breakdown, and shows the
canonical explanation, sample answer, and rubric. Written practice may record
encounter, response and manual-review history but never changes automatic
attempts or correctness.

## Privacy and compatibility

Everything remains in the current browser. There are no accounts, analytics,
backend, leaderboard, or synchronization. The key remains
`optometry-study-hub:v2`; valid V1 rollback data, legacy reading progress,
legacy active quizzes, legacy result history, Latest/Best selectors, PR 9
attempts/results, and Aqueous attempts/results remain compatible.

The HVP and Aqueous feature flags remain committed as `false`. PR 10 did not
deploy. PR 11 adds read-only practice and progress dashboards over these
contracts without changing history, selection, grading, storage, or the
disabled release boundary. See `docs/PROGRESS_ANALYTICS.md`.

## PR 12 release profile

The practice platform now has an automated HVP public-beta release profile that
keeps Aqueous disabled and preserves the existing StoreV2 key, version,
question-history identity, selection contracts, and manual-only Written
Practice boundary. The repository defaults remain false. Bundle audits require
authored HVP content to stay lazy and reject hidden Aqueous content. This draft
does not publish or alter any review status.

## PR 13 curated-experience registry

The learner-facing curated-practice shell now discovers experiences through a
validated registry. Eager summaries contain only answer-free identity,
availability, route and display metadata. Each registered adapter lazy-loads
its answer-bearing practice controller and optional analytics panel. Duplicate
experience IDs, route segments, course/module bindings and blueprint IDs fail
closed.

HVP is the only production registry entry. It retains the canonical route,
automatic and Written blueprint IDs, selection profiles, exact compatibility
checks and browser-local behavior. A configuration-driven definition supplies
its assembler, compatibility validators, registry, history policy and learner
labels. The shared controller owns start/resume, guarded atomic replacement and
discard, autosave, movement, flagging, submission, deterministic regrading,
finalization, history updates and result lookup. Shared components render
Quick, Standard, Full, Custom, targeted and Written launch choices, controlled
sessions and exact result review.

The test-only synthetic bank uses that same controller and UI to prove launch,
draft persistence, result dispatch and progress without HVP IDs or labels.
The Aqueous engineering pilot remains separate, disabled and absent from the
curated learner registry.

To add a future bank, first complete content provenance and independent review,
then define answer-free summary metadata, keep the bank and compatibility
logic behind lazy loaders, register unique route/module/blueprint identities,
and run import-isolation, compatibility, release-profile and Chrome tests.
Registration alone must never promote draft content or enable a feature.
PR 13 adds no bank, storage migration, legacy-score conversion or deployment.

## PR 14 Tissue Foundations curated-practice boundary

PR 14 starts from merged PR 13 commit
`443c638de39985bc566436f443ef596aa184f6b6`. It imports the byte-identical
80-question OPT 376 Tissue Foundations bank with 18 objectives, 10 registered
sources and four original neutral SVG diagrams. All questions and objectives
remain draft.

The answer-free registry now exposes a second production adapter, but
`NEXT_PUBLIC_ENABLE_TISSUE_FOUNDATIONS_CURATED_PRACTICE=false` remains the
committed default. Answer-bearing content stays behind retryable lazy practice
and progress loaders. The shared curated controller and presentation support
Quick 10, Standard 25, Full 50, Custom 5-50, targeted 10 and manual-only
Written 2 sessions without a Tissue-specific router, hook or component tree.
Full practice covers all 18 objectives; every fixed profile enforces exact
section, format and difficulty quotas, a bounded Apply-or-higher range and a
two-question family maximum. Required-objective fixed profiles use a deterministic
quota-aware optimizer that satisfies all hard contracts before maximizing unseen
current-version questions; larger or family-constrained profiles retain the generic
backtracking fallback.

Tissue attempts, results and current-version history use the unchanged StoreV2
assessment maps. Curated mastery remains separate from the preserved legacy
Tissue 50-question quiz and its Latest/Best scores. HVP behavior and checksum,
the Aqueous pilot and hashes, both storage keys, five courses, eight modules,
39 sections and 400 legacy questions remain unchanged. No question status,
backend, analytics service, account, deployment or next content bank is added.
