# Current State

## Verified state

- PR 13 is merged; PR 14 exact base commit: `443c638de39985bc566436f443ef596aa184f6b6`
- Courses: 5
- Modules: 8
- Study sections: 39
- Live legacy-generated questions: 400, with 50 questions per module
- Current persistence key: `optometry-study-hub:v2`
- Rollback key retained after migration: `opt376-study-state:v1`
- Canonical Aqueous and Vitreous candidate bank: 36 draft questions across 6 sections and 13 objectives
- Assessment pilot: the exact 9 engineering questions, derived from the canonical bank
- Canonical OPT 374 Human Visual Perception bank: 120 draft questions, 23 objectives, and 19 sources
- HVP curated practice: reviewed public-beta behavior is unchanged
- Canonical OPT 376 Tissue Foundations bank: 80 draft questions, 18 objectives, 10 sources, and 4 SVG assessment diagrams
- Tissue Foundations curated practice: default-disabled Quick 10, Standard 25, Full 50, Custom, targeted, and manual-only Written 2 sessions
- Canonical OPT 376 Ocular Adnexa bank: 80 draft questions, 18 objectives, 8 sources, and 5 original SVG assessment diagrams
- Ocular Adnexa curated practice: default-disabled Quick 10, Standard 25, Full 50, Custom, targeted, and manual-only Written 2 sessions

## Courses and modules

| Course | Modules |
|---|---|
| Environmental Vision | Environmental Vision |
| Human Visual Perception | Human Visual Perception |
| Neuro Anatomy & Ocular Anatomy | Tissue Foundations for Neuro Anatomy; Ocular Adnexa & Lacrimal Apparatus; Aqueous Humour & Vitreous Body; Blood Supply to the Eye |
| Ocular Pharmacology | Adrenergic & Cholinergic Pharmacology |
| Systemic Pathology | Systemic Pathology Review |

## Application model

`app/StudyApp.tsx` is the orchestration layer. Course and module content lives under `content/legacy/`; legacy question generation, attempts, progress, route handling, and storage are separated under `lib/` and `hooks/`; and the home, course, study, quiz, results, figure-dialog, header, and footer views are focused components.

Each live module contains sections and 50 fact records. The isolated legacy `questionsFor()` generator converts each fact into a single-best-answer-style question and selects three distractors positionally from related facts. Generated questions are cached by module for the browser session.

The new assessment domain lives alongside—not inside—the live engine. It defines stable IDs, ten discriminated question formats, objectives, sources, Bloom levels, difficulty, rationales, misconception tags, review states, structured diagnostics, and deterministic coverage reports. The Aqueous and Vitreous pilot is not registered with the live quiz.

A headless session layer can register approved questions through a defensive validated registry, create deterministic arbitrary-length attempts, validate all ten persisted response shapes, update attempts immutably, diagnose stale snapshots, finalize through an external evaluation, and update keyed StoreV2 assessment maps with exact atomic snapshot checks.

A separate grading layer provides immutable strict and diagnostic version-1 policies, mode defaults, explicit historical policy adoption, one-point normalized outcomes, exact-fraction diagnostic aggregation, manual open-response boundaries, compact result snapshots, and deterministic exact-version regrading. PR 6 connects it only to a default-disabled Aqueous engineering pilot with accessible renderers for all nine formats. The controlled route now enforces the exact nine-question identity and current versions, composes mutations through a latest-store transaction, retains incompatible exact-blueprint candidates for guarded discard or atomic replacement, detects multiple pilot candidates, enforces draft/response coherence, partitions question validation from session alerts, and provides focus/reduced-motion-safe submission and navigation.

Client route state supports:

- `/`
- `/practice`
- `/progress`
- `/progress/:moduleId`
- `/course/:courseId`
- `/study/:moduleId`
- `/quiz/:moduleId`
- `/results/:moduleId`
- `/pilot/aqueous-vitreous`
- `/practice/human-visual-perception-curated`
- `/assessment/:attemptId`
- `/assessment-result/:resultId`

History updates use `pushState`, and `popstate` restores the matching view.

## Device-local persistence

The validated version-2 store preserves:

- completed reading-section IDs by module;
- one active legacy quiz attempt per module;
- up to 20 recent submitted legacy results per module;
- assessment maps for pilot attempts, grading-aware results, and unchanged question history, isolated from legacy score history.

On first V2 load, valid V1 `read`, `active`, and `results` fields migrate exactly to the new key. The V1 record is retained for rollback until the learner explicitly uses the global reset, which writes valid empty records to both generations. Initial hydration does not rewrite valid or malformed stored bytes, while later learner actions still save. Failed learner-originated saves retain dirty state so a later persistence call can retry. Malformed V1 or V2 data, unavailable browser storage, and throwing accessors do not crash the application or delete the original raw record. There is no account, backend database, analytics feed, or cross-device sync.

## Strengths

- A working responsive learning experience across five course areas.
- Consistent 50-question live assessments and resumable attempts.
- Device-local privacy with explicit reset controls.
- Attributed instructional figures and accessible figure enlargement behavior.
- Modular legacy architecture protected by compatibility tests.
- Validated assessment and storage boundaries ready for reviewed question migration.
- Existing public Sites deployment and reproducible Vinext production build.

## Known technical debt

- The legacy distractor generator can create weak or duplicate options.
- The live 400 questions are not yet represented by the new assessment schema.
- Client routes are parsed manually.
- The multi-format pilot remains draft, disabled by default, and unsuitable as an approved examination bank. Disabled reset prompts keep their original wording unless matching hidden assessment data requires disclosure; reset behavior still removes that hidden data.
- Four intentional `<img>` lint warnings remain until a later UI-focused change.

## Known educational limitations

- Lecture material is not automatically authoritative.
- The live bank lacks per-question sources, Bloom levels, difficulty, reviewer status, option rationales, and misconception tags.
- The schema pilot remains `draft` and is an engineering demonstration, not an approved examination bank.
- Named lecturer attribution identifies the supplied teaching source; it does not imply approval of rewritten notes or questions.
- Image ownership and reuse rights require ongoing review.
- The current 400 questions should not be treated as a validated examination bank.

## PR 7 authoring and review foundation

The canonical source of truth is `content/question-bank/opt376/aqueous-vitreous/`. Its exact blueprint covers 36 draft candidates, six per study section, including 22 higher-order items. The existing engineering pilot is selected by stable ID from that bank and remains default-disabled; the other 27 candidates have no browser launcher and cannot enter a pilot attempt.

Question validation and reporting now use the canonical bank. `questions:blueprint` enforces the declared distribution and minimum objective coverage. `questions:review-pack` exports blank, applicable expert-review criteria, and `questions:aiken` validates real 1–5 ratings and reports Aiken’s V without mutating review status. No expert ratings have been collected, no item is academically approved, and the live 400-question quiz and browser storage contracts are unchanged.
## PR 7 review correction state

The 36-question Aqueous and Vitreous candidate bank remains draft-only and the exact nine-question pilot remains disabled by default. The expert export now generates a 338-row evidence-bound CSV plus complete Markdown/JSON item dossiers. No real reviewer identity, rating, reviewed status, or approved status is present. Aiken reporting uses only `overall-content-validity` for per-question V and reports the full applicable/rated/unrated matrix. The learner-facing application, StoreV2, legacy 400-question bank, and pilot feature gate are unchanged.
## Final PR 7 review isolation correction

The disabled nine-question pilot is assembled directly from `questions/preservedPilot.ts`, filtered objectives, and filtered registered sources. Its import graph does not reach `bank.ts` or any of the 27 hidden candidate-question modules. The canonical 36-question authoring bank remains available only to authoring, validation, blueprint, and expert-review tooling.

## PR 8 operational expert-review workflow

The repository can create evidence-bound campaigns, prefill one 338-row pack per registered reviewer, merge validated packs in deterministic order, preserve comment-only evidence, analyze criterion-specific Aiken values, generate stable issues, validate resolutions and chair decisions, export a bank snapshot, and verify a future status transition. Generated output is ignored and no campaign module is imported by the browser application. All current questions and objectives remain draft, no real ratings or identities are committed, and the pilot feature flag remains false.


## PR 8 review hardening

Campaign identity now includes a deterministic hash over the full normalized campaign, reviewer profiles, policy, timestamp, and ordered criterion matrix. Exact campaign recreation is a no-op that never rewrites reviewer evidence; malformed or conflicting directories fail closed. Reviewer packs, merged evidence, issues, reports, bundles, and decisions carry that identity. Merged evidence is runtime-validated and self-hashed before analysis; evidence bundles recompute analysis, issue application, and resolutions rather than trusting caller-supplied state. Readiness uses independent, unconflicted coverage and cannot waive missing ratings, criteria, reviewers, stale evidence, or independence deficits. Stable decisions and status-transition verification are exact to the campaign, internally recomputed canonical question hash and content, evidence bundle, decision type, chair authority, and a decision-bound independent, unconflicted, consent-aware substantive attribution. Markdown JSON exports use fences longer than any untrusted backtick run. These changes remain authoring/review tooling only; the learner application, question content, objectives, storage, scoring, and disabled pilot are unchanged.

## PR 9 OPT 374 curated-practice boundary

The canonical package JSON is preserved byte-for-byte and validated separately
from the Aqueous bank. Six original SVG schematics satisfy the declared image
viewBoxes and normalized coordinates. A seeded assembler creates 50-question
Study-mode sessions with exact section and format quotas, a maximum of two
questions per family, at least 20 Apply-or-higher items, and deterministic
difficulty targeting.

`NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=false` remains the repository
default. When disabled, the ordinary learner graph cannot import the 120-item
bank or its answer keys. When enabled, attempts and results dispatch by
`opt374-hvp-curated-v1`, remain in StoreV2 assessment maps, and do not mutate
legacy facts, active quizzes, results, Latest/Best scores, or question history.
All 120 questions and 23 objectives remain draft. No expert evidence, review
status transition, deployment, or public enablement is part of PR 9.

## PR 10 reusable practice and history boundary

The assessment engine now supports ten formats, including dedicated boolean
True/False, while the unchanged HVP and Aqueous banks continue using nine
formats. HVP Full remains backward-compatible with PR 9 snapshots and exact
50-question quotas. New strict selection snapshots identify Quick, Standard,
Full, Custom, targeted, and written sessions. Strategy snapshots retain
tamper-evident eligible-ID evidence; fixed profiles prefer unseen questions
without weakening quotas; weak sections require genuine low-accuracy/recent-miss
evidence. Written results are blueprint-bound manual-only results even when
unanswered, and manual responses cannot alter automatic mastery. HVP
finalization compares blueprint/history policy and deterministically regrades
before atomically updating backward-compatible, version-aware question
history; the Aqueous pilot
remains excluded. The storage key/version, legacy data, legacy scores, both
committed feature flags, and privacy model are unchanged. Details are in
`docs/PRACTICE_PLATFORM.md`.

## PR 11 practice and progress boundary

The learner application now has `/practice`, `/progress`, and
`/progress/:moduleId` routes while preserving controlled
`/practice/:experienceId` routing. Legacy reading, active quizzes, and at most
20 saved results per module are summarized without inventing lifetime or
question-level history. When HVP is enabled, a lazy HVP-specific panel
schema-validates, compatibility-checks, and deterministically regrades saved
results before showing current-version evidence or mastery. Written practice
remains Not scored, Aqueous remains excluded, and legacy and curated scores
are never combined. Analytics are read-only; StoreV2, both storage keys,
reset behavior, and both committed false feature flags are unchanged.

### PR 11 review corrections

The Progress Hub now selects one recommendation across verified HVP and legacy
signals and merges eligible activity across both systems before sorting and
limiting it. Compatible scored and Written HVP attempts are represented
explicitly; incompatible or multiple HVP candidates route to controlled
recovery. HVP summaries expose the five-level current-question mastery
distribution, active state, compatible-session/profile/strategy counts,
gradable encounters, integrity omissions and individually reviewable Written
sessions, which remain unscored.

Legacy malformed dates, scores and totals now fail safely in read-only
analytics without deleting or rewriting stored records. Older legacy activity
links to module history rather than pretending the latest-result route can
open an exact historical result.

## PR 12 release-hardening boundary

PR 11 is merged and PR 12 is the current draft release phase. Committed feature
defaults remain false. The intended reviewed HVP public-beta artifact uses
Aqueous false and HVP true, but production HVP has not been published during
this draft PR. All 36 Aqueous questions, 13 Aqueous objectives, 120 HVP
questions, and 23 HVP objectives remain draft.

Release tooling now validates content identity, storage compatibility, exact
profiles, bundle isolation, byte budgets, Sites configuration, security
headers, route identity, and a clean-tree manifest. HVP question history is
active in StoreV2 when compatible curated results are finalized; it stays
separate from legacy scores. No migration is added by the release.

The current production baseline remains the pre-redesign Sites release
inspected read-only in Chrome. Publishing requires the reviewed PR to merge,
release verification on the exact new `main` commit, reviewer approval, and
separate explicit deployment authorization. Aqueous remains disabled.

## PR 13 curated-practice architecture

PR 13 is based on main commit
`14a884235e7a2976a7da8de881f4411b6265b1d5`. It introduces an answer-free
curated-experience registry plus lazy practice and progress adapters. HVP is
the first and only production entry. Its canonical 120-question package,
23 objectives, 19 sources, six diagrams, persisted blueprint identities,
routes, practice profiles, compatibility rules and question-history semantics
are unchanged.

The Aqueous nine-question engineering pilot remains a separate,
default-disabled route and is not registered in the learner Practice Hub.
Both committed feature flags remain false. The storage keys, StoreV2 schema
version, five courses, eight modules, 39 sections, 400 legacy questions and
legacy Latest/Best behavior are unchanged. A synthetic non-medical bank and definition exist only under tests. They use
the production generic controller and shared landing, result and mastery
presentation to prove launch, draft persistence, finalization, history, result
dispatch and progress without HVP assumptions.

Global progress now loads pure contributions from every enabled experience,
selects one recommendation, and deduplicates and caps one activity feed.
Registry identities use stable slug IDs and immutable defensive snapshots;
failed lazy imports may retry. Route document titles come from safe registered
summary metadata. Saved records for disabled curated modules remain disclosed
even if another module stays enabled. The Node-only release audit iterates a
curated boundary registry and supports multiple practice/progress entries with
shared chunks counted once. PR 13 adds no production bank, status promotion,
migration, backend or deployment.

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
