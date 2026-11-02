# Feature Specification: Không gian khóa học và đọc bài Lumina

**Feature Branch**: `002-improve-course-workspace` (artifact identifier; Git branch không đổi)
**Created**: 2026-10-31
**Status**: Accepted — 2026-11-02, isolated acceptance stack; see verification.md.
**Input**: Cải thiện desktop course shell, section Bài học và vùng đọc cho STUDENT/INSTRUCTOR; giữ contract, quyền và nghiệp vụ hiện có.

## User Scenarios & Testing

### User Story 1 — Tìm và đọc bài (Priority: P1)

Học viên muốn nhận biết khóa và bài đang đọc, tìm bài cần học và dành phần lớn không gian cho nội dung.

**Why this priority**: Đây là công việc chính sau dashboard.
**Independent Test**: Khóa có nhiều bài, tên/nội dung dài, trạng thái hoàn thành khác nhau; không cần tạo bài hoặc quản trị.

**Acceptance Scenarios**:
1. **US1-AC1** Given khóa tải thành công có bài, When mở Bài học tại 1280×800/1440×900 zoom100%, Then không cuộn vẫn thấy tìm kiếm, ít nhất một bài và tên/vùng đầu của bài đang chọn (hoặc hướng dẫn chọn bài); không có form thêm bài mở sẵn.
2. **US1-AC2** Given nhiều bài, When tìm tiêu đề/nội dung không phân biệt hoa thường và kết hợp bộ lọc hoàn thành hiện có, Then đúng tập kết quả; số thứ tự vẫn theo toàn khóa, không đánh lại theo kết quả lọc.
3. **US1-AC3** Given bài đang chọn bị ẩn bởi bộ lọc, When lọc, Then vùng đọc và địa chỉ vẫn giữ bài đó; danh sách thông báo bài đang đọc nằm ngoài bộ lọc; xóa lọc không mất lựa chọn.
4. **US1-AC4** Given có/không có lựa chọn hợp lệ, When chọn bài, Bài trước/tiếp, refresh hoặc back/forward, Then địa chỉ và nội dung đồng nhất; trước/tiếp theo toàn khóa, đầu/cuối disabled; ID không còn tồn tại có thông báo riêng và không tự mở bài khác.
5. **US1-AC5** Given chưa có bài, không khớp lọc, đang tải hoặc lỗi tải, When xem, Then phân biệt rõ; lỗi có thử lại và đường về dashboard; không hiển thị tiến độ thiếu thành 0 đã xác nhận.

### User Story 2 — Học với tài liệu và công cụ hiện có (Priority: P1)

Người học và giảng viên muốn tìm thấy tài liệu/công cụ mà nội dung đọc vẫn dễ theo dõi.

**Why this priority**: Giữ chức năng và ngữ cảnh bài học khi bố trí lại.
**Independent Test**: Bài có/không nội dung, tài liệu text/PDF; mở các panel hiện có.

**Acceptance Scenarios**:
1. **US2-AC1** Given bài có nội dung dài, When đọc, Then nội dung xuống dòng, không cắt chiều cao, các nút có nhãn rõ và không chồng lên chữ; nhận biết trạng thái hoàn thành và nơi mở công cụ.
2. **US2-AC2** Given có tài liệu được cấp quyền, When xem/tải, Then dùng luồng được bảo vệ hiện có; lỗi quyền/network được báo; đổi bài không hiện tài liệu/nội dung của bài cũ dưới bài mới.
3. **US2-AC3** Given mở summary/assistant/quiz, When đổi panel/bài/section bằng điều khiển trong workspace, Then địa chỉ đúng và giữ cơ chế rời quiz hiện có: flush, hoặc ở lại/bỏ thay đổi khi lưu lỗi; không sửa luật tạo/chấm/lưu/version của quiz.
4. **US2-AC4** Given metadata nguồn tài liệu, When xem hướng dẫn/phản hồi, Then mô tả đúng trích text cục bộ, không OCR; tóm tắt trích xuất, tra cứu cục bộ và quiz mẫu câu giới hạn, không hứa AI ngoài.
5. **US2-AC5** Given gọi đánh dấu hoàn thành hoặc thao tác đọc đang chờ, When bấm lặp/lỗi/đổi bài, Then không gửi lặp cùng thao tác, không báo thành công giả, kết quả gắn đúng bài và lỗi có văn bản dễ tìm.

### User Story 3 — Thêm bài khi cần (Priority: P2)

Giảng viên muốn ưu tiên xem khóa và chỉ mở biểu mẫu thêm bài khi chủ động.

**Why this priority**: Form không che công việc đọc/quản lý thường xuyên.
**Independent Test**: Khóa thuộc giảng viên, mở/đóng form, thử dữ liệu hợp lệ/không hợp lệ và upload lỗi/thành công.

**Acceptance Scenarios**:
1. **US3-AC1** Given INSTRUCTOR mở khóa, When chọn Thêm bài học, Then một lần kích hoạt vào Bài học và mở form; focus tiêu đề; một lần đóng hoặc Escape thu gọn, trả focus khi cần; mở/đóng không gửi dữ liệu. STUDENT không có form này.
2. **US3-AC2** Given đã nhập tiêu đề/nội dung/thứ tự/chọn file, When thu gọn/mở lại trong cùng page instance, Then giữ draft, tên/file object và lỗi; không yêu cầu giữ sau refresh/rời khóa; không lập trình khôi phục đường dẫn file trên thiết bị.
3. **US3-AC3** Given gửi form, When kiểm dữ liệu, Then title trim2–160, content trim≤100000, order nguyên0–10000 (trống=0), có nội dung hoặc tài liệu, file theo giới hạn hiện có; invalid không gửi, báo field lỗi và focus hữu ích.
4. **US3-AC4** Given write pending, When bấm gửi lặp/đóng form, Then một request, inputs/file/remove/submit disabled nhưng đóng vẫn dùng được; đóng không hủy write. Thành công mới upsert một bài, clear draft/file, thu gọn và giữ notice ngoài panel; thất bại giữ draft/file để sửa/thử lại.
5. **US3-AC5** Given giảng viên xem bài, When cần sửa/thay tài liệu/xóa, Then có lối tới quản lý bài hiện có; section Cài đặt và quyền/confirmation giữ hành vi.

### User Story 4 — Nhất quán và không hồi quy (Priority: P1)

Hai vai trò cần giao diện dễ dùng bằng bàn phím mà các luồng LMS còn lại được giữ nguyên.

**Why this priority**: Redesign không được làm mất trạng thái học hoặc quyền.
**Independent Test**: Hai vai trò, hai viewport, keyboard, chuỗi dài và route ngoài phạm vi.

**Acceptance Scenarios**:
1. **US4-AC1** Given desktop và dữ liệu dài, When thao tác hai vai trò, Then không tràn ngang toàn trang/chồng chữ/nút; phân cấp chữ/nút/focus thống nhất với dashboard.
2. **US4-AC2** Given keyboard, When Tab/Shift+Tab/Enter/Space/Escape, Then thứ tự theo DOM, focus rõ, label/selected state/feedback accessible; disclosure không trap, dialog native giữ hủy/focus return.
3. **US4-AC3** Given response course/lesson đến trễ hoặc page unmount, When ý định mới đã có, Then response cũ không thay nội dung/notice hoặc điều hướng của ngữ cảnh mới.
4. **US4-AC4** Given section ngoài Bài học hoặc dashboard/admin/account/auth, When truy cập sau khi CSS mới đã load, Then giữ bố cục/hành vi ngoài shell được phép; session, role/resource guards, assignments/grading và quiz vẫn hoạt động theo contract.

### Edge Cases

- EC-01: Bài đang đọc bị filter loại; số thứ tự không đổi và reader không bị xóa.
- EC-02: Không chọn bài khác ID không tồn tại; không tự chọn bài đầu để che link lỗi.
- EC-03: Tên khóa120/tên bài160, description4000, nội dung100000 ký tự và token dài không tạo overflow.
- EC-04: Close form trong khi upload không hủy write; success không giành focus nếu người dùng đã sang vùng khác.
- EC-05: File lỗi/oversize, empty content, trimmed boundaries, order thập phân/âm/quá lớn; giữ file hợp lệ qua collapse/failure.
- EC-06: GET cũ đối đầu create/progress, unmount/đổi course; chỉ response hiện hành được áp dụng, không fake success.
- EC-07: Lỗi lưu quiz khi điều khiển mới đổi bài/panel/section phải đi qua guard hiện có; browser unload không được hứa lưu mạng.
- EC-08: 401/403/404/5xx/network khi đọc tài liệu hoặc nội dung, giữ recovery/session theo hệ thống.

## Requirements

### Functional Requirements

- **FR-001**: Chỉ STUDENT/INSTRUCTOR có quyền hiện có vào workspace; ADMIN không được cấp quyền nội dung (US4-AC4).
- **FR-002**: Shell gọn, nav section rõ; ở Bài học, list/search và đầu vùng đọc hiện trong viewport đầu ở cả hai kích thước (US1-AC1, US4-AC1).
- **FR-003**: Giữ search/filter theo tiêu đề/nội dung/trạng thái, stable ordinal và empty/no-match riêng (US1-AC2/5).
- **FR-004**: Giữ bài đang chọn khi filter loại, có giải thích ngữ cảnh (US1-AC3).
- **FR-005**: Selected lesson/section/panel theo địa chỉ, trước/tiếp theo toàn khóa; invalid/no selection phân biệt (US1-AC4).
- **FR-006**: Vùng đọc không cắt nội dung, có tiêu đề/vị trí/trạng thái và hành động đúng vai trò (US2-AC1, US3-AC5).
- **FR-007**: Giữ protected preview/download, panel summary/assistant/quiz và metadata nguồn; không hiện dữ liệu bài trước sau đổi bài (US2-AC2/3).
- **FR-008**: Mọi hướng dẫn capability trong vùng sửa phải đúng xử lý cục bộ và giới hạn hiện có (US2-AC4).
- **FR-009**: Form thêm bài mặc định đóng, một thao tác mở/đóng, đúng role, keyboard/focus và draft/file retention (US3-AC1/2).
- **FR-010**: Validate normalized payload/file theo rule hiện tại; lỗi có label/field focus; invalid không gửi (US3-AC3).
- **FR-011**: Create pending lock, giữ draft/file khi lỗi, chỉ clear/upsert/collapse khi server xác nhận; notice ngoài panel (US3-AC4).
- **FR-012**: Loading/empty/no-match/read error/retry/write success/error/disabled phân biệt; missing progress không được fake0 (US1-AC5, US2-AC5).
- **FR-013**: Đọc/write trong vùng thay đổi có duplicate/unmount/response generation guard, không đảo ngữ cảnh mới (US2-AC5, US4-AC3).
- **FR-014**: Keyboard/labels/selected/focus/status accessible; chuỗi dài không mất hành động (US4-AC1/2).
- **FR-015**: Điều khiển điều hướng mới phải dùng cơ chế rời quiz hiện có; giữ draft/version/attempt và URL semantics, không mở rộng nghiệp vụ quiz (US2-AC3).
- **FR-016**: CSS giới hạn vào course shell và section Bài học; không thay global token hoặc style các section ngoài phạm vi (US4-AC4).
- **FR-017**: Giữ session, auth/resource guards và mọi contract; không backend/schema/dependency/mobile/AI ngoài, không thay nghiệp vụ assignments/grading (US4-AC4).

### Key Entities

Người dùng/phiên, khóa với danh sách bài có thứ tự, bài/nội dung/tài liệu/metadata nguồn, tiến độ, địa chỉ đọc và draft thêm bài/file/tác vụ tạm. Không thêm dữ liệu bền hoặc cam kết giữ draft qua refresh.

## Success Criteria

- **SC-001**: Cả4 lượt role×viewport thấy search/một bài/đầu reader khi có bài, form mặc định đóng, không cuộn ngang (FR-002/006/016).
- **SC-002**: Search/filter cho đúng tập, ordinal ổn định, giữ bài đang đọc và trước/tiếp đúng toàn khóa trong toàn bộ US1-AC2/3/4 (FR-003/004/005).
- **SC-003**: Mở/đóng form mỗi chiều≤1 activation, giữ text/order/file/error; invalid không request và rapid submit chỉ1 write; success/error đúng US3-AC1–4 (FR-009/010/011).
- **SC-004**: Tài liệu, panel, progress và controlled quiz-leave giữ đúng ngữ cảnh trong US2-AC1–5, kể cả lỗi và response đảo thứ tự (FR-006/007/008/012/013/015).
- **SC-005**: Keyboard/focus/labels/notices dùng được ở cả2 role; native disclosure/dialog và dữ liệu dài không che hành động ở cả2 viewport (FR-014).
- **SC-006**: Frontend regression, lint, build đạt; không regression dashboard/admin/account/auth/các section khác và quyền hiện có (FR-001/016/017).

## Assumptions và ranh giới

- Không tự chọn bài khi mở section không lessonId, giữ prompt chọn bài; invalid selection được báo rõ. Filter chỉ ảnh hưởng list.
- Thêm bài inline disclosure; draft giữ trong page instance, có thể đổi section rồi quay lại, không thêm persistence hoặc cảnh báo rời editor mới.
- Không redesign overview/assignments/students/settings; chỉ shell chung và lối tới management hiện có.
- Giữ các đường rời quiz có guard hiện có; không mở rộng bảo vệ mọi đường rời ứng dụng hoặc thay browser-history/autosave nghiệp vụ trong feature này. Mọi điều khiển mới phải gọi guard.
- Nghiệm thu cần tài khoản/dữ liệu thử sẵn; không seed/reset hoặc sửa dữ liệu thật để tạo ảnh. Bằng chứng fixture phải ghi riêng.
- Feature001 T021/T022/T024/T025 còn thiếu nghiệm thu và không thuộc tasks002. Constitution1.0.0 dùng nguyên trạng. Spec là mục tiêu, không phải kết quả tests.
