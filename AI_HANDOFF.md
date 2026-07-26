# AI Handoff — PR 7

## Pull request

- Branch: `codex/pr7`
- Base branch: `main`
- Exact base commit: `1b3fe4911c366b80bac42d3327e7f780cf3cfce9`
- Suggested title: **Add the Aqueous and Vitreous candidate bank and expert-review workflow**
- Draft PR: [#7 — Add the Aqueous and Vitreous candidate bank and expert-review workflow](https://github.com/davidagyekum/optometry-study-hub/pull/7)
- Implementation commit: `511f43cce5408058ca178cb15dafda836c69539b`
- The exact final head is recorded in the draft PR and final Codex report because a committed file cannot contain the SHA produced by the commit that contains it.
- GitHub Actions Quality run [30226155543](https://github.com/davidagyekum/optometry-study-hub/actions/runs/30226155543), job `89856561937`, completed as a zero-step failure. Checkout, install, lint, type-check, tests, validation, and build did not execute; this is the known external account restriction, not a repository test failure.
- Status: draft implementation complete; no deployment; PR 8 not started.

## Scope completed

PR 7 creates one canonical OPT 376 Aqueous and Vitreous authoring bank and keeps the ordinary public experience unchanged. The canonical bank contains 36 draft questions: the nine preserved engineering-pilot questions plus exactly 27 new candidates. The controlled pilot is a stable-ID-derived subset; there is no second manually maintained copy.

All 36 questions and all 13 objectives remain `draft`. No reviewer identity or real expert rating was invented. The live 400-question legacy bank, the Aqueous 50-question quiz, storage schemas, scoring, question history, and public feature exposure are unchanged. `.env.example` remains `NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false`.

## Exact blueprint

- Sections: media-chambers 6; production 6; flow 6; iop 6; vitreous-anatomy 6; vitreous-clinical 6.
- Formats: single-best-answer 12; multiple response 4; ordering 4; matching 4; extended matching 3; image hotspot 3; image label 2; short answer 2; open response 2.
- Bloom: Remember 6; Understand 8; Apply 12; Analyze 7; Evaluate 2; Create 1.
- Higher order: 22/36, or 61.111111%.
- Difficulty: foundation 10; intermediate 18; advanced 8.
- Stimulus: text 5; diagram 5; table 3; clinical vignette 8; pathway 6; comparison 5; error analysis 4.
- Review status: draft 36.
- Objectives: 13, all with two or more questions.

The 13-objective decomposition is deliberate and documented. The preserved `aqueous-trace-conventional-outflow` objective now includes pathway comparison, avoiding a fourteenth objective that could not reach the two-question minimum without changing preserved pilot metadata or exceeding six flow items.

## Pilot compatibility

The derived pilot contains exactly nine questions in the declared ID order and only its referenced objectives and sources. A SHA-256 semantic fixture protects every preserved question object, including ID, version, stem, answers, option/item rationales, note anchor, and grading-relevant content. The pilot validates with zero errors and zero warnings, remains feature-gated and draft-only, and still locks `diagnostic@1` into nine-question Study attempts.

## Source registry and audit

The lecture and OpenStax sources remain registered. PR 7 adds verified NCBI Bookshelf sources for aqueous circulation, IOP, general eye anatomy, posterior vitreous detachment, and vitreous composition plus the National Eye Institute vitreous-detachment page. URLs were checked during implementation; ordinary tests validate URL syntax without requiring network access.

`docs/AQUEOUS_VITREOUS_SOURCE_AUDIT.md` records chamber anatomy, anterior-chamber measurements, production, flow rate, barrier integrity, drainage, the course 90/10 approximation, resistance, IOP ranges and measurement context, turnover, vitreous volume/water/attachments/canal, syneresis, PVD, and warning symptoms. Variable values remain qualified or excluded from unqualified items. The live notes were not rewritten. Existing local OpenStax and NEI figures are reused only in draft image candidates with neutral pre-answer text; rights and coordinates require expert recheck before approval.

## Blueprint and review tooling

- `npm run questions:validate` and `npm run questions:report` now use the canonical bank.
- `npm run questions:blueprint` enforces exact distribution, bank size, higher-order share, objective coverage, and structured diagnostics. It is included in `npm run check`.
- `npm run questions:review-pack` writes an uncommitted 302-row blank CSV, review guide, and question summary to `tmp/question-review/`.
- Review criteria are stable and format-aware; reviewer ID, rating, and comment are intentionally blank.
- `npm run questions:aiken -- --input <csv>` validates real ordinal ratings and emits Markdown, JSON, and console summaries per question and per question/criterion.
- Aiken’s V uses `s = r - 1` and `V = sum(s) / (n × (5 - 1))`. The fixture ratings 5, 5, 4 produce numerator 11, denominator 12, and display V 0.916667.
- Unknown questions/criteria, duplicate reviewer-question-criterion rows, missing reviewer IDs, and ratings outside 1–5 are rejected. Fewer than three reviewers warns. Values below an optional threshold are only `needs-review`; no status is mutated.

Generated `tmp/` review output is ignored and is not part of the PR.

## Automated validation

Final validation used bundled Node.js 24.14.0:

- `npm ci --include=optional`: passed from the lockfile under Node 24 after recovery from npm’s Windows optional-native cleanup behavior. An initial machine-default invocation reported Node 22.11; the final locked install explicitly put Node 24 first for npm and child scripts.
- `npm run lint`: passed with only the four pre-existing legacy `<img>` warnings and no new warnings.
- `npm run typecheck`: passed.
- `npm run test`: passed, 65 test files and 382 tests.
- `npm run questions:validate`: passed, 36 questions, 13 objectives, 0 errors, 0 warnings.
- `npm run questions:validate -- --strict`: passed.
- `npm run questions:report`: passed with the exact declared coverage.
- `npm run questions:blueprint`: passed with 0 diagnostics and no family-size warning.
- `npm run questions:review-pack`: passed, 36 questions and 302 deterministic CSV rows.
- `npm run questions:aiken -- --input tests/fixtures/review/valid-ratings.csv`: passed; V = 0.916667 with no warnings.
- `npm run build`: passed.
- `npm run check`: passed to completion, including the new blueprint gate.
- `git diff --check`: passed.

The full suite continues to prove five courses, eight modules, 39 study sections, 400 live legacy questions, 50 per module, unchanged legacy scoring boundaries, pilot exclusion from legacy Latest/Best, unchanged question history, and default-disabled production exposure.

## Manual question self-review

Every new candidate was checked against its exact objective, cognitive operation, difficulty, homogeneous responses, one-best-answer boundary, manually authored rationales, misconception target, source and locator, note anchor, family purpose, variable-number qualification, image answer leakage, and draft safety. Strict lint and content-quality tests report no all/none options, empty option-like rationales, undeclared negative stems, duplicate normalized answers/labels/matching text, answer-revealing hotspot interaction labels, or near-duplicate stems. This is author self-review, not independent academic approval.

## Chrome-only regression

Chrome extension QA used separate localhost origins for disabled and enabled builds; the Codex in-app browser was not initialized.

Disabled build:

- homepage, OPT 376 course, all six Aqueous study sections, figures, source links, and `Start 50-question quiz` were present;
- no experimental pilot entry appeared;
- direct pilot navigation exposed no pilot question or draft content (the extension test remained on the normal home shell rather than advancing the requestAnimationFrame-driven client route; the neutral unavailable component remains covered by focused automated tests);
- the ordinary Aqueous quiz displayed a 50-button navigator and `0/50 answered`;
- no new console errors appeared.

Enabled build:

- the Aqueous notes showed both the unchanged 50-question quiz control and a secondary experimental pilot entry;
- landing showed exactly 9 questions, Study mode, and `diagnostic@1`, with no 36-question entry;
- a nine-question attempt started, an image-label answer autosaved, Save and exit returned to a Resume state, and resume restored all three selected labels and the answered count;
- incomplete submission warned about 1 answered and 8 unanswered, then produced 1/9 with nine ordered review cards and no legacy-score effect;
- the 27 new candidates were not exposed and no canonical-bank launcher was added;
- no new console errors appeared.

## Known limitations

- All candidates await real independent expert review; review-pack output contains no real ratings.
- Aiken’s V is descriptive evidence and never automatically approves an item.
- The 13-objective equivalent decomposition must be reviewed academically.
- Existing image rights and coordinates require confirmation before any question can leave draft.
- The four existing legacy image lint warnings remain.
- GitHub Actions run `30226155543`, job `89856561937`, failed with zero executed steps because of the known external account restriction.
- No deployment was performed, and PR 8 was not started.
