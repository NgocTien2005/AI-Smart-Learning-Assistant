# Verification: Free hosting adapters

Date2026-11-18. Baseline d8716a8 clean captured in ignored artifacts; official allocator/resolver025-free-hosting-adapters. Branch feat/free-hosting-adapters explicitly depends on security/runtime-advisories, intended PR base that branch. No main edit, dependency upgrade, schema/migration change, remote infrastructure/account creation or paid billing. Existing production entry backend/server.js -> src/app.js; legacy backend/app.js untouched.

## Workflow and scope
Constitution reviewed; managed specify/clarify/plan/checklist/tasks/analyze/implement/verify/converge followed. No extension hooks file. Clarification coverage had no unresolved product decision; private provider account setup remains an acceptance prerequisite. Requirement checklists reviewed5/5 and3/3 before implement and frozen. Plan primary-source research delegated read-only. Initial read-only analyze mapped6FR/3SC/8tasks, no critical/high conflict. Subsequent bounded plan refinements: CLI-vs-pg strict TLS URL, guarded local ADMIN bootstrap, clearing inherited provider settings in CI. No new public API or model entity.

## Implementation and acceptance mapping
| Requirement | Tasks | Evidence / outcome |
| --- | --- | --- |
| FR001, SC001 | T002/T003/T006 | Actual production lessons router + real authentication factory with injected Prisma/storage. Missing session, foreign instructor, ADMIN, unenrolled/former student denied before storage IO; owner/enrolled download exact bytes; replacement CAS loser cleans own object only; uncertain DB outcome retains possible orphan; reprocess outage preserves prior source. Isolated full LMS auth/roles/docs/quiz regression remains green. |
| FR002 | T003 | Supabase tagged bucket/lumina UUID identity; legacy bare basename always local. Adapter restart round-trip through controlled provider contract; actual live provider persistence is NOT yet proven. No auto data/file migration. |
| FR003 | T002/T003 | Reject public/mismatched bucket, invalid host/key/reference, path traversal, foreign bucket, missing object, remote rejection/network faults/oversize/timeout.10MiB stream cap,64KiB metadata cap,15s operation deadline; server key only, no redirects/signed/public URLs or fallback. Cleanup logs fixed allowlisted code only. |
| FR004, SC002 | T004 | Brevo fixed HTTPS endpoint, verified-sender config boolean, single text message/frontend origin,10s/64KiB bounds; invalid config,400/401/403/429/500, malformed/oversize201 and stalled body rejected safely without retry/SMTP fallback. Local Gmail SMTP remains default. Existing production forgot/reset tests prove generic response, hash conditional cleanup, one-use reset and authVersion revocation with injected sender. |
| FR005, SC003 | T005/T007 | docs/deploy-free.md, deploy/free.env.example, README link. Render Free static+Docker, private Supabase/no Data API, strict runtime and CLI TLS URLs, sender approval/free rewriting caveats, fresh guarded ADMIN bootstrap without paid shell, cold starts/quotas/backup/old-local-file limits. |
| FR006 | T006/T007 | Checks and fresh integration below; source hashes in evidence/source-manifest.json. External/hosted evidence remains T008. |

## Commands and actual results
[Command/cwd/exit records](evidence/checks.json): backend npm test97pass; npm test -- --test-name-pattern=quiz runner26pass (file runner total, not26quiz scenarios); CI/config helper tests29pass; Prisma validate and generate exit0 using synthetic isolated env. No new schema SQL or migration. Existing local URL remains fallback when MIGRATION_DATABASE_URL unset. CLI strict remote TLS has not connected to an actual Supabase project.

Initial contract tests failed exit1 because adapter modules did not yet exist (expected red). Targeted adapter/router tests then passed. Extra stream/header/guard/malformed-success coverage added before final full97-pass run. [Bootstrap shape checks](evidence/bootstrap.json): allowed synthetic configuration exit0; missing explicit target confirmation exit1 as expected (negative guard PASS). --check-only never contacts a DB; actual new ADMIN creation against Supabase is unrun. Existing bootstrap implementation and guard tests do not substitute for it.

[Final rebuilt isolated integration](evidence/integration.json), [allowlisted HTTP results](evidence/http.json): Node24 Docker images rebuilt, db/backend healthy, HTTP health and actual backend-connected database lumina_acceptance verified before provisioning, migration status exit0.103HTTP operations/33resources; auth/ownership/enrollment/assignment/quiz concurrency/upload/PDF/reprocess/reset and operations restore/upload digest/log privacy/headers pass.0owned users after scoped cleanup. No real provider request. Earlier successful103-op run retained as integration-initial.json; final evidence is authoritative. Frontend source/lock unchanged; no UI redesign or claimed new browser acceptance. Prior frontend232tests/lint/build remain historical evidence, not rerun for backend adapters/docs.

The fake fetch protocol tests are controlled Supabase/Brevo contracts; production-router tests use injected DB/storage. Full Docker integration exercises real HTTP/PostgreSQL with default LOCAL storage and injected email fixtures, not live Supabase/Brevo. No successful external storage/mailbox delivery, public hosted app or new hosted CI is fabricated.

## Data, secrets and cleanup
Fresh projects only, generated test secrets, no local8081 or default development DB/data mutations. No SMTP send, no provider account/key read, no previous send-budget reuse. No .env/browser profile/token/reset URL/raw authenticated request uploaded. Generated Prisma stays ignored.

- Initial project lumina-acceptance-ci-1794969492154-ada6805b: own containers/network down; named postgres_data/uploads_data volumes retained; restore DB lumina_restore_a1b9f112db7bb664 and1synthetic row/1upload fixture retained.
- Final project lumina-acceptance-ci-1794969765227-b121bb1e: own containers/network down; named postgres_data/uploads_data volumes retained; restore DB lumina_restore_3549d114264fc9ad and1synthetic row/1upload fixture retained.

No named volume deletion, shared data reset or blocked-profile cleanup attempted. New local unit test temp files are generated and removed only in their own fresh temporary directory. Unknown upload/database outcome may retain remote orphan; exact object reconciliation requires separately verified ownership, never prefix/bucket wipe.

## Final analysis and remaining gates
Final read-only review covers6FR/3SC/3stories and8tasks, constitution I-V. No uncovered buildable local requirement; external acceptance is already covered by T008. Append-only converge does not add a duplicate blocker or empty phase, task bytes unchanged during that review. T007 tracks coherent local commits/archive; no whole-feature completion while T008 lacks evidence.

T008 OPEN: operator privately configures new Supabase/Brevo/Render Free accounts and sender, confirms no billing and grants fresh recipient/send budget; verifies bucket persistence after actual backend redeploy and denied revoked/foreign access, actual mailbox/reset/new login/old password-session/used-link refusal, exact hosted revision CI. No remote deployment here. Free sender may be rejected/rewritten; quota or approval can block mail even when readiness boolean is true. Public release still requires ownership, monitoring, least privilege, backup/restore and shared proxy-IP limit review.
