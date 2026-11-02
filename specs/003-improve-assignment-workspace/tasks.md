# Tasks: Bài tập và chấm bài Lumina

**Input**: spec.md, plan.md, research.md, data-model.md, contracts/assignments.md, quickstart.md.
**Tests**: User yêu cầu test/lint/build + runtime. Không task backend/schema/migration; không commit/push/deploy.

## Phase 1: Setup

- [x] T001 Lưu baseline/hash/status và ghi riêng open acceptance001/002 trong specs/003-improve-assignment-workspace/verification.md; FR021, SC008, V09.
- [x] T002 Chốt contract/thiết kế/rủi ro và review checklist theo user authorization trong specs/003-improve-assignment-workspace/research.md, contracts/assignments.md và checklists/review.md; FR001/019/022, Constitution I–V.

## Phase 2: Foundation

- [x] T003 Viết regression priority/filter/null0/invalid selection trong frontend/src/__tests__/frontend.test.js, xem fail trước implementation; FR003/004/006/007/008/011, SC002/003.
- [x] T004 Thêm pure helper status/filter/sort/ID trong frontend/src/services/assignmentView.js; giữ grade null khác0, deadline strict<now, tie createdAt/id ổn định; validate T003.

## Phase 3: US1 — Học viên (P1, MVP)

Goal: list/detail và đọc/nộp đúng trạng thái. Independent test: US1-AC1–6, V03.

- [x] T005 [US1] Viết regression student search/no-match/selection, submitted/feedback-only/zero/deadline và draft trong frontend/src/__tests__/frontend.test.js; FR002–009/013, SC001–004.
- [x] T006 [US1] Triển khai search/filter/priority/selection ngoài filter và detail trong frontend/src/components/AssignmentsPanel.jsx; US1-AC1–4, FR002–007, SC001–003; verify T003/T005.
- [x] T007 [US1] Triển khai student disclosure/draft/submit, content trim bắt buộc≤20000, deadline clock/focus/new dueAt trong frontend/src/components/AssignmentsPanel.jsx; US1-AC5/6, FR008/009/014, SC003/004.

## Phase 4: US2 — Giảng viên (P1)

Goal: chọn một bài nộp để xem/chấm. Independent test: US2-AC1–5, V04.

- [x] T008 [US2] Viết test chọn/filter submission, blank/null/zero/feedback, pending A→B và scalar response metadata trong frontend/src/__tests__/frontend.test.js; FR010/011/014/015, SC002–004.
- [x] T009 [US2] Triển khai list/detail submissions và grade form trong frontend/src/components/AssignmentsPanel.jsx; grade null hoặc integer0..points, feedback≤5000; capture target/functional merge giữ student; US2-AC1–5, FR010/011/014, SC003/004; verify T008.

## Phase 5: US4 — State/điều hướng (P1)

Goal: URL/races/refresh không lẫn target. Independent test: US4-AC1/2/4/5, V06/07.

- [x] T010 [US4] Viết deferred tests independent writes, refresh-before/during write, overlapping refresh, course unmount và URL invalid/back/forward trong frontend/src/__tests__/frontend.test.js; FR009/013–016/018, SC004/006.
- [x] T011 [US4] Kết nối optional assignmentId/submissionId query và functional assignment updater trong frontend/src/pages/CourseWorkspacePage.jsx; không sửa lesson/quiz, giữ query khác; FR015/016/018, SC006, verify T010.
- [x] T012 [US4] Hoàn thiện mounted guard/ref locks/mutation revision và refresh GET tại panel trong frontend/src/components/AssignmentsPanel.jsx; không unmount draft, notice scoped target; FR009/013–015, SC004; verify T010.

## Phase 6: US3 — Form gọn (P2)

Goal: mở/thu/giữ draft và native confirmation. Independent test: US3-AC1–5, V05.

- [x] T013 [US3] Viết tests create/edit collapse/focus/draft/error/reset/duplicate và delete dialog cancellation trong frontend/src/__tests__/frontend.test.js; FR002/009/012/014/017, SC004/005.
- [x] T014 [US3] Thêm frontend/src/components/AssignmentEditor.jsx với disclosure focus/labels/validation: title trim3–160, description trim bắt buộc≤20000, points integer1–1000, dueAt hợp lệ/null; giữ draft/lỗi khi thu; verify T013, FR002/009/012/017.
- [x] T015 [US3] Kết nối create/edit/delete confirmation hiện có và draft per assignment trong frontend/src/components/AssignmentsPanel.jsx; merge PATCH giữ submissions, không live delete; US3-AC1–4, FR009/012/014, SC004/005.

## Phase 7: Polish và kiểm chứng

- [x] T016 Thêm CSS scoped .assignment-workspace trong frontend/src/components/AssignmentsPanel.css cho list/detail/forms, long text/focus/pending; không global/mobile styles; FR002/017/019, SC001/005/008; V02/05 khi browser khả dụng.
- [x] T017 Bổ sung hồi quy frontend/src/__tests__/frontend.test.js cho assignment entry/navigation và suite lesson/document/quiz/autosave/account/auth/ADMIN đã có; FR001/018/020, SC007; V07, không thay business assertions.
- [x] T018 Chạy npm test từ frontend/, lưu log và kết quả trong specs/003-improve-assignment-workspace/verification.md; FR020, SC007; mọi test phải pass, sửa lỗi scope rồi rerun impacted.
- [x] T019 Chạy npm run lint từ frontend/, lưu log trong specs/003-improve-assignment-workspace/verification.md; FR020, SC007; không disable lint.
- [x] T020 Chạy npm run build từ frontend/, lưu log trong specs/003-improve-assignment-workspace/verification.md; FR020, SC007.
- [x] T021 Nghiệm thu desktop live hai vai trò×1280×800/1440×900 zoom100%, normal/long/keyboard/native dialog/async/navigation và V02–07; ghi screenshots/bounds mới và phần chưa chạy trong specs/003-improve-assignment-workspace/verification.md; FR002–018/020/022, SC001–007; cần browser/phiên/resource an toàn, không lấy fixture thay live.
- [x] T022 Nghiệm thu HTTP owner/enrollment/ADMIN/cross-resource và đọc/nộp/chấm phù hợp trên resource thử hiện có; ghi specs/003-improve-assignment-workspace/verification.md theo V08, FR001/020/022, SC007; chưa có target không write, không provision/seed/cleanup trái phép.
- [x] T023 Đối chiếu baseline/diff, hoàn thiện traceability FR/US/AC/SC→task→evidence/result và trạng thái tasks trong specs/003-improve-assignment-workspace/verification.md; FR019–022, SC008, V09; giữ001/002/backend/managed files.

## Dependencies & Execution Order

T001/T002 → T003/T004 → US1(T005–007) → US2(T008/009) → US4(T010–012) → US3(T013–015) → T016/T017 → T018–020 → T021/T022/T023.
Tests meaningful viết trước thay hành vi; giữ assertions nghiệp vụ cũ. Các task chung panel/test file đi tuần tự để tránh xung đột. T016 CSS có thể song song review wording ở verification sau khi markup chốt; không yêu cầu spawn implementation agents. US1 và US2 kiểm chứng độc lập theo role fixture; UI routing/shared lifecycle được kiểm tra lại khi tích hợp.

## Implementation Strategy

MVP là US1 list/detail; hoàn thiện US2 và robustness rồi forms theo ưu tiên. Không dừng xin phép ở từng bước đã giao. T021/T022 phụ thuộc điều kiện bên ngoài; giữ mở nếu không đủ, hoàn tất tasks độc lập rồi converge. Converge chỉ append công việc thiếu, không sửa yêu cầu/plan/ID cũ; không claim feature complete khi acceptance còn thiếu.

## Phase 8: Convergence

- [x] T024 Hoàn tất phần desktop live còn thiếu của T021 sau khi browser control khả dụng và có phiên/tài nguyên thử phù hợp; kiểm tra frontend implementation mới cho STUDENT/INSTRUCTOR tại 1280×800 và 1440×900, zoom100%, normal/long text, keyboard/focus/native dialog, states/draft/races/deadline/null/0, refresh/back/forward/deep link và hồi quy dashboard/course/lesson/document/quiz/account/auth/ADMIN theo quickstart.md V02–07; lưu screenshot/bounds mới và kết quả riêng live/fixture trong specs/003-improve-assignment-workspace/verification.md; không sửa checklist markers hoặc đóng T021 khi chưa đủ evidence. Dependency: T018–T020; external prerequisites như trên. Theo FR002–018/020/022, US4-AC3/4/5, SC001–007, plan:D07, Constitution III/IV (partial).
- [x] T025 Hoàn tất phần authenticated HTTP và nghiệm thu nộp/chấm còn thiếu của T022 khi đã xác định tài khoản/phiên hợp lệ, course/assignment/submission thử hiện có được phép dùng và backend/database mục tiêu; kiểm tra owner/enrollment/role/ADMIN/cross-resource, read và write hợp lệ/lỗi theo quickstart.md V08, giữ contract/deadline/null/0, không seed/provision/reset/delete; ghi request mục tiêu/kết quả không chứa secret trong specs/003-improve-assignment-workspace/verification.md và chỉ đóng T022 khi có evidence phù hợp. Dependency: T018–T020; không chạy integration cleanup ngoài phạm vi được phép. Theo FR001/020/022, US1-AC5/6, US2-AC3, US4-AC5, SC003/007, plan:D07, Constitution I/II/IV/V (partial).
