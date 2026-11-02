# Tasks: Trải nghiệm ôn tập Lumina

Input: [spec](spec.md), [plan](plan.md), research/data-model/contracts/quickstart. User yêu cầu regression tests; frontend-only, không task backend/schema/migration.

## Phase 1: Setup

- [x] T001 Lưu baseline172files/status và task mở001–003 riêng trong specs/004-improve-practice-quiz/verification.md; FR019/020, SC007, V09.
- [x] T002 Chốt contract/research/UI design và separate requirements-quality review trong specs/004-improve-practice-quiz/research.md, contracts/quiz.md, checklists/review.md; FR001/018–020, Constitution I–V; không tick runtime từ checklist.

## Phase 2: Foundation

- [x] T003 Viết fixtures/deferred regression và chạy đỏ trước code cho lesson replacement/history/error/same-attempt draft trong frontend/src/__tests__/frontend.test.js; FR005/014/015, EC05, SC002/003, V03/07.
- [x] T004 Thiết lập lesson-key wrapper/mounted/request/session identity và immediate action lock trong frontend/src/components/PracticeQuizPanel.jsx; guard response cũ sau unmount; FR015/018, SC003, D03/05; verify T003.

## Phase 3: US1 — Lịch sử và tiếp tục (P1, MVP)

Goal: History/detail độc lập. Independent test US1-AC1–4/V03.

- [x] T005 [US1] Viết regression filter/count/selected-outside/newest/score0/empty vs error/open retry/latest read trong frontend/src/__tests__/frontend.test.js; FR002–005/014/015, SC001/002.
- [x] T006 [US1] Tạo frontend/src/components/QuizHistory.jsx với filter all/draft/submitted, count, dates/questionCount/score0 và selected semantics; không bịa dữ liệu thiếu; FR003/004, US1-AC1/2, SC002; verify T005.
- [x] T007 [US1] Kết nối history/detail và guarded read/open/retry trong frontend/src/components/PracticeQuizPanel.jsx; giữ detail cũ khi GET lỗi, same active attempt no-op, history read không xóa draft; FR002/005/014/015, US1-AC3/4, SC002/003; verify T003/T005.

## Phase 4: US2 — Lưu, phục hồi và nộp (P1)

Goal: Latest answers confirmed, không lưu nhầm. Independent test US2-AC1–5/V04.

- [x] T008 [US2] Viết deferred queue A→B→A/B→C, version/flush, failed/conflict edits/recovery GET, pending duplicate create/submit/retry/leave tests trong frontend/src/__tests__/frontend.test.js; FR006–010/015, EC03–05, SC003/004.
- [x] T009 [US2] Sửa session queue trong frontend/src/components/PracticeQuizPanel.jsx: debounce550ms, so sánh sau tail, PUT tuần tự/version tại request, pending count không kẹt, confirmed snapshot không ghi answers; FR006/007/015, D03, SC003; verify T008.
- [x] T010 [US2] Sửa blocked failed/conflict, explicit retry/load saved confirmation và flush switch/create/close/parent leave trong frontend/src/components/PracticeQuizPanel.jsx; tiếng Việt UTF-8, failure stay/discard, browser unload warning không hứa persistence; FR008/009/014/017, US2-AC3/4, SC003/004; verify T008.
- [x] T011 [US2] Sửa submit latest-save/version/duplicate/disabled/error-preserve và kết quả đúng target trong frontend/src/components/PracticeQuizPanel.jsx; FR007/010/015, US2-AC5, SC004; verify T008.

## Phase 5: US4 — Desktop/lifecycle (P1)

Goal: Bảo toàn learning shell, keyboard và scope. Independent test US4-AC1–4/V06/07.

- [x] T012 [US4] Bổ sung regression keyboard/radio/dialog/long text, lesson unmount/races và URL section/lesson/panel/back-forward trong frontend/src/__tests__/frontend.test.js; giữ assertions dashboard/document/assignment/session/ADMIN hiện có; FR015–018, SC003/005/006, V07.
- [x] T013 [US4] Tạo frontend/src/components/PracticeQuizPanel.css với selectors .practice-panel.quiz-workspace, desktop260px+minmax detail, long wrapping/scroll/focus và không global/mobile override; FR002/017/020, SC001/005/007, D01; desktop geometry nghiệm thu riêng T021.

## Phase 6: US3 — Form và kết quả (P2)

Goal: Disclosure không write lúc mở/thu, đọc result đúng dữ liệu. Independent test US3-AC1–4/V05.

- [x] T014 [US3] Viết regression disclosure focus/count retention/error/duplicate, requested≠actual/reopen count, legacy/zero result/back-history trong frontend/src/__tests__/frontend.test.js; FR011–014/017, EC02/06, SC004/005.
- [x] T015 [US3] Tạo frontend/src/components/QuizCreateDisclosure.jsx: mặc định đóng, count integer3..10, label/keyboard/focus/Escape, giữ count/error khi thu, reset open sau confirmed success; FR011/012/017, US3-AC1/2; verify T014.
- [x] T016 [US3] Kết nối create flush/lock/count/422/actual và result score0/legacy/source/answer key chỉ sau submit trong frontend/src/components/PracticeQuizPanel.jsx; no invented requestedCount khi reopen, back-history không write; FR007/011–014, US3-AC2–4, SC004; verify T014.

## Phase 7: Polish và kiểm chứng

- [x] T017 Cập nhật setup3quiz tests cũ trong frontend/src/__tests__/frontend.test.js để mở disclosure trước create, giữ toàn bộ business assertions; review phối hợp5frontend files theo plan, không sửa parent/contract; FR018/020, SC006/007.
- [x] T018 Chạy npm test trong frontend/, sửa scope failures rồi rerun affected; lưu kết quả thật trong specs/004-improve-practice-quiz/verification.md; FR019, SC006, V01.
- [x] T019 Chạy npm run lint trong frontend/, không tắt lint, lưu log/kết quả trong specs/004-improve-practice-quiz/verification.md; FR019, SC006, V01.
- [x] T020 Chạy npm run build trong frontend/, lưu log/kết quả trong specs/004-improve-practice-quiz/verification.md; FR019, SC006, V01.
- [x] T021 Nghiệm thu browser thật hai vai trò được phép×1280×800/1440×900 zoom100%, history/detail/disclosure/save/recovery/long keyboard/native/URL và hồi quy theo V02–07; ghi screenshot/bounds mới trong specs/004-improve-practice-quiz/verification.md; FR002–018/019, US4-AC1–4, SC001–006. Cần current implementation/test runtime/browser/session/resource; thiếu giữ mở.
- [x] T022 Nghiệm thu HTTP auth/attempt owner/current enrollment/instructor/ADMIN/cross-attempt và safe draft/submit theo V08; ghi specs/004-improve-practice-quiz/verification.md, FR001/007/018/019, US4-AC4, SC006; chỉ designated existing resources, không provision/seed/reset/delete/cleanup để xanh.
- [x] T023 Hoàn thiện specs/004-improve-practice-quiz/verification.md với FR/US/AC/SC→task→evidence/result, scope hashes172files/old open tasks/frozen checklists và phần chưa chạy; FR018–020, SC006/007, V09.

## Dependencies & Execution Order

T001/T002→T003/T004→US1(T005–007)→US2(T008–011)→US4(T012/013)→US3(T014–016)→T017→T018–020→T021/T022/T023. Tests trước implementation của story; foundation guards sau regression. Existing model constraints được giữ: count integer3..10, null answer là chưa chọn/index0 hợp lệ, score0 hợp lệ, version integer, source snapshot bất biến, no new persistence.

Không [P] vì các story cùng sửa panel và test file; tránh concurrent edits. Parallel example có thể review docs/evidence file riêng khi test package đang chạy; không dispatch implementation agents. Mỗi story kiểm riêng theo role fixture, phần runtime độc lập cần T021/T022. MVP là US1 sau foundation, rồi hoàn thiện độ tin cậy US2 trước form US3. Không deploy/demo/commit; user giới hạn có ưu tiên hơn template. Checklist markers read-only trong implement; tasks thiếu bằng chứng giữ mở rồi converge append-only.

## Phase 8: Convergence

- [x] T024 Hoàn tất phần desktop còn thiếu của T021 khi current implementation được phục vụ trong môi trường kiểm thử được phép, browser host hoạt động và có phiên/tài nguyên thử phù hợp; chạy STUDENT/enrolled và INSTRUCTOR/owner tại1280×800/1440×900 zoom100% theo quickstart.md V02–07, normal/long content, history/detail/disclosure/five-save-states/conflict/leave/native radio arrows/dialog/focus/URL và hồi quy ngoài quiz; lưu screenshot/bounds mới cùng kết quả live/fixture riêng trong specs/004-improve-practice-quiz/verification.md. Depends T018–T020; không đổi checklist markers hoặc đóng T021 từ DOM fixture. Theo FR002–018/019, US4-AC1–4, SC001–006, plan:D01/D07/D08, Constitution III/IV (partial).
- [x] T025 Hoàn tất phần HTTP còn thiếu của T022 sau khi Docker/localhost kiểm thử healthy, HTTP/database đích đã đối chiếu và có tài khoản/phiên/course/lesson/attempt thử hiện có được xác định an toàn; kiểm own attempt/current enrollment/instructor/ADMIN/cross-attempt/invalid payload/version/submitted cùng draft/submit hợp lệ theo quickstart.md V08, ghi specs/004-improve-practice-quiz/verification.md không chứa secret. Depends T018–T020; không seed/provision/reset/delete/cleanup hoặc tạo tài nguyên để xanh; fixture router9pass không thay live middleware/DB. Theo FR001/007/018/019, US2-AC2–5/US4-AC4, SC003/004/006, plan:D08, Constitution I/II/IV/V (partial).
