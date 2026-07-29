# AI Handoff — PR 13 review corrections

## Pull request

- Repository: `davidagyekum/optometry-study-hub`
- Draft PR: https://github.com/davidagyekum/optometry-study-hub/pull/13
- Branch: `codex/pr13-generalize-curated-practice`
- Base: `main`
- Exact base commit: `14a884235e7a2976a7da8de881f4411b6265b1d5`
- Reviewed head replaced: `d70ef723caf8de75a6c4b4d43b9bc2329b507f7c`
- The exact correction head, tree, changed-file count and Actions identifiers
  are recorded in the updated draft PR description and final report.

## Review corrections

- Global progress adapters now return pure contributions. One outer coordinator
  combines them with legacy evidence, chooses one deterministic recommendation,
  and deduplicates, sorts and caps one activity feed at eight items.
- Safe summary metadata now owns landing, session, result and unavailable
  document titles. Controlled routing models arbitrary curated experiences;
  HVP titles remain byte-for-byte equivalent.
- A configuration-driven definition and reusable controller own start/resume,
  guarded atomic replacement/discard, draft updates, movement, flags,
  submission, deterministic regrading, finalization, history and result lookup.
- Shared landing, controlled-session, result-review and mastery components serve
  HVP and a tiny valid synthetic bank. HVP assembly and compatibility rules
  remain module-specific and unchanged.
- The Node-only release audit uses an experience registry for lazy entries,
  authored and answer markers, allowed/excluded cross-bank markers and profile
  enablement. Synthetic two-experience closures prove shared chunks count once.
- Practice and Progress disclose saved records owned by disabled curated
  experiences even when a different curated experience remains enabled.
- Practice and progress loaders validate exports, cache by adapter identity,
  evict failures and permit retry.
- Registry identities use the stable slug contract. Summaries and blueprint
  arrays are defensively cloned and deeply frozen; adapter records are frozen.
- Course cards count every registered curated module rather than selecting one.

## Preserved contracts

- Production registry contains HVP only.
- HVP remains 120 draft questions, 23 draft objectives, 19 sources and six SVG
  diagrams. Canonical checksum:
  `029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a`.
- Aqueous remains 36 draft questions and 13 draft objectives; its exact
  nine-question engineering pilot remains separate and disabled.
- Five courses, eight modules, 39 sections and 400 legacy questions are
  unchanged.
- StoreV2 remains `optometry-study-hub:v2`, version 2, with rollback key
  `opt376-study-state:v1`.
- Existing HVP routes, attempts, results, Full-50 snapshots and question history
  remain compatible. Both committed feature flags remain false.
- No question/objective content, review status, deployment or PR #14 work was
  added.

## Validation

- Bundled Node.js 24 is used for all commands.
- Lint passes with the four pre-existing `<img>` warnings and no errors.
- TypeScript, production build and all focused correction suites pass.
- Aqueous validation/blueprint: 36 questions, 13 objectives, 22 higher-order,
  zero diagnostics.
- HVP validation/blueprint: 120 questions, 23 objectives, 19 sources,
  55 higher-order, zero errors and the unchanged 79 advisory warnings.
- `npm ci` passed from the committed lockfile after two stale HTTP-500
  development servers were stopped to release Windows native-module locks.
- `npm run check` passed end to end.
- Vitest passed: 141 test files and 817 tests.
- The first cold post-install test pass had one unrelated five-second
  review-campaign subprocess timeout; that test passed alone in 1.8 seconds and
  the complete rerun passed without changing its timeout or product behavior.
- Production build and `git diff --check` passed.
- Clean-head `npm run release:verify`, Chrome QA, release metrics and the exact
  final head are recorded in the PR description and final report.

## Publishing

- PR #13 remains draft.
- No deployment was performed.
- PR #14 was not started.
