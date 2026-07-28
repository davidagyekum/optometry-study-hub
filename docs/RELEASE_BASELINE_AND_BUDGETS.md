# Release baseline and performance budgets

## Measurement boundary

The corrected release baseline was measured from the untouched PR 11 `main`
tree at `e8b9810ff6f2898c9bc85d37da72f069ee049115` with the bundled Node.js 24
runtime on Windows. Both declared release profiles were built from that exact
tree. The algorithm follows both HVP dynamic boundaries instead of treating
Home, Practice, and Progress as the same closure.

| Metric | Disabled | HVP public beta |
|---|---:|---:|
| Total output | 6,490,558 bytes | 6,490,556 bytes |
| Client JavaScript | 959,311 bytes | 959,310 bytes |
| Initial Home JavaScript | 529,995 bytes | 529,994 bytes |
| Disabled Practice Hub JavaScript | 529,995 bytes | 529,994 bytes |
| Disabled Progress Hub JavaScript | 529,995 bytes | 529,994 bytes |
| HVP-enabled Practice Hub JavaScript, including analytics | 816,876 bytes | 816,875 bytes |
| HVP-enabled Progress Hub JavaScript, including analytics | 816,876 bytes | 816,875 bytes |
| Incremental controlled HVP JavaScript | 376,558 bytes | 376,558 bytes |
| Incremental HVP analytics JavaScript | 286,881 bytes | 286,881 bytes |
| Combined incremental HVP JavaScript | 398,751 bytes | 398,751 bytes |
| Largest emitted asset | 632,350 bytes | 632,350 bytes |
| Output files | 111 | 111 |
| Observed build duration | 6,822 ms | 5,940 ms |

The initial learner closure contains the browser entry, `StudyApp`, and their
static imports. The controlled closure begins at `HvpPracticeRouter`; the
analytics closure begins at `HvpProgressPanel`. Incremental sizes subtract the
initial closure, and the combined HVP size uses a set union so shared chunks
are counted once.

Disabled Practice and Progress route measurements exclude the analytics
dynamic closure. HVP-enabled Practice and Progress include that analytics
closure. Controlled-practice size independently includes the practice router.

## Enforced budgets

`lib/release/budgets.ts` applies approximately ten per cent headroom to every
measured byte metric. `npm run release:audit` fails if either profile exceeds a
ceiling.

The audit also requires both HVP entries to remain dynamic and outside the
initial learner closure. It scans multiple authored-content and answer-identity
markers across distinct sections and formats, without printing those markers
in release reports. Initial JavaScript must contain no HVP authored or answer
content and no hidden Aqueous content. Both HVP closures must contain their
expected HVP content while excluding hidden Aqueous content.

Build duration is recorded in source-bound metadata and the release manifest
but is not a hard budget because local and hosted-runner I/O varies
substantially. Any material duration change must still be investigated before
publishing.

## Changing a budget

A budget change requires a reviewed explanation, a fresh baseline from an
identified clean commit, both release-profile builds, and evidence that the
change does not expose answer content or weaken import isolation. Never raise a
budget only to make a failing build pass.

## PR 12 corrected release-candidate measurements

The clean-tree dual audit after the review corrections produced:

| Metric | Disabled | HVP public beta |
|---|---:|---:|
| Total output | 6,492,574 bytes | 6,492,572 bytes |
| Client JavaScript | 962,237 bytes | 962,236 bytes |
| Initial Home JavaScript | 533,011 bytes | 533,010 bytes |
| Disabled Practice Hub JavaScript | 533,011 bytes | 533,010 bytes |
| Disabled Progress Hub JavaScript | 533,011 bytes | 533,010 bytes |
| HVP-enabled Practice Hub JavaScript, including analytics | 819,972 bytes | 819,971 bytes |
| HVP-enabled Progress Hub JavaScript, including analytics | 819,972 bytes | 819,971 bytes |
| Incremental controlled HVP JavaScript | 376,388 bytes | 376,388 bytes |
| Incremental HVP analytics JavaScript | 286,961 bytes | 286,961 bytes |
| Combined incremental HVP JavaScript | 398,661 bytes | 398,661 bytes |
| Largest emitted asset | 628,981 bytes | 628,981 bytes |
| Output files | 111 | 111 |
| Observed build duration | 6,263 ms | 5,957 ms |

Every byte metric remains below its corrected ceiling. The generated metadata,
audits, and manifest bound these outputs to the exact clean correction commit.
Final evidence is regenerated from scratch by `release:verify` on the final
branch head.
