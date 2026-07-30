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

## PR 13 curated-adapter boundary update

PR 13 keeps the PR 11 byte baselines for unchanged release surfaces and
remeasures the three lazy-boundary metrics affected by the new generic curated
practice and progress adapters. The clean implementation commit
`6b0f085615f6a930410f4cfdbd26a123069cc3d3` produced 422,877 bytes for the
controlled-practice increment, 332,888 bytes for the analytics increment, and
445,310 bytes for their de-duplicated union in the disabled profile. The HVP
public-beta profile is verified against the same boundaries.

The increase is attributable to reusable routing, fail-closed registry
resolution, generic progress composition, and lazy-adapter error handling.
Answer-bearing HVP modules remain outside the initial learner closure, hidden
Aqueous content remains excluded, and the standard ten-per-cent headroom still
applies.

## PR 14 Tissue Foundations profile baselines

The clean implementation commit
`253843835bd6b1666f8faa84ccf9eab365d30444` added the default-disabled Tissue
Foundations curated experience and two preview profiles. The source-bound
release verifier measured all four profiles:

| Metric | Disabled | HVP only | Tissue only | HVP + Tissue |
|---|---:|---:|---:|---:|
| Total output | 6,985,404 | 6,985,402 | 6,985,402 | 6,985,400 |
| Client JavaScript | 1,168,274 | 1,168,273 | 1,168,273 | 1,168,272 |
| Initial Home JavaScript | 498,756 | 498,755 | 498,755 | 498,754 |
| Disabled Practice Hub JavaScript | 498,756 | 498,755 | 498,755 | 498,754 |
| Disabled Progress Hub JavaScript | 498,756 | 498,755 | 498,755 | 498,754 |
| Enabled Practice Hub JavaScript | 844,170 | 844,169 | 844,169 | 844,168 |
| Enabled Progress Hub JavaScript | 844,170 | 844,169 | 844,169 | 844,168 |
| Incremental controlled practice JavaScript | 425,531 | 425,531 | 425,531 | 425,531 |
| Incremental analytics JavaScript | 345,414 | 345,414 | 345,414 | 345,414 |
| Combined incremental curated JavaScript | 447,721 | 447,721 | 447,721 | 447,721 |
| Largest emitted asset | 629,617 | 629,617 | 629,617 | 629,617 |
| Output files | 133 | 133 | 133 | 133 |
| Observed build duration | 8,482 ms | 8,997 ms | 8,622 ms | 8,641 ms |

The metric property names retain their historical HVP wording for manifest
compatibility, but the release audit resolves both registered curated
experiences. It proves that each practice and progress entry remains lazy,
neither bank appears in the initial learner closure, each enabled closure
contains its own authored and answer markers, and HVP and Tissue markers remain
isolated from one another. The standard ten-per-cent byte headroom is derived
from these measurements; duration remains observational.
## Ocular Adnexa checkpoint evidence

The Ocular Adnexa bank contains 80 draft questions, 18 draft objectives, eight registered sources and five original SVGs. Its SHA-256 is `fe96d664bdad67b40a4711332612e59e26a2b5a2c3844aae279dc71f662ecb9f`. The focused checkpoint passed disabled and Ocular-enabled production builds; the committed release profiles still keep the new feature false and no deployment is authorized here.

The clean implementation commit `c842b199af97e77d81d2541184519051e507dd5c`
also remeasured the four existing release profiles after adding the Ocular
practice and progress chunks:

| Metric | Disabled | HVP only | Tissue only | HVP + Tissue |
|---|---:|---:|---:|---:|
| Total output | 7,343,926 | 7,343,924 | 7,343,924 | 7,343,922 |
| Client JavaScript | 1,319,742 | 1,319,741 | 1,319,741 | 1,319,740 |
| Initial Home JavaScript | 500,681 | 500,680 | 500,680 | 500,679 |
| Disabled Practice Hub JavaScript | 500,681 | 500,680 | 500,680 | 500,679 |
| Disabled Progress Hub JavaScript | 500,681 | 500,680 | 500,680 | 500,679 |
| Enabled Practice Hub JavaScript | 848,396 | 848,395 | 848,395 | 848,394 |
| Enabled Progress Hub JavaScript | 848,396 | 848,395 | 848,395 | 848,394 |
| Incremental controlled practice JavaScript | 427,832 | 427,832 | 427,832 | 427,832 |
| Incremental analytics JavaScript | 347,715 | 347,715 | 347,715 | 347,715 |
| Combined incremental curated JavaScript | 450,022 | 450,022 | 450,022 | 450,022 |
| Largest emitted asset | 630,171 | 630,171 | 630,171 | 630,171 |
| Output files | 146 | 146 | 146 | 146 |
| Observed build duration | 8,102 ms | 8,515 ms | 8,233 ms | 8,325 ms |

The increase in total emitted client JavaScript is the new answer-bearing
Ocular dynamic closure. Registry-driven audits prove that its practice and
progress entries remain outside the initial learner closure, that the initial
and server entries contain no Ocular answer markers, and that HVP, Tissue,
Ocular and hidden Aqueous content remain isolated. These measured values—not a
waiver—form the next standard ten-per-cent ceilings.

## Blood Supply checkpoint baselines

The clean Blood Supply implementation commit
`b79cb795261f4354c43528f5f13045e758a4587f` was measured after both the full
Aqueous/Vitreous and Blood Supply answer-isolated dynamic experiences were
registered. The inherited Ocular ceiling correctly failed on total client
JavaScript, while initial-route and per-experience closure checks continued to
pass. The four clean builds measured:

| Metric | Disabled | HVP only | Tissue only | HVP + Tissue |
|---|---:|---:|---:|---:|
| Total output | 7,996,819 | 7,996,817 | 7,996,817 | 7,996,815 |
| Client JavaScript | 1,596,037 | 1,596,036 | 1,596,036 | 1,596,035 |
| Initial Home JavaScript | 504,544 | 504,543 | 504,543 | 504,542 |
| Disabled Practice Hub JavaScript | 504,544 | 504,543 | 504,543 | 504,542 |
| Disabled Progress Hub JavaScript | 504,544 | 504,543 | 504,543 | 504,542 |
| Enabled Practice Hub JavaScript | 852,264 | 852,263 | 852,263 | 852,262 |
| Enabled Progress Hub JavaScript | 852,264 | 852,263 | 852,263 | 852,262 |
| Incremental controlled practice JavaScript | 427,837 | 427,837 | 427,837 | 427,837 |
| Incremental analytics JavaScript | 347,720 | 347,720 | 347,720 | 347,720 |
| Combined incremental curated JavaScript | 450,027 | 450,027 | 450,027 | 450,027 |
| Largest emitted asset | 630,806 | 630,806 | 630,806 | 630,806 |
| Output files | 165 | 165 | 165 | 165 |
| Observed build duration | 6,385 ms | 6,981 ms | 6,523 ms | 6,723 ms |

The total-client increase is attributable to the new lazy answer-bearing
Aqueous/Vitreous and Blood Supply practice/progress chunks. Initial learner
JavaScript increased by only 3,863 bytes from the Ocular baseline, and every
bank remained absent from the initial and server answer scans. These exact
measurements—not a waiver—replace the preceding baselines and receive the
standard ten-per-cent headroom.
