# Tasks: Dashboard theo vai trò Lumina

**Input**: [plan.md](plan.md), [spec.md](spec.md), research/data-model/contracts/quickstart hiện có.
**Date**: 2026-10-31. Tests được người dùng yêu cầu. Không có task backend/schema/migration.

## Phase 1: Setup

- [X] T001 Ghi baseline, runtime probes và kiểm ignore/package vào specs/001-improve-role-dashboards/verification.md theo Constitution IV/V và quickstart V01/V02.

## Phase 2: Foundational

- [X] T002 Thêm route marker và bỏ breadcrumb ADMIN dư trong frontend/src/components/AppLayout.jsx, tạo frontend/src/pages/RoleDashboards.css scoped desktop theo FR-001/018/019/022, SC-001/008/009; kiểm header/route regression.

## Phase 3: US1 — Tìm khóa và học tiếp (P1)

**Independent test**: Search/filter/progress và mở first incomplete không phụ thuộc ADMIN hay tạo khóa mới.

- [X] T003 [US1] Thêm regression dữ liệu thiếu, progress, first incomplete, lỗi/retry và ý định mới nhất trong frontend/src/__tests__/frontend.test.js theo US1-AC1–6, FR-003/004/005/006, SC-003/004/007.
- [X] T004 [US1] Ưu tiên list/search, totals phía dưới, phân biệt null/0 và trạng thái đọc trong frontend/src/pages/DashboardPage.jsx theo FR-002/003/004/016, US1-AC1–5, SC-001/004/007.
- [X] T005 [US1] Bảo vệ list GET và học tiếp bằng abort/generation/unmount/pending, retry đúng course trong frontend/src/pages/DashboardPage.jsx theo FR-005/006/017, US1-AC4/6, SC-003/007.

## Phase 4: US2 — Giảng viên quản lý khóa (P1)

**Independent test**: Search/sort/management/copy với tập khóa sở hữu.

- [X] T006 [US2] Mở rộng regression instructor search/sort/clipboard denied/counts trong frontend/src/__tests__/frontend.test.js theo US2-AC1–6, FR-004/007, SC-003/004/007.
- [X] T007 [US2] Hoàn thiện masthead/actions/metadata và copy feedback ngoài form trong frontend/src/pages/DashboardPage.jsx theo FR-002/004/007/016, SC-001/003/004/007.

## Phase 5: US3 — ADMIN quản lý tài khoản (P1)

**Independent test**: Tìm/phân trang/sửa/confirm/toggle/dirty và các response đảo thứ tự.

- [X] T008 [US3] Thêm regression ADMIN errors/drafts/row lock/query race/paging trong frontend/src/__tests__/frontend.test.js theo US3-AC1–7, FR-011–015, SC-004/005/007.
- [X] T009 [US3] Compact articles, label totals theo valid snapshot/query, loading/empty/error trong frontend/src/pages/AdminPage.jsx theo FR-002/011/012/016/019, US3-AC1/2/3/7, SC-001/004/008.
- [X] T010 [US3] Serialize row writes/confirmation, name trim 2–80, role chỉ INSTRUCTOR/STUDENT, isActive boolean, bảo toàn draft trong frontend/src/pages/AdminPage.jsx theo FR-012/013/014/015/017, US3-AC3–6, SC-005/007.
- [X] T011 [US3] Reconcile current query tối đa 120 ký tự/page, generation và authoritative total/page clamp sau write trong frontend/src/pages/AdminPage.jsx theo FR-011/015/016, SC-004/005/007; phân biệt write-success/refresh-error.

## Phase 6: US4 — Disclosure tạo/tham gia (P2)

**Independent test**: Mở/đóng một thao tác, giữ draft, normalize, lỗi/thành công và duplicate guard.

- [X] T012 [US4] Thêm regression disclosure/focus/retained draft/normalized boundaries/races trong frontend/src/__tests__/frontend.test.js theo US4-AC1–6, FR-008/009/010/017, SC-002/007/009.
- [X] T013 [US4] Tạo controlled disclosure open/onOpenChange, hidden/refs/focus/keyboard trong frontend/src/components/CourseEntryDisclosure.jsx theo FR-008/009/020, SC-002/006.
- [X] T014 [US4] Tích hợp form page-owned, title trim 3–120, description trim tối đa 4.000, join trim/uppercase đúng 8 hex; pending/reconcile/failure recovery trong frontend/src/pages/DashboardPage.jsx theo FR-008/009/010/016/017, SC-002/007/009.

## Phase 7: US5 — Desktop, trạng thái và accessibility (P2)

**Independent test**: Các role dùng keyboard, states rõ, CSS route khác không đổi.

- [X] T015 [US5] Bổ sung actual route/session/header/keyboard regression trong frontend/src/__tests__/frontend.test.js theo US5-AC3/5/6/7, FR-001/020/021/022, SC-006/007/009.
- [X] T016 [US5] Hoàn thiện typography/spacing/grid/compact ADMIN/status/focus/long data trong frontend/src/pages/RoleDashboards.css theo FR-002/018/019, SC-001/008; không thay global CSS hoặc mobile feature.
- [X] T017 [US5] Đối chiếu trạng thái read/write/refresh error và keyboard semantics trong frontend/src/pages/DashboardPage.jsx, frontend/src/pages/AdminPage.jsx và frontend/src/components/CourseEntryDisclosure.jsx theo FR-016/017/018/020/021, US5-AC1–7, SC-006/007/008.

## Phase 8: Polish và kiểm chứng

- [X] T018 Chạy npm test trong frontend và ghi kết quả/bằng chứng FR-001–022 vào specs/001-improve-role-dashboards/verification.md; sửa regression trong phạm vi.
- [X] T019 Chạy npm run lint trong frontend và ghi kết quả vào specs/001-improve-role-dashboards/verification.md theo Constitution IV.
- [X] T020 Chạy npm run build trong frontend và ghi kết quả vào specs/001-improve-role-dashboards/verification.md theo Constitution IV.
- [ ] T021 Nghiệm thu browser thật 3 roles × 1280×800/1440×900, zoom100%, dữ liệu dài/focus/native dialog/route ngoài scope; ghi screenshot/bounds và kết quả SC-001/002/006/008/009 trong specs/001-improve-role-dashboards/verification.md theo quickstart V03/V11.
- [ ] T022 Kiểm HTTP/database trên stack test healthy theo quickstart V12 và ghi quyền/không write trái phép trong specs/001-improve-role-dashboards/verification.md; không reset/seed hoặc thay backend theo FR-001/021/022, SC-009.
- [X] T023 Hoàn thiện bảng FR/US/AC/SC → task → bằng chứng/kết quả, kiểm diff/contract và limitations trong specs/001-improve-role-dashboards/verification.md theo quickstart V01–V12.

## Dependencies và thực thi

T001 → T002 → US1 → US2 → US3 → US4 → US5 → Phase8. Các story sau cùng sửa page/CSS/test nên thực thi tuần tự để giữ thay đổi review được. Test trong từng story đi trước code tương ứng; T018–020 là gate tổng cuối.

Không gắn [P] cho các task cùng file. Sau code ổn định, T019 và T020 có thể chạy song song với T018 bằng các command độc lập; đây là cơ hội chạy tool, không yêu cầu spawn agent. Desktop/HTTP chỉ tick khi đã thực hiện, không tick từ component mock hoặc build. Nếu môi trường thiếu, giữ task đó unchecked và tiếp tục phần độc lập.

MVP kiểm tăng dần là US1; phạm vi bàn giao lần này vẫn là tất cả 5 user stories. Không dừng sau MVP. Chưa có task hoàn tất tại thời điểm generation.

## Phase 9: Convergence

- [ ] T024 Hoàn tất phần nghiệm thu desktop còn thiếu của T021 trong specs/001-improve-role-dashboards/verification.md khi có stack local/test và phiên/dữ liệu thật ba vai trò: chạy quickstart V03–V11 tại 1280×800/1440×900 zoom100%, bổ sung screenshot/bounds và font thực tế đúng weight (đặc biệt ADMIN), đầy đủ keyboard/clipboard/notice/live writes và hồi quy course/lesson/quiz sau CSS đã load; không dùng fixture E04/E05 thay live acceptance, không đổi code ngoài scope per SC-001/002/006/008/009, US1-AC1/4, US2-AC1/3, US3-AC1, US5-AC1/3/6/7, plan: desktop verification và T021 (partial).
- [ ] T025 Hoàn tất phần HTTP/database còn thiếu của T022 trong specs/001-improve-role-dashboards/verification.md khi Docker stack kiểm thử healthy và HTTP/DB target đã đối chiếu với backend/scripts/integration-check.mjs: chạy quickstart V12, kiểm create/join/rejoin progress, ADMIN save/linked409/lock/revoked session, token/role/owner/enrollment và từ chối không để lại write trái phép; không seed/reset/xóa dữ liệu hoặc thay backend/schema để vượt kiểm tra per FR-001/010/012/013/014/015/021/022, SC-005/007/009, Constitution II/IV và T022 (partial).
