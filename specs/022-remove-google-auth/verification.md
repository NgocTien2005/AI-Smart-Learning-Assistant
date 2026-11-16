# Verification: OAuth retirement (2026-11-16)

## Outcome and scope

Feature022 removes OAuth UI, GIS loader, backend router/verifier, Client ID env/build arguments and linking controls. Existing email/password users, roles, sessions, reset contracts and immutable schema/migrations are preserved. googleSubject remains dormant private storage; no destructive cleanup. Gemini chat and Gmail SMTP are separate retained integrations. Historical010 acceptance is superseded, not claimed as passed.

Official allocator selected022, resolver confirmed the directory. Constitution reviewed; specify -> clarify(no material ambiguities) -> plan -> checklist -> tasks -> read-only analyze -> implement -> verify -> read-only analyze -> converge. No extension hooks file exists. Checklist5/5 reviewed for requirements quality before implement; markers remained read-only during implement. No managed skill/template/constitution edits.

## Traceability

| Requirement | Task | Evidence/result |
| --- | --- | --- |
| FR001 UI/config removal | T002/T004 | No active OAuth modules/build args; frontend absence test and three-role browser views pass |
| FR002 retired interface | T003 | production-app404 test and8 anonymous/authenticated isolated requests404; no cookies/provider access |
| FR003 password/session/roles | T002/T003 | Existing production auth/role/reset suites retained, fresh actual three-role form login/account/logout pass |
| FR004 data privacy | T003 | No schema/migration/user change; public mapper and seed redaction guards remain; isolated cleanup owns data |
| FR005 independent providers | T003/T004 | Gemini runtime source hash matches repair; key/Free/chat and SMTP booleans true at verified checkpoint, no new email |
| FR006 current docs/history | T004/T005 | README, AGENTS, architecture/security/portfolio/setup and010 supersession note updated, prior evidence retained |
| SC001-003 | T005 | Local package gates,102 HTTP/database operations and15 real desktop browser records pass |

## Commands and observed results

See [safe command records](evidence/checks.json), [isolated summary](evidence/integration.json), [allowlisted HTTP evidence](evidence/http.json), [browser](evidence/browser.json) and [runtime](evidence/runtime.json).

- frontend/: npm test exit0,5 service +227 component tests; npm run lint exit0; npm run build exit0.
- backend/: npm test exit0,85 tests; npm test -- --test-name-pattern=quiz exit0,21 tests.
- root: node --test scripts/ci/test/ci.test.mjs scripts/ci/test/operations.test.mjs exit0,25 tests. An earlier wrong glob selected0 tests; it was corrected, not treated as coverage.
- root: node scripts/ci/integration.mjs exit0. Fresh Compose build/start healthy, target/actual backend DB checked before provisioning,12 migrations/status verified,102 HTTP operations/33 recorded resources,0 owned users after cleanup. Backup/restore synthetic drill and upload digest pass, no real provider requests.
- root: docker compose -f compose.yaml -f compose.dev.yaml up -d --no-deps --build frontend exit0. Only frontend recreated; backend privately configured env preserved by guarded source sync/restart. Runtime hashes of4 changed backend files matched host; retired files absent. Both5173/8080 health200, retired endpoint404 at checkpoint.
- Real Orca UI: ADMIN/INSTRUCTOR/STUDENT password login/role routing/account/logout; auth/account at1280x800 and1440x900,15 records pass. No Google controls/SDK, password trigger enabled, no horizontal overflow. Four actual synthetic-only auth/account screenshots visually inspected; two-column identity preserved. Screenshots/profile/raw authenticated requests not published.

Browser helper corrections are not application defects: initial account wait during reload timed out; textContent was incorrectly used for an aria-label; another role retained intentional return-to-account navigation state. The corrected helper starts with fresh test-session/history and checks the actual accessible control. Final15 records pass. No app guards were changed for these helper issues.

## Data and cleanup

Only fresh project lumina-acceptance-ci-1794821268501-50f832f0 was provisioned/cleaned. Containers/network removed with ownership checks; volumes retained:
- lumina-acceptance-ci-1794821268501-50f832f0_postgres_data
- lumina-acceptance-ci-1794821268501-50f832f0_uploads_data

Its synthetic restore DB lumina_restore_1da5c442a5225b3d retains1 operations fixture row/1 synthetic upload. No archive published. Default dataset/accounts unchanged, no SMTP sends, local8081 not targeted. Historical008/T026 blocked browser profiles remain untouched; no alternate cleanup attempt.

## Git, analysis and limitations

Temporary stacked branch refactor/remove-google-auth, dependency f22d6d8 on unmerged feat/gemini-lesson-chat; intended PR base that branch. Commits12cfc7b(spec),30ad37e(backend),f88117e(UI/config); handoff documentation commit follows. Previous Git credential dialog was canceled; no alternate authentication or remote retry, no push/new PR/merge/deploy in this batch. Hosted CI for these commits has not run; prior green runs do not prove this head.

Final read-only analysis:6FR,3SC,2US,5tasks mapped, no uncovered requirement or constitution conflict. Current OAuth API retirement is intentional and documented. Converge reviews code against artifacts; existing remote limitation is recorded, no duplicate blocker/empty convergence section required. Local retirement acceptance is complete; production-readiness, old finite-demo012 and broader021 controls/remote handoff remain separate.

### Runtime interruption after verification

After the user's interruption/Continue, Docker Linux engine pipe was absent. Read-only target verification failed before any DB operation. Docker Desktop start reported already running; desktop restart failed to stop three UI processes within its45second deadline. Windows Docker service start was denied by OS permissions. No elevated/alternate credential attempt, force-kill, container recreation, volume removal or local8081 target operation followed. Existing Vite5173 still serves UI but /api/health returns502;8080 is currently unreachable. The earlier runtime.json remains a timestamped passing checkpoint, not a claim of current availability. Operator must recover Docker Desktop/its service, then start existing default containers and rerun boolean/health proof without recreating privately configured backend. No additional model/email call needed.
