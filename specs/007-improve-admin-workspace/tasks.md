# Tasks: ADMIN Workspace007
Input: spec/plan/research/data-model/contracts/quickstart. Tests explicitly requested. Frontend only, no backend/schema/migration tasks.

## Phase 1: Setup
- [x] T001 Capture211-file baseline, prior001–006 open acceptance and full baseline test result in specs/007-improve-admin-workspace/research.md and verification.md; FR-018/SC-007, V01.
- [x] T002 Finalize production trace/contracts/design/no-question clarification and runtime findings in specs/007-improve-admin-workspace/contracts/admin.md and plan.md; FR-001/002/005/014/018, SC-005/007. Depends T001.
- [x] T003 Review/freeze requirement checklists and validate ignore/scope rules in specs/007-improve-admin-workspace/checklists/review.md and verification.md; FR-018/SC-007. Depends T002.

## Phase 2: Foundational
- [x] T004 Add session-aware ADMIN fixture and requested selection/draft/race/outcome/permission/keyboard cases first in frontend/src/__tests__/frontend.test.js; adapt only existing ADMIN interactions while retaining their original behavior assertions; run red cases before source changes. FR-001–018, SC-001–007, V03–07. Depends T003.
- [x] T005 Add context/keyed ADMIN workspace and mounted/generation operation guard in frontend/src/pages/AdminPage.jsx, preserving shared006 session/API; FR-001/013/014/017, US3-AC3/4, SC-003/005. Depends T004.

## Phase 3: US1 Find/select (P1, MVP)
Independent test: supported search/page and explicit one-editor selection with distinct results/loading/empty/no-match.
- [x] T006 [US1] Build compact public rows and explicit selection/close with per-ID draft retention in frontend/src/pages/AdminPage.jsx; FR-004/007/015, US1-AC1/3, SC-001/006. Depends T005.
- [x] T007 [US1] Preserve query120/debounce/page/read sequence, clamp, previous-result labels and filtered selection closure in frontend/src/pages/AdminPage.jsx; FR-002/003/012, US1-AC2/4/US2-AC5, SC-003/004. Depends T006.
- [x] T008 [US1] Verify selection/discovery/empty/error/count fixtures in frontend/src/__tests__/frontend.test.js and record evidence in specs/007-improve-admin-workspace/verification.md; FR-002–004/007/015, US1-AC1–4, SC-001/003/006. Depends T007.

## Phase 4: US2 Edit/recover (P1)
Independent test: validation/independent locks, saved versus reload failures, target-specific retained drafts and no replay.
- [x] T009 [US2] Implement selected name/role form, exact validation, per-ID immediate locks and functional draft merge in frontend/src/pages/AdminPage.jsx; FR-005–008, US2-AC1–3, SC-002/003. Depends T008.
- [x] T010 [US2] Implement per-account outcomes, confirmed public merge, separate field/conflict/uncertain errors and read-only retries in frontend/src/pages/AdminPage.jsx; FR-010/011/013, US2-AC3–5, SC-003/004. Depends T009.
- [x] T011 [US2] Verify old/intermediate reads, current-query write reconciliation, independent pending accounts, saved/reload503 and malformed/network fixtures in frontend/src/__tests__/frontend.test.js; FR-008/010–013, US2-AC2–5, SC-002–004. Depends T010.

## Phase 5: US3 Confirm/boundaries (P1)
Independent test: native confirmation cancel/target/focus, toggle preserves draft,403/reverify and old-session responses.
- [x] T012 [US3] Preserve role/status target+payload ConfirmDialog, toggle-only payload, immediate rechecks and cancel in frontend/src/pages/AdminPage.jsx; FR-001/008/009, US3-AC1/2, SC-002/005/006. Depends T011.
- [x] T013 [US3] Implement current403 action block/confirmation close/explicit identity verification and scope-safe late results in frontend/src/pages/AdminPage.jsx; keep401/API/session unchanged; FR-001/013/014, US3-AC3/4, SC-003/005. Depends T012.
- [x] T014 [US3] Verify cancellation,409/current403/recovery, same-token replacement/logout/navigation and role boundary fixtures in frontend/src/__tests__/frontend.test.js; FR-001/009/013/014, US3-AC1–4, SC-002/003/005/006. Depends T013.

## Phase 6: US4 Desktop/accessibility (P2)
Independent test: keyboard/long content/local route lifetime and complete existing account/LMS regression.
- [x] T015 [US4] Add frontend/src/pages/AdminWorkspace.css scoped beneath admin-workspace and import last;16px body, list/editor hierarchy, wrapping, focus and disabled states; FR-016/017, US4-AC1/2, SC-001/006. Depends T014.
- [x] T016 [US4] Verify keyboard/editor focus, native dialog, long identity, missing0 metadata and route/session lifetime in frontend/src/__tests__/frontend.test.js; preserve unrelated006/account/LMS assertions; FR-015–018, US4-AC1–4, SC-001/006/007. Depends T015.

## Phase 7: Verification/handoff
- [x] T017 Run full frontend npm test and record specs/007-improve-admin-workspace/verification.md, preserve baseline failures separately; FR-018/SC-002–007, V01/V07. Depends T016.
- [x] T018 Run frontend npm run lint and npm run build with complete logs in specs/007-improve-admin-workspace/verification.md; no disabled checks/dependency changes; FR-016/018, SC-007. Depends T016.
- [x] T019 Accept current desktop ADMIN1280×800/1440×900 zoom100% with fresh screenshots/bounds, long content/keyboard/native dialog/async/URL and existing account/LMS regression in specs/007-improve-admin-workspace/verification.md per V02–07; FR-001–017, US4-AC1–3, SC-001–006. Depends T017/T018 and current assets/browser/authorized session/resources; missing conditions stay open.
- [x] T020 Accept production HTTP/auth/roles/self/target/linked validation/public response/revocation and designated safe name writes in specs/007-improve-admin-workspace/verification.md per V08; FR-001/005/006/009/014/018, US3-AC1–4, SC-005/007. Depends T017/T018, healthy verified HTTP/DB target and designated existing accounts/operations; user performs role/status changes, integration provisioning/cleanup separately authorized.
- [x] T021 Complete FR/US/AC/SC→task→typed evidence/results, baseline/checklist/prior-feature integrity and honest handoff in specs/007-improve-admin-workspace/verification.md; FR-018, US4-AC4, SC-007. Depends T017–T020 outcomes, not success.

## Dependencies / execution
Setup→tests-first foundation→US1→US2→US3→US4→verification. T004 intentionally creates requested regressions for all later slices before implementation; verify each story incrementally. Same source/test files serialize mutations; no[P] implementation markers. T017 and T018 checks may run independently with separate logs.
Parallel examples: US1 contract-read versus fixture design; US2 outcome review versus expected request counts; US3 middleware review versus synthetic scenarios; US4 CSS review versus regression inventory. Only managed Phase0 research dispatch used.
MVP: list/discovery/selection, then editing/recovery/boundaries and desktop. User authorizes continuous workflow; no commit/deploy checkpoints. Live conditions remain explicit tasks; converge append-only after implement.


## Phase 8: Convergence

- [x] T022 Complete current authenticated007 desktop acceptance in specs/007-improve-admin-workspace/verification.md, continuing open T019: serve current assets only in an explicitly permitted verification environment, use an identified existing ADMIN session and reliable browser capture; verify1280×800/1440×900 at100% browser zoom, long identity/errors, list/editor/draft/async states, keyboard/native dialog/visible focus, refresh/back/forward and account006/LMS regressions. Save fresh screenshots/bounds without the observed repeating/clipping capture limitation; synthetic browser DOM/bounds and old8081 assets do not substitute. Depends T017/T018 and external current-assets/session/capture conditions. Per FR-004/007/010/016/017/018, US1-AC1/3, US4-AC1–3, SC-001/004/006 and plan D01/D07/D08 (partial; F1 HIGH).
- [x] T023 Complete authenticated production administration acceptance in specs/007-improve-admin-workspace/verification.md, continuing open T020: identify existing permitted ADMIN/target IDs and safe name operations, verify HTTP/database targets and current role/self/ADMIN-target/notfound/linked-record validation, public responses and revocation; user performs real role/status changes through normal UI. Preserve existing q/page-only contract, no invented role/status filtering/removal. Anonymous401 and read-only DB metadata already pass but cannot certify these cases. Integration provisioning/cleanup needs separate authorization; no credentials retrieval/entry, seed/reset/delete/provision or automatic mutation replay. Depends T017/T018 and designated resources/sessions/user action. Per FR-001/005/006/009/014/018, US2-AC1/4/US3-AC1–4, SC-002/004/005/007 and plan D05/D06/D08 (partial; F2 HIGH).


## Phase 9: Convergence

- [x] T024 Complete only the remaining stateful live regression and unavailable-data acceptance in specs/007-improve-admin-workspace/verification.md, continuing T019/T022 without repeating their accepted E12-E15 desktop/name-write subcases: verify account006 saved-profile/identity-refresh recovery, user-completed password change/session behavior, quiz autosave/version/conflict/dirty-leave and grading mutation regression on specifically designated permitted existing resources; verify live multipage/clamp or genuinely empty-data cases only when a suitable existing dataset is available. Preserve all prior feature task files and distinguish complete component evidence from missing live evidence. No additional business write, resource provisioning or credential retrieval is authorized by this task. Depends T017/T018, existing safe-resource/operation designation and required user actions. Per FR-002/012/014/017/018, US1-AC2/4, US2-AC5, US4-AC3, SC-003/004/006/007, plan:D08 (partial; F1 HIGH).
- [x] T025 Complete only remaining production authorization/validation/revocation acceptance in specs/007-improve-admin-workspace/verification.md, continuing T020/T023: user performs specifically designated real role/lock/unlock transitions through normal UI; observe target-specific confirmation, toggle-only payload/draft retention, linked-record rejection, revoked-session denial and lost-ADMIN/pending-write behavior as safely available. Other-ADMIN target and complete invalid/uncertain-write cases need suitable existing resources/explicit operation scope; keep unavailable cases open rather than provision or replay. E14 already proves exactly two authorized name-only28 writes and exact restoration; do not repeat them. No agent role/status mutation, credential retrieval or integration provisioning/cleanup. Depends T017/T018, designated safe existing accounts/operations and required user action. Per FR-001/005/006/008/009/011/013/014/018, US2-AC1-3, US3-AC1-4, SC-002/003/005/007, plan:D04-D06/D08 (partial; F2 HIGH).
