# AI Handoff - Autonomic Pharmacology curated bank

## Checkpoint

- Branch: `codex/autonomic-pharmacology-curated-bank`
- Base main: `0e1b0d503d4b25cb91e65e7b620be0d29f1eccb8`
- Scope: default-disabled Adrenergic and Cholinergic Pharmacology curated practice
- Deployment: none

## Canonical content

- Package ZIP SHA-256: `3e92f1686bbb802d7eca535c6bf51a7fd061ad99a64fc8b0683505f6fdfc5362`
- Bank SHA-256: `7f8c0d7915bccd3c3ffcf2ac96bc44758366928198ec55e68ee5e5c55d43e143`
- Bank: 80 draft questions, 20 draft objectives, 18 sources
- Assets: five exact answer-neutral SVG diagrams
- Sections: `pharm-adrenergic` 40; `pharm-cholinergic` 40
- Formats: 78 automatically gradable questions across nine formats and two manual-only open responses
- Review status: every question and objective remains `draft`; no reviewer identity was added

## Learner contract

- Route: `/practice/autonomic-pharmacology-curated`
- Automatic blueprint: `autonomic-pharmacology-curated-v1`
- Written blueprint: `autonomic-pharmacology-written-v1`
- Profiles: Quick 10, Standard 25, Full 50, Custom 5-50, targeted 10 and Written 2
- Exact section, format and difficulty quotas; Apply-or-higher minimums of 6, 18 and 36
- Maximum family repetition: 2; no difficulty relaxation
- Feature flag: `NEXT_PUBLIC_ENABLE_AUTONOMIC_PHARMACOLOGY_CURATED_PRACTICE=false`
- StoreV2 identity, legacy quiz/history, HVP identities and the Aqueous pilot are unchanged

## Validation

- Focused Pharmacology tests: 5 files, 16 tests passed
- Registry/release contract tests: passed
- Strict bank validation: 80 questions, 0 errors, 0 unexpected warnings; 30 canonical lint notes recorded without changing authored content
- Blueprint validation: passed with 0 diagnostics
- Full-suite checkpoint: 175 files and 942 tests; two expected registry/fixture-count failures were corrected and their focused reruns passed
- Clean source-bound Pharmacology preview build and bundle audit: passed
- Preview metrics: 8,866,345 total bytes; 1,971,237 client JS bytes; 509,145 initial-route JS bytes; 183 files; 7,477 ms observed build
- Final `npm run check`, browser QA and final commit identity are recorded in the draft PR after completion

## Preserved boundaries

The answer-bearing bank is imported only by the lazy practice and progress adapters. The release audit registry excludes Pharmacology markers from every unrelated curated closure and excludes all other bank markers from Pharmacology. Committed flags remain false and the preview profile is non-publishable.
