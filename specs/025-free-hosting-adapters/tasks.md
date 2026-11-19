# Tasks: Free hosting adapters

## Setup and foundation
- [x] T001 P1 Review requirements/checklists/research and perform read-only analyze; files specs/025-free-hosting-adapters/*; FR001-006; deliver complete mapped artifacts with no critical issue before implementation.
- [x] T002 P0 [US1] Add backend/test/freeHosting.test.js storage contract tests and injectable production lesson router auth/cleanup regressions; FR001-003/006, SC001; missing implementation must fail first, then pass with local/remote compatibility and zero IO for denied actors.

## US1 - Private durable documents
- [x] T003 P0 [US1] Implement backend/src/services/documentStorage.js and wire courseDocuments.js/lessons.js; depends T002; FR001-003; bounded private REST/local adapter, opaque references, protected download/reprocess/removal, conflict/uncertain commit safety. Verify contract/router tests and unchanged API.

## US2 - HTTPS recovery
- [x] T004 P0 [US2] Add backend/test/recoveryEmail.test.js and backend/src/services/recoveryEmail.js, select in email.js; depends T001; FR004/006, SC002; prove exact single HTTPS call, missing config, timeout/rejection/oversize/redaction and SMTP default, existing forgot/reset/session regression. No real send.

## US3 - Free deploy
- [x] T005 P1 [US3] Write docs/deploy-free.md and deploy/free.env.example, link README; add optional MIGRATION_DATABASE_URL in backend/prisma.config.ts for CLI-vs-pg strict TLS compatibility, validate/generate with synthetic target; provide guarded backend/scripts/bootstrap-free-admin.mjs/utils/freeDeployTarget.js and tests; depends T003/T004; FR005/SC003; exact Render static/Docker/Supabase/Brevo private setup, admin without paid shell, quotas/sender approval, no old data copy, staging/backup checklist and valid links.

## Verification and handoff
- [x] T006 P0 Run backend npm test/quiz, isolated HTTP/database integration plus bounded transport/router tests, validate docs/diff and record specs/025-free-hosting-adapters/verification.md/evidence; depends T003-T005; FR006/SC001-003; commands/cwd/exit, actual target identity/cleanup and no secret.
- [x] T007 P1 Read-only final analyze and append-only converge; update tasks/evidence, small local commits and source archive; depends T006; FR005-006; distinguish all external gates, no false hosted/provider pass.
- [ ] T008 P1 [US3] Operator real free-provider acceptance: private bucket survives backend redeploy, revoked access denied, actual permitted mailbox/reset/new login/old session/used link, HTTPS frontend/backend and exact hosted CI; depends T005/T006 and privately configured accounts/secrets/new send recipient+budget. Keep OPEN without those prerequisites; no external deployment or send delegated by local tests.

## Dependencies and delivery
T001 -> T002 -> T003; T001 -> T004; T003/T004 -> T005 -> T006 -> T007. T008 external acceptance is independently blocked, no duplicate historical008/021/023 blockers. Storage and sender files can be worked independently but source edits performed sequentially. MVP: explicit adapters and preserved contracts; no billing or environment migration. Each checkbox needs referenced verification evidence and coherent commit accounting.
