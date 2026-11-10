# Tasks: Safe operation foundations

## Setup and foundations
- [x] T001 [P1] Review official logging/header/recovery contracts and requirements (research.md, checklists/); deps none; deliverable reviewed bounded plan; AC FR001?004 have testable acceptance; verify read-only analyze.

## US1 ? privacy and response defaults
- [x] T002 [P1] [US1] Configure frontend/nginx.conf and compose.yaml/compose.acceptance.yaml safe summaries, headers and rotation; deps T001; deliverable bounded configuration; AC FR001/002 and SC001; verify real nginx/header/canary/LogConfig probes.

## US2 ? recovery rehearsal
- [x] T003 [P1] [US2] Add scripts/ci/operations-check.mjs and scripts/ci/test/operations.test.mjs, invoke from integration.mjs; deps T002; deliverable guarded synthetic recovery; AC FR003/SC002; verify denial tests and actual fresh-stack restore/database/file digest match, failure propagation, scoped cleanup.

## US3 ? operations guidance
- [x] T004 [P2] [US3] Write docs/operations.md and link docs/production-readiness.md; deps T001; deliverable release/backup/rollback/monitoring guide; AC FR004/SC003; verify commands, links, no public-readiness claim.

## Cross-cutting delivery
- [x] T005 [P1] Record verification.md/evidence/traceability, small commits and feature PR; deps T002?004; deliverable local command/cwd/exit and exact hosted CI evidence; AC all declared checks pass and retained resources/open production gates explicit; verify diff, read-only analyze and append-only converge.

Dependencies: T001?T002?T003?T005; T004 can follow T001 independently. Sequential implementation; no additional worker needed. MVP is US1, then recovery and guide. Checklist review is separate from implementation; tasks close only with evidence.
