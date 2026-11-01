# Validation guide —007
AGENTS.md applies. No dependency installation/init/upgrade/data provisioning.

| ID | Scenario | Required evidence |
| --- | --- | --- |
| V01 | baseline and final frontend npm test/npm run lint/npm run build; full exit codes, unrelated failures separate | host logs |
| V02 | ADMIN1280×800/1440×900 zoom100%, long identities/errors, list before optional editor, no overflow, fresh screenshot/bounds | current implementation in real browser |
| V03 | deliberate select/close/switch, draft lifetime,2/80 names, role rules, counts missing/0, empty/no-match | component + permitted live |
| V04 | search120/debounce/page races, clamp, filtered selection, pending independent/duplicate/conflicting writes, old GETs | controlled components + live when safe |
| V05 |400/409/404/403/network/malformed outcomes, confirmed write+reload503, GET-only retries, native confirmation cancel/focus | components + current browser |
| V06 | current/stale401/403, replacement same-token identity, logout/navigation, /me recovery, INSTRUCTOR/STUDENT deny, ADMIN no course bypass | component/router + HTTP |
| V07 |006 account/profile/password recovery and all auth/dashboard/course/lesson/document/assignments/quiz autosave-version-leave/lookup-summary regressions; route refresh/back/forward | full frontend suite + live |
| V08 | own/current ADMIN, managed target/self/ADMIN/notfound/linked-record validation, public response/revocation, safe name mutation; user role/status action | authorized production HTTP/database |

8081 health and anonymous missing/invalid-token denial already observed; not an authenticated or new007 UI pass. Verify current assets before screenshots. No real password/token retrieval, no logs with credentials.
Live name writes require designated existing ADMIN/target IDs and operations. Role/status changes user-performed through UI.
Integration script backend/scripts/integration-check.mjs provisions resources and SQL cleanup via Compose db; health alone is insufficient. Compare HTTP target and database, obtain provisioning/cleanup authorization before npm run test:integration. No seed/reset/delete to manufacture acceptance.
Evidence directory .artifacts/admin-workspace-20261101; verification.md maps17AC/18FR/7SC. Prior001–006 task files stay unchanged.
