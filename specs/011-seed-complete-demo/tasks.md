# Tasks: Complete demo dataset

**Input**: spec/plan/research/data-model/contracts/quickstart. Required safety/content/HTTP tests per FR-001–011.

## Phase 1: Setup

- [x] T001 Capture baseline/runtime/001–010 evidence review in verification.md, preserving008/010 blockers and pending AI consent (FR-010/011).
- [x] T002 Separately review checklists/safety.md under user permission, analyze artifacts read-only and record coverage in verification.md (FR-001–011).

## Phase 2: Foundation

- [x] T003 Add `DemoSeedDataset` id String primary key, version Int, manifest Json without credentials, createdAt default now to backend/prisma/schema.prisma; generate/review a new additive migration only (FR-003/004).
- [x] T004 Write failing target/ownership/content safety tests in backend/test/demoSeed.test.js before implementing their modules (FR-001–004/009/010).

## Phase 3: US1 — safe target and create-only seed (P1)

Independent test: read-only preview; correct target apply; mismatch/production/collision/8081 denial; rerun unchanged.

- [x] T005 [US1] Implement backend/scripts/demo-seed/target.mjs with explicit project/API/local daemon/container/network/volume/actual DB guards and dev marker in compose.dev.yaml/compose.acceptance.yaml (FR-001/002).
- [x] T006 [US1] Implement backend/scripts/demo-seed/seed.mjs and worker.mjs with durable manifest, bounded stdin, collision denial, atomic rows, exclusive fresh files and no update/upsert/reset/cleanup path (FR-003/004/011).
- [x] T007 [US1] Replace backend/scripts/seed-demo.mjs host entry with explicit dry-run/apply/private-console/isolated acceptance modes, bounded safe public reporting and sanitized nonzero failures (FR-001/002/009/011).

## Phase 4: US2 — complete useful dataset (P1)

Independent test: dataset meets counts and source/lifecycle contracts; mounted APIs enforce normal three-role/owner/enrollment behavior.

- [x] T008 [US2] Author backend/scripts/demo-seed/dataset.mjs with18users,8courses×6meaningful Vietnamese lessons, assignments and varied enrollment/progress/grading/quiz/prepared-chat states (FR-005–008).
- [x] T009 [US2] Add original HTML/PDF handouts in backend/scripts/demo-seed/documents/; generate readable text-layer PDFs and validate PDF/TXT/MD/CSV processing with current source metadata in backend/test/demoSeed.test.js (FR-006/007).
- [x] T010 [US2] Implement backend/scripts/demo-seed/verify.mjs in-memory credential HTTP matrix covering all roles, own/enrolled content, cross-owner/unenrolled/document/quiz denials and correct graded/draft states (FR-007/008).
- [x] T011 [US2] Add scripts/ci/seed-integration.mjs to exercise dry-run/apply/rerun/collision/sentinel preservation on fresh isolated stack, actual DB identity/migration/status and exact owned test cleanup (FR-001–008/011).

## Phase 5: US3 — private access (P2)

Independent test: initial generated access appears only in a dedicated private local TTY; public summaries contain no credentials, rerun does not reissue.

- [x] T012 [US3] Add scripts/start-demo-seed.ps1 private console launcher, TTY guard and no credential file/transcript path; document access lifetime without automatic resets (FR-009/010).
- [x] T013 [US3] Update docs/demo-data.md and README with explicit commands, source inventory, rerun/conflict/cleanup semantics and no external sends (FR-009–011).

## Phase 6: Verify and handoff

- [x] T014 Run backend full/quiz tests, Prisma validate/generate, isolated image build/healthy/migration status, existing HTTP integration and seed acceptance; record command/cwd/exit in verification.md (SC-001–004).
- [x] T015 Refresh only verified dev8080 backend after checks, dry-run then apply via private console; verify counts/preexisting preservation and role browser read flows at1280×800/1440×900 without secret capture (FR-001/005–011, SC-001/003).
- [x] T016 Complete verification.md/traceability.md, final read-only analyze and append-only converge, then scoped commits/normal push and actual hosted outcomes (FR-011, SC-004).

## Dependencies & implementation strategy

T001→T002→T003/004; T005→T006→T007. T008/009 provide validated dataset before T006 writes; T010 depends on T006/008/009. T011 depends on seed/verify/guards. T012/013 follow CLI. T014 precedes T015; T016 reports all results. Independent documents/tests can proceed in parallel after their prerequisite contracts; no parallel agents required. MVP first is safe preview/guard plus create-only transaction, then rich content/private operator access, then real default-target seed. No deployment/PR/merge checkpoint authorized.
