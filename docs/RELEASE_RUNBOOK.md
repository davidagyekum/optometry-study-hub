# All-course-content public release runbook

This runbook prepares and publishes all reviewed course content to the existing OpenAI Sites project. Preview profiles are never publishable, and historical profiles retain their original semantics.

## Required profile

`all-course-content-public` is the publishable production profile for all reviewed content. It enables the eight established curated practices, HVP Depth + Colour, and all five OPT 370 practices while `NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT` remains false. `full-curated-public-beta` remains available with its historical eight-bank semantics. Every committed flag in `.env.example` remains false.

## Pre-publish

- Use an exact clean merged `main` checkout with Node.js 22.13.0 or newer.
- Run `npm ci`, `npm run check` and `npm run release:verify`.
- Require six courses, 15 visible modules, 90 visible study sections, 680 established curated questions, 400 OPT 370 draft questions, 160 HVP Depth + Colour draft questions, and 400 frozen legacy compatibility questions. The machine-readable manifest records 1,240 course-aligned question records.
- Require every recorded canonical bank checksum, the original 36 Aqueous objects, the nine pilot identities and draft status for every question and objective.
- Review `tmp/release/build-metadata/all-course-content-public.json`, `tmp/release/audits/all-course-content-public.json`, `tmp/release/release-manifest.json`, its SHA-256 file and the release report.
- Require metadata, audit and manifest to agree on commit, tree, profile, flags, output directory, fingerprint, runtime and clean-tree status.
- Require initial and server closures to contain no answer identity; each experience must retain distinct lazy practice and progress closures.
- Require StoreV2 key `optometry-study-hub:v2`, rollback key `opt376-study-state:v1`, and no migration, D1 or R2 binding.
- Query Sites project `appgprj_6a5614a4d1288191966f6f3570f99f22` and record the current version and deployment as the rollback target.

## Publish

1. Build the exact merged `main` using `npm run release:build:all-course-content-public`.
2. Audit that exact output and create the source-bound manifest.
3. Push the exact source state identified by the manifest.
4. Package that exact source through the tracked Sites integration.
5. Save one new version in the existing Sites project; do not create another project.
6. Deploy only the saved version and poll it to a terminal successful state.
7. Record the Sites version, deployment ID, commit, tree, archive identity, output fingerprint, manifest checksum, timestamp and operator.

## Post-publish

Use the browser QA matrix for all six course pages and 15 study modules. Verify Notes V2/V3, all 15 controlled Quick/Standard/Full/Custom/targeted/Written entry points across the established, HVP extension, and OPT 370 experiences, autosave and resume, result review, global progress, legacy archive/history, direct-route refresh, device-local persistence, keyboard and modal focus, reduced motion, mobile overflow, response headers and static images. The Aqueous engineering pilot must remain unavailable, Written Practice must remain `Not scored`, and pre-practice routes must expose no answer content.

## Rollback

Immediately restore the recorded prior Sites version for a blank route, answer leakage, learner-data loss or corruption, cross-module collision, widespread start/resume/submit failure, critical security-header regression or persistent Worker error. Document the exact finding and do not publish an unverified hotfix.