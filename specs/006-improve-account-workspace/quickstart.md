# Validation guide —006

AGENTS.md applies. No dependency install, Spec Kit init/upgrade, seed/reset/provisioning or DB setup is authorized.

| ID | Scenario | Evidence |
| --- | --- | --- |
|V01 | frontend npm test, npm run lint, npm run build; full exit codes/logs and baseline comparison | host automation |
|V02 | ADMIN/INSTRUCTOR/STUDENT×1280×800/1440×900 zoom100%; identity/profile before collapsed password, long name/email/error, fresh screenshots/bounds/no page overflow | current live desktop |
|V03 | trimmed2/80/invalid name, duplicate/cross-write gate, newer/edit-away-back draft, normalized saved value/header after /me | real components + safe existing live account |
|V04 | profile200 then /me delay/503/401, read-only retained view/draft/outcome, retry GET-only; uncertain write verify; startup/other guard behavior | component/router + live |
|V05 | disclosure/focus/clear, password lengths/spaces/confirmation/same/wrong-current, pending/duplicate, confirmed logout/banner, unknown outcome and read/sign-in recovery | synthetic component fixture; user-performed live password action |
|V06 | late save/read/error/401/password success after logout/new account/same-token relogin; API/document current401 still expires; no password storage or old cache revival | component/session fixtures + live when safe |
|V07 | auth/role/dashboard/course/lesson/protected document/assignments/grading/quiz autosave-version-leave/local lookup-summary regression | full component suite + current live |
|V08 | production HTTP own-account/public response/auth denial/current-password/revocation/role boundaries; integration only healthy suitable stack, verified targets and authorized provisioning/cleanup | live HTTP/database |

Logs: .artifacts/account-workspace-20261101/. Record FR/US/AC/SC→task→evidence/status in verification.md. Passing fixture/mocked dialog/old screenshot is not live proof; preserve unrelated failed suites separately.

Before profile writes identify existing safe account IDs/roles and permitted edits. User enters/changes real passwords through normal UI; never retrieve or print credentials. No seed/reset/delete/create accounts for acceptance.

Read compose.yaml and backend/scripts/integration-check.mjs before integration; it provisions accounts/resources and SQL cleanup. Health alone does not establish database/auth success. Current Docker/browser/HTTP are unavailable; missing conditions leave explicit open tasks.
