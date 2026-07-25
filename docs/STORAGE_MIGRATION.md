# Browser Storage Migration

## Keys

- Legacy V1 key: `opt376-study-state:v1`
- Current V2 key: `optometry-study-hub:v2`

Both records remain local to the current browser and device. No account, backend, analytics service, or cross-device synchronization is introduced.

## Version-1 shape

V1 contains:

- `version: 1`;
- reading progress in `read`;
- unfinished legacy attempts in `active`;
- submitted legacy results in `results`.

The V1 key is retained after migration so the previous application can be restored if rollback is required.

## Version-2 shape

V2 preserves `read`, `active`, and `results` at the top level so the current production UI can continue using the legacy selectors and quiz engine.

It adds:

```text
assessment.activeAttempts
assessment.results
assessment.questionHistory
```

These maps are empty in PR 3. Future assessment attempts will persist question IDs, question versions, stable response IDs, ordering, flags, and the current index. Entire question objects are not stored.

V2 validates semantic consistency as well as shape: question orders are non-empty and unique, version maps cover them exactly, responses and flags cannot refer outside a snapshot, indices stay in range, timestamps are ISO datetimes, persisted assessment identifiers use stable syntax, response arrays are unique, result scores do not exceed numeric maxima, and correct history counts do not exceed attempt counts.

## Load and migration algorithm

1. Resolve browser storage inside a guarded operation.
2. Read the V2 key first.
3. If V2 exists and validates, return it.
4. If V2 exists but is malformed or has the wrong version, report a development diagnostic, return an empty valid V2 store, and leave the raw V2 value untouched.
5. Only when V2 is absent, read V1.
6. If V1 validates, copy `read`, `active`, and `results` exactly.
7. Initialize the three assessment maps as empty.
8. Save the migrated record under the V2 key.
9. Leave the V1 key unchanged.
10. If persistence fails, continue with the valid in-memory result and report a development diagnostic.

The pure `migrateV1ToV2` function does not access browser APIs and is unit-tested independently.

## Corruption handling

Malformed JSON, wrong versions, invalid persisted shapes, blocked storage, and throwing `getItem` or `setItem` calls do not crash the application.

Corrupt values are not removed or silently overwritten. Initial hook hydration is explicitly clean, so assigning the loaded in-memory fallback does not auto-save over malformed V1 or V2 bytes. A valid V2 record also loads without an unnecessary rewrite. Development builds report a structured diagnostic code. Production continues with an empty valid V2 store for the current session, and later learner-originated changes continue to save normally.

## Reset behavior

Ordinary migration retains V1 unchanged for rollback protection.

The visible global reset action is the explicit exception: `resetAllStudyData` writes a valid empty V1 record and a valid empty V2 record. This clears both storage generations so a later application rollback cannot restore pre-reset study data. Module and course resets keep their existing scoped behavior.

## Future migrations

Every future storage change must:

- use a new version and explicit key or migration boundary;
- validate before use;
- migrate through a pure function;
- preserve enough identifiers and versions to interpret historical results;
- avoid deleting the previous record during the rollout;
- test absence, valid prior data, malformed data, unavailable storage, and round trips;
- distinguish clean hydration from learner-originated dirty updates;
- document rollback and privacy impact.

## Privacy implications

V2 remains device-local. It stores study behavior and future question history in the browser only. Clearing browser/site data removes access. The migration does not transmit data, add student names, or create a shared record.
