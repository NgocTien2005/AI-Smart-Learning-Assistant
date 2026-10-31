# Tasks: Không gian khóa học và đọc bài

Input: [spec](spec.md), [plan](plan.md), research/data-model/contracts/quickstart. Date2026-10-31. Regression tests được yêu cầu.

## Phase 1: Setup
- [x] T001 Ghi baseline/hash, runtime/auth probes và pending001 riêng trong specs/002-improve-course-workspace/verification.md theo ConstitutionIV/V, V01/V06.

## Phase 2: Foundation
- [x] T002 Thêm root/scope marker và CourseWorkspace.css import trong frontend/src/pages/CourseWorkspacePage.jsx, tạo frontend/src/pages/CourseWorkspace.css theo FR002/016/017, SC001/006; giữ global CSS.

## Phase 3: US1 — List và đọc (P1)
Independent test: list/reader chọn/search/filter/prevnext/URL không phụ thuộc thêm bài.
- [x] T003 [US1] Thêm tests selected/filter/stable ordinal/no-selection/invalid/URL/races/missing progress trong frontend/src/__tests__/frontend.test.js theo US1-AC1–5, FR003/004/005/012/013, SC002/004.
- [x] T004 [US1] Hoàn thiện compact shell/description disclosure, list semantics, stable ordinal, selected-filter notice/invalid và reader context trong frontend/src/pages/CourseWorkspacePage.jsx theo FR002–006/012/014, SC001/002/005.
- [x] T005 [US1] Bảo vệ course GET và unmount/generation trong frontend/src/pages/CourseWorkspacePage.jsx theo FR013, US4-AC3, SC004.

## Phase 4: US2 — Tools và progress (P1)
Independent test: protected preview/tools/pending và quiz leave giữ đúng bài.
- [x] T006 [US2] Thêm regression integrated quiz leave/stay/discard, preview source/key, progress duplicate/late result trong frontend/src/__tests__/frontend.test.js theo US2-AC1–5, FR007/012/013/015, SC004.
- [x] T007 [US2] Bố trí reader actions trước content, management entry qua guard, preview/summary key source và sửa hướng dẫn PDF trong frontend/src/pages/CourseWorkspacePage.jsx cùng copy422 frontend/src/components/DocumentAssistantPanel.jsx theo FR006/007/008/015, SC004.
- [x] T008 [US2] Thêm per-lesson progress ref lock/context guard trong frontend/src/pages/CourseWorkspacePage.jsx theo FR012/013, US2-AC5, SC004; không sửa API.

## Phase 5: US3 — Create disclosure (P2)
Independent test: open/close/File/normalized validation/success/failure/duplicate.
- [x] T009 [US3] Thêm tests disclosure/draft/File/focus/create bounds/multipart/races trong frontend/src/__tests__/frontend.test.js theo US3-AC1–5, FR009/010/011/013, SC003.
- [x] T010 [US3] Tạo controlled frontend/src/components/LessonCreateDisclosure.jsx, props/state/focus/hidden/File reset theo plan và FR009/014, SC003/005; reuse DocumentSelection/Feedback.
- [x] T011 [US3] Tích hợp header CTA guard, page-owned draft/File, normalized create/pending locks/upsert/notice trong frontend/src/pages/CourseWorkspacePage.jsx theo FR009–013/015, US3-AC1–5, SC003/004.

## Phase 6: US4 — Desktop và hồi quy (P1)
Independent test: hai role×viewport/keyboard và các section/route khác.
- [x] T012 [US4] Bổ sung regression CSS marker/role/session/navigation và state semantics trong frontend/src/__tests__/frontend.test.js theo FR001/014/016/017, US4-AC1–4, SC005/006.
- [x] T013 [US4] Hoàn thiện scoped desktop CourseWorkspace.css và long/readable/focus/disclosure trong frontend/src/pages/CourseWorkspace.css theo FR002/006/014/016, SC001/005/006.
- [x] T014 [US4] Review mọi control mới qua quiz guard, async/context/state/keyboard trong frontend/src/pages/CourseWorkspacePage.jsx và frontend/src/components/LessonCreateDisclosure.jsx theo FR012–017, US4-AC2–4, SC004–006.

## Phase 7: Verify và bàn giao
- [x] T015 Chạy npm test frontend, sửa regression trong scope và ghi specs/002-improve-course-workspace/verification.md theo V01, FR001–017, SC006.
- [x] T016 Chạy npm run lint frontend, ghi specs/002-improve-course-workspace/verification.md theo ConstitutionIV.
- [x] T017 Chạy npm run build frontend, ghi specs/002-improve-course-workspace/verification.md theo ConstitutionIV.
- [ ] T018 Nghiệm thu browser desktop hai vai trò×1280×800/1440×900 zoom100%, screenshot/bounds/font/native keyboard/File/dialog/long data và route/section hồi quy theo V02–V05 trong specs/002-improve-course-workspace/verification.md, SC001–006; E09/E14 xác nhận viewport live hai vai trò ở cả hai kích thước, E10 xác nhận disclosure/focus/picker subset; long-data live và toàn bộ interaction matrix còn thiếu; fixture/live ghi riêng.
- [ ] T019 Kiểm read/protected API và phiên/tài nguyên thử hiện có được user xác định theo V06, ghi specs/002-improve-course-workspace/verification.md theo FR001/007/017, SC004/006; E11 xác nhận owner preview/download và assignment read-only; quyền tài liệu Student/enrollment, từ chối truy cập chéo vai trò, quiz/autosave và grading còn thiếu; không seed/reset/delete hoặc provision.
- [x] T020 Hoàn thiện FR/US/AC/SC→task→evidence/result, kiểm baseline/contract/file diff và giữ001 trong specs/002-improve-course-workspace/verification.md theo V01–V06.

## Dependencies và strategy

T001→T002→US1→US2→US3→US4→Verify. P1 US4 xếp cuối vì kiểm tích hợp các story khác. T003/T006/T009/T012 là tests trước implementation tương ứng. Không [P] cho cùng CourseWorkspacePage/test file. Sau source ổn định, T015/T016/T017 là commands độc lập có thể chạy song song; không cần agent. MVP là US1 nhưng yêu cầu bàn giao tất cả stories.

Không tick từ code review/build thay runtime. T018/T019 chỉ hoàn tất theo bằng chứng thật; nếu thiếu session/fixture/data quyền thì giữ unchecked và tiếp tục phần độc lập. Task001 nghiệm thu còn thiếu không chuyển vào đây.

## Phase 8: Convergence

- [ ] T021 [US4] Hoàn tất phần runtime còn thiếu của T018 theo SC001/005/006, US1-AC1, US4-AC1/2/4 và quickstart V02–V05; ghi specs/002-improve-course-workspace/verification.md cùng screenshot/bounds mới: E09/E14 xác nhận hai vai trò ở hai viewport, E10 xác nhận disclosure/focus/picker subset; còn thiếu instructor element bounds, long-data live, đủ keyboard/dialog, async/quiz và hồi quy các section ngoài phạm vi. Depends T013–T017; cần phiên/dữ liệu phù hợp.
- [ ] T022 [US2] Hoàn tất phần protected API/resource còn thiếu của T019 theo FR001/007/017, US2-AC2/3, US4-AC4, SC004/006 và quickstart V06; E11 xác nhận owner preview/download và assignment read-only; còn thiếu quyền Student/enrollment, preview/download bị từ chối, quiz/autosave/version/leave và grading regression trên tài nguyên thử hiện có. Không provision/seed/delete; E06 xác nhận Student course/summary read trước đây, E07 unauth401. Depends T006/T007/T014; cần phiên/tài nguyên thử phù hợp, không trích credential/token.
