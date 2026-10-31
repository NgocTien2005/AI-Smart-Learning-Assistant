# Feature Specification: Bài tập và chấm bài Lumina

**Feature Branch**: Không tạo hoặc đổi Git branch; feature directory 003-improve-assignment-workspace.

**Created**: 2026-10-31

**Status**: Draft — chưa nghiệm thu implementation.

**Input**: Cải thiện trải nghiệm bài tập và chấm bài cho STUDENT/INSTRUCTOR, ưu tiên danh sách và nội dung cần xử lý, giữ nghiệp vụ và quyền hiện có.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Học viên tìm và xử lý bài tập (Priority: P1)

Học viên đã tham gia khóa tìm bài cần làm, hiểu yêu cầu/hạn nộp, đọc bài đã nộp và nhận xét/điểm.

**Why this priority**: Học viên cần biết việc phải làm trước khi gặp biểu mẫu.
**Independent Test**: Khóa có bài chưa nộp, đang chờ chấm, đã chấm và quá hạn; tìm/chọn một bài và đối chiếu dữ liệu đã lưu.

**Acceptance Scenarios**:

1. **US1-AC1 Given** khóa có nhiều bài, **When** mở phần bài tập, **Then** danh sách có tiêu đề, hạn, điểm tối đa và trạng thái; bài còn mở chưa nộp được ưu tiên theo hạn gần nhất.
2. **US1-AC2 Given** danh sách đã tải, **When** tìm bằng tiêu đề/yêu cầu hoặc lọc trạng thái, **Then** chỉ danh sách phù hợp xuất hiện, số lượng đúng và có no-match riêng với khóa chưa có bài.
3. **US1-AC3 Given** đã chọn bài, **When** bộ lọc che bài đó, **Then** nội dung đang xem vẫn giữ, có thông báo và cách bỏ lọc; không tự chọn bài khác.
4. **US1-AC4 Given** bài đã nộp, **When** mở kể cả sau hạn, **Then** thấy nội dung/thời điểm đã nộp, điểm nếu có và feedback dù chưa có điểm; điểm 0 là điểm đã lưu.
5. **US1-AC5 Given** bài được phép nộp/cập nhật, **When** mở biểu mẫu, nhập và gửi, **Then** pending chặn gửi lặp, thành công cập nhật đúng bài và lỗi giữ draft cho retry; không cho sửa bài đã có điểm hoặc quá hạn.
6. **US1-AC6 Given** tab lấy lại focus hoặc hạn thay đổi từ dữ liệu mới, **When** xem bài đang mở, **Then** hạn/trạng thái/action cập nhật; nội dung đã nộp và feedback không bị ẩn.

### User Story 2 — Giảng viên tìm bài nộp cần chấm (Priority: P1)

Giảng viên sở hữu khóa tìm bài đang quản lý, chọn bài nộp và lưu điểm/nhận xét hiện có.

**Why this priority**: Danh sách và bài nộp phải dễ thấy thay cho hàng loạt form mở cùng lúc.
**Independent Test**: Khóa có nhiều bài và nhiều bài nộp; chọn/lọc, đọc một bài, chấm hoặc nhận xét theo nghiệp vụ hiện tại.

**Acceptance Scenarios**:

1. **US2-AC1 Given** khóa có bài nộp chưa chấm, **When** mở danh sách, **Then** bài có nội dung cần chấm đứng trước, hiển thị số bài nộp/chưa chấm lấy từ dữ liệu hiện có.
2. **US2-AC2 Given** chọn một bài tập, **When** xem danh sách bài nộp và chọn một người nộp, **Then** danh tính, thời điểm, nội dung, điểm/feedback và form chấm thuộc đúng bài nộp đó.
3. **US2-AC3 Given** điểm để trống hoặc bằng 0, **When** lưu theo form hợp lệ, **Then** phân biệt lưu nhận xét chưa có điểm với lưu điểm 0; không biến dữ liệu trống thành điểm 0.
4. **US2-AC4 Given** đang lưu bài nộp A, **When** chọn B trước response, **Then** kết quả A chỉ cập nhật A; lựa chọn, draft và form B không bị ghi đè.
5. **US2-AC5 Given** lỗi validation/network/conflict, **When** lưu thất bại rồi tải lại dữ liệu, **Then** draft phù hợp còn nguyên và lỗi/retry có ngữ cảnh, không báo thành công giả.

### User Story 3 — Biểu mẫu gọn nhưng không mất ngữ cảnh (Priority: P2)

Giảng viên mở tạo/sửa khi cần; học viên mở form bài làm mà vẫn nhận biết bài đang xử lý.

**Why this priority**: Giảm nội dung biểu mẫu lấn danh sách, giữ thao tác có thể tìm thấy.
**Independent Test**: Dùng bàn phím mở/thu form, nhập draft, đổi lựa chọn rồi quay lại.

**Acceptance Scenarios**:

1. **US3-AC1 Given** vừa mở phần bài tập, **When** chưa yêu cầu tạo/sửa/nộp, **Then** form tạo/sửa/bài làm thu gọn, action mở rõ và danh sách/chi tiết được ưu tiên.
2. **US3-AC2 Given** form có draft/lỗi, **When** thu/mở hoặc chuyển bài/bài nộp rồi quay lại trong cùng panel, **Then** draft vẫn gắn đúng đối tượng; chỉ reset draft đã gửi sau thành công xác nhận.
3. **US3-AC3 Given** tạo/sửa hợp lệ, **When** gửi, **Then** giữ giới hạn dữ liệu hiện hành, deadline theo giờ địa phương, pending chặn lặp; lỗi không đóng form/mất input.
4. **US3-AC4 Given** yêu cầu xóa hiện có, **When** mở xác nhận rồi Hủy/Escape, **Then** native dialog đóng, focus trả về trigger và không gửi yêu cầu xóa; bản thân feature không cấp quyền xóa mới.
5. **US3-AC5 Given** tiêu đề/yêu cầu/bài làm/feedback dài, **When** đọc hoặc thao tác, **Then** có cách xem đủ nội dung, ngắt dòng và vùng cuộn phù hợp, không che nút/action hoặc tràn ngang desktop.

### User Story 4 — Điều hướng và kiểm chứng đáng tin (Priority: P1)

Người dùng mở lại bài theo địa chỉ và không gặp dữ liệu/lựa chọn bị lẫn giữa tài nguyên.

**Why this priority**: Tránh nộp/chấm nhầm và hồi quy luồng học hiện có.
**Independent Test**: Deep link, refresh/back/forward, request chậm, hai vai trò và đường truy cập không được phép.

**Acceptance Scenarios**:

1. **US4-AC1 Given** có bài/bài nộp đang chọn, **When** refresh/back/forward/deep link, **Then** phục hồi lựa chọn hợp lệ trong khóa hiện tại; ID sai/không có không hiển thị tài nguyên khác như thể đã chọn đúng.
2. **US4-AC2 Given** request đang pending, **When** chuyển course/assignment/submission hoặc có write mới trước response tải lại, **Then** response cũ không ghi đè dữ liệu/lựa chọn/draft mới và không phát notice sai course.
3. **US4-AC3 Given** hai vai trò tại 1280×800 và 1440×900, zoom 100%, **When** dùng Tab/Shift+Tab/Enter/Space/Escape và nội dung dài, **Then** focus rõ, controls có tên, dialog đúng và không tràn ngang.
4. **US4-AC4 Given** loading/empty/no-match/error/pending/success, **When** thao tác/tải lại, **Then** phân biệt rõ trạng thái, retry hữu ích và draft được giữ trong vòng đời cho phép.
5. **US4-AC5 Given** người không có owner/enrollment hoặc ADMIN, **When** vào nội dung khóa hay gọi thao tác không được phép, **Then** server vẫn từ chối; dashboard, lesson/document, quiz/leave, account/auth và ranh giới ADMIN không hồi quy.

### Edge Cases

- EC-01: Không bài tập, không bài nộp, filter không có kết quả; không coi là cùng một empty state.
- EC-02: ID không hợp lệ/đã bị xóa, bài đang xem nằm ngoài filter, student không có bài nộp của mình.
- EC-03: Điểm null/0, feedback-only, bài chấm rồi, deadline null/quá hạn/vừa qua khi tab nền; server là nơi quyết định cuối.
- EC-04: Tiêu đề dài 160 ký tự, yêu cầu/bài làm 20.000 ký tự, feedback 5.000 ký tự, từ liền dài.
- EC-05: Request chậm/lỗi/409, gửi lặp, đổi lựa chọn hoặc course trước response, refresh chồng write.
- EC-06: Thu form/đổi bài không gửi dữ liệu; rời section/reload kết thúc panel và draft local, không có hứa lưu bền.
- EC-07: Dữ liệu thiếu không phải giá trị 0; bài đã nộp còn đọc được dù hết hạn hoặc chưa có điểm.
- EC-08: Thiếu phiên/tài nguyên thử hoặc browser control; ghi chưa chạy, không tạo/seed/xóa tài nguyên để hoàn tất nghiệm thu.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: MUST giữ nghiệp vụ nộp/cập nhật/chấm/feedback, giới hạn dữ liệu và quyền hiện có; STUDENT chỉ thấy bài nộp mình, INSTRUCTOR chỉ quản lý khóa sở hữu, ADMIN không thêm quyền nội dung.
- **FR-002**: MUST ưu tiên danh sách và chi tiết đang xử lý; form tạo/sửa/bài làm mặc định thu gọn, có action mở rõ.
- **FR-003**: MUST tìm tiêu đề/yêu cầu không phân biệt hoa thường; STUDENT lọc tất cả/cần nộp/đã nộp/đã chấm/quá hạn chưa nộp; INSTRUCTOR giữ tất cả/đã có bài nộp/có bài chưa chấm/có bài đã chấm.
- **FR-004**: MUST ưu tiên STUDENT: chưa nộp còn mở → đã nộp chưa chấm → đã chấm → quá hạn chưa nộp; trong nhóm hạn gần trước, không hạn sau, tie ổn định. INSTRUCTOR: có bài chưa chấm trước, sau đó hạn gần trước, tie ổn định.
- **FR-005**: MUST hiển thị selection rõ, giữ chi tiết khi filter che selection kèm notice/bỏ lọc; không tự đổi bài đang xem.
- **FR-006**: MUST cho đọc đủ yêu cầu, hạn theo giờ địa phương hoặc không hạn, điểm tối đa và trạng thái.
- **FR-007**: MUST cho STUDENT đọc nội dung/thời điểm đã nộp, điểm và feedback hiện có kể cả sau hạn; null là chưa chấm, 0 là điểm đã lưu.
- **FR-008**: MUST chỉ hiện action nộp/cập nhật khi chưa có điểm và chưa quá hạn, cập nhật khi thời gian/tab focus/dữ liệu deadline đổi; server vẫn quyết định cuối.
- **FR-009**: MUST giữ draft theo assignment/submission trong panel khi đổi selection/thu form, giữ khi lỗi/refresh tại panel, reset đúng draft sau thành công; không thêm autosave hay lưu local bền.
- **FR-010**: MUST tách danh sách bài nộp và một bài đang xem, hiển thị danh tính/thời gian/nội dung và form chấm đúng đối tượng.
- **FR-011**: MUST phân biệt điểm trống/null, điểm nguyên hợp lệ kể cả 0 và feedback; validation không đổi contract hiện có.
- **FR-012**: MUST giữ thao tác tạo/sửa/xóa đã có qua action gọn; xóa vẫn cần native confirmation dialog, Hủy/Escape không write và trả focus.
- **FR-013**: MUST phân biệt loading, empty, no-match, error/retry, pending và success; thông báo nêu đúng đối tượng, không trùng notice toàn trang.
- **FR-014**: MUST chặn gửi lặp theo đối tượng đang pending; field pending disabled; không xóa hoặc ghi đè draft của đối tượng khác.
- **FR-015**: MUST tránh stale response khi đổi course/assignment/submission hoặc refresh chồng write; merge đúng tài nguyên và không update sau unmount.
- **FR-016**: MUST phục hồi assignment/submission selection hợp lệ từ địa chỉ khi refresh/back/forward/deep link; lựa chọn mặc định chỉ khi địa chỉ không chỉ định, ID sai có trạng thái rõ.
- **FR-017**: MUST giữ thao tác keyboard, label, trạng thái chọn, focus-visible và focus khi disclosure/dialog mở/đóng; nội dung dài xem đủ, không tràn ngang hai desktop mục tiêu.
- **FR-018**: MUST giữ nguyên màn/logic bài học, session, quiz autosave/leave, protected document và các section khác ngoài kết nối điều hướng cần thiết.
- **FR-019**: MUST dùng style được giới hạn trong phần bài tập và thành phần/dependency hiện có; không thêm thư viện, mobile feature, nghiệp vụ backend/schema mới.
- **FR-020**: MUST nghiệm thu bằng test phù hợp, lint/build, desktop thật hai vai trò/hai viewport và HTTP quyền khi có điều kiện; ghi riêng fixture/live/chưa chạy và giữ task thiếu bằng chứng mở.
- **FR-021**: MUST giữ nguyên task/artifact feature 001/002; chỉ ghi baseline/open acceptance riêng, không chuyển task cũ thành việc hoàn tất của feature này.
- **FR-022**: MUST chỉ ghi dữ liệu live trên tài khoản/tài nguyên thử hiện có được xác định an toàn; không provision/seed/reset/delete để vượt nghiệm thu và không đọc/in secret.

### Key Entities *(include if feature involves data)*

- **Assignment**: bài thuộc khóa; tiêu đề, yêu cầu, hạn tùy chọn, điểm tối đa và bài nộp theo quyền hiện có.
- **Submission**: bài nộp thuộc assignment/người học; nội dung, thời điểm, điểm tùy chọn, feedback tùy chọn.
- **Selection và draft**: trạng thái giao diện theo khóa/bài/bài nộp; không thay data model hoặc tạo trạng thái nghiệp vụ mới.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ở cả hai vai trò và cả hai desktop mục tiêu, khi vào phần bài tập với form thu gọn, thấy tìm/lọc, ít nhất một bài (nếu có) và tiêu đề chi tiết đang xem trong vùng cao 800/900 px; không phải cuộn qua form tạo.
- **SC-002**: Với tập tình huống gồm chưa nộp/chờ chấm/đã chấm/quá hạn, tất cả bài trong bộ kiểm chứng có đúng trạng thái, thứ tự/nhóm lọc; filter không làm mất chi tiết đã chọn.
- **SC-003**: Mỗi bài đã nộp trong bộ kiểm chứng hiển thị đúng nội dung/feedback; hai trường hợp chưa có điểm và điểm 0 được phân biệt, kể cả sau hạn.
- **SC-004**: Với mọi kịch bản request chậm/lỗi/lặp/chuyển lựa chọn trong bộ kiểm chứng, không có response cập nhật nhầm đối tượng và draft không mất ngoài lifecycle đã công bố.
- **SC-005**: Có thể hoàn thành chọn bài, mở/thu form, chọn bài nộp và hủy dialog bằng bàn phím; cả hai desktop không tràn ngang với nội dung dài tới giới hạn hiện có.
- **SC-006**: Refresh/back/forward/deep link phục hồi đúng selection trong các ca hợp lệ; các ca ID sai không giả thành lựa chọn thành công.
- **SC-007**: Kiểm chứng tự động frontend bắt buộc đạt; hồi quy các khu vực đã nêu và server owner/enrollment/ADMIN có bằng chứng đúng loại, hoặc được ghi chưa chạy với task mở; chưa đủ bằng chứng không tuyên bố hoàn tất feature.
- **SC-008**: Toàn bộ thay đổi nằm trong giao diện/kết nối giao diện, test và artifacts feature mới; backend/dependency/schema/migration/constitution/managed skills và artifacts 001/002 giữ nguyên.

## Assumptions

- Dữ liệu bài tập/bài nộp được tải cùng khóa hiện tại, đủ cho tìm/lọc phía giao diện trong phạm vi một khóa; không thêm tìm kiếm toàn hệ thống hoặc pagination backend.
- “Cần chấm” dùng grade chưa có; feedback-only vẫn chưa có điểm. Không phát minh cờ đã đọc/rubric/thông báo.
- Mặc định chọn bài ưu tiên đầu tiên khi địa chỉ chưa chỉ định; khi có bài nộp, giảng viên mặc định xem bài chưa chấm đầu tiên, nếu không có thì bài mới nộp gần nhất.
- Query tìm/lọc giữ local như UI hiện có; selection có thể mở lại từ địa chỉ. Draft local chỉ trong vòng đời panel, không hứa giữ qua reload/rời section.
- Hiện chưa có tài nguyên thử ghi dữ liệu được xác định. Nghiệm thu read-only và fixture/component có thể tiến hành độc lập; thao tác ghi live chờ tài nguyên phù hợp.
- Chỉ desktop. Không đổi API/backend/schema/migration/session/quyền; không rubric, analytics, notification, OAuth, OCR hoặc AI ngoài.
