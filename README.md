# Optometry Study Hub

Optometry Study Hub is a responsive, lecture-based study website for optometry students. It combines structured notes, attributed instructional figures, and device-local practice quizzes across five course areas.

Live site: https://opt-376-eye-anatomy-review.davorion7.chatgpt.site

## Current study library

- **Environmental Vision** — light, visual task analysis, ergonomics, ocular hazards, protection, and workplace illumination.
- **Human Visual Perception** — retinal coding, the LGN, visual cortex, and higher perceptual streams.
- **Neuro Anatomy & Ocular Anatomy** — tissue foundations, ocular adnexa, aqueous and vitreous anatomy, and ocular blood supply.
- **Ocular Pharmacology** — adrenergic and cholinergic foundations relevant to eye care.
- **Systemic Pathology** — breast, cardiovascular, gastrointestinal, lymphoid, renal, and respiratory pathology.

The current application contains five courses, eight modules, 39 study sections, and 400 legacy-generated multiple-choice questions. The versioned assessment engine supports ten formats; all Aqueous, HVP, Tissue Foundations, Ocular Adnexa, and Blood Supply schema questions remain draft.

## Architecture today

The project uses React, TypeScript, Next-compatible App Router files, Vinext, Vite, and Cloudflare Workers. Legacy content lives under `content/legacy/`; focused views live under `components/`; route, attempt, progress, and question-generation logic lives under `lib/` and `hooks/`; and `app/StudyApp.tsx` coordinates those modules.

Client navigation includes `/practice`, `/progress`, `/progress/:moduleId`, the existing course/study/quiz/result routes, and controlled `/practice/:experienceId` routes. Reading progress, active legacy attempts, and up to 20 recent results per module are stored in the validated V2 browser record `optometry-study-hub:v2`. Existing `opt376-study-state:v1` data migrates locally and remains available for rollback until the learner explicitly resets all study data, which clears both storage generations.

PR 3 adds an assessment-domain pilot under `content/question-bank/pilot/`, validation and reporting under `lib/assessment/`, and migration-safe storage under `lib/storage/`. The live quiz still uses the legacy 400-question engine.

PR 4 adds a headless session engine under `lib/assessment/session/` plus immutable StoreV2 assessment helpers. It supports deterministic arbitrary-length attempts and all nine response formats, but intentionally provides no renderer, grading policy, or public entry point.

PR 5 adds versioned strict and diagnostic grading under `lib/assessment/grading/`. It locks policy identity into new attempts, provides explicit locking for historical attempts, grades eight automatic formats with exact-fraction aggregation, marks answered open responses for manual review, and verifies compact persisted outcomes through deterministic regrading.

PR 6 adds accessible renderers for all nine formats plus a controlled Aqueous and Vitreous engineering pilot. It remains disabled by default and does not replace or affect the legacy 50-question quiz. Pilot attempts/results must match the exact nine-item blueprint and are updated atomically in browser-local StoreV2; hotspot answers remain hidden behind neutral pre-submission markers.

PR 7 adds one 36-question draft Aqueous and Vitreous candidate bank, an exact authoring blueprint, verified source audit, expert-review export, and Aiken’s V reporting. The pilot remains the same derived nine-question subset and remains disabled by default.

PR 8 adds evidence-bound expert-review campaigns, immutable reviewer packs, readiness analysis, human-chair decisions, and exact transition verification. It does not move any question beyond draft.

PR 9 adds a canonical 120-question OPT 374 Human Visual Perception pool and a secondary, default-disabled 50-question curated-practice route. The existing notes and legacy quiz remain unchanged, and curated results remain isolated from legacy Latest/Best metrics.

See [Current State](docs/CURRENT_STATE.md), [Progress Analytics](docs/PROGRESS_ANALYTICS.md), [Assessment Specification](docs/ASSESSMENT_SPEC.md), [Session Engine](docs/ASSESSMENT_SESSION_ENGINE.md), [Grading Policies](docs/ASSESSMENT_GRADING_POLICIES.md), and [Assessment Redesign Roadmap](docs/ASSESSMENT_REDESIGN_ROADMAP.md).

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
NEXT_PUBLIC_ENABLE_TISSUE_FOUNDATIONS_CURATED_PRACTICE=true
NEXT_PUBLIC_ENABLE_OCULAR_ADNEXA_CURATED_PRACTICE=true
NEXT_PUBLIC_ENABLE_AQUEOUS_VITREOUS_CURATED_PRACTICE=true
NEXT_PUBLIC_ENABLE_BLOOD_SUPPLY_CURATED_PRACTICE=true
```

Only the exact string `true` enables an experience. These flags control client exposure, not security, and all candidate questions remain draft rather than academically approved. Every committed feature default remains false.

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
npm run questions:validate:tissue
npm run questions:report:tissue
npm run questions:blueprint:tissue
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

## Unified practice and progress

PR 11 adds an always-available Practice Hub, an overall Progress Hub, and
module detail routes. Legacy saved-result statistics remain separate from
feature-gated HVP curated analytics. Current-version mastery, integrity
filtering, activity, and recommendations are deterministic and derived
read-only from StoreV2. See
[docs/PROGRESS_ANALYTICS.md](docs/PROGRESS_ANALYTICS.md).

## Release hardening

PR 11 is merged. PR 12 is the current draft release-hardening phase, based on
`e8b9810ff6f2898c9bc85d37da72f069ee049115`. It adds exact disabled and HVP
public-beta profiles, dual-build bundle audits, performance budgets, a
clean-tree release manifest, Worker security headers, route and focus
hardening, and a manual release workflow. Production publishing remains a
separate post-merge action requiring explicit authorization.

Use `npm run release:verify` from a clean reviewed commit. See the
[release runbook](docs/RELEASE_RUNBOOK.md), [release
checklist](docs/RELEASE_CHECKLIST.md), [rollback
runbook](docs/ROLLBACK_RUNBOOK.md), and [baseline
budgets](docs/RELEASE_BASELINE_AND_BUDGETS.md).

## Curated-experience registry

PR 13 generalizes curated practice behind validated, immutable answer-free
discovery metadata and retryable lazy answer-bearing adapters. HVP and the default-disabled Tissue Foundations experience are registered
through the same answer-free discovery boundary. HVP preserves its route,
profiles, stored identities and public-beta behavior. The shared platform now owns start/resume, guarded
replacement and discard, draft persistence, navigation, flagging, submission,
history finalization, landing, results and mastery presentation. Educational
assembly, compatibility and progress calculation remain module-defined.

One coordinator selects a single recommendation and builds a deduplicated,
eight-item activity feed across legacy and every enabled curated contribution.
Disabled curated records remain stored and are disclosed even when another
curated module is enabled. The Aqueous engineering pilot remains separate and
disabled. A tiny valid synthetic bank exercises the complete generic lifecycle
only in tests.

Future curated banks must keep question and grading content behind lazy
loaders, use unique route/module/blueprint identities, preserve StoreV2
compatibility, pass import-isolation and release-profile checks, and complete
the documented academic-review process. PR 13 added no new question content, storage migration, legacy-score
conversion or deployment. PR 14 adds the default-disabled Tissue bank without
changing those storage or deployment boundaries.

## OPT 376 Tissue Foundations curated practice

PR 14 registers the canonical 80-question Tissue Foundations package through
the generic curated-experience platform. The feature is disabled by default,
uses StoreV2 device-local assessment maps, keeps the legacy 50-question quiz
unchanged, and does not alter HVP or Aqueous behavior. Fixed profiles enforce
their exact quotas and evidence contracts, while the two open responses remain
manual-only and display **Not scored**. No question has been promoted beyond
draft and no deployment is part of the pull request.

## OPT 376 Blood Supply curated practice

The Blood Supply checkpoint registers a canonical 80-question draft bank
through the generic curated platform. It supports exact Quick 10, Standard 25
and Full 50 profiles, Custom and targeted sessions, and manual-only Written 2
practice. Five original answer-neutral SVG diagrams support image formats. The
feature remains disabled by default, StoreV2 and legacy score identities are
unchanged, and the existing Blood Supply notes and 50-question quiz remain
available.
