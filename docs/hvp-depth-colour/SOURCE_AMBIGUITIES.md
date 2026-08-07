# Source ambiguity and caution register — HVP Depth and Colour extension

This file records issues that Codex and reviewers should preserve rather than silently correct.

## 1. Course-code mismatch
- Depth deck title uses **OPT 374**.
- Colour deck title uses **OPT 372 Human Visual Perception**.
- Existing site already has Human Visual Perception content. Codex should map the new sections into the existing HVP site structure and ask the maintainer/lecturer before changing visible course-code labels.

## 2. Colour deck objective scope exceeds slide detail
The colour deck objectives name abnormal colour perception, Ishihara, D-15, City University, HRR, FM-100 and tints. The deck itself gives little or no detailed administration/scoring/tint-demonstration content. Questions in this package therefore avoid detailed clinical-test scoring and tint claims.

## 3. Trichromatic-theory typo
One slide wording says "one receptor for red, another for green and the third for red". Later slides clearly frame the three cone mechanisms as S, M and L/blue-green-red. Codex should avoid reproducing the typo as if it were a concept.

## 4. Depth distance threshold wording
The depth deck uses wording such as "Beyond 1.5m" and ">1.5m?" when discussing stereopsis usefulness. Treat the exact threshold as lecturer-source wording, not as a universal physiological law.

## 5. Panum spelling
The deck uses Panum/Pannum-style spelling in different places. The package standardizes to **Panum's fusional space**, but reviewers may choose the lecturer's preferred spelling.

## 6. Stereogram construction
The deck explains threshold separation and seconds-of-arc reporting but does not provide a full angular conversion formula. This package avoids calculation questions requiring a formula not taught in the deck.

## 7. Moon illusion
The deck explicitly says no universally accepted explanation exists. Do not write answer keys that imply a single final accepted theory.

## 8. Clinical-test approval
All question banks are draft. Do not label them lecturer-approved, clinically validated or exam-authorized until review is completed.
## Runtime compatibility decisions
- The two raw bank JSON files remain byte-for-byte unchanged. Runtime normalization expands objective Bloom targets only when linked authored questions require the missing level.
- Package image percentages are converted to normalized 0-1 coordinates, and hotspot interaction labels become neutral Region markers so the prompt cannot reveal the answer.
- Seven three-option extended-matching items receive one deterministic, source-grounded unused distractor because the site schema requires four options. For hvp-colour-em-006, the added option is source-contradicted, which is mutually exclusive from the authored needs-source answer.
- One repeated matching choice is deduplicated and marked reusable.
- Full 50 uses verified section-format matrices so exact section, format and difficulty totals, higher-order coverage, all ten objectives and the family cap can be solved deterministically without an unbounded runtime search.
