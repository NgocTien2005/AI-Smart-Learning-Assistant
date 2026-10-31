# Implementation Plan: Bài tập và chấm bài Lumina

**Branch**: Git branch không đổi; feature 003-improve-assignment-workspace | **Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification từ specs/003-improve-assignment-workspace/spec.md.

## Summary

Chuyển AssignmentsPanel từ mọi card/form nối dài sang danh sách bên trái, một bài đang xem bên phải. STUDENT đọc yêu cầu/kết quả trước rồi mở bài làm; INSTRUCTOR chọn một bài nộp và form chấm. Form tạo/sửa là disclosure, không nằm trước danh sách. Tìm/lọc/sắp xếp dùng dữ liệu GET course đã có; không đổi API/permission/schema.

## Technical Context

**Language/Version**: JavaScript ES modules, React 19; phiên bản cụ thể theo frontend/package.json và lockfile.
**Primary Dependencies**: React/React Router hiện có; không thêm dependency.
**Storage**: State React theo course/assignment/submission; selection URL; không localStorage draft, không model/migration.
**Testing**: Node service tests + Vitest/jsdom/RTL trong npm test hiện tại; lint/build; browser/HTTP phân biệt evidence.
**Target Platform**: Desktop 1280×800, 1440×900, zoom100%; không mobile feature.
**Project Type**: React/Vite frontend gọi Express production.
**Performance Goals**: Tìm/lọc không tạo request mới; một request mỗi thao tác, chặn double-submit; chỉ render detail/form của selection.
**Constraints**: Không đổi business rule, backend/schema/session/quiz/lesson/global CSS; giữ draft trong lifetime panel.
**Scale/Scope**: Một khóa với assignments/submissions đã tải; search không phân biệt hoa/thường; không backend pagination mới.

## Constitution Check

Gate trước research và sau design: **PASS về thiết kế**, không phải runtime acceptance.

| Principle | Cách tuân thủ |
| --- | --- |
| I Contract | Truy App → CourseWorkspacePage → AssignmentsPanel → apiRequest → src/app routes/courses → authenticate/role/owner/enrollment → Prisma; [contract](contracts/assignments.md) giữ payload/status. |
| II Authorization | Không đổi guard/server. User hiện tại xác minh /me; không cấp ADMIN nội dung. Kiểm read/deny thật nếu có phiên, otherwise giữ task mở. |
| III Learning UX | List/detail, forms thu, feedback/null/0, URL selection, draft/context, native dialog/keyboard và trạng thái; [research](research.md). |
| IV Evidence | Test/lint/build bắt buộc; desktop/live HTTP riêng với fixture, task chưa có evidence vẫn mở. |
| V Data/scope | Không seed/reset/provision/delete test resources; không dependency/backend/schema changes; baseline hash giữ001/002 và managed artifacts. |

Không có exception constitution; thiếu điều kiện runtime là acceptance chưa chạy, không phải bỏ gate.

## Project Structure

### Documentation (this feature)

- spec.md, plan.md, research.md, data-model.md, contracts/assignments.md, quickstart.md.
- checklists/requirements.md và assignment-ux.md; review chất lượng yêu cầu riêng với implement.
- tasks.md tạo ở bước tasks; verification.md ghi traceability/evidence và baseline/open tasks001/002.

### Source Code (repository root)

- frontend/src/components/AssignmentsPanel.jsx: container, mutation lifecycle, refresh, scoped notices.
- frontend/src/components/AssignmentEditor.jsx: disclosure tạo/sửa và focus/validation; chỉ phục vụ assignments.
- frontend/src/components/AssignmentsPanel.css: selectors dưới .assignment-workspace, không đổi global CSS.
- frontend/src/services/assignmentView.js: pure status/filter/sort/selection helpers nếu cần tái sử dụng/test.
- frontend/src/pages/CourseWorkspacePage.jsx: truyền query selection và functional updater; không sửa lesson/quiz workflow.
- frontend/src/__tests__/frontend.test.js: regression thực component, helper scenarios và CourseWorkspace URL/races; giữ suite hiện có.

**Structure Decision**: Chia editor riêng để panel tập trung list/detail và concurrency. Không thay API client chung, shared ConfirmDialog, Router, shell style hoặc package scripts. Test mới nằm trong file suite được npm test hiện tại chạy, không thêm file mà script bỏ sót.

## Design Decisions

### D01 — Bố cục và typography

Giữ course shell/header/tabs. Assignments root scoped, heading gọn; toolbar search/filter/count bên trên list. Desktop grid 300–320px + minmax(0,1fr), gap20. List có tên đầy đủ accessible, title wrap/clamp 2 dòng (focus xem đủ), badge/status, deadline/points và count thật. Detail heading/requirements không bị form tạo đẩy xuống. Colors/fonts/borders lấy tokens Lumina; body14–16px, heading20–22px; chiều rộng đọc khoảng76ch, unbroken strings wrap. Nội dung dài có vùng cuộn có tên/tabIndex, full text vẫn truy cập được. Form mở có focus/close action; collapsed không tham gia Tab.

### D02 — Derived state và priority

Dùng grade === null để xác định chưa chấm với dữ liệu hợp lệ; grade 0 là saved. Không dùng truthy cho số điểm; field thiếu không hiển thị0. Student groups theo FR004; instructor assignments có ungraded count trước; dueAt ascending, null infinity, createdAt rồi numeric id tie. Search trim/toLocaleLowerCase('vi') trên title/description. Filter local không gửi API; không làm thay selection.

### D03 — URL và lifecycle

Trong CourseWorkspacePage truyền assignmentId/submissionId lấy từ query (raw string; null là không chỉ định). Callback setParams functional, set section=assignments, bảo toàn query khác và xóa submissionId khi đổi assignment. Không rewrite lesson callbacks/quiz. Default selection được nhớ trong panel khi URL chưa chỉ định để sorting/time không tự nhảy. ID chỉ định không hợp lệ render error không fallback âm thầm. Student bỏ qua submissionId vì chỉ có bài của mình; instructor validate submission thuộc assignment. Browser back/forward cập nhật selection theo URL; query search/filter local không được hứa persist. Rời section/reload unmount panel theo hành vi hiện có; draft không bền.

### D04 — Form và draft

Tạo, sửa và student submission mặc định thu. Draft create theo panel, edit/submission theo assignment ID, grade theo submission ID. Thu form/chọn đối tượng khác không xóa draft hoặc lỗi; refresh tại panel giữ draft. Success chỉ xóa draft của target đã gửi, collapse editor tương ứng nếu còn đang mở target; không đóng form B khi A hoàn tất. Pending khóa field/button đúng target và ref lock ngăn duplicate trước rerender. Validation giữ trim/length/int bounds/timezone contract. Grade null + feedback được phép; blank grade gửi null, integer0 hợp lệ. Xóa vẫn dùng shared ConfirmDialog; chỉ test hủy, không gửi live delete.

### D05 — Races và refresh

CourseRoute đã key workspace theo courseId. Panel mutation có mounted/epoch guard và capture target trước await; callback dùng functional assignments updater để merge vào state mới nhất, không dùng snapshot course.assignments. Operation outcome không đổi URL/selection của target khác; notices có tên target và chỉ nằm trong panel. Refresh riêng panel GET course, AbortController + request generation + mutation revision: response cũ hơn write bị bỏ; chỉ latest response hợp lệ thay assignments, không unmount panel để giữ draft. Refresh pending và error/retry có UI riêng. Parent assignment callback invalidate course read đang chờ trước merge để GET cũ không đè mutation; không thay flow lesson. Nếu thiếu submissions array thì hiển thị dữ liệu chưa có, không giả count0.

### D06 — Deadline và data refresh

Tính deadline từ dueAt, cập nhật clock mỗi30s và khi focus. Dữ liệu dueAt mới từ refresh/props áp dụng ngay; không giả đã sync server chỉ từ clock. Focus cập nhật clock, không tự phát write. Đã nộp/feedback luôn đọc được dù quá hạn; quyền cập nhật chỉ grade null và chưa quá hạn. Server409 giữ draft và cung cấp refresh không mất input. Không thay policy deadline hoặc thêm autosave.

### D07 — Evidence và phạm vi thực thi

Baseline .artifacts/assignment-workspace-20261031/baseline có158 hashes, status clean và copies source/001/002. Old open tasks:001 T021/T022/T024/T025;002 T018/T019/T021/T022, không sửa/chuyển task.

Runtime lúc khảo sát backend/db healthy, frontend8081. CUA host/browser session không khả dụng và sau đó Computer Use tự dừng do không xác định URL Windows đủ tin cậy; không tiếp tục browser automation trong lượt này. Không có credential/resource write target xác định; user trả “Ok” chưa chỉ định ID. Hoàn tất phần độc lập; runtime tasks vẫn mở nếu điều kiện không thay đổi. Không chạy integration script do provision/SQL cleanup chưa được cho phép. Không dùng ảnh/fixture002 làm baseline live003.

### D08 — Validation

Test meaningful component scenarios trước/sau implementation: derive priority/filter, URL/invalid selection, null/0/feedback deadline, form/error/draft lifecycle, duplicate and race target, refresh-vs-write, course unmount, keyboard/dialog cancellation, no-match/outside-filter và toàn suite hồi quy. Desktop/HTTP theo [quickstart](quickstart.md); screenshot/bounds mới chỉ khi browser được phép dùng và dữ liệu phù hợp.

## Complexity Tracking

Không có vi phạm cần exception. Không thêm package, service layer/backend/schema task hoặc hệ thống lưu draft mới.
