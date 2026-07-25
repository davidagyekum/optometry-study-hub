# Current State

## Verified baseline

- Baseline commit: `18ba5aebdef82402e26c1937d4e2bb1638a7a116`
- Courses: 5
- Modules: 8
- Study sections: 39
- Legacy-generated questions: 400, with 50 questions per module
- Production persistence key: `opt376-study-state:v1`

## Courses and modules

| Course | Modules |
|---|---|
| Environmental Vision | Environmental Vision |
| Human Visual Perception | Human Visual Perception |
| Neuro Anatomy & Ocular Anatomy | Tissue Foundations for Neuro Anatomy; Ocular Adnexa & Lacrimal Apparatus; Aqueous Humour & Vitreous Body; Blood Supply to the Eye |
| Ocular Pharmacology | Adrenergic & Cholinergic Pharmacology |
| Systemic Pathology | Systemic Pathology Review |

## Application model

`app/StudyApp.tsx` currently owns the original OPT 376 content, legacy domain types, question generation, attempts, scoring, local-storage access, client navigation, progress calculations, and most view markup. `app/additionalCourses.ts` owns the five newer lecture-derived modules and the course catalog.

Each module contains sections and 50 fact records. `questionsFor()` converts each fact into a single-best-answer-style question and selects three distractors positionally from related facts. The generated questions are cached by module for the browser session.

Client route state is derived from `window.location.pathname`. Supported route shapes are:

- `/`
- `/course/:courseId`
- `/study/:moduleId`
- `/quiz/:moduleId`
- `/results/:moduleId`

History updates use `pushState`, and `popstate` restores the matching view.

## Device-local persistence

The version-1 store contains:

- completed reading-section IDs by module;
- one active quiz attempt per module;
- up to 20 recent submitted results per module.

Active attempts preserve question order, option order, answers, flags, and the current index. JSON parsing failures and values without version 1 fall back to the empty store. Version-1 objects are not yet schema-validated, so structurally malformed version-1 data may still be accepted. There is no account, backend database, analytics feed, or cross-device sync.

## Strengths

- A working responsive learning experience across five course areas.
- Consistent 50-question module assessments and resumable attempts.
- Device-local privacy with explicit reset controls.
- Attributed instructional figures and accessible figure enlargement behavior.
- Existing public Sites deployment and reproducible Vinext production build.

## Known technical debt

- `StudyApp.tsx` combines data, domain logic, persistence, navigation, and UI.
- The legacy distractor generator can create weak or duplicate options.
- Questions and response options lack stable assessment-domain identifiers.
- Storage parsing is permissive rather than schema-validated.
- Client routes are parsed manually.
- Four intentional `<img>` lint warnings remain until a later UI-focused change.

## Known educational limitations

- Lecture material is not automatically authoritative.
- The live bank lacks per-question sources, Bloom levels, difficulty, reviewer status, option rationales, and misconception tags.
- Named lecturer attribution identifies the supplied teaching source; it does not imply approval of rewritten notes or questions.
- Image ownership and reuse rights require ongoing review.
- The current 400 questions should not be treated as a validated examination bank.
