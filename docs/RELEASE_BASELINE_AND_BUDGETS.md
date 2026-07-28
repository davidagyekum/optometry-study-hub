# Release baseline and performance budgets

## Measurement boundary

The release baseline was measured from the untouched PR 11 `main` tree at
`e8b9810ff6f2898c9bc85d37da72f069ee049115` with the bundled Node.js 24
runtime on Windows. Both declared release profiles were built from the same
tree.

| Metric | Disabled | HVP public beta |
|---|---:|---:|
| Total output | 6,482,130 bytes | 6,482,128 bytes |
| Client JavaScript | 959,310 bytes | 959,310 bytes |
| Initial Home closure | 529,994 bytes | 529,994 bytes |
| Practice Hub closure | 529,994 bytes | 529,994 bytes |
| Progress Hub closure | 529,994 bytes | 529,994 bytes |
| Incremental lazy HVP closure | 376,558 bytes | 376,558 bytes |
| Largest emitted asset | 628,002 bytes | 628,002 bytes |
| Output files | 111 | 111 |
| Observed build duration | 6,822 ms | 5,940 ms |

The initial route measurements reflect the current shared application entry.
The HVP number is the incremental JavaScript reachable from its dynamic
boundary after excluding files already required by the initial entry.

## Enforced budgets

`lib/release/budgets.ts` applies ten per cent headroom to every measured byte
metric. `npm run release:audit` fails if either profile exceeds a ceiling. It
also confirms that authored HVP content remains in its lazy boundary and that
hidden Aqueous content does not enter the initial or HVP learner bundles.

Build duration is recorded in the manifest but is not a hard budget because
local and hosted-runner I/O varies substantially. Any material duration change
must still be investigated before publishing.

## Changing a budget

A budget change requires a reviewed explanation, a fresh baseline from an
identified clean commit, both release-profile builds, and evidence that the
change does not expose answer content or weaken import isolation. Never raise a
budget only to make a failing build pass.

## PR 12 final measured output

The final dual-build audit on bundled Node.js 24 produced:

| Metric | Disabled | HVP public beta |
|---|---:|---:|
| Total output | 6,492,574 bytes | 6,492,572 bytes |
| Client JavaScript | 962,237 bytes | 962,236 bytes |
| Initial Home closure | 533,011 bytes | 533,010 bytes |
| Practice Hub closure | 533,011 bytes | 533,010 bytes |
| Progress Hub closure | 533,011 bytes | 533,010 bytes |
| Incremental lazy HVP closure | 376,388 bytes | 376,388 bytes |
| Largest emitted asset | 628,981 bytes | 628,981 bytes |
| Output files | 111 | 111 |
| Observed build duration | 19,382 ms | 6,018 ms |

All byte metrics remain below the ten-per-cent ceilings. The first disabled
build followed a clean dependency reinstall and was I/O-cold; duration remains
observational.
