# OPT 374 Human Visual Perception curated practice

## Status and scope

PR 9 adds a private, default-disabled practice experience for the existing
`human-visual-perception` course and module. It covers the supplied
introduction, retina, LGN/V1, and extrastriate teaching decks.

The canonical pool contains:

- 120 version-1 questions;
- 23 learning objectives;
- 19 registered sources;
- four existing note anchors;
- nine assessment formats;
- 118 automatically gradable items;
- two manual-only open-response study prompts.

Every question and objective remains formally `draft`. The required learner
wording is:

> Internally verified, slide-aligned practice questions. Not lecturer-approved examination items.

The current legacy Human Visual Perception notes and generated 50-question quiz
remain the primary course experience and are not modified.

## Exposure boundary

The curated route is enabled only when:

```text
NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=true
```

Only the exact string `true` enables it. The repository default is `false`.
This is an exposure control, not authentication or authorization.

When disabled, the HVP notes contain no curated-practice entry, direct routes
show an unavailable screen, and the ordinary static learner import graph does
not reach the canonical bank or its answer keys.

## Canonical content

The package JSON is preserved byte-for-byte at:

```text
content/question-bank/opt374/human-visual-perception/bank.json
```

Its recorded SHA-256 is:

```text
029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a
```

Typed adapters, the exact blueprint, and bank-specific validation commands live
beside that file. The source hierarchy and slide corrections are documented in
[the content audit](OPT374_HVP_CONTENT_AUDIT.md), while exact distributions are
documented in [the question blueprint](OPT374_HVP_QUESTION_BLUEPRINT.md).

## Fifty-question assembler

Every scored practice contains exactly 50 unique current-version questions.
The two open responses are excluded because the application does not fabricate
an automatic grade for written synthesis.

Exact section quotas:

| Section | Count |
|---|---:|
| `hvp-foundations` | 6 |
| `hvp-retina` | 20 |
| `hvp-lgn` | 14 |
| `hvp-extrastriate` | 10 |

Exact format quotas:

| Format | Count |
|---|---:|
| Single best answer | 30 |
| Multiple response | 8 |
| Matching | 4 |
| Extended matching | 2 |
| Ordering | 2 |
| Image hotspot | 1 |
| Image label | 1 |
| Short answer | 2 |

The assembler first preserves total, section, and format quotas. It then
requires exactly 14 foundation, 26 intermediate, and 10 advanced questions,
requires at least 20 Apply-or-higher questions, and limits each question family
to two members. Runtime assembly disables difficulty relaxation; an incompatible
attempt or result fails closed if either the exact difficulty distribution or
higher-order minimum drifts. Missing required cells produce structured
diagnostics.

Seeded assembly is deterministic: the same bank and seed produce the same set,
while different seeds vary the set where the pool permits.

## Session, storage, and scoring isolation

Curated practice reuses the version-2 local StoreV2 assessment maps, session
engine, nine accessible renderers, `diagnostic@1` grading, atomic finalization,
and exact-version result verification.

The controlled identity is:

```text
practice: human-visual-perception-curated
blueprint: opt374-hvp-curated-v1
course: human-visual-perception
module: human-visual-perception
mode: study
grading: diagnostic@1
```

Attempts and results dispatch by the exact blueprint ID rather than module ID.
Compatibility also verifies the 50 unique IDs, current versions, section and
format quotas, family limit, absence of open responses, and generic session
integrity.

Curated attempts and results never enter legacy `store.results`, never change
homepage or module Latest/Best values, and never update `questionHistory`.
Course, module, and global resets continue to remove only their intended
device-local records.

## Original diagrams

Six repository-owned SVG schematics support the image questions:

- `retina-landmarks.svg`;
- `retinal-circuit.svg`;
- `photoreceptor-distribution.svg`;
- `visual-pathway-medial-brain.svg`;
- `lgn-layers.svg`;
- `dorsal-ventral-streams.svg`.

They use the exact declared viewBoxes and coordinate contracts. Pre-submission
metadata and visible artwork avoid answer labels; interaction overlays remain
HTML controls supplied by the existing accessible renderers.

## Validation commands

```bash
npm run questions:validate:hvp
npm run questions:report:hvp
npm run questions:blueprint:hvp
```

The existing Aqueous commands retain their current defaults. HVP validation
does not combine banks, so stable IDs cannot create false cross-bank duplicate
diagnostics.

## Future content tranches

Later depth, stereopsis, colour, motion, entoptic, and dedicated illusion decks
should extend this canonical bank with new stable IDs and versions. They must
not rewrite the current tranche or weaken the expert-review and promotion
requirements added in PRs 7 and 8.

## PR 10 profiles and written practice

The original Full 50 remains exact and PR 9 snapshots without selection
metadata remain resumable. Quick 10 and Standard 25 use documented
largest-remainder proportional targets; Custom uses explicit filters; targeted
strategies use compatible current-version device history. Quick, Standard
and Full prefer unseen candidates without weakening their exact quotas.
Targeted snapshots retain a tamper-evident eligible-ID pool so resumed attempts
and results fail closed if strategy membership changes. Weak-topic practice is
section-level and requires at least two gradable attempts plus sub-80% accuracy
or a recent current-version miss. The two canonical open-response items are
available only in separate Written practice; its blueprint is always
manual-only, including when both prompts are unanswered. See
`docs/PRACTICE_PLATFORM.md`.
