# AI Handoff — PR 9

## Pull request

- Branch: `codex/pr9`
- Base branch: `main`
- Exact base commit: `a47b4e21ce890d1045cfd407f40abbb7f3067938`
- Suggested title: **Add the OPT 374 curated visual-perception practice bank**
- Draft PR: pending creation after the focused implementation commit is pushed.
- The implementation and final head SHAs are recorded in the PR description and final report because a committed file cannot contain the SHA produced by its own commit.
- Status: implementation, automated validation, and Chrome-only QA complete; no deployment; PR 10 not started.

## Implemented scope

- Imported the supplied OPT 374 Human Visual Perception JSON byte-for-byte as the canonical source and exposed typed bank, objective, source, and blueprint modules.
- Added six original accessible SVG teaching diagrams built around the package's declared dimensions and interaction coordinates.
- Added HVP-specific validation, report, and blueprint commands without changing the Aqueous defaults or PR 8 review-campaign tooling.
- Added a deterministic 50-question assembler, exact compatibility checks, registry, selectors, local StoreV2 controller, landing, session, and result views.
- Extracted shared controlled-assessment session and result components while retaining the Aqueous pilot's existing contracts.
- Added the exact-string feature flag `NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=false`; the legacy HVP notes and 50-question quiz remain the primary learner experience.
- Result snapshots may now retain an optional blueprint ID so exact controlled-result routing and compatibility checks remain possible. The storage version and key are unchanged.

## Canonical content and quotas

- Package SHA-256: `029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a`.
- Canonical bank: 120 questions, 23 objectives, 19 registered sources, nine formats, all version 1 and all formally `draft`.
- Section totals: foundations 16, retina 48, LGN/V1 32, extrastriate 24.
- Scored practice: exactly 50 unique current-version questions; open response excluded.
- Practice sections: foundations 6, retina 20, LGN/V1 14, extrastriate 10.
- Practice formats: 30 single-best-answer, 8 multiple-response, 4 matching, 2 extended-matching, 2 ordering, 1 hotspot, 1 image label, and 2 short-answer.
- Difficulty target: 14 foundation, 26 intermediate, and 10 advanced; exact target achieved for the supplied bank.
- The assembler preserves the section/format matrix, at least 20 Apply-or-higher questions, at most two questions per family, deterministic same-seed behavior, different-seed variation, and structured failure diagnostics.

## Preserved boundaries

- Five courses, eight modules, 39 study sections, 400 legacy-generated questions, and 50 legacy questions per module remain covered by the test suite.
- The legacy HVP facts, generator, scoring, Latest/Best values, and `store.results` are unchanged.
- The Aqueous bank remains 36 draft questions with 13 draft objectives; its nine pilot semantic hashes remain unchanged.
- `NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false` and `NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=false` remain the committed defaults.
- HVP attempts and results use only the existing StoreV2 assessment maps; `questionHistory` is not updated.
- No reviewer identities, evidence, status promotions, backend, account, analytics, deployment, or PR 10 work was added.
- A static disabled-learner import-boundary test proves the ordinary learner graph cannot reach the 120-question bank or its answer keys while the flag is off.

## Final local validation

Validation used bundled Node.js 24.14.0:

- `npm ci`: passed from the committed lockfile; npm reported 23 existing dependency advisories and harmless optional-package cleanup warnings.
- `npm run lint`: passed with only the four pre-existing legacy `<img>` warnings.
- `npm run typecheck`: passed.
- `npm run test`: passed, 90 test files and 552 tests.
- `npm run questions:validate`: passed, 36 Aqueous questions, 13 objectives, 0 errors, 0 warnings.
- `npm run questions:validate -- --strict`: passed.
- `npm run questions:report` and `npm run questions:blueprint`: passed; Aqueous coverage and zero blueprint diagnostics remain unchanged.
- `npm run questions:validate:hvp`: passed, 120 questions, 23 objectives, 19 sources, 0 errors, and 79 non-blocking supplied-content authoring warnings. Academic content was not silently rewritten.
- `npm run questions:report:hvp` and `npm run questions:blueprint:hvp`: passed with exact declared totals and zero blueprint diagnostics.
- Production builds passed with HVP curated practice disabled and enabled.
- `npm run check`: passed to completion and includes both Aqueous and HVP validation/blueprint gates.
- `git diff --check`: passed.

## Chrome-only regression

Chrome tested the local application without using the Codex in-app browser.

- Disabled: no curated entry or hidden 120-question content appeared; the HVP notes retained the legacy 50-question action; the direct practice route hydrated to a neutral unavailable view.
- Enabled: the notes displayed the secondary entry; the landing reported a 120-question pool and 50-question set; starting produced the exact section and format quotas.
- One draft and flag persisted through refresh; question navigation worked; incomplete submission displayed the review warning and finalized atomically.
- Results showed 0/50 with 50 unanswered for the intentionally incomplete QA submission, exact section/format breakdowns, full stored-order review, and the explicit legacy-score isolation statement.
- Responsive checks covered 390×844, 768×1024, and 1024×768 with no document-level horizontal overflow.
- Enabled and disabled Chrome console checks reported zero errors.
- Automated renderer, grading, controller, compatibility, seed-variation, note-link, reset, and isolation tests cover the remaining format and persistence contracts.

## GitHub Actions

- Implementation-head Quality run: `30285156536`; job: `90041015246`.
- GitHub marked the job failed with an empty `steps` array, so no checkout, install, lint, type-check, test, validation, or build step executed.
- This matches the repository's known external account restriction and is not evidence of a repository-code failure.
- The draft PR description and final report record the final head and its latest Actions run/job IDs after this handoff correction is pushed.

## Known limitations

- The 79 HVP validator warnings are preserved package authoring diagnostics; changing them would violate the requirement to import the supplied academic objects exactly.
- All HVP questions and objectives remain draft and are not lecturer-approved examination items.
- Public enablement is a separate decision; the committed feature flag remains false.
- Later depth, stereopsis, colour, motion, entoptic, and illusion tranches remain pending.
