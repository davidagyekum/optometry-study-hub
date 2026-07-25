# Contributing

## Workflow

1. Start from the latest merged `main`.
2. Create a focused branch using `codex/<short-description>` for Codex work or another agreed descriptive prefix.
3. Keep one concern per pull request.
4. Do not commit directly to `main`.
5. Open pull requests as drafts until validation is complete.
6. Wait for review and merge before starting a dependent pull request.

Never commit local lecture decks, extracted slide content, build output, environment files, browser data, or editor artifacts.

## Required checks

Run from a clean npm install:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

Document warnings and failures rather than hiding them. Include screenshots and accessibility verification when the UI changes. Include storage migration tests whenever persisted data changes.

## Educational content

Follow [Content Review Policy](docs/CONTENT_REVIEW_POLICY.md). In particular:

- cite a traceable source and locator for new questions;
- record authorship and reviewer status;
- do not imply lecturer approval without evidence;
- document optometric or medical corrections;
- verify image ownership, accuracy, attribution, and accessibility;
- keep draft content out of the live question registry.

## AI handoff

Update `AI_HANDOFF.md` in every pull request. Record the objective, scope, behavior and storage impact, validation results, manual checks, deviations, known limitations, and recommended next step. The final response and pull request must identify the exact branch head commit.
