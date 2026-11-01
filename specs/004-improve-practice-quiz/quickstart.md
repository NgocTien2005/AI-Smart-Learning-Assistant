# Verification guide - Quiz004

Read AGENTS.md and [contract](contracts/quiz.md). Existing dependencies, no install/update/seed/reset/delete or credential/storage reads.

| ID | Procedure/expected evidence |
| --- | --- |
| V01 | In frontend/: npm test, npm run lint, npm run build; save logs/exit. Mock component is not live. |
| V02 | Current implementation in permitted test runtime, real browser1280x800/1440x900 zoom100%, STUDENT/enrolled and INSTRUCTOR/owner; fresh screenshots/bounds at panel top. Old image not evidence. |
| V03 | All/draft/submitted filters/count/outside selection/newest/empty/error/read retry; no auto-create/open; failed open retains detail and retries GET only. |
| V04 | Resume/five save states; deferred A-B-A, sequential versions/latest flush, no stuck pending/retry loop; conflict edits blocked, recovery GET error/other-tab submitted. |
| V05 | Disclosure focus/count/collapse/Escape;3..10/actual fewer/422; no opening writes, no duplicate create/submit/retry, submit after latest save. Only safe existing resources live. |
| V06 | Native radios/Tab/ShiftTab/Enter/Space/Escape, native discard/stay dialogs and focus; long prompt/options/source, no horizontal overflow. jsdom shim is not native proof. |
| V07 | Fast open/history/old writes/lesson/course/unmount; same-attempt preserves draft. Refresh/back/forward preserves lesson/panel and resume confirmed draft via history. Dashboard/document/assignments/grading/account/auth/ADMIN regression. |
| V08 | Healthy stack; fresh read-only health and missing/invalid auth quiz endpoints; valid sessions for owner/enrollment/cross-attempt/ADMIN and safe draft/submit. Integration only after HTTP+DB target/provisioning/cleanup authorization. |
| V09 |172baseline hashes,001-003 open tasks, restricted backend/schema/dependencies/constitution/managed tooling and frozen checklist hashes unchanged; final trace/tasks/converge. |

Browser host unavailable; resource reply "ok" contains no IDs. Complete independent work and keep runtime tasks open; healthy stack alone does not authorize integration writes/cleanup.
