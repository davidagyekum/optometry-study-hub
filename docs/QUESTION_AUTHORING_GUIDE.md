# Question Authoring Guide

## Authoring workflow

1. Start with one traceable learning objective.
2. Choose the format that best represents the required thinking.
3. Write a focused stem that contains the shared context.
4. Add plausible, homogeneous responses with stable IDs.
5. Explain the correct reasoning and each option’s diagnostic value.
6. Add misconception tags, sources, and precise locators.
7. Run validation and reporting.
8. Obtain independent review before moving beyond `draft`.
9. Increase the question `version` when a meaningful content change is approved.

## Objective ownership

Every objective's course must be declared by the bank. A question must use an objective from the same course, module, and—when the objective specifies one—the same section. The question's Bloom level must be one of the objective's `targetBloomLevels`.

Create a separate objective when two items genuinely test different cognitive work. For example, recalling that a tonometer measures IOP is a Remember objective; applying the relationship among formation, outflow resistance, and episcleral venous pressure is a separate Apply/Analyze objective.

## Focused stems

Ask one interpretable question. Put repeated wording in the stem instead of every option. Include only context needed to answer. Clinical vignettes should contain findings that support the intended inference, not decorative detail.

Avoid copying notes verbatim. The assessment should require retrieval or reasoning from the notes, while the explanation can reconnect the learner to the relevant concept through `noteAnchor`.

## Distractors

Distractors must be plausible to a learner who holds a specific misconception. Keep options grammatically and conceptually homogeneous. Avoid obvious category changes, unequal specificity, and answer-length clues.

Never use positional distractor generation for the new schema. Do not use “all of the above” or “none of the above.” Each option has a stable ID; reviewed and approved options require a rationale.

## Negative stems

Prefer positive stems. If `NOT`, `EXCEPT`, `FALSE`, `incorrect`, or a similar negative is academically necessary:

- set `allowNegativeStem: true`;
- make the negative visually unambiguous in the rendered question later;
- verify that only one interpretation is defensible;
- document why a positive rewrite would be less clear.

## Bloom examples

- Remember: “Name the instrument used to measure intraocular pressure.”
- Understand: “Match each aqueous structure to its principal role.”
- Apply: “Arrange the outflow structures for a new pathway scenario.”
- Analyze: “Determine which IOP determinant best explains each observation.”
- Evaluate: “Judge which investigation best distinguishes two mechanisms using stated criteria.”
- Create: “Construct a management or explanatory model against a supplied rubric.”

Do not assign a higher Bloom label merely because the terminology is difficult.

## Misconception tags

Tags describe the incorrect model an option or question is designed to expose, such as `aqueous-route-order` or `aqueous-vitreous-confusion`. Intermediate and advanced MCQs should normally have at least one misconception tag.

## Sources and locators

Register every source once with a stable ID. Course IDs in a bank, source IDs in a question, and source IDs in an objective must not repeat. Lecture, textbook, guideline, and journal sources should name the relevant slide, page, chapter, figure, or section. A source attribution does not claim author or lecturer approval.

Question citations must preserve the registered source title, kind, and URL. A question may use a more precise locator without creating a new source identity.

Reviewed and approved questions require:

- at least one registered source;
- an independent reviewer;
- rationales for option-like responses.

## Diagrams and accessibility

Image questions require:

- a licensed or course-approved image source;
- useful alternative text that describes the figure without revealing the answer;
- fixed positive dimensions;
- normalized coordinates from `0` to `1`;
- targets that remain entirely within the image;
- stable region, target, and label IDs.
For image labelling, `correctLabels` must cover every target exactly once and must not reuse a label ID. There is no label-reuse policy in the schema or response contract; duplicate correct-label values make the authored answer impossible to submit and are rejected by validation.


Coordinates should be checked against the exact optimized asset at phone and desktop sizes before a question becomes production-ready.

## Format references and normalization

Matching prompt IDs, extended-matching stem IDs, and their normalized text must be unique. Their answer maps must contain exactly one key for every declared prompt or stem, with no missing or extra keys. Hotspot correct-region IDs must also be unique.

Short-answer accepted responses must remain unique and non-empty after applying that item's trim, case, whitespace, and terminal-punctuation rules. Terminal punctuation may be ignored, but Unicode symbols remain meaningful: `Na+` retains `+`, and `15°` retains `°`. Punctuation-only accepted answers are rejected.

The same normalization function is used during authoring validation and grading. Accepted answers therefore need to be complete intended responses; empty normalized learner responses, substring, keyword, fuzzy, and spelling-distance matching are not accepted.

Diagnostic partial credit exists only for matching, extended matching, and image labelling. Authors must ensure their prompts, stems, and targets represent independently meaningful components. Multiple response, ordering, hotspot, single-best-answer, and short-answer formats remain all-or-nothing.

Open-response rubrics support future manual review. They are never automatic answer keys, and sample answers must not be written as though the engine will infer points from them.

## Versioning and retirement

Keep the question ID stable when correcting or improving the same item, and increment `version`. Create a new ID for a materially different task. Retire obsolete items rather than silently deleting their history.

## Review responsibilities

Authors run the automated checks and document sources. Reviewers check factual accuracy, clinical safety, cognitive level, distractor plausibility, accessibility, and reuse rights. Approval must be explicit; lecturer attribution alone is not approval.

## Example

```ts
{
  schemaVersion: 1,
  id: 'aqueous-flow-sba-001',
  familyId: 'aqueous-conventional-outflow-sequence',
  courseId: 'neuro-anatomy',
  moduleId: 'aqueous-vitreous',
  sectionId: 'flow',
  objectiveId: 'aqueous-identify-outflow-resistance',
  format: 'single_best_answer',
  stimulusType: 'pathway',
  bloomLevel: 'remember',
  difficulty: 'foundation',
  stem: 'Aqueous humour reaches its principal resistance site at which structure?',
  explanation: 'The trabecular meshwork is the main resistance site.',
  noteAnchor: 'flow',
  misconceptionTags: ['aqueous-route-order'],
  sources: [{
    id: 'opt376-aqueous-vitreous-lecture',
    title: 'OPT 376 Aqueous Humour and Vitreous Body lecture deck',
    locator: 'Aqueous flow section',
    kind: 'lecture'
  }],
  author: 'Named author',
  reviewStatus: 'draft',
  version: 1,
  options: [
    { id: 'trabecular-meshwork', text: 'Trabecular meshwork', rationale: 'Main resistance site.' },
    { id: 'vitreous-base', text: 'Vitreous base', rationale: 'Vitreoretinal attachment, not outflow.' },
    { id: 'choroid', text: 'Choroid', rationale: 'Vascular tissue, not conventional outflow.' }
  ],
  correctOptionId: 'trabecular-meshwork'
}
```

## Controlled renderer-pilot boundary

The PR 6 Aqueous bank remains `draft` and may be registered only by the clearly named draft-only pilot registry when `NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT` is exactly `true`. This exception demonstrates rendering and persistence; it is not an academic approval path and must not be copied into production registration.

For image hotspots, author three separate concepts: marker is a neutral visible identifier (for example A), interactionLabel is an informative spatial description that does not name the anatomy, and label is the anatomical answer shown only after submission. Never repeat the target anatomy in interactionLabel.

Draft-response persistence accepts structurally valid incomplete learner work, but it does not relax question authoring. Stable IDs, selection limits, reuse rules, image coordinates, alternative text, sources, rationales, and reviewer metadata remain authored contracts. The grading layer reads complete responses only.

Before a future production pilot is enabled, replace or independently review each engineering example, confirm sources and image rights, verify the cognitive target and distractors, test all accessible interactions, record reviewer metadata, and move accepted items through the normal reviewed and approved statuses.

## Canonical candidate banks and blueprints

New module questions belong in one canonical bank; feature-gated pilots must derive ordered subsets by stable ID rather than duplicate content. A declared blueprint is an authoring contract and must be validated before review. Table stimuli use structured caption, column, row, and cell data so a later renderer can produce accessible HTML rather than a screenshot.

After self-review, run `npm run questions:review-pack` and obtain independent ratings using the criteria in [Expert Content Review](EXPERT_CONTENT_REVIEW.md). Aiken’s V is descriptive review evidence only. Do not add a reviewer or move an item beyond `draft` until a real reviewer has completed the project process.
