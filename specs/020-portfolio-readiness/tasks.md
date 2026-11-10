# Tasks: Portfolio readiness

## Setup/foundations
- [x] T001 P1 Review source/evidence and requirements in spec.md/plan.md/checklists; deps:none; deliverable bounded source-backed writing plan; AC FR001-003 clear; verify read-only analyze.
- [x] T002 P1 [US3] Verify combined portfolio/integration-review dependencies in docs/integration-review.md and evidence; deps:T001; deliverable no-regression reference base, explicit conflict resolution; AC FR003/SC003; verify full package checks, isolated HTTP/database/recovery, seed and real role browser matrix, Prisma validate, exact hosted run.

## US1 - architecture and onboarding
- [x] T003 P1 [US1] Update README.md, docs/portfolio-overview.md, docs/architecture.md; deps:T002; deliverable overview/stack/setup/ERD/auth/roles; AC FR001/SC001; verify source references, relative links, no placeholder or false capability.

## US2 - demonstration and interview
- [x] T004 P1 [US2] Write docs/interview-guide.md and docs/demo-script.md; deps:T002; deliverable three-role synthetic walkthrough and tradeoffs; AC FR002/SC002; verify existing browser/HTTP evidence and private credential/provider conditions.

## US3 - report/delivery
- [x] T005 P1 [US3] Write docs/portfolio-improvement-report.md plus verification.md, traceability/evidence, small commits and docs PR; deps:T003/T004; deliverable before/after/task/branch/commit/PR/result/retention matrix; AC FR003/SC003; verify links/diff, source/exact hosted outcomes, final read-only analyze and append-only converge.

Dependencies:T001 -> T002 -> {T003,T004} -> T005. Writing may be independent after baseline verification but execute serially. No new worker required. Original feature tasks/provider blockers remain owned by their features.
