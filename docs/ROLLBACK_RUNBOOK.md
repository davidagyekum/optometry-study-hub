# Rollback runbook

Rollback requires authorization from the release owner or designated review
chair. Capture the triggering evidence, affected release commit, Sites version,
manifest checksum, authorizer, operator, and timestamps before and after the
rollback. Open a follow-up issue for every rollback.

## Level 1: feature rollback

Use the same reviewed release commit and rebuild it with:

```text
NEXT_PUBLIC_ENABLE_ASSESSMENT_PILOT=false
NEXT_PUBLIC_ENABLE_HVP_CURATED_PRACTICE=false
NEXT_PUBLIC_ENABLE_HVP_DEPTH_COLOUR_EXPANSION=false
# Keep every established curated and OPT 370 release flag false
```

Run the disabled release build and audit, generate evidence for that exact
clean commit, save a new Sites version, and deploy it only with rollback
authorization.

This hides every controlled practice experience without deleting StoreV2 attempts, results, or
question history. It preserves all legacy data and requires no storage
migration, so a later reviewed build can re-enable HVP and recover compatible
device-local records.

## Level 2: code rollback

Republish the exact previously recorded production source commit and Sites
version. For the August 2026 all-content release, the recorded rollback candidate is Sites version 10 at commit `051790b10e865db126094ee47c3e9ece1247abeb`. Always use the exact version and deployment IDs captured immediately before the production change, and restore its recorded environment matrix before redeploying it.

- Do not clear browser storage or delete StoreV2.
- Do not run database rollback procedures; the application has no database.
- Verify the older build ignores compatible newer assessment fields without
  rewriting them.
- Record any forward-only compatibility risk honestly. If the older release
  cannot safely read or ignore a saved record, stop and seek a reviewed
  compatibility fix instead of deleting learner data.
- Repeat the production Home, notes, legacy quiz, direct-route, persistence,
  console, network, mobile, accessibility, and security smoke checks.

## Evidence and follow-up

The incident record must include:

- original and replacement commit SHAs and Sites version IDs;
- release and rollback manifest checksums;
- reason and observable impact;
- authorizer and operator;
- decision, start, completion, and verification timestamps;
- Chrome screenshots/logs and production response checks;
- confirmation that no device-local data was intentionally cleared;
- a linked corrective-action issue and criteria for any re-release.
