# Research và kết quả clarify: dashboard theo vai trò

**Date**: 2026-10-30 | **Feature**: [spec.md](spec.md)

## Kết quả clarify

No critical ambiguities detected worth formal clarification.

Không có quyết định nghiệp vụ còn thiếu cần hỏi. Số câu hỏi đã hỏi/trả lời: **0/0**.
Spec giữ nguyên nội dung và ID; không ghi câu trả lời giả vào mục Clarifications.
Checklist chất lượng được đánh giá lại: **16/16 → 16/16**; không có mục mới đạt,
hồi quy hoặc còn chưa tick. Theo yêu cầu trực tiếp, cập nhật ghi chú constitution
đã hoàn thiện, tách khỏi việc đánh giá marker của checklist.

| Nhóm coverage | Trạng thái | Căn cứ / xử lý |
| --- | --- | --- |
| Functional Scope & Behavior | Clear | 3 vai trò, 5 US, phạm vi desktop và các phần giữ nguyên được xác định. |
| Domain & Data Model | Clear | Dữ liệu hiện có đủ; không thêm model, migration hoặc lịch sử đọc bài. |
| Interaction & UX Flow | Clear | Luồng chính, lỗi, rỗng, keyboard và bản nhập được mô tả; hình thức disclosure thuộc plan. |
| Non-Functional Quality Attributes | Clear | Hai viewport, zoom, phục hồi lỗi/quyền và không gây hồi quy; không thêm SLO hạ tầng. |
| Integration & External Dependencies | Clear | Dùng contract hiện có, không thêm dịch vụ/dependency; runtime thiếu được ghi riêng. |
| Edge Cases & Failure Handling | Clear | EC-01 đến EC-10 và các AC bao phủ pending, phản hồi muộn, hủy, dữ liệu thiếu. |
| Constraints & Tradeoffs | Clear | Frontend-only; lựa chọn bố cục/CSS là quyết định kỹ thuật được giải quyết bên dưới. |
| Terminology & Consistency | Clear | ADMIN là quản trị tài khoản; học tiếp là bài chưa hoàn thành đầu tiên theo thứ tự. |
| Completion Signals | Clear | 22 FR, 32 AC và 9 SC có đầu ra quan sát được. |
| Misc / Placeholders | Clear | Spec không có placeholder hoặc quyết định nghiệp vụ chưa xử lý. |

Không có mục Outstanding/Deferred về yêu cầu. Thiếu bằng chứng runtime là giới hạn
kiểm chứng, không được chuyển thành kết luận sản phẩm đã đạt.

## Căn cứ và giới hạn quan sát

- Đối chiếu mã working tree ngày 2026-10-30: [DashboardPage](../../frontend/src/pages/DashboardPage.jsx),
  [AdminPage](../../frontend/src/pages/AdminPage.jsx), [AppLayout](../../frontend/src/components/AppLayout.jsx),
  [router](../../frontend/src/app/App.jsx), [session](../../frontend/src/app/SessionContext.jsx),
  [API client](../../frontend/src/services/api.js), [courses](../../backend/src/routes/courses.js),
  [admin](../../backend/src/routes/admin.js), middleware và [schema](../../backend/prisma/schema.prisma).
- CSS: [index.css](../../frontend/src/index.css), [App.css](../../frontend/src/App.css),
  [LearningApp.css](../../frontend/src/pages/LearningApp.css); components UI và regression tests hiện có.
- Probe đọc ngày 2026-10-30: GET `http://localhost:8080/api/health`, `/` trên cổng 8080
  và `/` trên cổng 5173 đều timeout sau 4 giây/request. `docker compose ps --format json`
  thất bại vì pipe `dockerDesktopLinuxEngine` không tồn tại. Không khởi động stack,
  migrate, seed, đăng nhập hoặc thay dữ liệu trong lần lập kế hoạch này.
- Chưa quan sát UI đang chạy, chưa có screenshot mới hoặc phép đo layout. Không dùng ảnh
  trong `.artifacts/` làm bằng chứng bản hiện tại. Các kích thước dưới đây là thiết kế đề xuất.
- Research có hai lượt đối chiếu độc lập, chỉ đọc: contract/async/test và UI/CSS/accessibility.
  Không chạy app tests, lint, build hoặc integration; chỉ kiểm tra tài liệu và tooling.
- Spec Kit cục bộ 1.2.3; resolver và setup-plan xác định cùng feature. Constitution 1.0.0
  được đọc và giữ nguyên. Không có extensions.yml cho các pre/post hook clarify/plan.

## Quyết định thiết kế và kỹ thuật

### D01 — Giữ điều hướng ngang, danh sách là vùng chính

**Decision**: Giữ header/profile và role home hiện có. Masthead gọn với tiêu đề theo vai trò,
CTA tạo/tham gia bên phải; toolbar và danh sách đi ngay sau. Thống kê phụ nằm sau danh sách.
ADMIN dùng cùng nhịp bố cục nhưng ưu tiên tài khoản. Bỏ breadcrumb tự trỏ về trang ADMIN.

**Rationale**: Dashboard hiện render welcome → form luôn mở → totals → library
(DashboardPage dòng 106–118), trái mục tiêu ưu tiên nội dung. AppLayout đã có điều hướng
đúng vai trò; không cần kiến trúc mới.

**Alternatives considered**: Sidebar mới tăng phạm vi; hero lớn hoặc ba thẻ thống kê phía
trên tiêu tốn khung nhìn. Giữ stats sau danh sách vẫn bảo toàn chức năng hiện có.

### D02 — Disclosure inline, giữ state tại page

**Decision**: Tạo/tham gia dùng vùng inline mặc định đóng; state bản nhập và isEntryOpen
ở DashboardPage. Disclosure nhận open/onOpenChange, chỉ giữ refs và lifecycle focus.
Mở focus trường đầu, đóng từ panel trả focus trigger. Escape chỉ xử lý khi focus trong
panel; không trap focus. Giữ panel mounted/hidden đúng nghĩa và không để CSS display cũ
ghi đè hidden. Thông báo tác vụ ở vùng luôn hiện bên ngoài panel.

**Rationale**: Form state đã ở page; không cần dependency hoặc dialog mới. Message hiện
nằm trong form card dù cũng phục vụ học tiếp/copy (DashboardPage dòng 112).

**Alternatives considered**: Modal yêu cầu thêm focus lifecycle; trang riêng đổi luồng.
Không tách toàn bộ card/page thành hệ thống component mới. Chỉ thêm một component
CourseEntryDisclosure nếu việc gom trigger/panel/focus giúp page rõ trách nhiệm.

### D03 — Chuẩn hóa trước validation ở frontend, giữ server authoritative

**Decision**: Validate title/description và mã sau trim theo contract hiện có; mã uppercase
và 8 hex. Không dùng maxLength=8 trên chuỗi mã thô vì khoảng trắng đầu/cuối được phép.
Giữ bản nhập sau lỗi và chỉ clear sau xác nhận thành công. Giới hạn query ADMIN 120 ký tự.

**Rationale**: Input mã hiện min/maxLength=8 ngăn trường hợp US4-AC4 dù server chấp nhận.
Server vẫn quyết định tạo/tham gia/đổi vai trò và trả lỗi thực.

**Alternatives considered**: Đổi backend validation hoặc trim phá nội dung mỗi lần gõ
không cần thiết; không thêm thư viện form/schema.

### D04 — Bảo vệ GET/mutation và điều hướng học tiếp

**Decision**: Dùng AbortController, request generation và guard unmount tại page. Với học
tiếp, khóa thao tác lặp cùng course; lựa chọn course mới hủy/vô hiệu ý định cũ, chỉ ý định
mới nhất được navigate. GET danh sách cũ không được ghi đè kết quả create/join; invalidate
trước write và reconcile bằng response xác nhận/refetch có guard, dedupe bằng course id.
Nếu write thất bại sau khi GET đầu bị vô hiệu, phải kết thúc trạng thái tải cũ và tải
lại GET có guard hoặc hiện read-error/retry; không để spinner vô hạn, không tự retry write.

**Rationale**: loadCourses và continueLearning hiện không có guard như ADMIN search;
phản hồi muộn có thể ghi đè danh sách hoặc điều hướng sai course.

**Alternatives considered**: Query library/cache mới mở rộng dependency; khóa cả ứng dụng
không cần thiết. Giữ logic trang và API client hiện có.

### D05 — ADMIN khóa write theo từng hàng và đồng bộ lại danh sách

**Decision**: Serialize save/toggle trên cùng user id, khóa editor và hai thao tác khi row
đang write; giữ hàng khác dùng được. Confirmation chụp target/payload. Sau success merge
public fields, refetch query/page hiện hành có generation guard, giữ dirty drafts hàng
khác; clamp/refetch trang nếu tổng trang giảm. Không tự giảm total rồi coi là nguồn thật.

**Rationale**: save/toggle hiện có pending độc lập; save response ghi đè draft trong khi
inputs còn sửa được. Rename không khớp query đang giảm total cục bộ nhưng không cập nhật
totalPages/nạp hàng thay thế. GET cũ có thể đảo lại trạng thái mới lưu.

**Alternatives considered**: Thêm version field/backend concurrency contract ngoài phạm vi;
optimistic role/active trước xác nhận gây trạng thái giả. Khóa inputs trong write đơn giản
hơn cơ chế merge các revision chỉnh sửa song song trên cùng hàng.

### D06 — Phân biệt write thành công và refresh thất bại

**Decision**: Lỗi write giữ bản nhập/trạng thái hiệu lực cũ. Khi write đã thành công nhưng
GET làm mới thất bại, giữ thay đổi đã xác nhận, báo “Đã lưu, chưa làm mới được danh sách”
và cho retry GET; không gợi ý gửi lại write. Lưu notice ngoài disclosure/list fetch và
không để refetch xóa thông báo success. Total chỉ thuộc snapshot/query đã trả thành công.

**Rationale**: loadUsers hiện setMessage(null); total=0 ban đầu có thể bị trình bày như kết
quả thật sau lỗi. Dữ liệu cũ cần nhãn “kết quả trước/chưa cập nhật” khi query mới chưa xong.

**Alternatives considered**: Thay tất cả lỗi bằng danh sách rỗng, tự logout hoặc báo write
thất bại sau success làm người dùng hiểu sai tác động.

### D07 — CSS có marker theo đúng route

**Decision**: AppLayout thêm marker `role-dashboard-shell` chỉ ở `/dashboard` và `/admin`;
hai page có modifier theo vai trò. Thêm RoleDashboards.css import sau LearningApp.css,
mọi selector mới đều nằm dưới marker. Dialog ADMIN giữ class confirm-dialog hiện có và
vẫn thuộc DOM bên dưới marker dù render trong top layer. Không sửa :root, App.css, index.css hoặc các
selector dùng chung trong LearningApp.css.

**Rationale**: Account và workspace dùng cùng CSS, kể cả `.admin-user-*`; các selector
toàn cục thay đổi có thể làm lệch trang ngoài phạm vi. Token --lumina-* đã tồn tại.

**Alternatives considered**: Thay global token hoặc refactor CSS cũ mở phạm vi. CSS modules
không bắt buộc khi marker giải quyết được ranh giới bằng công cụ hiện có.

### D08 — Tái sử dụng component và dữ liệu hiện có

**Decision**: Giữ Button, Feedback và ConfirmDialog; Button nhận className hiện có, còn
Feedback/ConfirmDialog giữ interface và class hiện tại, không đổi semantics toàn cục. Giữ danh sách ADMIN là article gọn hai
tầng với editor trực tiếp. Không tạo API, model, analytics, snapshot bài đọc hoặc quyền mới.

**Rationale**: Components và contract đã đủ; native dialog hiện đã có cancel/focus return.
Backend GET course dựa trên owner/enrollment, không có ADMIN bypass và cũng không có
blanket role deny cho ADMIN; frontend route mới là nơi chặn ADMIN vào dashboard/course.

**Alternatives considered**: Table nhiều cột hoặc modal editor mới đổi workflow không cần
thiết; giả định ADMIN quản lý tất cả khóa học không đúng contract.

### D09 — Kiểm chứng theo tầng, không dùng checklist thay runtime

**Decision**: Bổ sung component/service regression trong cơ chế hiện có; thực hiện đủ npm
test/lint/build khi implement. Browser thật kiểm sáu lượt role×viewport, keyboard/native
dialog và hồi quy route ngoài phạm vi. HTTP/database authorization chỉ nghiệm thu trên
stack kiểm thử sẵn sàng; trạng thái từng kiểm tra ghi rõ trong quickstart.

**Rationale**: jsdom không đo layout/focus native đầy đủ; integration hiện có ghi/dọn dữ
liệu và có dấu hiệu fixture PDF cũ cần đối chiếu nếu thất bại.

**Alternatives considered**: Chạy cả app suite trong bước chỉ viết Markdown không xác minh
được UI chưa triển khai; bổ sung dependency E2E không được yêu cầu.
