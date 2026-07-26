# Aqueous and Vitreous Candidate Blueprint

PR 7 establishes one canonical, draft-only OPT 376 bank. It contains 36 questions: the exact nine engineering-pilot questions plus 27 new candidates. The live 50-question legacy quiz does not consume this bank.

| Dimension | Exact targets |
|---|---|
| Sections | 6 each: media-chambers, production, flow, iop, vitreous-anatomy, vitreous-clinical |
| Formats | SBA 12; multiple response 4; ordering 4; matching 4; extended matching 3; hotspot 3; image label 2; short answer 2; open response 2 |
| Bloom | Remember 6; Understand 8; Apply 12; Analyze 7; Evaluate 2; Create 1 |
| Difficulty | Foundation 10; Intermediate 18; Advanced 8 |
| Stimulus | Text 5; diagram 5; table 3; clinical vignette 8; pathway 6; comparison 5; error analysis 4 |

Apply, Analyze, Evaluate, and Create total 22 of 36 (61.111111%). Difficulty remains independent of Bloom level.

## Objective decomposition

The bank uses 13 objectives. This is the documented equivalent decomposition allowed by the brief: the preserved `aqueous-trace-conventional-outflow` objective now includes comparing conventional and unconventional pathways, rather than adding a separate comparison objective that could not reach the two-question minimum without changing preserved pilot metadata or exceeding six flow items. All existing objective IDs remain, all objectives are draft, and every objective has at least two questions.

## Enforcement

`npm run questions:blueprint` validates target totals, bank count, section, format, Bloom, difficulty, stimulus, higher-order share, and minimum objective coverage using structured diagnostic codes. It also reports source coverage and families with more than three active questions. It is an authoring contract, not a runtime session assembler.

The nine-question pilot is selected by its ordered stable-ID declaration from the canonical bank. Only referenced objectives and sources enter the derived pilot bank. A semantic-hash regression fixture protects the questions’ versions, stems, answers, rationales, anchors, and grading-relevant content.
