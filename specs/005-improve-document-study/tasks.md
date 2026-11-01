# Tasks: Local Document Study Workspace

**Input**: [spec.md](spec.md), [plan.md](plan.md), research/data-model/contracts/quickstart.
**Tests**: Requested; meaningful component regressions before implementation. Checklists are read-only during implement. No backend/schema/migration/dependency implementation tasks.

## Phase 1 — Setup

- [x] T001 Record clean-tree/hash baseline, resolver and separate001–004 open tasks in specs/005-improve-document-study/research.md and verification.md; FR018/SC007, V01.
- [x] T002 Trace production UI/API/auth/data and README conflicts in specs/005-improve-document-study/contracts/study-tools.md and research.md; FR001/005/011/013/017, US1-AC5/US4-AC4, SC004/006, V08.
- [x] T003 Record requirement review, baseline suite failure and evidence prerequisites in specs/005-improve-document-study/verification.md; freeze checklists/ hashes without modifying markers during implement; FR018/SC007. Depends T001/T002.

## Phase 2 — Foundation

- [x] T004 Add deferred-response/message/source fixtures for real panel tests in frontend/src/__tests__/frontend.test.js; cover context IDs,3–1000 trimmed characters and latest50 bound; FR004/007/015, SC002–004. Depends T003.

## Phase 3 — US1 Read/revisit (P1)

Independent test: history states, interleaved responses, latest50/dedup and stable reading region.

- [x] T005 [US1] Add and run failing history/reload/concurrent-send/scroll cases in frontend/src/__tests__/frontend.test.js; FR002–006/015, US1-AC1–5, SC001/002/005, V03/04. Depends T004.
- [x] T006 [US1] Rework history hierarchy, persistent read region, initial/empty/reload/error and independent history guard in frontend/src/components/DocumentAssistantPanel.jsx; FR002/003/004, US1-AC1–3, SC002, V03. Depends T005.
- [x] T007 [US1] Reconcile unique message IDs in chronological latest50, preserve confirmed sends on stale snapshots and disclose historical provenance in frontend/src/components/DocumentAssistantPanel.jsx; FR004/005, US1-AC3/5, SC002, V03. Depends T006.
- [x] T008 [US1] Preserve anchor/top beyond56px, near-bottom follow and explicit latest-reply scroll/focus in frontend/src/components/DocumentAssistantPanel.jsx; FR006/016, US1-AC4, SC002/005, V04. Depends T007.

## Phase 4 — US2 Ask/recover (P1)

Independent test: invalid/boundary/duplicate send, newer draft success, uncertain failure/read recovery and context lifetime.

- [x] T009 [US2] Add and run failing edit-away/back, duplicate, failure/unavailable/no-match and source/close race tests in frontend/src/__tests__/frontend.test.js; FR007–012/015, US2-AC1–6/US4-AC1, SC002/003, V03. Depends T008 (shared test file).
- [x] T010 [US2] Add immediate send lock, separate send guard and draft edit-generation clearing, keyed lesson/source scope and close cleanup in frontend/src/components/DocumentAssistantPanel.jsx; FR008/009/012/015, US2-AC2/3/6/US4-AC1, SC002/003. Depends T009.
- [x] T011 [US2] Retain current draft/transcript on errors, distinguish unavailable from textual no-match and offer read-only recovery without auto replay in frontend/src/components/DocumentAssistantPanel.jsx; FR010/011, US2-AC4/5, SC003, V03. Depends T010.
- [x] T012 [US2] Provide compact labeled editable textarea, trimmed3–1000 validation, pending/disabled/success/error descriptions in frontend/src/components/DocumentAssistantPanel.jsx; FR007/008/016, US2-AC1/2/US4-AC3, SC003/005. Depends T011.

## Phase 5 — US3 Summaries (P2)

Independent test: returned metadata/points, empty/unavailable/error/retry and stale lesson/revision.

- [x] T013 [US3] Add and run failing successful-old-summary→new-context, revision mismatch, duplicate retry and source-state cases in frontend/src/__tests__/frontend.test.js; FR013–015, US3-AC1–4, SC004, V05. Depends T012 (shared test file).
- [x] T014 [US3] Implement keyed context, independent current-read guard/cleanup, immediate retry lock and mismatched-known-revision recovery in frontend/src/components/LessonSummaryPanel.jsx; FR014/015, US3-AC3/4/US4-AC1, SC004. Depends T013.
- [x] T015 [US3] Provide extractive explanation, supplied source/truncation/pages and distinct points/empty/unavailable/error UI in frontend/src/components/LessonSummaryPanel.jsx; FR011/013/014/016, US3-AC1–3, SC004/005. Depends T014.

## Phase 6 — US4 Workspace safety (P2)

Independent test: real parent navigation and context isolation; full live regression remains separate.

- [x] T016 [US4] Add actual CourseWorkspacePage panel URL/back/forward and quiz leave guard regressions plus panel keyboard/context cleanup cases in frontend/src/__tests__/frontend.test.js; FR001/012/015–017, US4-AC1/3/4, SC005/006, V06/07. Depends T015.
- [x] T017 [US4] Add frontend/src/components/DocumentStudyPanels.css scoped to lookup-workspace/summary-workspace, import in both panels, support readable long content/focus without global layout/quiz changes; FR002/013/016/017, US4-AC2/3, SC001/005, V02/04. Depends T016.

## Phase 7 — Verification and handoff

- [x] T018 Run full frontend npm test and record exit/result in specs/005-improve-document-study/verification.md; preserve unrelated baseline failures separately, fix only in-scope regressions; FR018, SC002–007, V01. Depends T017.
- [x] T019 Run frontend npm run lint and record specs/005-improve-document-study/verification.md; fix in-scope failures without disabling rules; FR016/018, SC007, V01. Depends T017.
- [x] T020 Run frontend npm run build and record specs/005-improve-document-study/verification.md; no dependency changes; FR018/SC007, V01. Depends T017.
- [ ] T021 Accept current implementation in real browser for permitted roles×1280×800/1440×900 zoom100%, screenshot/bounds/scroll/long content/keyboard/native dialog/URL and outside-panel regression; record specs/005-improve-document-study/verification.md V02–07, FR002–017, US4-AC2–4, SC001–006. Depends T018–T020 and external runtime/browser/session/resources; missing prerequisites stays open.
- [ ] T022 Accept live HTTP auth/owner/enrollment/private history/source/invalid-input and safe lookup persistence using identified existing resources; record specs/005-improve-document-study/verification.md V08, FR001/005/010/011/013/017/018, US1-AC5/US2-AC4/US4-AC4, SC006/007. Depends T018–T020 and healthy suitable stack/verified targets/authorized resources; no provisioning or unapproved integration cleanup.
- [x] T023 Complete FR/US/AC/SC→task→evidence/result handoff and baseline/checklist/scope integrity checks in specs/005-improve-document-study/verification.md; record passed/failed/not-run and blockers without claiming feature complete; FR018/SC007. Depends T018–T022 outcomes (not prerequisite success).

## Dependencies and execution order

T001→T002→T003→T004; US1 T005→T008; US2 T009→T012; US3 T013→T015; US4 T016→T017. These story tests share one file, so serialize edits. US3 is logically independent after foundation, but scheduled after US2 to avoid shared test changes. T018/T019/T020 can run concurrently in separate output logs. T021/T022 wait on external conditions; independently complete T023 and leave their markers open.

Parallel examples per story: US1 transcript inspection and CSS review can be read-only alongside test design; US2 draft/error scenario review alongside contract review; US3 summary utility inspection alongside fixture design; US4 route review alongside desktop planning. No [P] implementation markers because files overlap; no delegation beyond the managed plan research step.

## Implementation strategy

MVP is US1 readable/recoverable history; validate its component cases, then add US2, independently validate US3 and regress US4. User authorizes continuation through the workflow, no pause/commit/deploy at increments. Runtime evidence remains mandatory before declaring completion. Converge may only append missing tasks according to its managed skill.


## Phase 8: Convergence

- [ ] T024 Complete the remaining desktop acceptance of T021 in specs/005-improve-document-study/verification.md when current implementation/runtime, browser host, permitted roles and safe resources are available: STUDENT/enrolled and INSTRUCTOR/owner×1280×800/1440×900 zoom100%, V02–07 long content/bounds/scroll/keyboard/native dialog/URL/quiz and outside-panel regressions; save fresh screenshots/bounds, separate live from fixtures; no provisioning or checklist edits per FR002–017, US4-AC2–4, SC001–006, plan:D08, Constitution III/IV (partial). Depends T018–T020 and external prerequisites; do not close T021 without evidence.
- [ ] T025 Complete remaining HTTP acceptance of T022 in specs/005-improve-document-study/verification.md after identifying safe existing test accounts/course/lesson and verifying healthy HTTP/database targets: V08 owner/enrollment/private history/other-user/ADMIN/invalid input/source denial and safe local lookup send/read persistence; no seed/reset/delete/provision or unapproved integration cleanup per FR001/005/010/011/013/017/018, US1-AC5/US2-AC4/US4-AC4, SC006/007, Constitution I/II/IV/V (partial). Depends T018–T020 and external prerequisites; no secret/credential reading.
- [x] T026 Align lookup question/answer and summary sentence body text to16px in frontend/src/components/DocumentStudyPanels.css, preserving scoped wrapping/spacing, then run frontend npm run build and report result in specs/005-improve-document-study/verification.md per plan:D01, FR002/013/016, SC001/005, T017 (partial).


## Phase 9: Convergence

- [ ] T027 Finish desktop evidence still missing after T026, continuing T021/T024 in specs/005-improve-document-study/verification.md with current served code and existing permitted sessions/resources; execute quickstart V02–07 at both desktop sizes/zoom100%, capture fresh screenshot/bounds and native keyboard/scroll/dialog/navigation/regression results, retaining fixture/live distinction per FR002–017, US4-AC2–4, SC001–006, plan:D01/D08, Constitution III/IV (partial). Depends T026 plus runtime/browser/resource availability; no new resources or checklist edits.
- [ ] T028 Finish HTTP evidence continuing T022/T025 in specs/005-improve-document-study/verification.md when stack/HTTP/database targets and safe existing course/lesson/role are identified; execute quickstart V08 auth/owner/enrollment/private-history/ADMIN/invalid-input/source/safe lookup persistence, with no provisioning, destructive cleanup or secret access per FR001/005/010/011/013/017/018, US4-AC4, SC006/007, Constitution I/II/IV/V (partial). Depends verified external conditions; component tests do not close this task.
