# Feature Specification: Cải thiện dashboard theo vai trò Lumina

**Feature Branch**: `main` — giữ nguyên nhánh hiện tại; không tạo/chuyển nhánh trong bước specify.

**Feature Directory**: `specs/001-improve-role-dashboards`

**Created**: 2026-10-28

**Status**: Accepted — 2026-11-02, isolated acceptance stack; see verification.md.

**Input**: Cải thiện dashboard Lumina cho STUDENT, INSTRUCTOR và ADMIN. Học viên dễ tìm khóa học và tiếp tục học; giảng viên dễ xem các khóa đang dạy và truy cập quản lý; quản trị viên dễ tìm và quản lý tài khoản theo quyền hiện có. Ưu tiên danh sách công việc theo vai trò, thu gọn biểu mẫu tạo/tham gia nhưng vẫn dễ tìm; thống nhất chữ, khoảng cách, nút và phản hồi. Chỉ desktop; giữ chức năng, quyền, contract, màn hình bài học và dữ liệu hiện có. Lần này chỉ viết đặc tả.

## User Scenarios & Testing

### User Story 1 - Học viên tìm khóa học và học tiếp (Priority: P1)

Là STUDENT, tôi muốn nhận ra các khóa mình đã tham gia, tìm khóa cần học và mở đúng nội dung tiếp theo ngay từ dashboard.

**Why this priority**: Đây là tác vụ chính khi học viên quay lại hệ thống; nội dung học cần xuất hiện trước các thao tác tham gia khóa mới.

**Independent Test**: Dùng học viên đã tham gia các khóa có trạng thái chưa bắt đầu, đang học, hoàn thành và chưa có bài học; kiểm tra tìm kiếm, lọc và mở khóa mà không cần thực hiện thao tác quản trị hoặc tạo khóa.

**Acceptance Scenarios**:

1. **US1-AC1 — Given** học viên có ít nhất một khóa và danh sách đã tải thành công, **When** mở dashboard ở các viewport desktop nghiệm thu, **Then** không cần cuộn vẫn thấy tiêu đề danh sách, ô tìm kiếm, tên ít nhất một khóa và hành động chính của khóa đó; không có biểu mẫu tham gia mở sẵn phía trên.
2. **US1-AC2 — Given** có nhiều khóa đã tham gia, **When** tìm theo tên khóa, mô tả hoặc tên giảng viên và chọn bộ lọc tiến độ hiện có, **Then** chỉ các khóa khớp đồng thời hai điều kiện được hiển thị, không phân biệt chữ hoa/thường; xóa từ khóa và chọn tất cả khôi phục danh sách.
3. **US1-AC3 — Given** một khóa có bài học và dữ liệu tiến độ đầy đủ, **When** xem khóa trên dashboard, **Then** nhãn và hành động phân biệt được ba trường hợp: chưa bắt đầu — “Bắt đầu học”; đang học — “Tiếp tục học”; hoàn thành — “Ôn tập lại”.
4. **US1-AC4 — Given** khóa còn bài chưa hoàn thành, **When** chọn “Bắt đầu học” hoặc “Tiếp tục học”, **Then** mở bài chưa hoàn thành đầu tiên theo thứ tự của khóa bằng điều hướng hiện có; không chuyển tới một khóa hoặc bài khác. Khóa hoàn thành mở khu vực bài học để ôn lại.
5. **US1-AC5 — Given** khóa chưa có bài học hoặc chưa đủ dữ liệu tiến độ, **When** xem khóa, **Then** hiển thị lần lượt “Chưa có bài học” hoặc “Tiến độ chưa có dữ liệu”, có thể “Xem khóa học”, không biểu diễn dữ liệu thiếu thành tiến độ 0% hay hứa tiếp tục một bài không xác định.
6. **US1-AC6 — Given** đang mở khóa để học tiếp, **When** việc tải nội dung thất bại hoặc quyền truy cập đã thay đổi, **Then** thông báo lỗi xuất hiện tại vùng dễ nhận biết trên dashboard, không báo điều hướng thành công và người dùng có thể thử lại.

---

### User Story 2 - Giảng viên tìm và quản lý khóa đang dạy (Priority: P1)

Là INSTRUCTOR, tôi muốn thấy các khóa mình đang sở hữu, tìm đúng khóa và đi tới quản lý hoặc lấy mã tham gia.

**Why this priority**: Danh sách khóa đang dạy là điểm vào công việc thường xuyên của giảng viên; biểu mẫu tạo khóa mới không được che khuất nó.

**Independent Test**: Dùng giảng viên sở hữu nhiều khóa; kiểm tra tìm kiếm, sắp xếp, mở quản lý và sao chép mã mà không cần tạo khóa mới.

**Acceptance Scenarios**:

1. **US2-AC1 — Given** giảng viên có ít nhất một khóa và danh sách đã tải, **When** mở dashboard tại các viewport nghiệm thu, **Then** trong khung nhìn đầu tiên có tiêu đề danh sách, tìm kiếm, sắp xếp, tên ít nhất một khóa và “Quản lý khóa học”; biểu mẫu tạo khóa mặc định thu gọn.
2. **US2-AC2 — Given** có nhiều khóa, **When** tìm kiếm và chọn “Cập nhật gần đây” hoặc “Tên A–Z”, **Then** danh sách khóa sở hữu được lọc và sắp xếp đúng lựa chọn; không xuất hiện khóa của giảng viên khác.
3. **US2-AC3 — Given** một khóa thuộc giảng viên, **When** chọn “Quản lý khóa học”, **Then** mở khu vực tổng quan của đúng khóa theo điều hướng hiện có.
4. **US2-AC4 — Given** khóa có mã tham gia, **When** chọn sao chép mã, **Then** có xác nhận khi sao chép thành công; nếu trình duyệt không cho sao chép, thông báo cho phép đọc và sao chép mã thủ công, không báo thành công giả.
5. **US2-AC5 — Given** chưa có khóa nào hoặc bộ lọc không có kết quả, **When** xem danh sách, **Then** hai trường hợp có thông báo khác nhau và chỉ dẫn tương ứng để tạo khóa hoặc điều chỉnh tìm kiếm.
6. **US2-AC6 — Given** danh sách đã tải, **When** xem một khóa, **Then** đọc được tên, mô tả hoặc nhãn chưa có mô tả, ngữ cảnh khóa sở hữu, số bài và số học viên khi có dữ liệu; số liệu chưa được cung cấp phải có nhãn chưa có dữ liệu, không được thay bằng 0.

---

### User Story 3 - Quản trị viên tìm và quản lý tài khoản (Priority: P1)

Là ADMIN, tôi muốn nhanh chóng tìm học viên/giảng viên, nhận biết vai trò và trạng thái tài khoản, rồi cập nhật hồ sơ hoặc quyền truy cập trong phạm vi được phép.

**Why this priority**: ADMIN đã có công việc quản lý tài khoản riêng; giao diện cần ưu tiên công việc này và không gán thêm quyền quản lý nội dung khóa học.

**Independent Test**: Dùng quản trị viên cùng danh sách học viên/giảng viên có tài khoản hoạt động, bị khóa và có dữ liệu liên kết; kiểm tra tìm kiếm, phân trang, cập nhật và xác nhận thao tác mà không dùng luồng học tập.

**Acceptance Scenarios**:

1. **US3-AC1 — Given** ADMIN có phiên hợp lệ và danh sách đã tải, **When** vào trang chính, **Then** hiển thị khu vực quản trị tài khoản hiện có; nếu có kết quả, khung nhìn đầu tiên có tìm kiếm, tổng số tài khoản phù hợp và ít nhất một tài khoản cùng thao tác quản lý. Không hiển thị nút tạo/tham gia khóa học cho ADMIN.
2. **US3-AC2 — Given** danh sách có học viên và giảng viên, **When** tìm theo tên/email hoặc chuyển trang, **Then** kết quả và tổng số tương ứng truy vấn hiện tại, đổi từ khóa bắt đầu lại từ trang đầu, không nhận kết quả cũ ghi đè truy vấn mới. Tài khoản ADMIN không xuất hiện trong danh sách quản lý này.
3. **US3-AC3 — Given** một tài khoản trong danh sách, **When** xem hoặc sửa, **Then** nhận biết được họ tên, email, vai trò, hoạt động/bị khóa, ngày tham gia và các số lượng liên quan đã có dữ liệu; chỉ họ tên và vai trò INSTRUCTOR/STUDENT được chỉnh trong luồng lưu hồ sơ, email không trở thành trường sửa.
4. **US3-AC4 — Given** đã sửa họ tên hợp lệ hoặc thay đổi vai trò, **When** lưu, **Then** thay đổi vai trò cần xác nhận có danh tính tài khoản đích; chỉ cập nhật thông tin đã lưu sau khi thành công. Nếu đổi vai trò bị từ chối vì khóa sở hữu/lượt tham gia còn liên kết, hiển thị lý do, giữ dữ liệu đang sửa và không biểu diễn vai trò mới là đã có hiệu lực.
5. **US3-AC5 — Given** ADMIN chọn khóa/mở khóa, **When** hộp xác nhận xuất hiện, **Then** nêu rõ tài khoản và tác động; hủy không làm thay đổi tài khoản. Xác nhận thành công cập nhật trạng thái; khóa giữ nguyên cơ chế thu hồi phiên hiện có. Thất bại không đổi trạng thái thành công trên màn hình.
6. **US3-AC6 — Given** còn thay đổi hồ sơ chưa lưu, **When** danh sách cùng trang được cập nhật lại hoặc xử lý khóa/mở khóa tài khoản, **Then** bản chỉnh đang nhập không bị ghi đè bởi thông tin cũ; sau lưu thành công mới coi bản chỉnh đó là đã lưu.
7. **US3-AC7 — Given** kết quả tìm kiếm rỗng, chưa có tài khoản quản lý hoặc tải thất bại, **When** xem trang quản trị, **Then** phân biệt rõ ba trạng thái, có hướng điều chỉnh tìm kiếm hoặc thử lại và không diễn giải lỗi tải là “0 tài khoản”.

---

### User Story 4 - Tạo hoặc tham gia khóa học qua biểu mẫu thu gọn (Priority: P2)

Là STUDENT/INSTRUCTOR, tôi muốn mở nhanh biểu mẫu đúng vai trò khi cần và dành phần lớn dashboard cho các khóa hiện có.

**Why this priority**: Giữ chức năng thêm khóa trong tầm tiếp cận, đồng thời giảm diện tích dành cho tác vụ ít thường xuyên hơn.

**Independent Test**: Từ dashboard có dữ liệu hoặc rỗng, mở/thu gọn biểu mẫu và kiểm tra nhập, lỗi, thành công với từng vai trò; không cần sửa trang bài học.

**Acceptance Scenarios**:

1. **US4-AC1 — Given** dashboard vừa mở, **When** xem khung nhìn đầu tiên, **Then** STUDENT thấy “Tham gia khóa học”, INSTRUCTOR thấy “Tạo khóa học”; một thao tác mở đầy đủ biểu mẫu đúng vai trò và một thao tác thu gọn/đóng, không cần rời dashboard.
2. **US4-AC2 — Given** đã nhập nội dung nhưng chưa gửi, **When** thu gọn rồi mở lại trong cùng lần xem trang, **Then** giữ nội dung đã nhập; việc đóng hoặc mở biểu mẫu không gửi yêu cầu tạo/tham gia. Không yêu cầu giữ bản nhập sau refresh hoặc rời trang.
3. **US4-AC3 — Given** giảng viên mở biểu mẫu tạo, **When** nhập tên khóa 3–120 ký tự sau khi bỏ khoảng trắng đầu/cuối và mô tả tối đa 4.000 ký tự rồi gửi, **Then** chỉ coi là tạo thành công khi hệ thống xác nhận; khóa mới xuất hiện đúng một lần, mã tham gia được cung cấp và danh sách được cập nhật.
4. **US4-AC4 — Given** học viên mở biểu mẫu tham gia, **When** gửi mã hợp lệ gồm 8 ký tự trong 0–9/A–F, cho phép nhập chữ thường và khoảng trắng ở hai đầu, **Then** chuẩn hóa theo quy tắc hiện có; thành công thêm hoặc cập nhật đúng một khóa và tiến độ thực tế, không tạo mục trùng khi đã tham gia.
5. **US4-AC5 — Given** dữ liệu không hợp lệ, mã không tồn tại, lỗi mạng hoặc dịch vụ từ chối, **When** gửi biểu mẫu, **Then** có thông báo hữu ích gắn với tác vụ, giữ nội dung để sửa/thử lại và không báo thành công. Trong lúc gửi, không thể gửi lặp cùng thao tác.
6. **US4-AC6 — Given** vừa tạo/tham gia thành công, **When** biểu mẫu được thu gọn hoặc đóng, **Then** thông báo kết quả vẫn nhận biết được trên dashboard; trường nhập được làm mới sau thành công, không xóa chúng sau thất bại.

---

### User Story 5 - Trải nghiệm desktop nhất quán, có thể phục hồi (Priority: P2)

Là người dùng ở bất kỳ vai trò nào, tôi muốn hiểu thứ tự thông tin, dùng được các thao tác bằng bàn phím và biết tác vụ đã hoàn tất hay cần xử lý lỗi.

**Why this priority**: Đây là nền tảng để ba trang chính có cùng mức độ rõ ràng và không khiến người dùng hiểu sai trạng thái.

**Independent Test**: Tại mỗi vai trò, kiểm tra hai viewport desktop, dữ liệu dài, tìm kiếm không khớp, lỗi tải và luồng Tab/Enter/Space/Escape.

**Acceptance Scenarios**:

1. **US5-AC1 — Given** lần lượt mở ba trang chính ở 1280×800 và 1440×900, mức zoom 100%, **When** xem và thao tác, **Then** không phải cuộn ngang toàn trang, không có chữ/nút chồng lấn và các hành động chính vẫn đọc, truy cập được; danh sách được ưu tiên hơn lời chào hoặc thống kê phụ.
2. **US5-AC2 — Given** các tiêu đề, nội dung phụ, trường nhập và nút cùng ý nghĩa ở ba vai trò, **When** so sánh, **Then** cùng cấp thông tin dùng cùng quy tắc cỡ/độ đậm chữ, khoảng cách, kiểu nút và trạng thái; hành động nguy hiểm phân biệt với hành động chính và có nhãn mô tả ngoài màu sắc.
3. **US5-AC3 — Given** chỉ dùng bàn phím, **When** duyệt bằng Tab/Shift+Tab và kích hoạt bằng phím phù hợp, **Then** thứ tự focus theo thứ tự nội dung, focus luôn nhìn thấy, mọi trường có nhãn; nếu mở hộp thoại thì focus ở trong hộp khi mở, Escape/hủy đóng hộp và trả focus về nút đã mở.
4. **US5-AC4 — Given** dữ liệu đang tải, **When** xem danh sách hoặc số lượng, **Then** có thông báo tải, không hiển thị số 0 như kết quả thật. Tải lại có thể giữ kết quả trước kèm nhãn đang cập nhật; kết quả lỗi không giả làm một danh sách rỗng thành công.
5. **US5-AC5 — Given** tác vụ đang chạy, thành công hoặc thất bại, **When** trạng thái thay đổi, **Then** có phản hồi văn bản gần tác vụ hoặc tại vùng thông báo dễ tìm, được công cụ đọc màn hình nhận biết; chặn thao tác gửi lặp phù hợp và cho phép thử lại sau lỗi.
6. **US5-AC6 — Given** lỗi mạng/dịch vụ khi xác minh phiên, **When** người dùng chờ hoặc thử lại, **Then** giữ luồng phục hồi phiên hiện có, không tự coi đó là đăng xuất. Phiên không hợp lệ/hết hạn và truy cập sai vai trò vẫn được xử lý theo quyền hiện có.
7. **US5-AC7 — Given** phiên hợp lệ của một trong ba vai trò, **When** dùng điều hướng chính, liên kết thương hiệu, tài khoản hoặc đăng xuất, **Then** có thể nhận biết tên/vai trò và mục đang mở, trở về đúng trang chính theo vai trò, mở trang tài khoản hiện có hoặc kết thúc phiên như trước; STUDENT/INSTRUCTOR không truy cập được quản trị, ADMIN không được mở giao diện học/quản lý khóa qua việc đổi bố cục này.

### Edge Cases

- **EC-01**: Tên khóa, tên người dùng hoặc email dài phải xuống dòng/rút gọn có cách đọc đủ; không đẩy nút ra ngoài viewport. Mô tả trống không thành khối trắng chiếm chỗ quá mức hoặc nội dung giả.
- **EC-02**: Khóa chưa có bài khác với khóa có bài nhưng học viên chưa bắt đầu; tiến độ không đủ dữ liệu khác với giá trị 0 hợp lệ.
- **EC-03**: Danh sách thật sự rỗng khác với tìm kiếm không khớp và tải thất bại; chỉ hiển thị tổng số sau khi có kết quả hợp lệ hoặc ghi rõ số cũ đang cập nhật.
- **EC-04**: Gõ tìm kiếm liên tục/chuyển trang nhanh chỉ giữ kết quả của lựa chọn cuối; không ghi đè bản chỉnh tài khoản chưa lưu khi làm mới cùng trang.
- **EC-05**: Nhấn gửi/xác nhận liên tiếp, mất mạng, lỗi dịch vụ và lỗi quyền không tạo thành công giả hoặc thay đổi vai trò/trạng thái chỉ trên màn hình.
- **EC-06**: Khóa học bị xóa, học viên đã bị gỡ hoặc tài khoản bị khóa/đổi vai trò sau lúc tải danh sách được xử lý bằng cơ chế lỗi/phiên hiện có, không cấp quyền từ dữ liệu cũ.
- **EC-07**: Quyền clipboard bị từ chối vẫn có mã để sao chép thủ công; không hiện “Đã sao chép” khi thao tác thất bại.
- **EC-08**: Hủy xác nhận đổi vai trò/khóa/mở khóa không thực hiện cập nhật; mất quyền giữa lúc sửa phải được báo mà không thay đổi dữ liệu thành công trên màn hình.
- **EC-09**: Trang đầu/cuối, một trang và kết quả tìm kiếm mới phải có điều khiển phân trang hợp lệ; tổng số chỉ nói về tập tài khoản phù hợp đang quản lý.
- **EC-10**: Sau khi tạo/tham gia khóa thành công, đóng biểu mẫu không làm mất thông báo kết quả; sau thất bại, đóng/mở lại trong cùng trang không làm mất nội dung đã nhập.

## Requirements

### Phạm vi và ranh giới tương thích

- Cải thiện dashboard học viên/giảng viên tại `/dashboard` và trang chính quản trị tài khoản tại `/admin`; chuẩn hóa phần điều hướng dùng trên ba trải nghiệm này.
- Giữ điểm vào theo vai trò, liên kết tài khoản, đăng xuất, chức năng tìm kiếm/lọc/sắp xếp/phân trang và quyền truy cập hiện có.
- “Bổ sung ADMIN” trong feature này nghĩa là đưa trang quản trị tài khoản hiện có vào cùng phạm vi cải thiện giao diện. Không tạo dashboard thống kê hệ thống hoặc quyền quản lý mọi khóa học cho ADMIN.
- Ngoài phạm vi: redesign trang bài học, bài tập, quiz, tài khoản hoặc đăng nhập; phát triển mobile; thay đổi API/contract, database, schema hoặc migration; thêm chức năng quản trị mới, phân tích toàn hệ thống, thông báo, OAuth hay AI ngoài.
- Nếu dùng chung thành phần/style với trang ngoài phạm vi, phải bảo toàn hành vi và bố cục hiện hành của các trang đó; không mở rộng redesign sang chúng.

### Functional Requirements

- **FR-001**: Mỗi vai trò phải vào đúng trang chính và chỉ thấy hành động thuộc quyền hiện có; giữ điều hướng tài khoản và đăng xuất. (US1-AC1, US2-AC1, US3-AC1, US5-AC6, US5-AC7; EC-06)
- **FR-002**: Khi có dữ liệu, danh sách và hành động chính theo vai trò phải xuất hiện trong khung nhìn đầu tiên tại cả hai viewport nghiệm thu; lời chào, thống kê và biểu mẫu không được đẩy chúng xuống dưới. (US1-AC1, US2-AC1, US3-AC1, US5-AC1)
- **FR-003**: STUDENT phải tìm theo tên khóa/mô tả/giảng viên và kết hợp các bộ lọc tất cả, chưa bắt đầu, đang học, hoàn thành; giữ quy tắc dữ liệu hiện có. (US1-AC2; EC-02, EC-03)
- **FR-004**: Thẻ khóa học phải cung cấp tên, mô tả hoặc nhãn thiếu mô tả, giảng viên/ngữ cảnh sở hữu và số bài; STUDENT có tiến độ khi đủ dữ liệu, INSTRUCTOR có số học viên/mã khi được cung cấp. Không thay dữ liệu thiếu bằng số giả. (US1-AC3, US1-AC5, US2-AC4, US2-AC6, US5-AC4; EC-01, EC-02)
- **FR-005**: Hành động học phải phản ánh chưa bắt đầu/đang học/hoàn thành; bắt đầu hoặc tiếp tục mở bài chưa hoàn thành đầu tiên theo thứ tự khóa, ôn tập mở khu vực bài học hiện có. (US1-AC3, US1-AC4)
- **FR-006**: Khóa không có bài hoặc thiếu tiến độ phải có nhãn đúng và đường xem khóa; lỗi mở khóa/học tiếp phải có phản hồi dễ thấy và cho phép thử lại. (US1-AC5, US1-AC6; EC-02, EC-06)
- **FR-007**: INSTRUCTOR phải giữ tìm kiếm và hai kiểu sắp xếp hiện có trên tập khóa sở hữu, mở đúng tổng quan quản lý và sao chép mã với thông báo đúng kết quả. (US2-AC2, US2-AC3, US2-AC4; EC-07)
- **FR-008**: Tạo/tham gia phải mặc định thu gọn, có nhãn đúng vai trò trong khung nhìn đầu và mở/đóng mỗi chiều bằng một thao tác, không đổi trang hoặc gửi dữ liệu khi chỉ mở/đóng. (US4-AC1, US4-AC2)
- **FR-009**: Biểu mẫu phải giữ giá trị chưa gửi khi đóng/mở trong cùng lần xem trang; chỉ xóa sau thành công và giữ phản hồi kết quả dễ thấy khi thu gọn. (US4-AC2, US4-AC5, US4-AC6; EC-10)
- **FR-010**: Tạo khóa phải giữ quy tắc tên/mô tả, xác nhận thành công, mã tham gia và cập nhật một mục danh sách; tham gia phải giữ chuẩn hóa/kiểm tra mã, tiến độ thực tế và không tạo mục trùng. (US4-AC3, US4-AC4, US4-AC5)
- **FR-011**: ADMIN phải tìm theo tên/email, xem tổng kết quả phù hợp và phân trang hiện có; thay từ khóa về trang đầu, phản hồi cũ không thay kết quả mới. Không tính danh sách tài khoản quản lý thành thống kê toàn hệ thống. (US3-AC2, US3-AC7; EC-04, EC-09)
- **FR-012**: Danh sách ADMIN phải nhận biết được tên/email/vai trò/trạng thái/ngày tham gia và số lượng liên quan được cung cấp, cho phép sửa họ tên/vai trò INSTRUCTOR hoặc STUDENT; không sửa email, tài khoản ADMIN hay cấp vai trò ADMIN trong luồng này. (US3-AC2, US3-AC3)
- **FR-013**: Đổi vai trò phải xác nhận tài khoản đích và giữ từ chối khi còn dữ liệu liên kết; lỗi không đổi vai trò có hiệu lực hoặc xóa bản chỉnh. (US3-AC4; EC-08)
- **FR-014**: Khóa/mở khóa phải xác nhận đối tượng/tác động, hủy không cập nhật; thành công/lỗi phản ánh đúng trạng thái thực và giữ cơ chế thu hồi phiên hiện có khi khóa. (US3-AC5; EC-05, EC-08)
- **FR-015**: Tải lại danh sách cùng trang và thao tác khóa/mở khóa không được ghi đè bản chỉnh hồ sơ chưa lưu; chỉ coi lưu hoàn tất khi được xác nhận. (US3-AC4, US3-AC6; EC-04)
- **FR-016**: Ba trang phải phân biệt tải ban đầu, đang làm mới, rỗng, không khớp tìm kiếm, lỗi có thử lại, đang xử lý và thành công; không dùng dữ liệu giả hay thông báo thành công cho yêu cầu thất bại. (US1-AC6, US2-AC5, US3-AC7, US4-AC5, US5-AC4, US5-AC5; EC-03, EC-05)
- **FR-017**: Mỗi tác vụ gửi/lưu/xác nhận đang chạy phải có phản hồi và không nhận gửi lặp cùng tác vụ; phục hồi sau lỗi để người dùng thử lại. (US4-AC5, US5-AC5; EC-05)
- **FR-018**: Ba vai trò phải dùng nhất quán phân cấp chữ, khoảng cách, nhãn, nút chính/phụ/nguy hiểm và phản hồi; trạng thái không được truyền đạt chỉ bằng màu. (US5-AC2, US5-AC5)
- **FR-019**: Giao diện desktop phải giữ nội dung/hành động trong viewport, xử lý chuỗi dài, không cuộn ngang toàn trang, không chồng lấn và vẫn đọc được thông tin cần thiết. (US5-AC1; EC-01)
- **FR-020**: Tất cả thao tác phải dùng được bằng bàn phím, có nhãn/focus và thông báo đọc được bằng công cụ hỗ trợ; hộp thoại nếu dùng phải quản lý focus và hủy/đóng đúng hành vi. (US5-AC3, US5-AC5)
- **FR-021**: Giữ xử lý phiên và quyền ở hệ thống hiện có; lỗi mạng/dịch vụ xác minh phiên có thể thử lại, lỗi hết hạn/sai quyền không được biến thành quyền truy cập mới. (US5-AC6; EC-06)
- **FR-022**: Chỉ thay đổi trải nghiệm desktop trong phạm vi đã nêu, không thay contract hoặc mô hình dữ liệu và không làm đổi màn hình bài học hay các luồng ngoài phạm vi. (Phạm vi; US1-AC4, US2-AC3, US5-AC6)

### Key Entities

- **Người dùng và phiên hiện tại**: Danh tính, tên hiển thị, vai trò ADMIN/INSTRUCTOR/STUDENT và trạng thái truy cập hiện có.
- **Khóa học**: Tên, mô tả, giảng viên/chủ sở hữu, số bài, số lượt tham gia và mã dành cho giảng viên; phạm vi nhìn thấy theo người dùng hiện tại.
- **Tiến độ học viên**: Số bài hoàn thành/tổng bài và trạng thái học trong khóa; không bổ sung dữ liệu “bài đọc gần nhất”.
- **Tài khoản được quản lý**: Học viên/giảng viên, hồ sơ, trạng thái khóa, ngày tham gia và số lượng liên quan sẵn có; có quy tắc cấm đổi vai trò khi còn liên kết.
- **Trạng thái giao diện tạm thời**: Từ khóa, bộ lọc/sắp xếp/trang hiện tại, mở/thu gọn, dữ liệu đang nhập, tác vụ và phản hồi; không bổ sung cam kết lưu bền các trạng thái này.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Với cả 3 vai trò tại 1280×800 và 1440×900, zoom 100%, dữ liệu hợp lệ có ít nhất một mục, cả 6 lượt kiểm tra đều thấy tìm kiếm, tên một mục và hành động chính trong khung nhìn đầu tiên mà không cuộn. (FR-001, FR-002, FR-019)
- **SC-002**: STUDENT/INSTRUCTOR mở và thu gọn biểu mẫu đúng vai trò mỗi chiều bằng tối đa 1 lần kích hoạt; thao tác đó không gửi dữ liệu và giữ nội dung đang nhập trong cùng trang. (FR-008, FR-009)
- **SC-003**: Từ một khóa đang hiển thị, học viên mở bắt đầu/tiếp tục/ôn tập bằng 1 lần kích hoạt và giảng viên vào quản lý bằng 1 lần kích hoạt; toàn bộ trường hợp trong US1-AC3/AC4/AC5 và US2-AC3 dẫn đến đúng khóa/trạng thái. (FR-004, FR-005, FR-006, FR-007)
- **SC-004**: Các kịch bản tìm kiếm/lọc/sắp xếp/phân trang US1-AC2, US2-AC2, US3-AC2 cho đúng tập kết quả và lựa chọn; thử phản hồi cũ tới muộn không thay kết quả cuối. (FR-003, FR-007, FR-011)
- **SC-005**: Các trường hợp ADMIN lưu hợp lệ, bị từ chối đổi vai trò, hủy/xác nhận khóa/mở khóa và làm mới khi còn bản chỉnh đều đáp ứng US3-AC3 đến US3-AC6; không có thay đổi giả sau lỗi hoặc hủy. (FR-012 đến FR-015)
- **SC-006**: Toàn bộ điều khiển trong ba trang dùng được với bàn phím; mọi hộp thoại được dùng có thể hủy và trả focus, mọi phản hồi lỗi/thành công có văn bản được công cụ hỗ trợ nhận biết. (FR-018, FR-020)
- **SC-007**: Tất cả trạng thái tải/rỗng/không khớp/lỗi/đang gửi/thành công áp dụng cho các luồng đều có kết quả phân biệt được; thử lỗi mạng, lỗi quyền và mất quyền clipboard không sinh thông báo thành công giả, số liệu giả hoặc gửi lặp. (FR-004, FR-006, FR-007, FR-016, FR-017, FR-021)
- **SC-008**: Tại cả hai viewport, ba trang cùng tuân theo một bộ quy tắc cho tiêu đề, nội dung phụ, trường nhập và nút; dữ liệu dài không che hành động, gây chồng lấn hoặc cuộn ngang toàn trang. (FR-018, FR-019)
- **SC-009**: So với mốc trước triển khai, giữ được toàn bộ chức năng trong phạm vi, điều hướng theo vai trò, quyền trên tài nguyên, xử lý phiên và các luồng tới bài học; không cần thay đổi contract, dữ liệu hoặc tính năng ngoài phạm vi để đạt các tiêu chí trên. (FR-001, FR-010, FR-021, FR-022)

## Assumptions

- Bổ sung ADMIN được hiểu theo chức năng quản trị tài khoản hiện có, phù hợp yêu cầu giữ chức năng/quyền/contract; không giả định quyền quản trị mọi nội dung khóa học.
- Hai viewport 1280×800 và 1440×900, zoom 100%, là mốc desktop nghiệm thu đề xuất. Không cam kết thiết kế mới cho mobile trong feature này.
- “Tiếp tục học” giữ nghĩa mở bài chưa hoàn thành đầu tiên theo thứ tự hiện có; không có yêu cầu mới về ghi nhớ bài đã đọc gần nhất.
- Chọn hình thức thu gọn trực tiếp hay hộp thoại, thông số chữ/màu/khoảng cách và cách tổ chức thành phần thuộc bước plan; phương án phải đạt các tiêu chí quan sát được ở trên.
- Phụ thuộc vào chức năng hiện có để xác minh phiên, lấy khóa/tiến độ, tạo/tham gia, lấy chi tiết khóa, tìm/phân trang/cập nhật tài khoản. Không thêm dữ liệu mới hoặc thay quy tắc máy chủ để hoàn thành giao diện.
- Kiểm chứng sau triển khai cần dữ liệu có sẵn cho cả ba vai trò và các trạng thái đã mô tả; dữ liệu thử nghiệm nếu cần phải được chuẩn bị riêng theo phạm vi được giao, không tự seed hay sửa dữ liệu thật trong bước specify.
- Đặc tả này dựa trên yêu cầu và đối chiếu mã hiện tại; chưa quan sát giao diện đang chạy hoặc thực hiện app tests. Acceptance scenarios và success criteria là mục tiêu nghiệm thu, không phải kết quả đã đạt.
