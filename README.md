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

The project uses React, TypeScript, Next-compatible App Router files, Vinext, Vite, and Cloudflare Workers. Most course data, quiz logic, route state, browser storage, and view markup currently live in `app/StudyApp.tsx`; the five newer modules live in `app/additionalCourses.ts`.

Client navigation uses `/course/:id`, `/study/:moduleId`, `/quiz/:moduleId`, and `/results/:moduleId`. Reading progress, active attempts, and up to 20 recent results per module are stored in the browser under `opt376-study-state:v1`.

See [Current State](docs/CURRENT_STATE.md) for the detailed baseline and [Assessment Redesign Roadmap](docs/ASSESSMENT_REDESIGN_ROADMAP.md) for the staged modernization plan.

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
npm run build
npm run check
```

`npm run check` runs linting, strict TypeScript checking, the Vitest suite, and the production build in sequence.

## Deployment

The site is hosted through OpenAI Sites using the project information in `.openai/hosting.json`. The Vite build packages that metadata for the Cloudflare Worker deployment. Pull requests do not deploy automatically; production publishing is a separate reviewed action.

## Privacy

Student reading progress, answers, flags, and quiz history remain in browser local storage. There are no student names, accounts, analytics, leaderboards, or cross-device synchronization. Clearing browser data removes the saved study state.

## Current limitations

- The 400 live questions are generated from fact prompts by a positional legacy distractor algorithm.
- Question options do not yet have stable IDs, source records, rationales, Bloom levels, or review statuses.
- Most application responsibilities remain concentrated in `app/StudyApp.tsx`.
- Navigation is client-managed rather than split into dedicated App Router routes.
- Course notes and figures still require ongoing academic and licensing review.

The assessment redesign described in the roadmap is not yet live.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Keep one concern per pull request, run `npm run check`, and apply the source and reviewer requirements in [Content Review Policy](docs/CONTENT_REVIEW_POLICY.md).

## Educational and licensing notice

Lecture-derived material is a curriculum aid, not automatically an authoritative clinical source. Educational wording, lecturer attribution, medical corrections, and image reuse rights must be reviewed before broad public release. Named lecturers must not be represented as approving rewritten material without documented approval.
