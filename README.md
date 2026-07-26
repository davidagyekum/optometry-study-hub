# Optometry Study Hub

Optometry Study Hub is a responsive, lecture-based study website for optometry students. It combines structured notes, attributed instructional figures, and device-local practice quizzes across five course areas.

Live site: https://opt-376-eye-anatomy-review.davorion7.chatgpt.site

## Current study library

- **Environmental Vision** — light, visual task analysis, ergonomics, ocular hazards, protection, and workplace illumination.
- **Human Visual Perception** — retinal coding, the LGN, visual cortex, and higher perceptual streams.
- **Neuro Anatomy & Ocular Anatomy** — tissue foundations, ocular adnexa, aqueous and vitreous anatomy, and ocular blood supply.
- **Ocular Pharmacology** — adrenergic and cholinergic foundations relevant to eye care.
- **Systemic Pathology** — breast, cardiovascular, gastrointestinal, lymphoid, renal, and respiratory pathology.

The current application contains five courses, eight modules, 39 study sections, and 400 legacy-generated multiple-choice questions.

## Architecture today

The project uses React, TypeScript, Next-compatible App Router files, Vinext, Vite, and Cloudflare Workers. Legacy content lives under `content/legacy/`; focused views live under `components/`; route, attempt, progress, and question-generation logic lives under `lib/` and `hooks/`; and `app/StudyApp.tsx` coordinates those modules.

Client navigation uses `/course/:id`, `/study/:moduleId`, `/quiz/:moduleId`, and `/results/:moduleId`. Reading progress, active legacy attempts, and up to 20 recent results per module are stored in the validated V2 browser record `optometry-study-hub:v2`. Existing `opt376-study-state:v1` data migrates locally and remains available for rollback until the learner explicitly resets all study data, which clears both storage generations.

PR 3 adds an assessment-domain pilot under `content/question-bank/pilot/`, validation and reporting under `lib/assessment/`, and migration-safe storage under `lib/storage/`. The live quiz still uses the legacy 400-question engine.

PR 4 adds a headless session engine under `lib/assessment/session/` plus immutable StoreV2 assessment helpers. It supports deterministic arbitrary-length attempts and all nine response formats, but intentionally provides no renderer, grading policy, or public entry point.

PR 5 adds versioned strict and diagnostic grading under `lib/assessment/grading/`. It locks policy identity into new attempts, provides explicit locking for historical attempts, grades eight automatic formats with exact-fraction aggregation, marks answered open responses for manual review, and verifies compact persisted outcomes through deterministic regrading. It remains disconnected from the public UI.

See [Current State](docs/CURRENT_STATE.md), [Assessment Specification](docs/ASSESSMENT_SPEC.md), [Session Engine](docs/ASSESSMENT_SESSION_ENGINE.md), [Grading Policies](docs/ASSESSMENT_GRADING_POLICIES.md), and [Assessment Redesign Roadmap](docs/ASSESSMENT_REDESIGN_ROADMAP.md).

## Requirements

- Node.js 22.13.0 or newer
- npm

## Local development

```bash
npm ci
npm run dev
```

The development server prints its local URL. The project intentionally has no account or server database requirement for student progress.

## Quality commands

```bash
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run questions:validate
npm run questions:report
npm run build
npm run check
```

`npm run check` runs linting, strict TypeScript checking, the Vitest suite, question-bank validation, and the production build in sequence.

## Deployment

The site is hosted through OpenAI Sites using the project information in `.openai/hosting.json`. The Vite build packages that metadata for the Cloudflare Worker deployment. Pull requests do not deploy automatically; production publishing is a separate reviewed action.

## Privacy

Student reading progress, answers, flags, quiz history, and future assessment history remain in browser local storage. There are no student names, accounts, analytics, leaderboards, or cross-device synchronization. Clearing browser data or using the confirmed global reset removes the saved study state from both supported storage generations.

## Current limitations

- The 400 live questions are generated from fact prompts by a positional legacy distractor algorithm.
- The live questions and options have not yet been converted to stable assessment IDs, sources, rationales, Bloom levels, or review statuses.
- The nine-format pilot proves the new schema but is not rendered or scored by the production quiz.
- Navigation is client-managed rather than split into dedicated App Router routes.
- Course notes, figures, and future production questions require ongoing academic and licensing review.
- The headless session and grading engines are not connected to the public UI; no multi-format renderer or manual-review workflow exists.

The assessment foundation, headless session lifecycle, and versioned grading policies are implemented alongside the live system; rendering, controlled pilot exposure, manual review, and production question conversion remain future work.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Keep one concern per pull request, run `npm run check`, and apply the source and reviewer requirements in [Content Review Policy](docs/CONTENT_REVIEW_POLICY.md) and [Question Authoring Guide](docs/QUESTION_AUTHORING_GUIDE.md).

## Educational and licensing notice

Lecture-derived material is a curriculum aid, not automatically an authoritative clinical source. Educational wording, lecturer attribution, medical corrections, and image reuse rights must be reviewed before broad public release. Named lecturers must not be represented as approving rewritten material without documented approval.
