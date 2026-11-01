# Tasks: Account Workspace006

**Input**: spec/plan/research/data-model/contracts/quickstart. Tests explicitly requested. No backend/schema/migration implementation tasks.

## Phase 1 — Setup
- [x] T001 Record baseline/runtime/prior001–005 acceptance separately in specs/006-improve-account-workspace/verification.md and research.md; FR-019/SC-007, V01.
- [x] T002 Finalize production contract, clarification A and requirements review in specs/006-improve-account-workspace/contracts/account.md and checklists/review.md; FR-001/007/010/012/019, US2-AC1/4, SC-007. Depends T001.
- [x] T003 Freeze checklist hashes and verify scope/ignore rules in specs/006-improve-account-workspace/verification.md; no marker edits during implement; FR-019/SC-007. Depends T002.

## Phase 2 — Foundation
- [x] T004 Add and run failing current/stale401 API/document, same-token relogin and replacement identity tests in frontend/src/__tests__/frontend.test.js; FR-009/010/014/018, US2-AC3/4, SC-003/006, V06. Depends T003.
- [x] T005 Add credential generation/install helpers and generation+token-scoped expiry in frontend/src/services/api.js for apiRequest/fetchDocument; FR-009/010, US2-AC3/4, SC-003, V06. Depends T004.
- [x] T006 Guard frontend/src/app/SessionContext.jsx refresh/cache by request sequence and generation, clear old user on credential install and expose generation stable across refresh; FR-009/010, US2-AC3/4, SC-003/006. Depends T005.

## Phase 3 — US1 Identity/profile (P1, MVP)
Independent test: all roles/read-only identity, name2–80/trim, duplicate and newer edit-generation outcomes.
- [x] T007 [US1] Add and run failing profile hierarchy/boundary/duplicate/newer/edit-away-back cases in frontend/src/__tests__/frontend.test.js; FR-001–006, US1-AC1–5, SC-001–003, V03. Depends T006.
- [x] T008 [US1] Build keyed identity/profile/password-section layout in frontend/src/pages/AccountPage.jsx with public name/email/role, no email/role editing; FR-001/002/006/018, US1-AC1/5, SC-001/006. Depends T007.
- [x] T009 [US1] Implement trimmed name2–80, immediate account lock, editable pending name/edit counter and separate saved value in frontend/src/pages/AccountPage.jsx; remove redundant updateStoredUser after refresh; FR-003–006/009, US1-AC2–5, SC-002/003. Depends T008.

## Phase 4 — US2 Recover/retain (P1)
Independent test: real App account retained during /me delay/error, GET retry only, logout/replacement safety and unchanged startup/other guards.
- [x] T010 [US2] Add and run failing confirmed-save/read503/read401/uncertain-write/navigation tests in frontend/src/__tests__/frontend.test.js; FR-007–010, US2-AC1–4, SC-003/004/006, V04/06. Depends T009.
- [x] T011 [US2] Add account-only retained known-user tree in frontend/src/app/App.jsx without changing startup/other-role route guards; FR-007/010/018, US2-AC1/4, SC-004/006. Depends T010.
- [x] T012 [US2] Implement read-only verification/error/retry and current-scope outcomes in frontend/src/pages/AccountPage.jsx, preserving draft/saved notice and no write replay; FR-007–010/016, US2-AC1–4, SC-003/004, V04. Depends T011.

## Phase 5 — US3 Password management (P2)
Independent test: exact untrimmed6–72/inequality/confirmation, field versus operation errors, disclosure/pending/clear, uncertain recovery and confirmed logout.
- [x] T013 [US3] Add and run failing password validation/disclosure/focus/duplicate/uncertainty/lifetime/stale-success tests in frontend/src/__tests__/frontend.test.js using synthetic values only; FR-011–017, US3-AC1–6, SC-002/003/005/006, V05/06. Depends T012.
- [x] T014 [US3] Create frontend/src/components/account/PasswordManager.jsx with ephemeral fields, described field errors, autocomplete, focus and pending disclosure lock; FR-011–013/016/017, US3-AC1–3/6, SC-002/005/006. Depends T013.
- [x] T015 [US3] Connect scoped password orchestration/shared lock in frontend/src/pages/AccountPage.jsx; clear on verification/session boundaries, preserve current logout/passwordChanged notice, uncertain read/sign-in recovery without replay; FR-004/009/014–016, US3-AC4–6, SC-003/005. Depends T014.

## Phase 6 — US4 Accessible scope/regression (P2)
Independent test: keyboard/long content/current role guards and existing LMS fixture suite; live evidence separate.
- [x] T016 [US4] Add account keyboard/long-content/current401/role/lifetime and App navigation regressions in frontend/src/__tests__/frontend.test.js; preserve existing assertions and test failures separately; FR-001/017–019, US4-AC1–4, SC-001/006/007, V06/07. Depends T015.
- [x] T017 [US4] Add frontend/src/pages/AccountPage.css scoped to account-workspace using existing palette/16px body, desktop layout, wrapping/visible focus/disabled states; FR-002/017/018, US4-AC1/2, SC-001/006. Depends T016.

## Phase 7 — Verification/handoff
- [x] T018 Run full frontend npm test, fix only in-scope failures and record specs/006-improve-account-workspace/verification.md with baseline comparison; failed suite remains failed; FR-019, SC-002–007, V01. Depends T017.
- [x] T019 Run frontend npm run lint and record specs/006-improve-account-workspace/verification.md; no disabled rules; FR-017/019, SC-007, V01. Depends T017.
- [x] T020 Run frontend npm run build and record specs/006-improve-account-workspace/verification.md; no dependency changes; FR-019/SC-007,V01. Depends T017.
- [ ] T021 Accept current live desktop3roles×1280×800/1440×900 zoom100%, fresh screenshots/bounds/long content/keyboard/focus/password lifecycle/session recovery/URL and LMS regressions in specs/006-improve-account-workspace/verification.md per V02–07, FR-001–018, US4-AC1–3, SC-001–006. Depends T018–T020 plus runtime/browser/existing authorized sessions; user performs password entry; missing prerequisites stays open.
- [ ] T022 Accept production HTTP own-account/auth/public-response/role/session-revocation and identified safe profile writes in specs/006-improve-account-workspace/verification.md per V08, FR-001/009/010/014–016/018/019, US2-AC4/US3-AC4–6/US4-AC3, SC-003/005–007. Depends T018–T020 plus healthy verified HTTP/DB target and designated existing accounts/operations; no provisioning or unapproved integration cleanup, user performs live password change.
- [x] T023 Complete FR/US/AC/SC→task→evidence/results, prior-feature/checklist/scope integrity and honest handoff in specs/006-improve-account-workspace/verification.md; FR-019/SC-007, US4-AC4. Depends T018–T022 outcomes, not success.

## Dependencies and execution
Setup→foundation→US1→US2→US3→US4, tests before corresponding implementation. Tests share frontend.test.js and mutations share AccountPage.jsx, so serialize edits; no [P] implementation markers. T018/T019/T020 may run independently in separate logs. US3 is logically independently testable after foundation but scheduled after US2 for shared files. No backend tasks.

Parallel examples: US1 identity/cascade source review alongside fixture design; US2 production auth predicate review alongside delayed-read scenarios; US3 autocomplete contract review alongside lifecycle cases; US4 read-only router review alongside desktop plan. No delegation beyond managed plan's research step.

MVP: US1 identity/profile, validate, then complete recovery/password/safety increments. User authorizes continuous workflow; no commit/deploy at checkpoints. Live blockers leave precise tasks open, followed by managed append-only converge.


## Phase 8: Convergence

- [ ] T024 Complete current desktop acceptance and record fresh role/route/viewport/100%-zoom screenshots plus element/page bounds in specs/006-improve-account-workspace/verification.md, continuing open T021: ADMIN/INSTRUCTOR/STUDENT ×1280×800/1440×900; long identity/error, keyboard/visible focus, disclosure/password lifecycle, save/recovery/pending, URL navigation and existing LMS regressions. Requires accessible browser, running current frontend/API and existing authorized sessions; no fixture/old screenshot substitution or fabricated resources. User performs real password entry. Depends T018–T020 and restored runtime prerequisites. Per SC-001/006, FR-002/017/018, US4-AC1–3 and plan D01/D07/D08 (partial; F1 HIGH).
- [ ] T025 Complete production account/auth acceptance and record HTTP/database target, permitted existing account IDs/roles/operations and results in specs/006-improve-account-workspace/verification.md, continuing open T022: own-account/public response, missing/invalid/expired credentials, safe profile save/recovery, wrong-current validation, user-performed confirmed password change/relogin and old-session rejection, role/owner/enrollment denial. Requires healthy suitable stack and explicit safe profile operations; integration only after verified HTTP/DB targets and authorized script provisioning/cleanup. Do not retrieve/enter credentials, seed/reset/delete/provision or replay uncertain writes. Depends T018–T020 and external runtime/accounts/user action. Per FR-001/009/010/014–016/018/019, US2-AC4/US3-AC4–6/US4-AC3, SC-003/005–007 and plan D03/D05/D08 (partial; F2 HIGH).
