# AI-Smart-Learning-Assistant
AI-Powered LMS là nền tảng quản lý học tập trực tuyến giúp giảng viên quản lý khóa học, bài giảng, bài tập và kết quả học tập. Sinh viên có thể học, làm bài và theo dõi tiến độ. Hệ thống có trợ lý tra cứu tài liệu cục bộ, tóm tắt trích xuất và bài ôn dựa trên mẫu câu hỗ trợ; không dùng dịch vụ AI bên ngoài cho nội dung tài liệu.

## Trạng thái bàn giao MVP

[Báo cáo bàn giao](docs/mvp-handoff.md) đối chiếu các feature 001–009 và loại
bằng chứng đã có. Ngày 2026-11-07: 001–007 đạt 175/175 task, 009 đạt 18/18 với
hosted CI đã pass; 008 đạt 25/26 sau khi người dùng xác nhận luồng email/reset
thật. Task T026 cleanup profile vẫn bị policy chặn. Chưa tuyên bố nghiệm thu
toàn bộ hoặc sẵn sàng production.
Xem [checklist production readiness](docs/production-readiness.md) trước khi
chuẩn bị triển khai công khai; CI không thực hiện deploy hoặc gửi email thật.

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

## Continuous integration

[Lumina CI](.github/workflows/ci.yml) kiểm tra frontend, backend và HTTP/database
trên stack Docker riêng khi pull request, push hoặc chạy tay. Dùng Node 24,
`npm ci` và lockfiles hiện có; CI cơ bản không cần production/Gmail credentials.
Xem [hướng dẫn CI](docs/continuous-integration.md) để chạy lại, đọc evidence an
toàn và phân biệt local checks với hosted run. Trạng thái từng lần chạy được
ghi trong [verification 009](specs/009-setup-quality-ci/verification.md);
nghiệm thu email thật vẫn thuộc feature 008.

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

Tài liệu upload được lưu trong Docker volume `uploads_data` và chỉ tải xuống qua endpoint có authentication. Định dạng hỗ trợ là PDF, TXT, Markdown và CSV, tối đa 10 MiB. Nội dung text được dùng cho trợ lý tài liệu cục bộ; dữ liệu không được gửi sang dịch vụ AI bên ngoài.

### Trích xuất tài liệu và tóm tắt

PDF có lớp văn bản được xử lý cục bộ bằng Mozilla PDF.js; giới hạn hiện tại là 250 trang và 100.000 ký tự đầu ra. PDF scan, được mã hóa hoặc không có chữ vẫn có thể xem/tải nếu tệp hợp lệ, nhưng không cung cấp nguồn văn bản. Không có OCR. MIME có thể thiếu hoặc là `application/octet-stream`; phần mở rộng và nội dung được kiểm tra.

Văn bản đã trích được lưu riêng khỏi nội dung nhập tay, cùng hash, trạng thái, revision và cờ cắt ngắn. Assistant, tóm tắt và quiz mới cùng ưu tiên văn bản tài liệu đã trích; nếu chưa có, dùng nội dung bài học do giảng viên nhập. Migration không tự xử lý tài liệu lịch sử. Giảng viên sở hữu khóa học có thể yêu cầu xử lý lại bằng `POST /api/courses/lessons/:lessonId/document/process`. Thay/gỡ tài liệu làm mới nguồn; snapshot quiz và kết quả đã nộp không đổi.

`GET /api/courses/lessons/:lessonId/summary` trả các câu được chọn từ nguồn dưới nhãn “Tóm tắt trích xuất”, kèm trang khi parser cung cấp được. Đây không phải giải thích AI; nội dung ngắn có thể không có điểm tóm tắt. Không gửi văn bản đến dịch vụ ngoài. PDF.js Node API được dùng theo ví dụ chính thức của Mozilla: https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs.

## Chức năng LMS hiện có

- Đăng nhập và kiểm tra phiên cho `ADMIN`, `INSTRUCTOR`, `STUDENT`; đăng ký công khai chỉ cho `INSTRUCTOR` và `STUDENT`. Quên mật khẩu dùng Gmail SMTP khi được cấu hình; phản hồi chung không xác nhận email tồn tại hoặc đã được chuyển đến hộp thư. Đặt lại mật khẩu giữ validation hiện có và thu hồi phiên cũ.
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

`npm run test:integration` yêu cầu stack kiểm thử tách biệt, healthy. Đặt rõ `TEST_COMPOSE_PROJECT=lumina-acceptance-*` và `TEST_API_URL=http://127.0.0.1:PORT/api`. Script xác minh project/container, cổng HTTP, network, volume và database trước khi tạo/dọn dữ liệu; không dùng Compose mặc định của repository. Xem [hướng dẫn kiểm thử tách biệt](docs/acceptance-testing.md).

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


## Frontend workflows

The React UI supports ADMIN, INSTRUCTOR, and STUDENT sessions. It provides role-aware dashboards, course workspace sections stored in the URL, lesson reading, authenticated document preview/download, progress, assignments and grading, local source lookup, and resumable practice quizzes. Session identity is checked through `/api/auth/me`; network and server failures remain recoverable.

PDF preview displays the uploaded document but does not extract PDF text. Assistant lookup uses locally available lesson text. Quiz generation uses supported local definition patterns and may return fewer questions when the source has too few suitable candidates. Drafts use server versions to resolve concurrent tabs.

Run frontend checks from `frontend/`: `npm test`, `npm run lint`, and `npm run build`.

Local PDF text-layer extraction and extractive summaries are implemented. OCR, learning recommendations, notifications, OAuth, and global analytics remain outside the current supported APIs and scope.
