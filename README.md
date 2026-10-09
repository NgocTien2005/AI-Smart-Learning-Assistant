# AI-Smart-Learning-Assistant
AI-Powered LMS là nền tảng quản lý học tập trực tuyến giúp giảng viên quản lý khóa học, bài giảng, bài tập và kết quả học tập. Sinh viên có thể học, làm bài và theo dõi tiến độ. Hệ thống tích hợp AI trợ giảng để hỗ trợ hỏi đáp, tóm tắt tài liệu, tạo câu hỏi ôn tập và đề xuất nội dung học tập phù hợp.

## Cấu trúc repository

- `frontend/src/app`: application shell và route composition.
- `frontend/src/pages`: các màn hình React và style theo trang.
- `backend/src/config`: cấu hình runtime và biến môi trường.
- `backend/src/routes`: các route HTTP theo nhóm tính năng.
- `backend/src/middleware`: middleware dùng chung như authentication.
- `backend/src/lib`: kết nối Prisma/database.
- `backend/src/utils`: hàm dùng chung cho authentication và public response.
- `backend/prisma`: schema và lịch sử migration.

`frontend/src/assets` chỉ chứa asset được ứng dụng sử dụng. Prisma client trong `backend/generated/prisma` là mã sinh tự động, không chỉnh sửa thủ công.

## Chạy bằng Docker

Yêu cầu Docker Desktop đang chạy. Tạo cấu hình local:

```powershell
Copy-Item .env.docker.example .env
```

Đổi `POSTGRES_PASSWORD` và `JWT_SECRET` trong `.env`. Để gửi email quên mật khẩu qua Gmail, bật xác minh 2 bước cho tài khoản Google, tạo App Password rồi cấu hình:

```dotenv
SMTP_USER=your-gmail-address@gmail.com
SMTP_APP_PASSWORD=your-16-character-google-app-password
APP_ORIGIN=http://localhost:8080
```

Không dùng mật khẩu đăng nhập Gmail thông thường và không commit file `.env`. Sau đó chạy:

```powershell
docker compose up -d --build
docker compose ps
```

Mở `http://localhost:8080`. Backend không public cổng riêng; Nginx chuyển tiếp `/api` tới backend. Backend tự chạy `prisma migrate deploy` khi container khởi động.

```powershell
docker compose logs -f
docker compose down
```

`docker compose down` giữ dữ liệu PostgreSQL. Chỉ dùng `docker compose down -v` khi chủ động muốn xóa volume database.

Khi chạy frontend bằng Vite trên host, backend mặc định chỉ cho phép origin `http://localhost:5173`. Có thể đặt `CORS_ORIGIN` thành một hoặc nhiều origin phân tách bằng dấu phẩy cho môi trường khác.

Tài liệu upload được lưu trong Docker volume `uploads_data` và chỉ tải xuống qua endpoint có authentication. Định dạng hỗ trợ là PDF, TXT, Markdown và CSV, tối đa 10 MB. Nội dung text được dùng cho trợ lý tài liệu cục bộ; dữ liệu không được gửi sang dịch vụ AI bên ngoài.

## Chức năng LMS hiện có

- Đăng ký, đăng nhập, quên/đặt lại mật khẩu qua Gmail SMTP và kiểm tra phiên cho vai trò `INSTRUCTOR` và `STUDENT`.
- Giảng viên tạo, sửa, xóa khóa học; hệ thống sinh mã tham gia 8 ký tự.
- Học viên tham gia bằng mã và chỉ truy cập khóa học đã tham gia.
- Giảng viên thêm/xóa bài học, nhập nội dung hoặc upload tài liệu.
- Người có quyền trong khóa học tải tài liệu, hỏi đáp theo nội dung text và xem lịch sử hỏi đáp.
- Học viên đánh dấu hoặc bỏ hoàn thành từng bài học; dashboard hiển thị tiến độ khóa học và giảng viên xem tiến độ từng học viên.
- Học viên tạo bài ôn trắc nghiệm cục bộ từ các mẫu câu định nghĩa được hỗ trợ, lưu nháp tự động, tiếp tục bài chưa nộp và xem lại kết quả chi tiết. Generator không dùng AI bên ngoài và bỏ qua dạng câu không nhận diện được; số câu tạo thực tế có thể thấp hơn yêu cầu.
- Giảng viên giao bài có hạn nộp và điểm tối đa; học viên nộp/cập nhật bài trước hạn, giảng viên chấm điểm và gửi nhận xét.
- Quản trị viên tìm tài khoản, sửa họ tên, đổi vai trò giảng viên/học viên và khóa/mở quyền truy cập.
- Authorization được kiểm tra riêng cho từng thao tác khóa học và bài học.

### Bài ôn tập có thể tiếp tục

- Số câu được yêu cầu từ 3 đến 10; API trả số câu thực tế và trả `422` khi không tìm thấy đủ khái niệm phù hợp. Generator hiện chỉ nhận diện câu định nghĩa có khái niệm đứng trước các mẫu `giúp`, `cho phép`, `lưu trữ`, `chứa`, `mô tả`, `biểu diễn`, `bao gồm`, `gồm` hoặc `là`. Đây là tạo câu hỏi theo mẫu cục bộ, không phải AI hiểu ngôn ngữ tổng quát.
- `GET /api/courses/lessons/:lessonId/quizzes` liệt kê lịch sử; `POST` cùng đường dẫn tạo attempt.
- `GET /api/courses/quiz-attempts/:attemptId` mở bản nháp hoặc kết quả; `PUT .../:attemptId/draft` lưu lựa chọn với `version`; `POST .../:attemptId/submit` chấm điểm và khóa attempt. Các thao tác đều cần quyền hiện tại với lesson/course.
- Câu hỏi đã tạo lưu snapshot nguồn bất biến. Answer key chỉ được trả sau khi nộp. Attempt cũ vẫn giữ được; attempt đã nộp trước khi lưu lựa chọn sẽ hiện thông báo lịch sử không có đáp án đã chọn.
- Migration `20261009150000_persist_quiz_attempt_lifecycle` bổ sung JSONB cho nháp/lựa chọn và bộ đếm version, không xóa hoặc sửa attempt cũ.

Các kiểm tra chính:

```powershell
cd backend
npm test
npm run test:integration
npx prisma validate

cd ../frontend
npm run lint
npm run build
```

`npm run test:integration` yêu cầu Docker stack đang chạy. Script tạo dữ liệu riêng, kiểm tra toàn bộ luồng qua `http://localhost:8080/api` rồi xóa dữ liệu kiểm thử.

Đăng nhập hiện dùng email và mật khẩu. OAuth Google/Microsoft chưa được bật vì repository chưa có OAuth client và callback domain cho môi trường triển khai.

## Dữ liệu trải nghiệm giao diện

Sau khi khởi động Docker, có thể nạp dữ liệu demo vào database local để thử cả hai vai trò, khóa học, danh sách học viên, bài học, bài tập, bài ôn nhanh, tải tài liệu và trợ lý học tập:

```powershell
docker compose exec -e NODE_ENV=development backend npm run seed:demo
```

Đăng nhập bằng các tài khoản demo (mật khẩu chung `123456789`):

- Giảng viên: `giangvien@lumina.local`
- Học viên: `hocvien@lumina.local`
- Quản trị viên: `quantri@lumina.local`

Lệnh seed có thể chạy lại để cập nhật dữ liệu demo; lệnh từ chối chạy khi `NODE_ENV=production`. Chỉ dùng tài khoản mẫu trong môi trường local, không dùng chúng cho hệ thống triển khai thật.

Tài khoản quản trị môi trường triển khai không thể đăng ký từ giao diện. Hãy đặt `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_EMAIL` và `ADMIN_BOOTSTRAP_PASSWORD` trong `.env`, khởi động lại backend rồi chạy `docker compose exec backend npm run admin:create`. Sau khi tạo xong, xóa ba biến này khỏi `.env` và khởi động lại backend. Mật khẩu bootstrap cần từ 12 đến 72 ký tự; lệnh chỉ tạo tài khoản mới và không sửa tài khoản đã tồn tại.
