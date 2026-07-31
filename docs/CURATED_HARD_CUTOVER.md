# Curated hard cutover

The production learner path has 680 active curated questions across eight
modules. Curated practice is the only assessment from which a learner can
start a new session.

## Learner routes

- Course cards, study pages, the Practice Hub and Progress Hub direct new work
  to the registered curated experience.
- `/quiz/:moduleId` resumes an already stored previous attempt. Without one, it
  shows a retired-path explanation and cannot create an attempt.
- `/results/:moduleId` retains exact historical answer review. Without a saved
  result, it links to curated practice and cannot start a legacy quiz.
- `/legacy` and `/legacy/:moduleId` are read-only **Previous quiz history**
  routes. They expose resume only for a stored active attempt and review only
  for retained results.
- Restart, retake and new-legacy-start actions are absent from learner UI and
  recommendation logic.

## Compatibility and data

Previous active legacy attempts and historical results remain readable. Their
scores are displayed only as previous evidence and are never combined with
curated percentages.

No storage migration accompanies this cutover:

- StoreV2 remains `optometry-study-hub:v2`, schema version 2.
- The rollback key remains `opt376-study-state:v1`.
- Curated attempts, results and `questionHistory` are unchanged.
- Previous attempts and results are neither rewritten nor deleted when their
  routes are opened.
- The frozen legacy generator remains in the repository solely to render
  already stored attempts and historical answer review.

## Learner status copy

Curated surfaces use a compact neutral status:

> Course-aligned practice  
> Built from the supplied course materials.  
> Progress is stored on this device.

Internal question and objective review statuses remain `draft`. The neutral
learner copy does not claim lecturer, expert or examination approval.

## Mobile navigation

At phone widths the header uses intrinsic height and a dedicated second row for
Home, Practice and Progress. This prevents the primary navigation from being
clipped when the brand and navigation wrap.
\n