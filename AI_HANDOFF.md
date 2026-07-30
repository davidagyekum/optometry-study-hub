# AI Handoff - Systemic Pathology curated bank

## Checkpoint

- Branch: `codex/systemic-pathology-curated-bank`
- Base main: `239bff1950db77f74bb131d9940a997d99e085af`
- Scope: default-disabled five-block Systemic Pathology curated practice
- Deployment: none

## Canonical content

- Package ZIP SHA-256: `7fff1bd0173e8838043c5730176d737152427e5271e860ba047d40dde2139257`
- Bank SHA-256: `06ed91a7323147e8eb9ce1fe6d4813209d986d0b4e4664d55136a012d544b379`
- Bank: 80 draft questions, 20 draft objectives, 19 sources
- Assets: five exact answer-neutral SVG diagrams
- Sections: Breast, Cardiovascular, Endocrine, Gastrointestinal and Renal pathology, 16 questions each
- Formats: 78 automatically gradable questions across nine formats and two manual-only open responses
- Canonical bytes: unchanged. The typed runtime view deterministically normalizes the single non-slug option ID `pituitary-tsH-deficiency` to `pituitary-tsh-deficiency`.
- Review status: every question and objective remains `draft`; no reviewer identity was added

## Learner contract

- Route: `/practice/systemic-pathology-curated`
- Automatic blueprint: `systemic-pathology-curated-v1`
- Written blueprint: `systemic-pathology-written-v1`
- Profiles: Quick 10, Standard 25, Full 50, Custom 5-50, targeted 10 and Written 2
- Exact section, format and difficulty quotas; Apply-or-higher minimums of 6, 16 and 35
- Maximum family repetition: 2; no difficulty relaxation
- Feature flag: `NEXT_PUBLIC_ENABLE_SYSTEMIC_PATHOLOGY_CURATED_PRACTICE=false`
- StoreV2 identity, legacy quiz/history, HVP identities and the Aqueous pilot are unchanged

## Validation

- Focused Systemic Pathology tests: 5 files, 16 tests passed
- Registry/release contract tests: 11 files, 70 tests passed
- Strict bank validation: 80 questions, 0 errors, 0 unexpected warnings; 17 canonical lint notes recorded without changing authored content
- Blueprint validation: passed with 0 diagnostics
- Final full-suite totals, source-bound preview metrics, Chrome QA and exact commit identity will be recorded in the draft PR after the clean checkpoint run.

## Release boundaries

Both `systemic-pathology-preview` and the internal `full-curated-preview` are non-publishable profiles. The full profile enables all eight curated experiences while keeping the Aqueous engineering pilot disabled. The answer-bearing bank remains behind lazy practice/progress adapters and is excluded from every unrelated answer closure. All committed feature flags remain false.