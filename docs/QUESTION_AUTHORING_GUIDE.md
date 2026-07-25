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

Register every source once with a stable ID. Lecture, textbook, guideline, and journal sources should name the relevant slide, page, chapter, figure, or section. A source attribution does not claim author or lecturer approval.

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

Coordinates should be checked against the exact optimized asset at phone and desktop sizes before a question becomes production-ready.

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
  objectiveId: 'aqueous-trace-conventional-outflow',
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
