# Tasks: Automated Lumina quality checks

17FR /14AC /8SC. No old feature task transferred; no application/backend/schema implementation.

## Phase 1 — Setup

- [x] T001 Record baseline, official009 resolver, old tasks and preserved source in specs/009-setup-quality-ci/research.md and verification.md. FR-015/017;US1-AC5,US3-AC4;SC-007. Verify baseline.json. Depends:none.
- [x] T002 Record official sources/action SHA pins, command contracts and safe test/cleanup targets in specs/009-setup-quality-ci/research.md and plan.md. FR-004/006/010/014;US1-AC5,US2-AC2/5;SC-003/005. Depends:T001.

## Phase 2 — Foundation

- [x] T003 Add initially failing safety/outcome tests in scripts/ci/test/ci.test.mjs for dependency skip, failed-check retention, safe evidence and project identity. FR-005/007/011/016;US1-AC2/3,US2-AC3/4,US3-AC2;SC-003/005/006. Depends:T002.
- [x] T004 Implement scripts/ci/common.mjs command execution/deadlines/npm resolution and explicit evidence mapping; add only ci-results/ to .gitignore. FR-004/005/010/011/012/017;US1-AC5,US3-AC1/2;SC-005/006. Verify T003 cases. Depends:T003.

## Phase 3 — US1 Required checks

- [x] T005 [US1] Implement fixed frontend/backend command groups in scripts/ci/check-package.mjs with npm ci, full suites, lint/build and quiz/helper regression; preserve failed full suites. FR-002/003/004/005/016;US1-AC2–5;SC-002/006. Depends:T004.
- [x] T006 [US1] Add .github/workflows/ci.yml PR/push/manual triggers, three independent bounded jobs, Node24/pinned actions/read-only token and lockfile caches. FR-001/004/005/012;US1-AC1/4/5;SC-001/005. Verify actionlint and structural review. Depends:T005.
- [x] T007 [US1] Execute package helpers with clean npm ci and record frontend full/lint/build and backend full/quiz/helper results in specs/009-setup-quality-ci/verification.md. FR-002/003/016;US1-AC2/3;SC-002/006. Preserve all failures. Depends:T005.

## Phase 4 — US2 Safe integration

- [x] T008 [US2] Add safety tests in scripts/ci/test/ci.test.mjs for fresh-project gates, unsafe/occupied ports, secret exclusions, missing evidence, primary+cleanup failure and no cleanup of refused targets. FR-006–010/016;US2-AC1–5;SC-003/004/006. Depends:T004.
- [x] T009 [US2] Implement scripts/ci/integration.mjs fresh project/port/runtime secrets, empty env, bounded Compose startup, actual integration-target guard, production suite and allowlisted export. FR-006/007/008/010/011;US2-AC1/2/3/5,US3-AC2;SC-003/005. Depends:T008.
- [x] T010 [US2] Implement owned finally shutdown and dual-failure reporting in scripts/ci/integration.mjs; never down -v or reuse old resources. FR-005/009;US2-AC4/5;SC-004/006. Depends:T009.
- [x] T011 [US2] Run real fresh isolated production integration through scripts/ci/integration.mjs, capture actual DB/HTTP/IDs, cleanup0 and unchanged old stack mounts in specs/009-setup-quality-ci/verification.md. FR-006–010/016;US2-AC1–5;SC-003/004/006. Depends:T010.

## Phase 5 — US3 Evidence and operation

- [x] T012 [US3] Configure exact safe artifact paths/seven-day retention/failure upload in .github/workflows/ci.yml and document field allowlists in docs/continuous-integration.md. FR-011/012;US3-AC1/2;SC-005. Depends:T006,T010.
- [x] T013 [US3] Add README.md CI guidance and docs/continuous-integration.md local/hosted instructions, limits and retained-volume behavior. FR-013/014/015;US3-AC3/4;SC-007/008. Depends:T012.
- [x] T014 [US3] Review prepared ignored SMTP launcher and readiness; record actual conditions under008 verification only when changed, retaining its T023/T026. Record the separate status in specs/009-setup-quality-ci/verification.md. FR-014/015/017;US3-AC4;SC-007. No mail without config/recipient/send scope, no blocked-profile retry. Depends:T002.
- [x] T015 [US3] Validate workflow/action pins and source-filtered Linux Node24 package execution when available; record command/cwd/exit and matching source in specs/009-setup-quality-ci/verification.md. FR-004/016;US1-AC5,US3-AC1/3;SC-002/005. Depends:T007,T012.

## Phase 6 — Final verification

- [x] T016 Record every FR/US-AC/SC→task→typed evidence/status in specs/009-setup-quality-ci/traceability.csv and verification.md; freeze checklist markers and audit preserved001–008/application/lockfiles. FR-011/014/015/017;US3-AC1–4;SC-007. Depends:T011,T013,T014,T015.
- [x] T017 Run managed analyze read-only and converge append-only for009; record findings/unchanged tasks or append work in specs/009-setup-quality-ci/verification.md. FR-016/017;US3-AC3/4;SC-007. Do not duplicate external blockers. Depends:T016.
- [ ] T018 Verify the first actual GitHub-hosted run of .github/workflows/ci.yml for the delivered revision and all three groups; record run URL/SHA/job outcomes in specs/009-setup-quality-ci/verification.md. FR-013;US1-AC1,US3-AC3;SC-001/008. EXTERNAL:requires later authorized publication/execution; no push in this task. Depends:T017.

## Dependencies and delivery

Setup→foundation→US1 and US2→US3→final verification. US1 offers package gates independently; US2 adds verified production HTTP; US3 makes evidence and limits reviewable. T014 can proceed after setup independently of CI implementation. T018 stays open until a real hosted run.

Parallel examples:after T004, package execution T007 and isolated guard-test design T008 can be independent; after T010, source/documentation T013 and real integration T011 can be independent. Shared helper/test files are edited sequentially; no further agent delegation is required. MVP is US1, followed by real US2 and typed US3 proof, never replacing production checks with mock success.
