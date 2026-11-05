# Tasks: Authentication entry and recovery

**Input**: spec/plan/research/data-model/contracts/quickstart in this directory. Checklist markers frozen before implement. No commit/push.
**Format**: ID, story, exact files, requirement/acceptance/success trace and dependencies. Tasks tick only after whole scope passes; SMTP is an explicit external evidence task.

## Phase 1 — Setup

- [x] T001 Record clean baseline, official008 resolver,001–007 closed tasks and full frontend baseline in research.md/verification.md. FR018/019;US5-AC4/5;SC007/008. Verify baseline.json and5+184 PASS. **Depends**: none.
- [x] T002 Verify isolated project HTTP/database/volumes before writes; record environment and cleanup scope in verification.md. FR016/019;US4-AC6;SC008. Use integration-target.mjs with explicit project/port. **Depends**: T001.

## Phase 2 — Foundation

- [x] T003 Add failing auth validation/lifetime/navigation regression cases in frontend/src/__tests__/frontend.test.js. FR003/007/008/013/016;SC002/003/005. Run targeted suite and record expected red. **Depends**: T001.
- [x] T004 Implement endpoint validators/reset classification in frontend/src/services/authEntry.js; canonical safe return in services/navigation.js. FR003/008/013;US1-AC1/2,US4-AC2/3;SC002/005. Verify new regression cases. **Depends**: T003.
- [x] T005 Create shared frontend/src/components/AuthEntryShell.jsx and pages/AuthEntry.css structure. FR002/017;US5-AC1/2;SC001/006. No dependency changes. **Depends**: T004.

## Phase 3 — US1 Sign in (P1)

- [x] T006 [US1] Add sign-in/verification/stale-session/duplicate regression in frontend/src/__tests__/frontend.test.js before page changes. FR005–010;US1-AC1–5;SC002–004. **Depends**: T003.
- [x] T007 [US1] Implement scoped pending/context/session gates, remembered credentials and operation-specific errors in frontend/src/pages/AuthPage.jsx. FR001/005/006/007/010;US1-AC2/3/5;SC002/003. **Depends**: T005,T006.
- [x] T008 [US1] Implement confirmed-entry GET-only verification recovery and verified safe navigation in AuthPage.jsx. FR008/009;US1-AC1/4;SC004. Verify network/503/expiry/replacement and original destination. **Depends**: T007.

## Phase 4 — US2 Registration (P1)

- [x] T009 [US2] Add registration boundary/role/409/uncertainty/verification tests in frontend/src/__tests__/frontend.test.js. FR003/004/015;US2-AC1–3;SC002–005. **Depends**: T006.
- [x] T010 [US2] Implement public role picker, normalized payload, associated validation and confirmed/uncertain recovery in AuthPage.jsx. FR003/004/005/006/007/009/015;US2-AC1–3;SC002–005. **Depends**: T008,T009.

## Phase 5 — US3 Forgot (P1)

- [x] T011 [US3] Add generic200/400/429/503/network and query/history/draft tests in frontend/src/__tests__/frontend.test.js. FR011/012/016;US3-AC1–4;SC002/003/005. **Depends**: T006.
- [x] T012 [US3] Implement compact recovery mode, query synchronization, preserved return state and generic/operation-specific feedback in AuthPage.jsx. FR011/012/015/016;US3-AC1–4;SC002/003/005. **Depends**: T010,T011.

## Phase 6 — US4 Reset (P1)

- [x] T013 [US4] Add reset missing/changed link, exact400, raw passwords, uncertainty, duplicate and late-context tests in frontend/src/__tests__/frontend.test.js. FR006/007/013–016;US4-AC1–6;SC002/003/005. **Depends**: T003.
- [x] T014 [US4] Implement keyed/reset-scoped form, validation, completion and uncertain/manual recovery in frontend/src/pages/ResetPasswordPage.jsx. FR005/006/007/012–016;US4-AC1–6;SC002/003/005. **Depends**: T005,T013.

## Phase 7 — US5 Desktop/accessibility (P2)

- [x] T015 [US5] Complete keyboard, error association, autocomplete/visibility and non-secret mode draft tests in frontend/src/__tests__/frontend.test.js. FR016/017;US5-AC2/3;SC006. **Depends**: T012,T014.
- [x] T016 [US5] Finalize scoped AuthEntry.css and shared shell with long-content wrapping, disabled/focus/status layout. FR002/017;US5-AC1/2;SC001/006. **Depends**: T015.

## Phase 8 — Verification and handoff

- [x] T017 Run full frontend npm test/lint/build and record sanitized command/cwd/exit logs in verification.md. FR018/019;US5-AC4/5;SC007/008. Preserve unrelated failures. **Depends**: T016.
- [x] T018 Run backend full/quiz regression and verified isolated HTTP integration; record production auth/role/ownership results in verification.md. FR001/018/019;US1-AC5,US4-AC4,US5-AC4;SC007. No production backend edits. **Depends**: T002,T017.
- [x] T019 [US5] Verify real Chrome four forms×two desktop viewports, keyboard/focus/long content/history and bounds/screenshots. FR002/012/017;US3-AC4,US5-AC1–3;SC001/006. Save ignored evidence and sanitized report. **Depends**: T002,T017.
- [x] T020 Verify real isolated three-role login/register, safe return, reset/relogin/old-session denial and actual503/429; label DB-prepared link fixture. FR001/004/008/011/014/019;US1-AC1/5,US2-AC1/3,US3-AC2,US4-AC1/4/6;SC005/007/008. **Depends**: T018,T019.
- [x] T021 Verify delayed/dropped production responses, duplicate, verification recovery and context/history races in real browser; component evidence for deterministic matrix remains separate. FR006/007/009/010/015/016;US1-AC2–4,US2-AC2/3,US3-AC3,US4-AC3/5/6;SC002–005. **Depends**: T020.
- [x] T022 Regress001–007 current source with full component suite and real isolated HTTP/browser role/course/document/assignment/quiz/account/admin flows; cite exact coverage/limits in verification.md. FR018/019;US5-AC4;SC007. **Depends**: T018,T021.
- [ ] T023 [US3] Verify actual SMTP delivery only with safe configured transport and authorized test recipient; otherwise record NOT RUN and keep open in verification.md. FR011/019;US3-AC1 delivery limit;SC008. No real recipient or backend mail change. **Depends**: T020.
- [x] T024 Correct README.md authentication role wording; record per-AC FR/US/SC traceability, cleanup exact own IDs and final scope hashes in verification.md/traceability.csv. FR016/018/019;US5-AC5;SC008. **Depends**: T022.
- [x] T025 Run managed analyze read-only and converge append-only for008; record status/open external task in verification.md; implement actionable appended tasks if any. FR019;US5-AC5;SC008. **Depends**: T024.

## Dependencies and execution

Setup → foundation → US1 → US2 → US3; US4 can proceed after foundation independently, then US5 and verification. Tests precede implementation. US4 reset tests and US1 tests can be authored independently in separate sequential sections of the same test file; avoid concurrent writes. UI and verification are sequential here, no extra agents required. Each story has independent component scenarios; integration connects shared identity. T023 does not block independent cleanup/handoff but remains open without external evidence. No backend/schema/migration implementation tasks.

## Phase 9: Convergence

- [ ] T026 [US5] Safely remove only the verified temporary test launch profile .artifacts/auth-entry-20261102/chrome after its browser/private contexts have closed; do not read credential stores or touch existing user profiles. Record cleanup proof in specs/008-improve-auth-entry/verification.md per FR-016/FR-019, SC-008 and US4/AC6 (partial). BLOCKED: automatic approval review rejected scoped deletion with blocked by policy; keep open until permitted. Depends: T024.

## Acceptance follow-up — 2026-11-03

Recounted **24/26 closed**; T023/T026 remain open. T023 is waiting for user-configured test Gmail SMTP, a designated permitted mailbox and permission for up to three messages. A secret-free isolated-stack setup is prepared but not executed; no mail/account mutation occurred. T026 was checked again: exact workspace path, no reparse point in its parent chain, no matching active browser process; automatic approval review again rejected the scoped deletion with `blocked by policy` before command execution. No alternate deletion method attempted. See [verification.md](verification.md#acceptance-follow-up--2026-11-03) and [traceability.csv](traceability.csv). No new or duplicated convergence task; checklist/task markers unchanged in this follow-up.
