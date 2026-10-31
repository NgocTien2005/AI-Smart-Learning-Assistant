---
name: lumina-ui-design
description: >-
  Đánh giá hoặc thiết kế bố cục, phân cấp thông tin và tương tác giao diện
  Lumina LMS theo vai trò, tạo phương án và tiêu chí nghiệm thu. Dùng trước
  triển khai khi cần quyết định thiết kế; sửa React theo thiết kế đã rõ dùng
  lumina-react-ui.
---

# Thiết kế giao diện Lumina

## Đầu vào

Đọc [AGENTS.md](../../../AGENTS.md), spec/acceptance criteria nếu có và màn hình
được yêu cầu. Tìm route trong `frontend/src/app/App.jsx`, session, `AppLayout`,
page/component liên quan, `services/api.js` và route production cấp dữ liệu.
Đọc CSS đang được import (`index.css`, `App.css`, `pages/LearningApp.css`) để
hiểu cascade và token hiện có trước khi đề xuất thành phần mới.

## Cách làm

1. Nếu môi trường chạy được, xem màn hình desktop thực tế ở route và vai trò
   liên quan; ghi viewport, trạng thái dữ liệu và môi trường/phiên bản đang xem.
   Ảnh trong `.artifacts/` hoặc ảnh được cung cấp chỉ là tham chiếu cho đến khi
   đối chiếu với bản hiện tại. Nếu không mở được UI, ghi rõ hạn chế; code review
   không phải quan sát giao diện. Không tự seed hay thay dữ liệu để có ảnh đẹp.
2. Xác định người dùng muốn hoàn thành việc gì trên màn hình: ADMIN quản lý
   tài khoản; INSTRUCTOR quản lý nội dung và chấm bài của khóa mình; STUDENT vào
   học, làm/nộp bài và xem tiến độ. Chọn hành động chính theo yêu cầu và contract
   hiện tại, không giả định ADMIN có toàn quyền với nội dung khóa học.
3. Nêu vấn đề có bằng chứng và tác động tới hành động đó. Đề xuất phân cấp thông
   tin, điều hướng/breadcrumb, typography, chiều rộng đọc, khoảng cách, màu và
   thành phần dùng chung. Tận dụng style/token có thật; tránh quyết định chỉ dựa
   trên selector CSS cũ không còn được render.
4. Khi yêu cầu liên quan **dashboard**, ưu tiên tìm và mở khóa học, hành động
   theo vai trò, tiến độ có nguồn dữ liệu rõ. Phân biệt chưa có bài học, chưa
   bắt đầu, đang học, hoàn thành và không tải được dữ liệu; không bịa số liệu.
   Khi liên quan **đọc bài**, ưu tiên danh sách bài, vị trí bài đang chọn, vùng
   đọc, xem/tải tài liệu và các panel hỗ trợ; bảo toàn URL và trạng thái quiz.
5. Mỗi tương tác phải có loading, empty, error/retry, success, disabled và
   keyboard focus phù hợp; nêu trạng thái không áp dụng cùng lý do nếu cần.
   Bao gồm label, thứ tự Tab, Enter/Space, Escape và trả focus cho dialog.
   Mặc định nghiệm thu desktop; chỉ thêm phạm vi mobile khi được yêu cầu.
6. Kiểm tra dữ liệu cho mỗi khối với API. Dùng nhãn đúng cho tra cứu cục bộ,
   tóm tắt trích xuất, quiz mẫu câu và PDF lớp văn bản; xem
   [giới hạn capability](../../../docs/development-workflow.md#gioi-han-capability).
   Chức năng chưa có API phải ghi là đề xuất ngoài phạm vi, không thêm CTA giả
   hoạt động hoặc analytics/recommendations/OAuth/notifications tự phát.

## Đầu ra và hoàn thành

Trả vấn đề quan sát được (tách suy luận), phương án bố trí có lý do, mapping
thành phần/dữ liệu và acceptance criteria cụ thể theo vai trò/trạng thái.
Ví dụ tiêu chí: refresh URL vẫn mở đúng bài; Tab tới được hành động chính;
lỗi tải không hiển thị tiến độ bằng 0 như dữ liệu thật. Thiết kế hoàn tất khi
có thể triển khai và kiểm tra từng tiêu chí, các giới hạn quan sát được nêu rõ.
Chỉ chuyển sang [lumina-react-ui](../lumina-react-ui/SKILL.md) để sửa code khi
phạm vi công việc bao gồm triển khai.
