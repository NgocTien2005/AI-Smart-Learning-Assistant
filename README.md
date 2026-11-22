# Lumina LMS — AI Smart Learning Assistant



Lumina là ứng dụng quản lý học tập bằng tiếng Việt dành cho ba vai trò:
`ADMIN`, `INSTRUCTOR` và `STUDENT`. Project gồm React frontend, Express backend,
PostgreSQL và các công cụ học tài liệu chạy cục bộ hoặc qua tích hợp Gemini
tùy cấu hình.



## Tính năng chính

### Dành cho INSTRUCTOR

- Tạo, sửa, xóa khóa học và quản lý bài học.
- Tạo mã tham gia và xem danh sách học viên.
- Tải tài liệu PDF, TXT, Markdown hoặc CSV cho bài học.
- Tạo bài tập, xem bài nộp và chấm điểm.
- Theo dõi tiến độ học của sinh viên trong khóa học.

### Dành cho STUDENT

- Đăng ký tham gia khóa học bằng mã.
- Đọc tài liệu được bảo vệ và theo dõi tiến độ bài học.
- Nộp bài tập và xem điểm, nhận xét.
- Làm bài ôn trắc nghiệm có lưu nháp và tiếp tục attempt.
- Tra cứu tài liệu, xem tóm tắt trích xuất hoặc chat với nguồn được chọn.

### Dành cho ADMIN

- Tìm kiếm và quản lý tài khoản.
- Cập nhật vai trò và thông tin người dùng.
- Khóa hoặc mở tài khoản.

## Công cụ hỗ trợ học tập


| Công cụ          | Trạng thái                             | Cách hoạt động                                                | Giới hạn                                                                                                                                            |
| ---------------- | -------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tra cứu tài liệu | Đã triển khai, chạy cục bộ             | Tìm đoạn văn/bảng từ nội dung đã trích xuất bằng token cục bộ | Không phải chatbot hiểu ngữ nghĩa tổng quát                                                                                                         |
| Tóm tắt          | Đã triển khai, chạy cục bộ             | Chọn câu nguồn trích xuất                                     | Không phải tóm tắt sinh bởi LLM                                                                                                                     |
| Quiz ôn tập      | Đã triển khai, chạy cục bộ             | Nhận dạng mẫu câu định nghĩa và tạo câu hỏi trắc nghiệm       | Có thể tạo ít câu hoặc không tạo được câu                                                                                                           |
| Chat Gemini      | Đã tích hợp; bật theo cấu hình runtime | Gửi câu hỏi cùng nguồn tài liệu đã chọn, có xác nhận chia sẻ  | Endpoint hoạt động khi `GEMINI_API_KEY`, `GEMINI_FREE_ONLY_CONFIRMED=true` và `GEMINI_CHAT_ALLOWED=true` đã được cấu hình; phụ thuộc quota/provider |


PDF chỉ trích xuất lớp văn bản hiện có trong tài liệu. Lumina không hỗ trợ OCR.
Kích thước tài liệu tối đa là 10 MiB; giới hạn trang và ký tự của PDF được áp
dụng ở backend.

Không gửi tài liệu hoặc lịch sử chat ra dịch vụ ngoài trừ khi Gemini chat được
bật và người dùng chủ động chọn nguồn. Chi tiết cấu hình tại
[docs/gemini-chat.md](docs/gemini-chat.md).

## Công nghệ


| Lớp      | Công nghệ                                              |
| -------- | ------------------------------------------------------ |
| Frontend | React 19, React Router 7, Vite 8                       |
| Backend  | Node.js, Express 5                                     |
| Dữ liệu  | PostgreSQL 17, Prisma 7                                |
| Tài liệu | PDF.js, Multer                                         |
| Email    | Gmail SMTP qua Nodemailer                              |
| Kiểm thử | Node test runner, Vitest, jsdom, React Testing Library |
| Vận hành | Docker Compose, Nginx, GitHub Actions                  |


```mermaid
flowchart LR
  UI[React frontend] --> Proxy[Nginx hoặc Vite proxy]
  Proxy --> API[Express API]
  API --> Auth[Authentication và role guard]
  Auth --> Prisma[Prisma]
  Prisma --> DB[(PostgreSQL)]
  Auth --> Files[Upload và trích xuất tài liệu]
  Auth --> Optional[SMTP hoặc Gemini]
```

Repository là hai package npm độc lập: `frontend/` và `backend/`; thư mục gốc
không có npm workspace.

## Chạy bằng Docker

Yêu cầu: Docker Desktop đang chạy Linux containers.

```powershell
git clone https://github.com/NgocTien2005/AI-Smart-Learning-Assistant.git
cd AI-Smart-Learning-Assistant
Copy-Item .env.docker.example .env
```

Sửa `.env` và đặt password database cùng JWT secret mạnh. Không commit `.env`
hoặc ghi secret vào tài liệu, log hoặc terminal output.

```powershell
docker compose up -d --build
docker compose ps
Invoke-RestMethod http://localhost:8080/api/health
```

Mở `http://localhost:8080`.

Compose chạy PostgreSQL và backend trong Docker network, publish frontend qua
Nginx cổng 8080. Backend tự chạy `prisma migrate deploy` trước khi khởi động
server.

Dừng stack:

```powershell
docker compose down
```

Không dùng `docker compose down -v` nếu cần giữ dữ liệu trong PostgreSQL và
upload volume.

### Biến môi trường Docker


| Biến                | Bắt buộc       | Mục đích                                     |
| ------------------- | -------------- | -------------------------------------------- |
| `POSTGRES_PASSWORD` | Có             | Password PostgreSQL                          |
| `JWT_SECRET`        | Có             | Ký và xác thực JWT                           |
| `APP_ORIGIN`        | Có khuyến nghị | Origin frontend hợp lệ và URL reset password |
| `FRONTEND_PORT`     | Không          | Cổng Nginx; mặc định 8080                    |
| `SMTP_USER`         | Không          | Gmail dùng cho khôi phục mật khẩu            |
| `SMTP_APP_PASSWORD` | Không          | Gmail App Password                           |
| `ADMIN_BOOTSTRAP_*` | Không          | Thông tin tạo tài khoản ADMIN một lần        |
| `GEMINI_*`          | Không          | Cấu hình Gemini chat Free                    |


Không đặt key Gemini trong biến bắt đầu bằng `VITE_*`, source frontend, log,
ảnh hoặc nội dung prompt.

## Chạy frontend và backend riêng

### Backend

Yêu cầu Node.js 24 trở lên.

```powershell
cd backend
npm ci
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Backend mặc định dùng cổng `3000` và cần `backend/.env` có ít nhất:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="a-long-random-secret"
PORT=3000
```

### Frontend

```powershell
cd frontend
npm ci
npm run dev
```

Frontend mặc định gọi `/api` cùng origin. Khi chạy riêng backend host:

```powershell
$env:DEV_API_PROXY_TARGET='http://localhost:3000'
npm run dev
```

Để override API URL tường minh, tạo `frontend/.env.local`:

```dotenv
VITE_API_URL=http://localhost:3000
```

## Tài khoản ADMIN

Đăng ký công khai chỉ cho phép tạo `INSTRUCTOR` hoặc `STUDENT`; public API không
cho tạo `ADMIN`.

Khi đang dùng Compose, đặt ba biến `ADMIN_BOOTSTRAP_*` trong `.env`, chạy:

```powershell
docker compose up -d backend
docker compose exec -T backend npm run admin:create
```

Sau khi tạo tài khoản, xóa hoặc để trống các biến bootstrap và recreate backend
nếu cấu hình môi trường đã thay đổi. Script không đổi tài khoản đã tồn tại.
Password bootstrap được nhập riêng và không lưu trong source.

## API chính

Các endpoint đều nằm dưới `/api`.


| Nhóm                                     | Chức năng                                                      |
| ---------------------------------------- | -------------------------------------------------------------- |
| `/api/health`                            | Health/liveness của backend                                    |
| `/api/auth`                              | Đăng ký, đăng nhập, `/me`, đổi mật khẩu, quên/đặt lại mật khẩu |
| `/api/admin/users`                       | Tìm kiếm, sửa vai trò/thông tin, khóa/mở tài khoản             |
| `/api/courses`                           | CRUD khóa học, tham gia bằng mã, rời khóa học                  |
| `/api/courses/:courseId/lessons`         | CRUD bài học, tiến độ và tài liệu                              |
| `/api/courses/lessons/:lessonId`         | Đọc, tải tài liệu, tìm kiếm, tóm tắt, quiz và chat             |
| `/api/courses/:courseId/assignments`     | Tạo và xem bài tập                                             |
| `/api/courses/assignments/:assignmentId` | Nộp bài và chấm điểm                                           |


Protected routes dùng Bearer JWT. Authorization được kiểm tra trên backend theo
role và quyền sở hữu, enrollment hoặc submission, không chỉ ẩn nút ở frontend.
Response lỗi có JSON dạng `{ "error": "..." }`.

Google OAuth đã được gỡ khỏi project; các endpoint cũ trả `404`.

## Kiểm thử

### Frontend

```powershell
cd frontend
npm ci
npm test
npm run lint
npm run build
```

### Backend

```powershell
cd backend
npm ci
npm test
npx prisma validate
```

Chạy riêng regression quiz:

```powershell
cd backend
npm test -- --test-name-pattern="quiz"
```

### Integration Docker

Từ thư mục gốc:

```powershell
node scripts/ci/integration.mjs
node scripts/ci/seed-integration.mjs
```

Các runner này tạo target Docker riêng để kiểm tra API và database thực, sau đó
dọn resource do runner sở hữu. Không chạy integration trên stack local hoặc
database chưa xác nhận mục tiêu.

## Cấu trúc repository

```text
frontend/
  src/app/          Router và session
  src/pages/        Auth, dashboard, course, account, admin
  src/components/   LMS panels, form và route guards
  src/services/     API client và request helpers
backend/
  server.js         Production entry point
  src/app.js        Middleware và mount routes
  src/routes/       Auth, admin, courses, lessons, assignments, quiz
  src/middleware/   Authentication và authorization
  src/services/     Email, tài liệu và Gemini
  prisma/           Schema và migration
  scripts/          Seed và integration
scripts/ci/         Docker integration và package checks
docs/               Kiến trúc, vận hành và hướng dẫn
specs/              Spec Kit cho từng feature
```

## Kiến trúc và authorization

Tài liệu được lưu tách khỏi nội dung nhập tay của bài học. Nếu extraction
thành công, document text được ưu tiên làm nguồn cho tra cứu, tóm tắt và quiz;
`documentHash`, `extractionStatus` và `sourceRevision` được lưu để theo dõi
nguồn. Thay hoặc xóa tài liệu làm mất text/hash cũ và tăng source revision.
Chỉnh manual lesson không ghi đè document text đã trích xuất thành công.

JWT hiện được lưu ở browser storage theo lựa chọn “ghi nhớ đăng nhập”. Backend
kiểm tra tài khoản còn active và `authVersion` ở `/api/auth/me`; reset password
hợp lệ có thể thu hồi phiên cũ.

Giới hạn quan trọng:

- Không có OCR, learning recommendation, notification hoặc analytics toàn hệ thống.
- Gemini và SMTP là tích hợp tùy chọn, không được giả định thành công khi thiếu secret.
- Health endpoint chỉ là liveness, không thay cho migration hoặc backup check.
- Rate limit/quota Gemini hiện có theo process và cần shared state khi mở rộng nhiều replica.
- Production còn cần domain/TLS, quản lý secret, database least privilege,
backup/restore, monitoring và kế hoạch rollback.

Xem:

- [Kiến trúc và data model](docs/architecture.md)
- [Ranh giới module](docs/module-boundaries.md)
- [Quyết định bảo mật](docs/security.md)
- [Dữ liệu demo](docs/demo-data.md)
- [Hướng dẫn demo ba vai trò](docs/demo-script.md)
- [Kiểm thử CI](docs/continuous-integration.md)
- [Vận hành và rollback](docs/operations.md)
- [Production readiness](docs/production-readiness.md)