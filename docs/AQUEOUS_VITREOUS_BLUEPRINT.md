# Aqueous and Vitreous Curated Bank Blueprint

The canonical draft-only OPT 376 bank now contains 80 questions: the original 36 objects in preserved order plus 44 slide-aligned additions. The live 50-question legacy quiz does not consume this bank, and the exact nine-question engineering pilot remains independently feature-gated.

| Dimension | Exact targets |
|---|---|
| Sections | media-chambers 12; production 13; flow 15; iop 14; vitreous-anatomy 13; vitreous-clinical 13 |
| Formats | SBA 26; true/false 6; multiple response 10; matching 9; extended matching 7; ordering 7; hotspot 5; image label 4; short answer 4; open response 2 |
| Bloom | Remember 10; Understand 17; Apply 32; Analyze 14; Evaluate 6; Create 1 |
| Difficulty | Foundation 21; Intermediate 41; Advanced 18 |
| Stimulus | Text 13; diagram 9; table 7; clinical vignette 20; pathway 10; comparison 12; error analysis 9 |

Apply, Analyze, Evaluate, and Create total 53 of 80 (66.25%). Difficulty remains independent of Bloom level.

## Objective decomposition

The bank uses 13 objectives. This is the documented equivalent decomposition allowed by the brief: the preserved `aqueous-trace-conventional-outflow` objective now includes comparing conventional and unconventional pathways, rather than adding a separate comparison objective that could not reach the two-question minimum without changing preserved pilot metadata or exceeding six flow items. All existing objective IDs remain, all objectives are draft, and every objective has at least two questions.

## Enforcement

`npm run questions:blueprint` validates target totals, bank count, section, format, Bloom, difficulty, stimulus, higher-order share, and minimum objective coverage using structured diagnostic codes. It also reports source coverage and families with more than three active questions. It is an authoring contract, not a runtime session assembler.

The nine-question pilot is selected by its ordered stable-ID declaration from the canonical bank. Only referenced objectives and sources enter the derived pilot bank. A semantic-hash regression fixture protects the questions’ versions, stems, answers, rationales, anchors, and grading-relevant content.
## Review-hardening correction

The review follow-up preserves the exact blueprint while correcting candidate quality: the two matching tables no longer reveal their answer maps; IOP measurement includes central corneal thickness context; IOP error analysis has one unique overlooked factor per prompt; the barrier item uses plausible anterior-segment mechanisms; the vitreous ordering endpoint is the posterior vitreous cortex rather than the optic disc; and the short-answer scenario requires applying examination findings. A full UTF-8 guard protects learner, reviewer, and diagnostic text.

### Manual author self-review of the 27 new candidates

This is author self-review only, not independent academic approval. Every item was checked for one defensible best answer or answer map, Bloom alignment, homogeneous distractors/components, plausible misconceptions, explanation quality, source support, variable-number qualification, answer leakage, and category clues.

| Candidate | Outcome |
|---|---|
| aqueous-chambers-sba-002 | Pass; ocular-space distractors remain homogeneous. |
| aqueous-angle-sba-001 | Pass after replacing the unrelated vitreous distractor. |
| aqueous-chambers-mr-001 | Pass; boundary statements and selection key are coherent. |
| aqueous-chambers-ordering-001 | Pass; sequence and Apply operation are supported. |
| aqueous-chambers-hotspot-001 | Pass; neutral marker text and draft coordinate audit retained. |
| aqueous-production-sba-001 | Pass; epithelial/tissue alternatives are homogeneous. |
| aqueous-barrier-sba-001 | Pass after conversion to mechanism analysis with plausible anterior-segment alternatives. |
| aqueous-production-mr-002 | Pass; three mechanisms and one outflow misconception are distinct. |
| aqueous-production-matching-001 | Pass after raw-trial redesign; the table no longer reproduces the answer map. |
| aqueous-production-ordering-001 | Pass; secretion pathway and rationales are coherent. |
| aqueous-flow-sba-002 | Pass; all options are route-localization alternatives. |
| aqueous-flow-extended-001 | Pass; variable route proportions remain qualified. |
| aqueous-iop-sba-001 | Pass after homogeneous diagnostic-interpretation distractor rewrite. |
| aqueous-iop-sba-002 | Pass after homogeneous measurement-context distractor rewrite. |
| aqueous-iop-mr-001 | Pass after adding central corneal thickness and retaining one plausible non-factor. |
| aqueous-iop-matching-001 | Pass after unique-determinant rewrite and quotation repair. |
| vitreous-anatomy-sba-001 | Pass; all choices are ocular spatial relationships. |
| vitreous-structure-sba-001 | Pass after 98–99% encoding repair and causal-distractor review. |
| vitreous-anatomy-ordering-001 | Pass after anatomically accurate posterior-cortex endpoint rewrite. |
| vitreous-anatomy-matching-001 | Pass after neutral specimen redesign; no answer-map leakage. |
| vitreous-anatomy-hotspot-001 | Pass; neutral interaction labels and draft coordinate audit retained. |
| vitreous-anatomy-label-001 | Pass; targets, labels, rationales, and one-to-one map are coherent. |
| vitreous-clinical-sba-001 | Pass after homogeneous assessment-urgency alternatives. |
| vitreous-clinical-sba-002 | Pass after homogeneous vitreous-term alternatives. |
| vitreous-clinical-extended-001 | Pass; urgency categories remain clinically distinguishable. |
| vitreous-clinical-short-001 | Pass after redesign as examination-based Apply/error analysis. |
| vitreous-clinical-open-response-002 | Pass after quotation repair; sample and rubric support Create. |
## Extended-matching exclusivity correction

`aqueous-flow-extended-001` now separates two anatomical routes from one downstream pressure constraint. Its correct categories are conventional trabecular route, unconventional uveoscleral route, and episcleral venous-pressure constraint; `reuseOptions` is explicitly `false`, and every stem maps to a unique category.

## Campaign evidence binding

The exact 80-question blueprint is part of the deterministic campaign bank hash. Each campaign question also binds its version, review hash, objective, sources, and format-derived criterion matrix. All 80 questions and 13 objectives remain draft; the nine preserved pilot semantics are unchanged.

## Curated session contracts

The default-disabled full experience uses `opt376-aqueous-vitreous-curated-v1` for automatic sessions and `opt376-aqueous-vitreous-written-v1` for manual Written sessions. Quick 10, Standard 25 and Full 50 enforce exact section, format and difficulty allocations, bounded higher-order counts and a maximum of two questions per family. Full covers all 13 objectives. All three profiles pass 1,000 deterministic seeds; Custom supports 5-50 questions and targeted mode selects 10.
