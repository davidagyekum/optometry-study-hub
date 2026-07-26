# Current State

## Verified state

- PR 5 base commit: `850d77b6e5673ca895caa55d247dc35df9ca7141`
- Courses: 5
- Modules: 8
- Study sections: 39
- Live legacy-generated questions: 400, with 50 questions per module
- Current persistence key: `optometry-study-hub:v2`
- Rollback key retained after migration: `opt376-study-state:v1`
- Assessment pilot: 9 draft questions covering 9 formats and 8 objectives

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

The new assessment domain lives alongside—not inside—the live engine. It defines stable IDs, nine discriminated question formats, objectives, sources, Bloom levels, difficulty, rationales, misconception tags, review states, structured diagnostics, and deterministic coverage reports. The Aqueous and Vitreous pilot is not registered with the live quiz.

A headless session layer can register approved questions through a defensive validated registry, create deterministic arbitrary-length attempts, validate all nine persisted response shapes, update attempts immutably, diagnose stale snapshots, finalize through an external evaluation, and update keyed StoreV2 assessment maps with exact atomic snapshot checks.

A separate headless grading layer provides immutable strict and diagnostic version-1 policies, mode defaults, policy locking, one-point normalized outcomes, conservative diagnostic partial credit, manual open-response boundaries, aggregate reports, compact result snapshots, and deterministic exact-version regrading. It remains unused by the React application and does not make the draft pilot publicly reachable.

Client route state supports:

- `/`
- `/course/:courseId`
- `/study/:moduleId`
- `/quiz/:moduleId`
- `/results/:moduleId`

History updates use `pushState`, and `popstate` restores the matching view.

## Device-local persistence

The validated version-2 store preserves:

- completed reading-section IDs by module;
- one active legacy quiz attempt per module;
- up to 20 recent submitted legacy results per module;
- assessment maps for future headless attempts, grading-aware results, and unchanged question history, with no public UI integration yet.

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
- Multi-format rendering and a controlled pilot experience do not yet exist; session and grading engines remain headless.
- Four intentional `<img>` lint warnings remain until a later UI-focused change.

## Known educational limitations

- Lecture material is not automatically authoritative.
- The live bank lacks per-question sources, Bloom levels, difficulty, reviewer status, option rationales, and misconception tags.
- The schema pilot remains `draft` and is an engineering demonstration, not an approved examination bank.
- Named lecturer attribution identifies the supplied teaching source; it does not imply approval of rewritten notes or questions.
- Image ownership and reuse rights require ongoing review.
- The current 400 questions should not be treated as a validated examination bank.
