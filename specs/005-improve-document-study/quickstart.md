# Validation guide —005

Use repository AGENTS.md. No install/init/upgrade, dependency or DB setup is part of this feature. Existing dependencies are present. Current runtime/browser is unavailable at inspection; do not treat fixture results as live.

| ID | Scenario / evidence required | Type |
| --- | --- | --- |
| V01 | frontend npm test (full), npm run lint, npm run build, exit codes/logs; compare baseline failures separately | automated host |
| V02 | STUDENT/enrolled and INSTRUCTOR/owner,1280×800 and1440×900, zoom100%; fresh screenshots and element bounds for header/history/composer/summary, long title/unbroken text/no horizontal overflow | current live desktop |
| V03 | initial/empty/history error/reload, delayed send both read orders, duplicate send, newer and edit-away/back drafts, failed/uncertain send/history recovery, no-match/unavailable,50-window/dedup/source-change/close | component + designated safe live |
| V04 | read older history, preserve anchor on reload/reply, near-bottom follow, latest reply control/focus, keyboard Tab/textarea/send/retry/scroll/close and concise announcements | component + live geometry/keyboard |
| V05 | summary DOCUMENT/manual, truncation/partial pages, successful empty, unavailable422/error/retry, retry duplicate, source revision mismatch and late lesson/revision responses | component + existing live sources |
| V06 | direct links ?section=lessons&lessonId=ID&panel=assistant or summary, refresh/back/forward, quick lesson/course switch, close/reopen draft lifecycle, quiz unsaved autosave/version/leave stay/discard/native dialog | component/router + current live |
| V07 | regress dashboard, lesson/protected preview-download, assignments/grading, quiz, account/auth/session recovery and ADMIN course boundary; no writes unless identified safe resources | full component suite + current live |
| V08 | HTTP health and study-tool auth/owner/enrollment/private history/invalid payload/no-source cases; safe send/read persistence; integration only with verified healthy HTTP/DB targets and authorized provisioning/cleanup | live HTTP/database |

Commands in frontend/: npm test; npm run lint; npm run build. Save logs under .artifacts/document-study-20261101/ and evidence table in verification.md. A full failed suite remains failed even if isolated tests pass.

Before live writes record permitted account role and existing course/lesson IDs, target runtime serving current code, and scope of writes. Never read/print browser credentials or token values; use normal existing authorized session. No seed/reset/delete/create resources to satisfy acceptance.

Read compose.yaml and backend/scripts/integration-check.mjs before integration. Script provisions users/resources and SQL cleanup, HTTP default8080 and DB lumina_lms; do not run against an unknown target or with only general permission to inspect localhost. Health alone does not prove database queries or authorization work.

Label every scenario passed/failed/not run with evidence and reason. Missing resources/source variants/browser/runtime remain precise open tasks; do not lower SC or close prior features.
