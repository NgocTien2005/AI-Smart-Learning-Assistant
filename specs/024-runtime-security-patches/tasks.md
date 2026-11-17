# Tasks: Runtime advisory patches

## Setup
- [x] T001 P1 Complete primary-source compatibility review and read-only analysis of specs/024-runtime-security-patches; FR001-005 mapped, reviewed checklist before code.

## US1 - patched installation
- [x] T002 [US1] P0 Update backend/package.json and package-lock.json only for targeted patched direct/transitive versions; depends T001; FR001; inspect lock diff for unrelated direct changes, npm ci, npm audit --omit=dev0 or explicit residual blocker. No force/overrides/schema changes.

## US2 - compatibility and release
- [x] T003 [US2] P0 Verify actual parser/document/auth/upload/email adapter/quiz via backend/test and scripts/ci/test after update, review obsolete PDF option against tagged6 API; fix reproduced malformed-gzip500 in backend/src/app.js with narrow safe400 mapping and regression in backend/test/requestBoundary.test.js/backend/scripts/integration-check.mjs; depends T002; FR002/003; deliver passing production regressions with no guard loss, no real email/model call.
- [x] T004 [US2] P0 Rebuild Node24 images and run verified fresh isolated HTTP/database/upload/PDF/quiz suite using scripts/ci/integration.mjs; depends T002/T003 and healthy Docker; FR004; keep open if unavailable, no shared DB/volume or local8081 change.
- [x] T005 P1 Update docs/release-status-20261117.md, docs/deploy-vps.md and specs/024-runtime-security-patches/verification.md with before/after audit, versions, tests, read-only analyze/append-only converge, local commits and exact remote/runtime limits; depends T002/T003; FR005/SC001-003; never present unrun T004 as pass.

## Dependencies

T001 -> T002 -> T003 -> T004/T005. Sequential work; no parallel source changes, plan research reviewer only. No duplicate008/021/023 blockers. A patched lockfile plus unit tests is not permission to public deploy without rebuilt image/integration acceptance.
