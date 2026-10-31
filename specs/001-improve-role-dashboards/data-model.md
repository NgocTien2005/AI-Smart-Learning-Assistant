# Data model và state UI được bảo toàn

**Date**: 2026-10-30 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Không thay Prisma model, migration hoặc contract server. Đây là phần dữ liệu UI cần
đọc và state tạm cần giữ để triển khai spec. Nguồn sự thật:
[schema](../../backend/prisma/schema.prisma), [courses](../../backend/src/routes/courses.js),
[admin](../../backend/src/routes/admin.js) và [API contract](contracts/existing-api.md).

## Entities đọc từ hệ thống hiện có

| Entity | Thuộc tính UI dùng | Quan hệ / invariant |
| --- | --- | --- |
| SessionUser | id, name, email, role | Lấy từ `/api/auth/me`; role ADMIN/INSTRUCTOR/STUDENT; không dựa vào cached role để cấp quyền |
| Course | id, title, description, createdAt, updatedAt, instructor, `_count.lessons`, `_count.enrollments`, joinCode khi dành cho owner | Instructor sở hữu, student chỉ nhìn tập được tham gia; id là khóa upsert/dedupe |
| CourseProgress | completedLessons, progressPercent, tổng bài từ `_count.lessons` | Server bổ sung cho STUDENT; số 0 có nghĩa khi được cung cấp, thiếu không thay bằng 0 |
| CourseLesson dùng cho học tiếp | id, order, createdAt, isCompleted | Dùng lesson list từ detail theo order/createdAt; không thêm last-read record |
| ManagedUser | id, name, email, role, isActive, createdAt, `_count.courses/enrollments/submissions` | Chỉ STUDENT/INSTRUCTOR trong danh sách ADMIN; PATCH trả subset, cần merge chứ không xóa createdAt/counts |
| ManagedUserPage | users, page, pageSize, total, totalPages | Mỗi snapshot gắn normalized query và page; pageSize hiện 25; totalPages server có thể 0 khi rỗng |

Course list hiện dùng include nên có thể chứa các scalar khác của model; contract ở
đây không mở rộng response hoặc yêu cầu server lọc scalar mới. Không hiển thị joinCode
như quyền dành cho student chỉ vì một field có trong JSON. Không đưa secret vào UI/log.

## Validation và trạng thái dẫn xuất

- Title tạo khóa: trim rồi 3–120 ký tự; description trim, tối đa 4.000. Chuỗi thô được
  giữ để sửa khi lỗi; normalized payload chỉ chụp tại submit. Khóa mới có mã do server sinh.
- Join: chuỗi thô có thể chứa whitespace hai đầu; normalized = trim + uppercase, đúng
  8 ký tự hex. Không cắt chuỗi âm thầm hoặc dùng maxLength=8 chặn raw value trước trim.
- ADMIN name: trim, 2–80; role chỉ hai managed roles; active là boolean; email read-only.
  Query tên/email trim và tối đa 120 ký tự để khớp server; đổi query về page 1.
- Quy tắc progress theo code hiện tại: có bài và đủ dữ liệu → chưa bắt đầu/đang học/
  hoàn thành; tổng bài 0 → chưa có bài; thiếu dữ liệu → chưa có tiến độ. Giữ quy tắc lọc
  hiện có (lọc “Chưa bắt đầu” dùng completedLessons=0); nhãn card vẫn phân biệt khóa rỗng.
- Instructor enrollment tổng là lượt ghi danh qua các khóa, không phải số người học duy
  nhất. Tổng ADMIN là số học viên/giảng viên khớp query, không phải tất cả user hệ thống.
- `null` hoặc field vắng không trở thành số 0. Hiển thị “Chưa có dữ liệu”/dấu gạch có
  nhãn ngữ cảnh; không append ký hiệu % vào giá trị chưa có dữ liệu.

## State tạm của DashboardPage

| Nhóm | State / trách nhiệm | Lifecycle |
| --- | --- | --- |
| Read | courses, loading/loadError, last valid snapshot, list generation/controller | Chỉ GET còn hiện hành được thay snapshot; unmount invalidate |
| View | searchQuery, progressFilter, sort | Giữ lọc/sắp xếp client-side hiện có; không thêm persistence/URL mới |
| Entry form | isEntryOpen, form.title/description/joinCode, field errors | Page sở hữu; component nhận open/onOpenChange và refs/focus, không có open state thứ hai; mở/đóng không clear hoặc fetch |
| Entry write | submitting + ref lock, submitted payload | Chụp payload hợp lệ; khóa fields/submit; server success clear, error giữ |
| Open course | pending course id, intent generation/controller, retry target | Ý định mới vô hiệu ý định cũ; chỉ response mới nhất được navigate |
| Notice | type/text/action/target theo tác vụ | Ngoài hidden panel; không clear chỉ vì đóng hoặc refetch |

### Chuyển trạng thái form

1. Closed → Open: hiện panel, focus input đầu. Open → Closed: giữ draft/error, trả focus
   trigger nếu focus đang ở panel; không gọi API.
2. Open + submit: normalize/validate. Invalid giữ Open và focus lỗi; Valid vào Sending,
   đặt ref lock ngay trước request, invalidate GET list cũ.
3. Sending có thể đóng panel; write vẫn đang chạy. Chỉ hủy GET không có nghĩa hủy server
   write, không hứa transaction bị hủy khi người dùng đóng/rời trang.
4. Success: upsert course id đúng một lần, clear payload đã gửi, thu gọn; giữ notice và
   mã/tiến độ thực. Reconcile GET có guard nếu cần; không để response trước write đảo lại.
   Nếu chưa có snapshot danh sách đầy đủ, phải GET lại trước khi công bố tổng/phạm vi
   danh sách đầy đủ; dữ liệu vừa upsert riêng lẻ không được coi là toàn bộ khóa đã có.
5. Error: release lock, giữ draft/errors; notice thấy cả lúc panel đóng. Không auto clear,
   báo success hoặc tự gửi lại. Explicit session invalid theo API client hiện có.
   Nếu GET trước đó đã bị vô hiệu, kết thúc loading cũ; khi chưa có snapshot đầy đủ,
   khởi động lại GET có guard hoặc hiện read-error/retry, không để spinner vô hạn.

### Chuyển trạng thái học tiếp

Idle → Loading(course, generation) → Navigate hoặc Error(course). Bấm lại cùng course
khi đang chạy không gửi lặp. Bấm course mới hủy/vô hiệu GET/intent trước. Trong detail
thành công, lấy bài đầu tiên `isCompleted=false` theo thứ tự server; nếu không còn bài
chưa xong thì vào khu vực lessons. Abort/unmount không cập nhật state hoặc navigate.

## State tạm của AdminPage

| Nhóm | State / trách nhiệm | Invariant |
| --- | --- | --- |
| Current view | search/canonical query, page, debounce | query/page dùng cho mỗi GET/refresh phải là lựa chọn hiện hành |
| Read snapshot | users,total,totalPages, query/page của snapshot, validity/stale flag | Chỉ response generation mới nhất được ghi; lỗi không gán total=0 |
| Draft map | `{ userId: {name,role} }`, dirty map/ref | Riêng với dữ liệu đã lưu; GET/toggle không overwrite dirty draft |
| Row write | `{userId: save hoặc toggle}`, ref lock và payload snapshot | Tối đa một write/user; khóa editor và hai nút của row đó, row khác không khóa |
| Confirmation | target id/email, kind, old/new role hoặc active, payload snapshot | Hủy không write; xác nhận dùng đúng target/payload đã nêu |
| Notice | write success/error, refresh error với retry GET | GET không xóa notice write; success + refresh error là hai trạng thái riêng |

### Quy tắc merge và làm mới

1. GET merge draft chỉ cho user không dirty; role hiển thị trạng thái hiệu lực lấy từ
   server snapshot, role đang chọn nằm trong draft. Không coi draft là đã lưu.
2. Save khóa editor trước request, chụp payload normalized. Success merge subset public
   fields vào record, chỉ clear dirty cho bản đã gửi; lỗi 409/validation/network giữ draft.
3. Toggle gửi chỉ isActive, không lén gửi name/role chưa lưu. Success merge active/public
   record nhưng giữ draft/dirty của user; không đánh dấu profile draft đã lưu.
4. Invalidate GET trước write và refresh sau success theo query/page mới nhất, không dùng
   closure search/page cũ. Với các row write độc lập hoàn tất gần nhau, chỉ GET generation
   hiện hành có thể thay danh sách; snapshot mới nhất phải phản ánh các write đã xác nhận.
5. Total/pages lấy từ GET authority. Nếu page > max(1,totalPages), chuyển về trang hợp lệ
   và GET lại; không coi trang trung gian rỗng là toàn bộ hệ thống chưa có user. Khi đổi
   tên khiến user rời query, refresh lấy cả số lượng và hàng thay thế.
6. Refresh lỗi sau write success: giữ thay đổi đã xác nhận, đánh dấu snapshot chưa cập
   nhật và cho retry GET. Không reset role/active, total fake hoặc auto gửi lại PATCH.
   Với write lỗi sau khi đã vô hiệu một GET, cũng phải giải phóng read loading và khôi
   phục đường GET/retry cho view hiện hành, không làm mất thông báo lỗi write.
7. Bản nhập được giữ trong cùng page instance qua search/refetch/toggle theo map hiện có;
   feature không thêm cảnh báo rời trang, lưu nháp bền hoặc version concurrency server.

## Persisted data và quyền

Không thêm cột, index, quan hệ hoặc Prisma query. Membership/progress/snapshot quiz,
authVersion và quy tắc owner/enrollment giữ nguyên. PATCH đổi role/active tăng authVersion
theo route hiện tại; UI không tự quản lý hoặc suy diễn phiên thay cho server. Concurrency
giữa nhiều admin/thiết bị giữ semantics server hiện có; feature chỉ ngăn races do chính
page gây ra, không cam kết optimistic locking toàn hệ thống.
