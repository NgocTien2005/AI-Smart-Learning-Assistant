# System verification — 2026-11-16

App running: **http://localhost:5173** (current source/Vite) and **http://localhost:8080** (existing Docker frontend). Tested revision: `be39e565c16dc2f92ec961a5c1da1b2593b97761`, branch `feat/gemini-lesson-chat`; initial working tree clean. This is a system-wide verification report, not a new CI feature or a claim of completed production readiness.

## Startup and target

Docker Desktop was initially stopped. Started it in the background; existing default project's containers resumed and backend/db became healthy. Did not recreate the privately configured backend or read environment values. Started Vite in an Orca terminal (`npm --prefix frontend run dev -- --host localhost --port5173`, actual command uses separate `--port 5173` arguments). Opened the app in Orca's browser; auth layout visually inspected at1280×800. Frontend `/` and `/api/health` return200 through both origins.

Default target checked with the existing guarded resolver: project/service labels, mount/network ownership, frontend HTTP binding and the database actually reached by backend Prisma matched default `lumina_lms`/db container. Existing12 migrations are up to date (`docker exec <verified backend> prisma migrate status`, exit0). No migrations, dependencies, application source, users/passwords or default course content changed. Protected local8081 was not accessed.

## Results by capability

| Capability | Checks performed now | Result and boundary |
| --- | --- | --- |
| Email/password auth,3 roles, `/me` | Actual UI login forms for original seed-owned admin/instructor/student; full auth regression and isolated HTTP/database reset/session cases | PASS; public role restrictions and revocation covered by automated real production routes |
| Registration and password/account changes | Frontend components, production backend tests, isolated HTTP/database workflows | PASS on isolated fixtures; did not change existing account credentials |
| Dashboard/navigation/account | Actual UI views for3 roles at1280×800/1440×900; components | PASS smoke/render checks; no assumption that every form mutation was clicked |
| Course ownership/enrollment/roster/management | Instructor/student UI views; real HTTP/database create/update/join/leave/access checks; many-user demo matrix | PASS; other instructor/unenrolled user access denied |
| Lessons/progress | UI reading/management views; actual HTTP/database progress and source lifecycle | PASS |
| Documents/PDF text layer | Actual protected PDF preview UI for instructor/student; upload/download/invalid/oversized files and extraction/source revision checks;26 demo documents downloaded/validated | PASS; no OCR claim |
| Assignment submission/grading | UI assignment panels; real HTTP/database lifecycle, grading, feedback, points and graded-resubmission guards; demo unsubmitted/pending/graded states | PASS; mutations confined to isolated fixtures |
| Persisted quiz | UI panel; full quiz regression including concurrency/access/snapshot/version/draft/submit, real HTTP/database; demo submitted/draft/unstarted cases | PASS; existing default attempts not edited |
| Local lookup/extractive summaries | UI panels + real HTTP/database lookup/history/summary; all48 seeded lesson summaries | PASS automated/HTTP; not described as an LLM |
| Administrator management | Actual admin UI plus component, real HTTP/database role/lock/account guards and seed login matrix | PASS checks; no real user list content/screenshots published |
| Google sign-in/linking | Runtime boolean=false, actual disabled button, production contract and isolated challenge/link checks | NOT accepted with real Google: missing Client ID configuration; no provider login attempted |
| Forgot email delivery | SMTP readiness boolean=true; reset validation/revocation/used-token routes tested in isolation | No new mailbox-delivery acceptance. Historical008/T023 evidence preserved; no reuse of old email-send budget,0 email sends |
| Chat Gemini | Runtime key/Free/chat flags true, actual selected original synthetic lesson + disclosure + consent + one free question through UI | FAILED live acceptance: safe provider-unavailable error, input retained,0 accepted replies/citations. No automatic retry/fallback/model/timeout change. Current error alone does not establish exact upstream HTTP status |
| Operations | Real isolated health/DB identity/migrations, security headers, proxy log privacy, bounded log rotation and synthetic DB/upload restore | PASS isolated drill; not public deployment/production readiness |

## Commands and evidence

All checked commands retain safe cwd/exit results:

- [Frontend](evidence/system-20261116/frontend.json): `npm ci`, `npm test`, `npm run lint`, `npm run build`, cwd `frontend`, all exit0.
- [Backend](evidence/system-20261116/backend.json): `npm ci`, `npm test`, `npm test -- --test-name-pattern=quiz`, CI/operations regression runner, cwd `backend`, all exit0. Tests exercise mounted production factories, not unused legacy `backend/app.js`.
- [HTTP/database integration](evidence/system-20261116/integration.json): `node scripts/ci/integration.mjs`, cwd repo, exit0. **98 HTTP operations/33 resources**,0 owned users remain. Backend's actual DB identity checked before provisioning; fresh secrets, explicit loopback target. Includes auth, authorization, courses, documents, progress, assignments, local tools, quiz and disabled-provider contracts.
- [Demo dataset integration](evidence/system-20261116/seed-integration.json): `node scripts/ci/seed-integration.mjs`, cwd repo, exit0. **247 HTTP operations**,18 demo users,8 courses,48 lessons,26 documents,24 assignments. Covers8 submitted quizzes,1 draft,40 unstarted lessons,8 graded/8 pending/8 unsubmitted assignments. Dry-run does not write, collision denied, no duplicate rerun, sentinel preserved, modified cloud source denied;0 users after scoped cleanup.
- [Actual browser smoke](evidence/system-20261116/browser.json): **53 passed records**, including3 actual login forms and2 document previews, across ADMIN/INSTRUCTOR/STUDENT. Source-controlled UI inspected at1280×800/1440×900 using Orca CLI, not old screenshots. Checks main/heading/loading/error/overflow and expected panels; these are smoke checks, not evidence every mutation was clicked. Registry-owned synthetic credentials used only in memory and not published. Test tabs logged out afterward.
- [Actual Gemini check](evidence/system-20261116/gemini.json): one generation attempt,0 automatic retries,0 replies/citations accepted. Native Tab reached Send; failed response preserved input. Initial browser helper selected the wrong combobox and exited before any generation; selector corrected in ignored test helper, not app source. Only the subsequent one generation attempt counts as provider work.

The existing hosted push and PR runs on exact tested `be39e56` both passed: [push43175315392](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/43175315392), [PR43175320757](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/43175320757). This local test session did not create those historical runs. Any subsequent report-only commit has separate hosted status.

## Data and cleanup

Default DB/schema/course/lesson/assignment/quiz data preserved. No seed apply, email send or password mutation on the default app. Only a synthetic selected lesson was sent for the one Gemini question; no personal/private documents, identity, tokens, raw authenticated/provider requests or browser profiles were recorded/uploaded. Readiness probes emitted booleans only. Existing policy-blocked profiles were not touched.

Both fresh isolated projects removed only their own containers/networks and owned fixture users, leaving **four named volumes**:

- `lumina-acceptance-ci-1794818947659-09540d2a_postgres_data`
- `lumina-acceptance-ci-1794818947659-09540d2a_uploads_data`
- `lumina-acceptance-ci-demo-1794818947674-72f67f_postgres_data`
- `lumina-acceptance-ci-demo-1794818947674-72f67f_uploads_data`

Integration retains a synthetic restore database `lumina_restore_ec23c6f73982e8e7` plus1 synthetic operations row/upload. Seed project retains26 synthetic document files after user cleanup. No volumes or recovery archives deleted/uploaded. Default app remains running for the user; no force-push, merge or deploy.

## Remaining acceptance

Feature010 real Google configuration/provider acceptance, feature021/T007 two real grounded Gemini answers, and remaining feature021/T006 enabled/native control acceptance stay open in their original feature artifacts; dependentT008 is not falsely completed. Historical008/T026 blocked cleanup stays open. No duplicate convergence tasks created, no prior completed email acceptance reopened.

The LMS core passes the checks above. This does **not** mean every possible input/device/provider condition has been tested or the whole app is complete/production-ready. Next useful work is separately configured real Google acceptance and diagnosing Gemini's currently unsuccessful generation while preserving the Free-only/no automatic fallback constraints.
