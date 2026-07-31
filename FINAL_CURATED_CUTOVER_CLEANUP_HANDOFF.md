# Final Curated Cutover Handoff

## Release outcome

The hard learner-path cutover is complete. New learner sessions are created
only by curated practice. Previous legacy attempts and results remain local,
read-only compatibility data; they were not migrated, deleted, or rewritten.

- Merged PR: https://github.com/davidagyekum/optometry-study-hub/pull/26
- Merge commit: `321654597541d88e43b637a4d7e822b6648e28ff`
- Public site: https://opt-376-eye-anatomy-review.davorion7.chatgpt.site
- Sites version: `6`
- Deployment: `appgdep_6a6c7f19203c8191ba6f89e06915fa01`
- Deployment status: succeeded
- Previous rollback reference: Sites version `5`

## Release evidence

- `npm run check`: passed (184 test files, 979 tests)
- `npm run release:verify`: passed for disabled, preview, and full-curated
  profiles, including validators, blueprints, builds, audits, manifest and
  whitespace checks
- Manifest SHA-256: `03345d2182f505ff3ed58eca254d1c7cc3132266a1dd41e8e75bac0346a3bb7c`
- Deterministic release identity: `ed2ca1e32e7c563c19f09a9bfcf2616adfc1d4679e0136ad63f049e9cb468a8a`
- Published archive SHA-256: `dc84bc57494f3493b929993d3646e4459191df20ebaf94278cbf6858a070cae3`
- Published archive: 192 files

The deployed full-curated profile contains 680 curated questions across the
eight course experiences while preserving the 400-question legacy bank.
StoreV2, local progress, answer isolation, accessibility behavior, and the
existing question-history contracts remain unchanged. Internal draft metadata
is retained, but learner-facing release copy is neutral and course-aligned.

## Mobile and live QA

Chrome smoke checks passed on the deployed site for the homepage, Practice Hub,
and direct HVP curated route. The curated route rendered its status panel,
practice-length controls, targeted/custom/written practice controls, and the
existing in-progress resume state. The live console log was empty.

The mobile navigation correction is included in the production CSS: the header
wraps at narrow widths, Home/Practice/Progress occupy a full-width second row,
and each control has a 44px touch target. Desktop inspection showed no document
horizontal overflow. The same responsive rules are covered by the release
build and source checks.

## Preserved identities and flags

The following canonical question-bank identities remain unchanged:

- Aqueous: `97c1bc76cbae20681b1c4494bb7d35d282420f8c03a9181927720e024ae9dccb`
- HVP: `029dc39ff103a836445a86bb352513b231e51d266d4b2fade3f00527d00ef89a`
- Tissue: `500454bab37a5846ed46efd442149c105cbaf6ea5c9dd270ba3605170a2d9c08`
- Ocular: `fe96d664bdad67b40a4711332612e59e26a2b5a2c3844aae279dc71f662ecb9f`
- Blood: `1ce2628c3c74ac124b7034d7c34efba63a10dc4d6dcaab079e5eed73a01ccf8d`
- Environmental: `cd453b8dd2f691db44bc93eb550f290d0c7213e44f16dc1913e5d75559b99385`
- Pharmacology: `7f8c0d7915bccd3c3ffcf2ac96bc44758366928198ec55e68ee5e5c55d43e143`
- Systemic: `06ed91a7323147e8eb9ce1fe6d4813209d986d0b4e4664d55136a012d544b379`

Production was built with the full-curated public profile. The committed
assessment pilot flag remains disabled. The local `.env.local` used for the
release build is ignored and untracked; it is not part of the repository.

No later PR work was started. No learner data was sent to a server, and no
additional deployment occurred after the successful Sites deployment above.
