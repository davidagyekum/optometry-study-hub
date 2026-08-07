# All-course-content production release checklist

## Source and content

- [ ] Exact clean merged `main` commit and tree recorded.
- [ ] 680 established curated questions, 400 OPT 370 draft questions, 160 HVP Depth + Colour draft questions and 400 frozen legacy compatibility questions verified.
- [ ] All eight established canonical bank hashes, five OPT 370 bank hashes, three HVP bank hashes and all draft statuses verified.
- [ ] Original Aqueous 36-object and nine-pilot identities preserved.
- [ ] StoreV2, rollback key, legacy scores and question history unchanged.
- [ ] `.env.example` keeps every controlled-experience flag false, including all five OPT 370 flags.

## Build and audit

- [ ] `npm ci`, `npm run check` and `npm run release:verify` pass.
- [ ] Every historical profile and the all-content production profile build and audit.
- [ ] `all-course-content-public` enables exactly eight established curated, five OPT 370 and two HVP extension experiences, while disabling the engineering pilot.
- [ ] Initial/server closures contain no answer identity.
- [ ] Each module keeps distinct lazy practice and progress closures; shared chunks count once.
- [ ] Release metadata binds exact commit, tree, flags, output directory and fingerprint.
- [ ] Manifest SHA-256 and deterministic identity recorded.
- [ ] Browser matrix at 360x800, 768x1024, 1280x800 and 1440x900 passes with zero new console errors, broken images or overflow.

## Publish

- [ ] Existing Sites project and public URL confirmed.
- [ ] Current Sites version/deployment recorded as rollback target.
- [ ] No D1 or R2 binding.
- [ ] Exact source archive saved as a new Sites version.
- [ ] Only that saved version deployed.
- [ ] Deployment reaches terminal success.

## Production

- [ ] All six course pages and 15 study routes work; all 15 intended controlled experiences are visible; HVP lists three modules and Dispensing Optics II lists five.
- [ ] Curated practice is primary; legacy archive/history remains available.
- [ ] Aqueous engineering pilot is unavailable.
- [ ] Written Practice is `Not scored`.
- [ ] Persistence, result review, reset isolation and direct refresh pass.
- [ ] Security headers, static images, device layouts and accessibility pass.
- [ ] Deployment identity matches the reviewed manifest.
- [ ] Final migration handoff is committed on clean `main`.