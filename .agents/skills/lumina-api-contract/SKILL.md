---
name: lumina-api-contract
description: >-
  Thêm, sửa hoặc review API/backend Lumina LMS và contract kết nối frontend,
  gồm validation, response, authentication và quyền trên tài nguyên. Thay model
  hoặc migration phối hợp lumina-prisma; sửa bố cục thuần túy dùng skill UI.
---

# Contract API Lumina

## Đầu vào và truy vết

Đọc [AGENTS.md](../../../AGENTS.md), yêu cầu/acceptance criteria, UI gọi thao
tác và API client. Lập đường đi **UI → request → route production → middleware
→ Prisma/nguồn tệp → response → UI** với đường dẫn thực tế.

`backend/server.js` khởi động `backend/src/app.js`. `backend/app.js` là harness
auth legacy được `backend/test/auth.test.js` dùng; thay hoặc test harness đó
không chứng minh production handler đã được sửa. Kiểm tra mount trong app
production và router con, đặc biệt `courses.js`/`quizAttempts.js`.

## Quyết định contract và quyền

1. Cho từng thao tác, ghi method/path dưới `/api`, params/query/body hoặc upload,
   field/type/normalization/validation, response thành công, status và lỗi thực
   tế. Giữ `{ error: ... }` và các `code`/metadata đã có mà client dùng; không
   chuẩn hóa bằng cách xóa mất thông tin. Không suy status từ quy ước chung nếu
   route đang cố ý che sự tồn tại tài nguyên bằng 404.
2. Tách ba lớp: `authenticate` xác minh token và user hiện tại;
   `authorizeRole` giới hạn vai trò; kiểm tra owner/enrollment/attempt owner
   giới hạn tài nguyên cụ thể. Đọc predicate ở từng route, không suy ADMIN được
   bypass, không chỉ tin role từ JWT, không chỉ ẩn nút ở frontend.
3. Validate boundary trước query/write. Với auth, giữ chuẩn hóa email và public
   user mapper; đăng ký public gửi name/email/password/role và không cấp ADMIN.
   Không trả password/hash, reset token hash hay stack; không log token/secret.
4. Nếu thao tác liên quan quiz, kiểm tra lại quyền khóa học trên từng lần mở,
   lưu và submit, attempt thuộc người gọi, answer key chỉ sau submit, update có
   điều kiện version và trạng thái. Nếu liên quan tài liệu, kiểm tra quyền tải,
   upload validation, nguồn/revision và
   [giới hạn capability](../../../docs/development-workflow.md#gioi-han-capability).
5. Thay đổi contract phải cập nhật mọi consumer/test/docs liên quan. Khi còn
   quyết định chưa rõ ảnh hưởng API, dữ liệu, schema hoặc phạm vi, hỏi quyết
   định đó trước phần phụ thuộc; không thêm API giả để UI trông hoạt động.

## Kiểm chứng và đầu ra

Lập ma trận gồm thành công, thiếu/token sai/hết hạn, sai role, instructor khác,
student chưa tham gia/đã rời course, tài nguyên/attempt của người khác, ID/payload
sai và không tìm thấy. Chọn các hàng áp dụng cho thao tác, kiểm tra response và
không có write trái phép; đăng nhập sai không đồng nghĩa phải logout phiên khác.

Chạy regression production phù hợp và endpoint có database khi khả dụng;
integration khi Docker healthy. Dùng [lumina-verify](../lumina-verify/SKILL.md)
để ghi bằng chứng. Đầu ra là contract trước/sau, file truy vết, ma trận quyền,
consumer bị ảnh hưởng và kết quả/chưa kiểm chứng. Review xong khi các nhận định
có nguồn; triển khai xong cần kiểm chứng production path, không chỉ legacy test.
