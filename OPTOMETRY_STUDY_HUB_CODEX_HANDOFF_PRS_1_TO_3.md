# Optometry Study Hub — Codex Implementation Handoff

## Scope of this handoff

This handoff covers the first three pull requests of the assessment redesign:

1. **PR 1 — Baseline quality, tests, and project documentation**
2. **PR 2 — Modularise the existing application without changing behaviour**
3. **PR 3 — Introduce the versioned assessment schema, validation tooling, and storage migration foundation**

Repository: `davidagyekum/optometry-study-hub`  
Baseline branch: `main`  
Baseline commit reviewed: `18ba5aebdef82402e26c1937d4e2bb1638a7a116`

The purpose of these three PRs is to create a safe engineering foundation. They must **not** attempt the full question rewrite, mixed-format quiz UI, adaptive selection, or mastery dashboard yet.

---

# Controlling implementation rules

1. Work on **one PR at a time**.
2. Create each branch from the latest merged `main`, not from the previous unmerged branch.
3. Do not commit directly to `main`.
4. Open each pull request as a **draft** until all checks pass.
5. Do not start the next PR until the previous PR has been reviewed and merged.
6. Preserve the current public appearance and behaviour throughout PRs 1–3, except where PR 1 repairs a broken test command or PR 3 performs a backward-compatible storage migration.
7. Do not rewrite the existing 400 questions during these PRs.
8. Do not “improve” current distractors in PR 2. Move the legacy generator intact and label it clearly as legacy technical debt.
9. Do not add authentication, a database, D1, R2, analytics, accounts, or cloud-synced progress.
10. Do not change course content, lecturer attribution, image copy, clinical statements, or user-facing wording unless a task below explicitly requires it.
11. Use strict TypeScript. Avoid `any`, unsafe non-null assertions, and broad `as` casts except at narrow validated boundaries.
12. Preserve the current local-only privacy model.
13. Add or update `AI_HANDOFF.md` at the end of every PR using the reporting template at the end of this document.
14. Before committing, inspect the complete diff and exclude unrelated files, generated caches, build outputs, local environment files, and editor artifacts.

---

# Current-state constraints to preserve

The current application:

- contains five course entries and eight modules;
- presents approximately 400 generated practice questions;
- stores progress in browser local storage;
- uses client-side route state for `/course`, `/study`, `/quiz`, and `/results`;
- keeps most data, quiz logic, persistence, and UI in `app/StudyApp.tsx`;
- stores the legacy data under `opt376-study-state:v1`;
- uses a generic starter README;
- declares a test command that must be verified because its referenced test file may be absent;
- has a visually established interface that should not be redesigned during PRs 1–3.

Treat the baseline as a working prototype. Preserve it while making the code testable and ready for the new assessment system.

---

# PR 1 — Baseline quality, tests, and documentation

## Branch and pull request

Branch:

```text
codex/pr1-baseline-quality
```

Suggested commit:

```text
Establish baseline quality checks and project documentation
```

Suggested PR title:

```text
Establish baseline quality checks and project documentation
```

## Objective

Create a reproducible baseline so later refactors can be verified confidently. Repair the project’s quality commands, replace starter documentation, and document the current architecture and known limitations without changing the visible product.

## Required changes

### 1. Verify the repository before editing

Run and record:

```bash
git status -sb
git log -1 --oneline
node --version
npm --version
npm ci
npm run lint
npm run build
npm test
```

Do not hide existing failures. Record the exact initial result in `AI_HANDOFF.md`.

If `npm test` fails because `tests/rendered-html.test.mjs` does not exist, treat that as the known baseline defect to repair.

### 2. Establish a dedicated test runner

Use **Vitest** for unit and source-integrity tests.

Add the required development dependency and lockfile update. Create a separate `vitest.config.ts` so the tests do not need to load the Cloudflare/Vinext development-server configuration.

Recommended configuration principles:

- Node environment for PRs 1–3.
- Test files under `tests/**/*.test.ts`.
- Clear coverage of pure logic and repository integrity.
- No browser DOM testing yet.
- No snapshots of large generated markup.

Update package scripts to include:

```json
{
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "check": "npm run lint && npm run typecheck && npm run test && npm run build"
}
```

Keep the existing `dev`, `build`, `start`, `lint`, and `db:generate` commands unless a verified defect requires a narrow correction.

### 3. Add baseline smoke and repository-integrity tests

Create at least:

```text
tests/smoke/package-scripts.test.ts
tests/smoke/repository-files.test.ts
tests/smoke/referenced-assets.test.ts
```

Required assertions:

#### `package-scripts.test.ts`

- `package.json` includes `dev`, `build`, `start`, `lint`, `typecheck`, `test`, and `check`.
- the declared Node engine remains compatible with the project;
- no test script references a missing file.

#### `repository-files.test.ts`

Assert the presence of critical files such as:

```text
app/page.tsx
app/layout.tsx
app/StudyApp.tsx
app/additionalCourses.ts
app/globals.css
package.json
tsconfig.json
vite.config.ts
.openai/hosting.json
```

Do not make this test excessively brittle. It is a baseline guard, not a permanent architecture contract.

#### `referenced-assets.test.ts`

- Read the current content source files.
- Extract local image references beginning with `/images/`.
- Resolve them under `public/`.
- Fail with a clear list of missing assets.
- Ignore remote URLs.
- Deduplicate reported paths.

### 4. Replace the starter README

Replace the generic `vinext-starter` README with a project-specific `README.md` containing:

- project purpose;
- current courses;
- current architecture summary;
- local-development requirements;
- installation commands;
- all quality commands;
- deployment context;
- local-storage privacy behaviour;
- current limitations;
- where course content and question data currently live;
- the staged redesign approach;
- contribution workflow;
- warning that lecture-derived content requires academic and licensing review before broad public release.

Do not claim that the assessment redesign is already implemented.

### 5. Add project documentation

Create:

```text
docs/CURRENT_STATE.md
docs/ASSESSMENT_REDESIGN_ROADMAP.md
docs/CONTENT_REVIEW_POLICY.md
CONTRIBUTING.md
.github/pull_request_template.md
AI_HANDOFF.md
```

#### `docs/CURRENT_STATE.md`

Document:

- the five courses and eight modules;
- the approximate current question count;
- the current fact-to-MCQ generation model;
- current local-storage model;
- current client-side route model;
- current strengths;
- known technical debt;
- known educational limitations;
- the baseline commit SHA.

#### `docs/ASSESSMENT_REDESIGN_ROADMAP.md`

Summarise the full phased roadmap, but clearly mark PRs 1–3 as foundation work.

#### `docs/CONTENT_REVIEW_POLICY.md`

Define:

- lecture material is not automatically authoritative;
- all new questions require a traceable source;
- named lecturers must not be represented as approving rewritten material unless approval is documented;
- images require source and reuse-right records;
- medical or optometric corrections require a reviewer note;
- question authorship and review status must be recorded.

#### `CONTRIBUTING.md`

Include:

- branch naming;
- one concern per PR;
- required commands;
- no direct commits to `main`;
- question-content review rules;
- how to update `AI_HANDOFF.md`.

#### Pull-request template

Include checkboxes for:

- scope;
- tests;
- typecheck;
- lint;
- build;
- screenshots when UI changes;
- content/source review when educational content changes;
- storage migration notes;
- accessibility review.

### 6. Do not make product changes

PR 1 must not change:

- course order;
- notes;
- questions;
- quiz behaviour;
- score calculation;
- storage format;
- routes;
- colours;
- layouts;
- responsive behaviour;
- metadata copy.

## PR 1 tests and acceptance criteria

The PR is complete only when:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run check
```

all pass from a clean checkout.

Additional acceptance criteria:

- the public UI has no intentional visual or behavioural change;
- the README is project-specific;
- the broken or missing test target is repaired;
- missing image references produce actionable failures;
- `AI_HANDOFF.md` contains the initial failures and final command results;
- no build output or local cache is committed.

## PR 1 non-goals

Do not:

- split `StudyApp.tsx`;
- introduce the new question schema;
- migrate local storage;
- change the current question generator;
- rewrite educational content;
- add browser testing libraries;
- introduce user accounts or backend persistence.

---

# PR 2 — Modularise the existing application without changing behaviour

## Branch and pull request

Start from the latest merged `main`.

Branch:

```text
codex/pr2-modularise-legacy-app
```

Suggested commit:

```text
Modularise the existing study application
```

Suggested PR title:

```text
Modularise the existing study application without changing behaviour
```

## Objective

Separate content, legacy quiz logic, storage, navigation, and UI components so the new assessment engine can be introduced without continuing to enlarge `app/StudyApp.tsx`.

This is a **behaviour-preserving refactor**.

## Target repository structure

Use the following structure unless a small adjustment is clearly justified in `AI_HANDOFF.md`:

```text
app/
  StudyApp.tsx
  additionalCourses.ts            # remove after content is moved
  page.tsx
  layout.tsx
  globals.css

components/
  layout/
    SiteHeader.tsx
    SiteFooter.tsx
  home/
    HomeView.tsx
  course/
    CourseView.tsx
  study/
    StudyView.tsx
    FigureDialog.tsx
  quiz/
    LegacyQuizView.tsx
  results/
    LegacyResultsView.tsx

content/
  legacy/
    courseCatalog.ts
    additionalModules.ts
    opt376Modules.ts
    imageCatalog.ts

lib/
  legacy/
    types.ts
    questionGenerator.ts
    attempts.ts
    progress.ts
  navigation/
    clientRoute.ts
  storage/
    legacyStore.ts

hooks/
  useClientRoute.ts
  useLegacyStore.ts

tests/
  content/
    legacy-content-integrity.test.ts
  legacy/
    question-generator.test.ts
    attempts.test.ts
    progress.test.ts
  navigation/
    client-route.test.ts
  storage/
    legacy-store.test.ts
```

Delete `app/additionalCourses.ts` only after all imports have been moved and the build passes.

## Required refactor

### 1. Extract legacy types

Move the current `Figure`, `CoverImage`, `Section`, `Fact`, `Module`, `Question`, `Attempt`, `Result`, `Store`, and `CourseSummary` types into `lib/legacy/types.ts`.

Keep these types explicitly labelled as legacy. Do not pretend they satisfy the future assessment model.

Prefer named exports.

### 2. Extract content without rewriting it

Move:

- course summaries to `content/legacy/courseCatalog.ts`;
- the five newer modules to `content/legacy/additionalModules.ts`;
- original OPT 376 modules to `content/legacy/opt376Modules.ts`;
- shared figure metadata to `content/legacy/imageCatalog.ts`.

Preserve:

- course order;
- module order;
- section order;
- question/fact order;
- all IDs;
- all wording;
- all image paths;
- all lecturer/source fields;
- all clinical notes.

Avoid mass formatting that makes the diff impossible to review.

### 3. Extract the legacy question generator

Move the existing `questionsFor()` logic to:

```text
lib/legacy/questionGenerator.ts
```

Retain its existing output and caching behaviour for this PR.

Add a prominent comment:

```text
Legacy compatibility only. This positional distractor generator is intentionally
preserved during the behaviour-neutral refactor and must not be used for the new
assessment schema.
```

Do not improve distractors in this PR.

### 4. Extract attempt utilities

Move:

- `shuffled`;
- `createAttempt`;
- score calculation helpers;
- unanswered-count helpers;

to `lib/legacy/attempts.ts`.

Where practical, inject the random-number function into pure helpers so tests can be deterministic:

```ts
shuffle(items, random = Math.random)
```

Do not change production randomisation.

### 5. Extract progress selectors

Move course/module calculations to `lib/legacy/progress.ts`, including:

- module reading percentage;
- course reading percentage;
- latest result;
- best result;
- overall reading completion.

These must remain derived values rather than duplicated state.

### 6. Extract route handling

Move route parsing and path construction to:

```text
lib/navigation/clientRoute.ts
```

Export functions such as:

```ts
parseClientRoute(pathname)
buildClientPath(route)
```

Move browser state handling into `hooks/useClientRoute.ts`.

Preserve the existing route shapes and back/forward behaviour.

Do not introduce full App Router route files yet.

### 7. Extract storage handling

Move:

- storage key;
- empty store;
- load logic;
- save logic;

to `lib/storage/legacyStore.ts`.

Move React integration to `hooks/useLegacyStore.ts`.

Preserve the key:

```text
opt376-study-state:v1
```

PR 2 must not migrate data.

### 8. Extract UI components

Move visual sections into the listed components.

`app/StudyApp.tsx` should become a small orchestration component responsible for:

- obtaining route state;
- obtaining store state;
- resolving the active course or module;
- wiring actions to views;
- choosing the active view.

Target approximately 150–250 lines, not a strict artificial limit.

Preserve all current HTML semantics, CSS classes, visible text, and interactions.

### 9. Keep the figure-dialog accessibility behaviour

When extracting `FigureDialog.tsx`, preserve:

- focus moved into the dialog;
- Escape to close;
- focus trap;
- backdrop close;
- body-scroll lock;
- focus return to trigger;
- image alt text;
- source links.

Do not weaken the current behaviour.

## PR 2 tests

### Legacy content integrity

Assert:

- exactly five courses;
- exactly eight modules;
- all course IDs are unique;
- all module IDs are unique;
- every course `moduleId` resolves to a module;
- every module’s section IDs are unique within that module;
- every fact references an existing section;
- every referenced local image exists;
- the total generated legacy question count remains 400;
- each legacy generated question has four option entries;
- existing module question totals remain unchanged.

Do **not** require legacy options to be unique; duplicate options are a known defect for later removal.

### Navigation

Test:

- root route;
- course route;
- study route;
- quiz route;
- results route;
- unknown route fallback;
- path generation;
- query/hash resilience if relevant.

### Storage

Test:

- empty storage;
- valid version-1 storage;
- malformed JSON;
- wrong version;
- persistence round trip.

### Attempts

Test using an injected deterministic random function:

- every question appears once;
- every option order is generated;
- result scoring remains identical to the current behaviour;
- unanswered responses are not counted as correct.

## PR 2 acceptance criteria

- all PR 1 quality commands pass;
- existing local-storage data remains readable;
- visible application behaviour remains unchanged;
- the course/module/question counts remain unchanged;
- no educational content is edited;
- `StudyApp.tsx` no longer owns course data or most view markup;
- pure legacy functions have unit tests;
- no circular imports are introduced;
- the legacy generator is clearly isolated.

## PR 2 non-goals

Do not:

- fix the hard-coded 50-question flow;
- add quick quizzes;
- add Study/Exam/Mastery modes;
- add new question formats;
- rewrite current questions;
- replace the legacy question generator;
- change the storage key;
- add mastery calculations;
- add real route files;
- redesign UI.

---

# PR 3 — Versioned assessment schema, validation tooling, and storage migration

## Branch and pull request

Start from the latest merged `main`.

Branch:

```text
codex/pr3-assessment-domain
```

Suggested commit:

```text
Introduce the versioned assessment domain and validation tooling
```

Suggested PR title:

```text
Introduce the assessment schema, validation tooling, and storage migration
```

## Objective

Introduce the new assessment model alongside the legacy system. Add a validated, versioned question-bank schema, content-quality linting, reporting commands, sample pilot fixtures, and a backward-compatible local-storage migration.

The production quiz must continue to use the legacy engine after this PR. The new schema is foundation work only.

## Dependencies

Add:

```text
zod
tsx
```

Use the package manager to install current compatible versions and commit the lockfile.

- Zod is the runtime schema boundary.
- `tsx` runs TypeScript validation/report scripts without requiring a separate build step.

Do not add a second validation library.

## Target structure

```text
lib/
  assessment/
    constants.ts
    schemas.ts
    types.ts
    diagnostics.ts
    validateQuestionBank.ts
    lintQuestionBank.ts
    reportQuestionBank.ts
  storage/
    schemas.ts
    migrations.ts
    store.ts
    keys.ts

content/
  question-bank/
    pilot/
      objectives.ts
      questions.ts
      bank.ts

scripts/
  validate-question-bank.ts
  report-question-bank.ts

tests/
  assessment/
    schema.test.ts
    validation.test.ts
    lint.test.ts
    report.test.ts
  storage/
    migration-v1-v2.test.ts
    store-v2.test.ts
  fixtures/
    valid-question-bank.ts
    invalid-question-bank.ts

docs/
  ASSESSMENT_SPEC.md
  QUESTION_AUTHORING_GUIDE.md
  STORAGE_MIGRATION.md
```

Small naming adjustments are acceptable if the architecture remains clear.

---

## Assessment domain requirements

### 1. Stable identifiers

All new entities use stable slug-style IDs.

Required ID examples:

```text
course: neuro-anatomy
module: aqueous-vitreous
section: aqueous-flow
objective: aqueous-trace-conventional-outflow
question: aqueous-flow-ordering-001
question family: aqueous-conventional-outflow-sequence
option: trabecular-meshwork
```

Question IDs must never be derived from array indexes.

### 2. Core enums

Implement validated schemas and inferred TypeScript types for:

```ts
type BloomLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

type Difficulty =
  | 'foundation'
  | 'intermediate'
  | 'advanced';

type ReviewStatus =
  | 'draft'
  | 'reviewed'
  | 'approved'
  | 'retired';

type QuestionFormat =
  | 'single_best_answer'
  | 'multiple_response'
  | 'ordering'
  | 'matching'
  | 'extended_matching'
  | 'image_hotspot'
  | 'image_label'
  | 'short_answer'
  | 'open_response';

type StimulusType =
  | 'text'
  | 'diagram'
  | 'table'
  | 'clinical_vignette'
  | 'pathway'
  | 'comparison'
  | 'error_analysis';
```

Use discriminated unions based on `format`.

### 3. Base question fields

Every new question must contain:

```ts
{
  schemaVersion: 1;
  id: string;
  familyId: string;
  courseId: string;
  moduleId: string;
  sectionId: string;
  objectiveId: string;

  format: QuestionFormat;
  stimulusType: StimulusType;
  bloomLevel: BloomLevel;
  difficulty: Difficulty;

  stem: string;
  explanation: string;
  noteAnchor: string;

  misconceptionTags: string[];
  sources: SourceReference[];

  author: string;
  reviewer?: string;
  reviewStatus: ReviewStatus;
  version: number;

  estimatedSeconds?: number;
  allowNegativeStem?: boolean;
}
```

### 4. Source reference

Use:

```ts
type SourceReference = {
  id: string;
  title: string;
  locator?: string;       // page, slide, chapter, figure, section
  url?: string;
  kind:
    | 'lecture'
    | 'textbook'
    | 'guideline'
    | 'journal'
    | 'website'
    | 'image'
    | 'other';
};
```

Rules:

- reviewed and approved questions require at least one source;
- source IDs must be stable;
- URLs must be valid when supplied;
- lecturer/source attribution must not imply approval.

### 5. Option model

Use stable option IDs:

```ts
type QuestionOption = {
  id: string;
  text: string;
  rationale?: string;
  misconceptionTag?: string;
};
```

For reviewed and approved questions, every option must have a rationale.

Do not store learner responses as option text.

### 6. Format-specific schemas

#### Single best answer

```ts
{
  format: 'single_best_answer';
  options: QuestionOption[];
  correctOptionId: string;
}
```

Rules:

- 3–6 options;
- exactly one correct option ID;
- correct ID must exist;
- option IDs and normalized texts must be unique.

#### Multiple response

```ts
{
  format: 'multiple_response';
  options: QuestionOption[];
  correctOptionIds: string[];
  minimumSelections?: number;
  maximumSelections?: number;
}
```

Rules:

- at least two correct options;
- all correct IDs must exist;
- selection limits must be internally consistent.

#### Ordering

```ts
{
  format: 'ordering';
  items: Array<{ id: string; text: string; rationale?: string }>;
  correctOrder: string[];
}
```

Rules:

- at least three items;
- `correctOrder` must be an exact permutation of item IDs.

#### Matching

```ts
{
  format: 'matching';
  prompts: Array<{ id: string; text: string }>;
  choices: Array<{ id: string; text: string; rationale?: string }>;
  correctMatches: Record<string, string>;
  reuseChoices?: boolean;
}
```

Rules:

- every prompt requires a match;
- referenced prompt and choice IDs must exist;
- choice reuse is permitted only when explicitly enabled.

#### Extended matching

Represent:

- one shared option list;
- multiple stems;
- one answer per stem;
- optional reuse setting.

Do not model extended matching as several unrelated MCQs.

#### Image hotspot

```ts
{
  format: 'image_hotspot';
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
  regions: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  correctRegionIds: string[];
}
```

Coordinates must be normalized from `0` to `1`.

Require:

- non-empty alt text;
- positive image dimensions;
- regions entirely within the image;
- at least one correct region.

#### Image label

Represent the image, label targets, draggable/selectable labels, and the correct mapping with stable IDs.

#### Short answer

```ts
{
  format: 'short_answer';
  acceptedAnswers: string[];
  normalization: {
    trim: boolean;
    caseInsensitive: boolean;
    collapseWhitespace: boolean;
    ignoreTerminalPunctuation: boolean;
  };
}
```

Do not introduce fuzzy medical-answer grading yet.

#### Open response

```ts
{
  format: 'open_response';
  sampleAnswer?: string;
  rubric: string[];
  autoGraded: false;
}
```

Open responses must never be included in automatic numeric scoring without a later explicit rubric workflow.

### 7. Learning objective schema

Implement:

```ts
type LearningObjective = {
  schemaVersion: 1;
  id: string;
  courseId: string;
  moduleId: string;
  sectionId?: string;
  statement: string;
  targetBloomLevels: BloomLevel[];
  tags: string[];
  sourceIds: string[];
  reviewStatus: ReviewStatus;
};
```

Every question’s `objectiveId` must resolve.

### 8. Question-bank schema

Implement a versioned bank:

```ts
type QuestionBank = {
  schemaVersion: 1;
  id: string;
  title: string;
  courseIds: string[];
  objectives: LearningObjective[];
  questions: AssessmentQuestion[];
  sources: SourceReference[];
  generatedAt?: string;
};
```

Do not place runtime-generated timestamps in committed fixtures unless deterministic.

---

# Question-bank validation and linting

## Validation errors

The validator must return structured diagnostics and exit with code `1` for errors.

Required errors include:

- invalid schema;
- duplicate question IDs;
- duplicate objective IDs;
- duplicate source IDs;
- missing objective reference;
- missing source reference;
- duplicate option IDs;
- duplicate normalized option text;
- correct option ID not present;
- invalid ordering permutation;
- invalid matching references;
- invalid hotspot coordinates;
- missing required reviewer/source/rationales for reviewed or approved items;
- empty stem or explanation;
- invalid version;
- unsupported format;
- production bank containing a retired question unless explicitly included for archival reporting.

## Lint warnings

Warnings must not fail the command by default.

Required warnings include:

- `NOT`, `EXCEPT`, `FALSE`, or similar negative stems when `allowNegativeStem` is not set;
- “all of the above”;
- “none of the above”;
- option-length imbalance;
- repeated grammatical prefixes that can be moved into the stem;
- near-duplicate stems;
- stem copied almost verbatim from a note or explanation when detectable;
- reviewed item with author and reviewer set to the same person;
- missing misconception tags on an intermediate or advanced MCQ;
- an apparently Remember-level item labelled Apply, Analyze, or Evaluate;
- source locator missing for lecture, book, guideline, or journal references.

For near-duplicate detection, use a deterministic token-based similarity method. Do not add a heavy machine-learning dependency.

## Diagnostic structure

Use a structured type such as:

```ts
type Diagnostic = {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  questionId?: string;
  path?: string;
};
```

CLI output must be readable and include a summary.

Example:

```text
Question bank validation: FAILED
Questions: 8
Objectives: 5
Errors: 2
Warnings: 3

ERROR DUPLICATE_OPTION_TEXT [aqueous-flow-sba-001]
options[1] and options[3] both normalize to "canal of schlemm"
```

---

# CLI commands

Add:

```json
{
  "questions:validate": "tsx scripts/validate-question-bank.ts",
  "questions:report": "tsx scripts/report-question-bank.ts"
}
```

Update `check` so it includes question validation:

```json
{
  "check": "npm run lint && npm run typecheck && npm run test && npm run questions:validate && npm run build"
}
```

## `questions:validate`

- loads the committed pilot bank;
- prints diagnostics;
- exits `1` on errors;
- exits `0` on warnings only;
- supports an optional strict flag that treats warnings as failures.

Suggested usage:

```bash
npm run questions:validate
npm run questions:validate -- --strict
```

## `questions:report`

Print counts by:

- course;
- module;
- section;
- objective;
- Bloom level;
- difficulty;
- format;
- stimulus type;
- review status.

Also print:

- total questions;
- total objectives;
- questions without misconception tags;
- questions without source locators;
- question families with multiple variants.

The report must be deterministic for committed content.

---

# Pilot schema fixtures

Create a small, non-production pilot bank for **Aqueous Humour & Vitreous Body**.

Purpose:

- prove every schema shape;
- exercise validation;
- provide examples for later authoring;
- do not replace the live legacy questions.

Include at least one valid example of:

- single best answer;
- multiple response;
- ordering;
- matching;
- extended matching;
- image hotspot;
- image label;
- short answer;
- open response.

Mark all sample items:

```text
reviewStatus: draft
```

Use existing course/module/section IDs where appropriate, but do not place these questions into the live quiz registry.

The examples must be medically coherent. Do not use placeholder distractors such as “Option A” or unrelated categories.

Add a deliberately invalid bank only under test fixtures. It must not be imported by production code.

---

# Storage version 2 and migration foundation

## Keys

Create:

```ts
export const LEGACY_STORAGE_KEY = 'opt376-study-state:v1';
export const STORAGE_KEY = 'optometry-study-hub:v2';
```

## Version-2 store

Use a backward-compatible shape that allows the current UI to continue working:

```ts
type StoreV2 = {
  version: 2;

  // Preserved legacy state used by the current production UI.
  read: Record<string, string[]>;
  active: Record<string, LegacyAttempt | undefined>;
  results: Record<string, LegacyResult[]>;

  // Empty foundation for the future assessment engine.
  assessment: {
    activeAttempts: Record<string, AssessmentAttemptSnapshot>;
    results: Record<string, AssessmentResultSnapshot>;
    questionHistory: Record<string, QuestionHistoryRecord>;
  };
};
```

Define validated schemas for all persisted structures.

### Assessment response union

Persist responses using a discriminated union:

```ts
type PersistedResponse =
  | { format: 'single_best_answer'; optionId: string }
  | { format: 'multiple_response'; optionIds: string[] }
  | { format: 'ordering'; itemIds: string[] }
  | { format: 'matching'; matches: Record<string, string> }
  | { format: 'extended_matching'; answers: Record<string, string> }
  | { format: 'image_hotspot'; regionIds: string[] }
  | { format: 'image_label'; matches: Record<string, string> }
  | { format: 'short_answer'; text: string }
  | { format: 'open_response'; text: string };
```

### Attempt snapshot

A future assessment attempt must retain:

- attempt ID;
- mode;
- course/module IDs;
- blueprint ID when present;
- start time;
- ordered question IDs;
- question versions;
- option/item order;
- learner responses;
- flags;
- current index.

Do not persist entire question objects. Preserve IDs and versions so a result can be interpreted safely.

## Migration behaviour

Implement:

```ts
migrateV1ToV2(v1): StoreV2
```

Required behaviour:

1. Try valid V2 data first.
2. If absent, read valid V1 data.
3. Copy `read`, `active`, and `results` exactly.
4. Initialise the `assessment` fields as empty.
5. Save the migrated V2 record under the new key.
6. Leave the V1 key untouched for rollback.
7. If V1 data is malformed, do not throw.
8. Return a valid empty V2 store and report a diagnostic in development.
9. Never silently delete corrupt user data.
10. Keep migration pure and unit-tested.

Wire the current production UI to the V2 load/save wrapper while retaining its existing top-level selectors and visible behaviour.

## Storage tests

Required cases:

- no stored data;
- valid V1 migration;
- valid V2 load;
- malformed V1;
- malformed V2;
- wrong version;
- V1 fields preserved exactly;
- V2 assessment fields initialised empty;
- old key remains present after migration;
- save and reload round trip;
- storage unavailable or throwing;
- no application crash.

---

# PR 3 documentation

## `docs/ASSESSMENT_SPEC.md`

Document:

- purpose of the new assessment system;
- supported formats;
- Bloom taxonomy usage;
- difficulty definitions;
- review statuses;
- source requirements;
- stable-ID policy;
- question-family policy;
- Study/Exam/Mastery modes as future work;
- why AIKEN is export-only;
- why Aiken’s V is a later expert-validation process;
- what remains legacy after PR 3.

## `docs/QUESTION_AUTHORING_GUIDE.md`

Include:

- writing focused stems;
- homogeneous plausible distractors;
- no positional distractor generation;
- no “all/none of the above”;
- negative-stem restrictions;
- source and locator requirements;
- Bloom examples;
- misconception tags;
- option rationales;
- diagram accessibility;
- versioning;
- review workflow;
- example question objects.

## `docs/STORAGE_MIGRATION.md`

Include:

- old and new keys;
- V1 and V2 shapes;
- migration algorithm;
- rollback behaviour;
- corruption handling;
- future migration rules;
- privacy implications.

---

# PR 3 tests and acceptance criteria

The PR is complete only when all pass:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run questions:validate
npm run questions:report
npm run build
npm run check
```

Additional acceptance criteria:

- the visible production quiz still uses the legacy engine;
- existing V1 browser progress migrates without loss;
- the V1 key is retained;
- the pilot bank passes validation;
- the invalid fixture produces expected diagnostics;
- validation errors are deterministic and actionable;
- all new question responses use stable IDs;
- no new question uses positional distractors;
- no current 400-question content migration occurs;
- no new question renderer is added;
- no backend or account system is added;
- all public behaviour remains visually unchanged.

## PR 3 non-goals

Do not:

- replace the live legacy quiz;
- implement multi-format renderers;
- implement the quiz assembler;
- implement adaptive mastery;
- implement spaced repetition;
- rewrite the Aqueous module fully;
- convert the existing 400 questions;
- add AIKEN export yet;
- calculate Aiken’s V;
- introduce cloud storage.

---

# Merge gates

## Gate after PR 1

Do not start PR 2 until:

- clean checkout passes `npm run check`;
- documentation is approved;
- no UI behaviour changed;
- the baseline failure and repair are documented.

## Gate after PR 2

Do not start PR 3 until:

- the refactor is behaviour-neutral;
- local V1 storage still works;
- the total course/module/question counts remain unchanged;
- `StudyApp.tsx` is a small orchestrator;
- extracted pure modules are tested.

## Gate after PR 3

Do not begin PR 4 or migrate real questions until:

- the question schema is approved;
- the storage migration has been tested with real sample V1 data;
- validator diagnostics are considered useful;
- the authoring guide is accepted;
- the sample Aqueous fixtures demonstrate every schema format;
- the live legacy application remains stable.

---

# Required Codex report after each PR

Update `AI_HANDOFF.md` with this structure:

```markdown
# AI Handoff

## Pull request
- PR:
- Branch:
- Base branch:
- Base commit:
- Head commit:
- Status: DRAFT / READY FOR REVIEW

## Objective completed
Describe exactly what this PR was meant to achieve.

## Files changed
List files grouped by:
- source
- tests
- documentation
- configuration
- dependencies

## Behaviour
- Intended user-visible changes:
- Confirmed preserved behaviour:
- Storage impact:
- Content impact:

## Validation
| Command | Result |
|---|---|
| npm ci | PASS/FAIL |
| npm run lint | PASS/FAIL |
| npm run typecheck | PASS/FAIL |
| npm run test | PASS/FAIL |
| npm run questions:validate | PASS/FAIL/N/A |
| npm run questions:report | PASS/FAIL/N/A |
| npm run build | PASS/FAIL |
| npm run check | PASS/FAIL |

Include concise failure details rather than hiding them.

## Manual verification
Record:
- homepage;
- course page;
- notes page;
- figure modal;
- quiz start/resume;
- answer selection;
- flagging;
- submission;
- results;
- browser refresh;
- back/forward;
- mobile-width check.

## Deviations from the brief
Explain every deviation and why it was necessary.

## Known limitations
List remaining risks or technical debt.

## Recommended next step
State the next PR, but do not begin it automatically.
```

---

# First prompt to give Codex

Give Codex **only this PR 1 instruction first**:

```text
Work in the repository davidagyekum/optometry-study-hub.

Read the full implementation brief in:
OPTOMETRY_STUDY_HUB_CODEX_HANDOFF_PRS_1_TO_3.md

Implement ONLY PR 1 — Baseline quality, tests, and documentation.

Start from the latest main branch. Create:
codex/pr1-baseline-quality

Do not begin PR 2 or PR 3.
Do not change the public UI, course content, questions, routes, storage format,
quiz behaviour, styling, or metadata copy.

Run the initial commands exactly as specified, record all initial failures,
repair the quality/test foundation, add the required project documentation,
run every final validation command, inspect the complete diff, commit the
changes, push the branch, open a draft pull request, and update AI_HANDOFF.md.

Return:
1. the draft PR link;
2. branch and commit;
3. concise summary of changes;
4. complete validation results;
5. deviations;
6. known limitations.

Stop after PR 1 and wait for review.
```

After PR 1 is reviewed and merged, provide Codex the PR 2 section. After PR 2 is reviewed and merged, provide the PR 3 section.

---

# Definition of success for this handoff

At the end of PR 3:

- the current site still works as before;
- its code is modular and testable;
- existing local progress survives migration;
- a new versioned question-bank schema exists;
- invalid questions are detected before release;
- assessment reports can be generated;
- each future question can carry Bloom level, difficulty, sources, rationales, misconception tags, and stable IDs;
- the project is ready for PR 4, which will replace the hard-coded legacy quiz engine with a dynamic session engine.
