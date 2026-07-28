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

PR 5 adds versioned strict and diagnostic grading under `lib/assessment/grading/`. It locks policy identity into new attempts, provides explicit locking for historical attempts, grades eight automatic formats with exact-fraction aggregation, marks answered open responses for manual review, and verifies compact persisted outcomes through deterministic regrading.

PR 6 adds accessible renderers for all nine formats plus a controlled Aqueous and Vitreous engineering pilot. It remains disabled by default and does not replace or affect the legacy 50-question quiz. Pilot attempts/results must match the exact nine-item blueprint and are updated atomically in browser-local StoreV2; hotspot answers remain hidden behind neutral pre-submission markers.

PR 7 adds one 36-question draft Aqueous and Vitreous candidate bank, an exact authoring blueprint, verified source audit, expert-review export, and Aiken’s V reporting. The pilot remains the same derived nine-question subset and remains disabled by default.

PR 8 adds evidence-bound expert-review campaigns, immutable reviewer packs, readiness analysis, human-chair decisions, and exact transition verification. It does not move any question beyond draft.

PR 9 adds a canonical 120-question OPT 374 Human Visual Perception pool and a secondary, default-disabled 50-question curated-practice route. The existing notes and legacy quiz remain unchanged, and curated results remain isolated from legacy Latest/Best metrics.

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

To inspect the draft pilot locally, create an untracked `.env.local`:

```text
NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=true
NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=true
```

Only the exact string `true` enables either experience. These flags control client exposure, not security, and all candidate questions remain draft rather than academically approved.

## Quality commands

```bash
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run questions:validate
npm run questions:report
npm run questions:blueprint
npm run questions:validate:hvp
npm run questions:report:hvp
npm run questions:blueprint:hvp
npm run questions:review-pack
npm run questions:aiken -- --input tests/fixtures/review/valid-ratings.csv
npm run build
npm run check
```

`npm run check` runs linting, strict TypeScript checking, the Vitest suite, question-bank and blueprint validation, and the production build in sequence.

## Deployment

The site is hosted through OpenAI Sites using the project information in `.openai/hosting.json`. The Vite build packages that metadata for the Cloudflare Worker deployment. Pull requests do not deploy automatically; production publishing is a separate reviewed action.

## Privacy

Student reading progress, answers, flags, quiz history, and future assessment history remain in browser local storage. There are no student names, accounts, analytics, leaderboards, or cross-device synchronization. Clearing browser data or using the confirmed global reset removes the saved study state from both supported storage generations.

## Current limitations

- The 400 live questions are generated from fact prompts by a positional legacy distractor algorithm.
- The live questions and options have not yet been converted to stable assessment IDs, sources, rationales, Bloom levels, or review statuses.
- The 36-question Aqueous and Vitreous candidate bank and its nine-format pilot subset remain draft, disabled by default, and are not approved production assessments.
- Navigation is client-managed rather than split into dedicated App Router routes.
- Course notes, figures, and future production questions require ongoing academic and licensing review.
- Open responses expose the deliberate manual-review boundary; no manual-grading workflow exists.

The assessment foundation, session lifecycle, grading policies, accessible renderers, and controlled pilot are implemented alongside the live system. Academic approval, manual review, and production conversion of the 400 legacy questions remain future work.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Keep one concern per pull request, run `npm run check`, and apply the source and reviewer requirements in [Content Review Policy](docs/CONTENT_REVIEW_POLICY.md) and [Question Authoring Guide](docs/QUESTION_AUTHORING_GUIDE.md).

## Educational and licensing notice

Lecture-derived material is a curriculum aid, not automatically an authoritative clinical source. Educational wording, lecturer attribution, medical corrections, and image reuse rights must be reviewed before broad public release. Named lecturers must not be represented as approving rewritten material without documented approval.
PR 7 review tooling now exports a self-contained 338-row, evidence-hashed expert pack and complete Markdown/JSON dossiers. Rated rows are rejected when canonical metadata or evidence hashes are stale. Reviewer identities are normalized lowercase slugs, zero-rating coverage is explicit, and per-question Aiken's V uses only `overall-content-validity`; no ratings or approvals are bundled with the repository.

## Evidence-bound expert-review campaigns

PR 8 adds local authoring commands for campaign creation, reviewer-pack merge, readiness analysis, decision verification, and bank snapshots:

```bash
npm run questions:review-campaign -- --campaign-id <id> --reviewers <profiles.json>
npm run questions:review-merge -- --campaign <manifest.json> --input <pack.csv>
npm run questions:review-readiness -- --campaign <manifest.json> --submissions <merged.json>
npm run questions:review-verify -- --campaign <manifest.json> --submissions <merged.json> --resolutions <resolutions.json> --decisions <decisions.json>
npm run questions:review-snapshot
```

Generated evidence remains under ignored `tmp/question-review/`. These commands do not enter the browser bundle, change question status, enable the pilot, or constitute academic review. See [Expert review campaigns](docs/EXPERT_REVIEW_CAMPAIGNS.md) and [Review resolution and promotion](docs/REVIEW_RESOLUTION_AND_PROMOTION.md).

## Reusable practice platform

PR 10 extends the assessment foundation with ten supported formats, versioned
practice blueprints, deterministic HVP Quick/Standard/Full/Custom sessions,
history-targeted practice, atomic device-local question history, and separate
written practice. See [docs/PRACTICE_PLATFORM.md](docs/PRACTICE_PLATFORM.md).
Both assessment feature flags remain disabled by default.
