# AGENTS.md

## Mục tiêu của repository

Đây là dự án **AI Smart Learning Assistant (Lumina LMS)**, một LMS có ba vai trò `ADMIN`, `INSTRUCTOR` và `STUDENT`.

Repository hiện có authentication, quản trị người dùng, khóa học, bài học/tài liệu, tiến độ, bài tập/chấm điểm, bài ôn trắc nghiệm và trợ lý tài liệu cục bộ. Đây là ứng dụng đang phát triển; cần kiểm tra cả API, authorization, dữ liệu và UI trước khi kết luận tính năng hoạt động.

Mọi thay đổi phải giúp dự án tiến gần hơn tới một hệ thống có thể hiểu, kiểm thử và vận hành được; không chỉ làm cho màn hình “trông như đã chạy”.

## Cấu trúc chính

```text
.
├── frontend/                 React 19 + Vite 8, app served by Nginx in Docker
│   ├── nginx.conf            Reverse proxy /api and upload body limit
│   └── src/
│       ├── app/              Router and application shell
│       ├── components/       Reusable LMS panels and route guards
│       ├── pages/            Authentication, dashboard, course and admin pages
│       └── services/         API client and request helpers
└── backend/                  Express 5 + Prisma 7 + PostgreSQL
    ├── server.js             Runtime entry point; imports src/app.js
    ├── app.js                Unused legacy auth harness; tests use production auth router
    ├── src/
    │   ├── app.js            Middleware and route mounting
    │   ├── routes/           Auth, admin, course and health APIs
    │   ├── middleware/       Authentication and role authorization
    │   ├── services/         Email integrations
    │   └── utils/            Auth, password reset, lesson text and study logic
    ├── scripts/              Demo seed and Docker integration verification
    ├── test/                 Node test runner unit/small app tests
    └── prisma/
        ├── schema.prisma     Database schema
        └── migrations/       Immutable migration history
```

Frontend và backend là hai package npm độc lập. Repository chưa có workspace hoặc script điều phối ở thư mục gốc.

## Nguyên tắc làm việc: Vibe Engineer

1. Đọc luồng liên quan từ UI đến API và database trước khi sửa. Không sửa một lớp mà bỏ qua contract với lớp còn lại.
2. Nêu giả định khi yêu cầu chưa rõ. Nếu giả định có thể làm thay đổi dữ liệu, API công khai, schema hoặc phạm vi tính năng, phải hỏi lại.
3. Ưu tiên thay đổi nhỏ, có mục tiêu và dễ review. Không refactor diện rộng trong cùng một thay đổi sửa lỗi nếu không thật sự cần thiết.
4. Tìm nguyên nhân gốc. Không nuốt exception, hard-code dữ liệu giả hoặc thêm fallback để che lỗi cấu hình.
5. Luôn kiểm chứng bằng lint, build, test phù hợp và/hoặc một luồng chạy thực tế. Không tuyên bố thành công nếu chưa chạy được kiểm chứng đó.
6. Phân biệt rõ điều đã quan sát, điều suy luận và điều chưa kiểm chứng trong phần bàn giao.
7. Giữ nguyên thay đổi không liên quan của người dùng. Không reset, overwrite hoặc format hàng loạt ngoài phạm vi công việc.

## Thiết lập môi trường

Khuyến nghị Node.js 24 trở lên. Vite và Prisma trong lockfile yêu cầu tối thiểu Node.js hiện đại; backend hiện import Prisma client TypeScript trực tiếp nên Node.js 24+ là lựa chọn an toàn.

Backend cần file `backend/.env` (không được commit):

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
JWT_SECRET="a-long-random-secret"
PORT=3000
```

Frontend mặc định gọi `/api` cùng origin. Vite proxy sang Docker tại `http://127.0.0.1:8080`; chạy Docker với `compose.dev.yaml` để cho phép origin5173. Khi chạy backend riêng trên host, đặt `$env:DEV_API_PROXY_TARGET='http://localhost:3000'` trước `npm run dev`. Chỉ tạo `frontend/.env.local` khi cần override base URL:

```dotenv
VITE_API_URL=http://localhost:3000
```

Không đọc hoặc in giá trị secret vào log, test output, issue hay phần bàn giao.

## Chạy toàn bộ hệ thống bằng Docker

Docker Compose là cách chạy mặc định khi cần kiểm thử tích hợp hoặc chuẩn bị deploy. Stack gồm:

- `db`: PostgreSQL 17, chỉ truy cập trong Docker network và lưu dữ liệu trong volume `postgres_data`.
- `backend`: Express/Prisma trên cổng nội bộ `3000`; tự chạy `prisma migrate deploy` trước khi khởi động server.
- `frontend`: build Vite và phục vụ bằng Nginx tại `http://localhost:8080`; Nginx proxy `/api` sang backend.

Sao chép `.env.docker.example` thành `.env` ở thư mục gốc và thay các giá trị bí mật trước khi chạy. File `.env` không được commit.

```powershell
Copy-Item .env.docker.example .env
docker compose up -d --build
docker compose ps
Invoke-RestMethod http://localhost:8080/api/health
```

Các lệnh vận hành:

```powershell
docker compose logs -f
docker compose down
```

Không dùng `docker compose down -v` nếu người dùng chưa yêu cầu xóa dữ liệu. Không cần chạy `npx prisma migrate deploy` trên host khi dùng toàn bộ stack Docker; backend container tự chạy migration và kết nối database qua `db:5432`. Database mặc định không publish cổng `5432` ra host.

Khi thay đổi dependency, Dockerfile, Prisma schema hoặc migration, phải build lại image và kiểm tra trạng thái healthy cùng endpoint `/api/health`. Cấu hình hiện tại phù hợp để chạy một máy; trước khi deploy công khai vẫn phải đặt secret mạnh, cấu hình domain/TLS và giới hạn CORS theo môi trường thật.

## Lệnh chuẩn

Chạy các lệnh trong đúng package tương ứng.

### Backend

```powershell
cd backend
npm ci
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Các lệnh liên quan:

```powershell
npm start
npx prisma validate
npx prisma migrate status
```

### Frontend

```powershell
cd frontend
npm ci
npm run dev
```

Kiểm tra frontend:

```powershell
npm run lint
npm run build
```

Không chạy `npm install` chỉ để kiểm tra nếu lockfile đã tồn tại; dùng `npm ci`. Không commit `node_modules`, `dist`, `.env` hoặc `backend/generated/prisma`.

## Quy ước frontend

- Dùng function component và React hooks.
- Giữ side effect trong `useEffect` hoặc event handler; không tạo side effect trong render.
- URL backend phải đi qua `VITE_API_URL`; không rải hard-coded URL ở nhiều component.
- Mọi request phải xử lý cả response không thành công lẫn lỗi mạng, đồng thời hiển thị thông báo hữu ích cho người dùng.
- Không đưa password, JWT hoặc thông tin nhạy cảm vào console.
- Khi UI gửi payload, đối chiếu field, kiểu dữ liệu và validation với route backend tương ứng.
- Duy trì accessibility cơ bản: label gắn với input, keyboard interaction, focus state, `aria-*` khi cần và thông báo lỗi có thể được screen reader đọc.
- Không thêm dependency nếu platform API hoặc dependency hiện tại đã giải quyết rõ ràng bài toán.
- Nếu `App.jsx` tiếp tục lớn lên, tách theo trách nhiệm (`components`, `pages`, `services`) thay vì tiếp tục dồn toàn bộ logic vào một file.

## Quy ước backend và API

- Backend dùng ES modules (`"type": "module"`).
- Validate mọi dữ liệu ở boundary trước khi truy cập database.
- Chuẩn hóa email bằng `trim().toLowerCase()` ở mọi luồng liên quan.
- Không trả `password` hoặc password hash trong bất kỳ response nào. Dùng một hàm mapping public user nhất quán.
- Protected route phải sử dụng authentication middleware; authorization theo role phải được kiểm tra riêng khi thêm course/lesson APIs.
- Dùng HTTP status có ý nghĩa và response lỗi JSON nhất quán, hiện theo dạng `{ "error": "..." }`.
- Handler bất đồng bộ phải xử lý lỗi dự kiến; lỗi nội bộ được log đủ để debug nhưng response không được làm lộ secret hoặc stack trace.
- `JWT_SECRET` bắt buộc trong production. Không dựa vào development fallback ngoài môi trường local.
- CORS phải được giới hạn bằng cấu hình môi trường trước khi deploy công khai.
- Khi thêm shutdown/resource logic, đảm bảo kết nối Prisma được đóng sạch.

## Prisma và database

- `backend/prisma/schema.prisma` là nguồn sự thật của data model.
- `backend/generated/prisma` là generated code: không sửa thủ công và không commit.
- Không chỉnh sửa migration đã được dùng để “sửa lịch sử”. Với thay đổi schema mới, tạo migration mới có tên mô tả rõ:

```powershell
cd backend
npx prisma migrate dev --name meaningful_change_name
npx prisma generate
```

- Sau khi thay đổi schema, chạy ít nhất `npx prisma validate` và kiểm tra migration SQL sinh ra trước khi bàn giao.
- Nêu rõ tác động dữ liệu của migration, đặc biệt với cột bắt buộc, unique constraint, foreign key và delete behavior.
- Không dùng `prisma migrate reset`, drop database hoặc xóa dữ liệu nếu người dùng chưa yêu cầu rõ ràng.
- Tránh N+1 query và chỉ select/include dữ liệu route thực sự cần.

## Contract hiện tại cần giữ nhất quán

Các API hiện được mount dưới `/api`. Nhóm endpoint chính đang tồn tại:

- `GET /api/health`
- `/api/auth`: đăng ký, đăng nhập, hồ sơ `/me`, quên/đặt lại và đổi mật khẩu.
- `/api/admin/users`: Admin tìm kiếm, cập nhật vai trò/thông tin và khóa/mở tài khoản.
- `/api/courses`: tạo/list/xem/sửa/xóa khóa học, tham gia bằng mã và rời khóa học.
- `/api/courses/:courseId/lessons` và `/api/courses/lessons/:lessonId`: bài học, tiến độ, tài liệu, lịch sử chat và bài ôn.
- `/api/courses/:courseId/assignments` và `/api/courses/assignments/:assignmentId`: bài tập, bài nộp và chấm điểm.

Role hợp lệ là `ADMIN`, `INSTRUCTOR` và `STUDENT`. Đăng ký công khai chỉ cho phép `INSTRUCTOR` hoặc `STUDENT`; tạo Admin bằng lệnh bootstrap được mô tả trong README.

Đăng ký frontend gửi `name`, `email`, `password` và role đã chọn; giữ kiểm thử contract này khi sửa authentication. Quên/đặt lại mật khẩu dùng email SMTP nếu được cấu hình. Feature022 đã gỡ đăng nhập/liên kết Google OAuth; dùng email/mật khẩu. Gemini và Gmail SMTP là tích hợp riêng được giữ lại; xem `docs/google-sign-in.md` và `docs/gemini-chat.md`. PDF/TXT/Markdown/CSV trích xuất cục bộ, không OCR. Chat Gemini chỉ gửi câu hỏi/lịch sử giới hạn và nguồn người dùng chủ động chọn, có quyền xem và đồng ý chia sẻ; key chỉ ở backend, Free không billing.

Bài ôn tập dùng generator cục bộ dựa trên các mẫu câu định nghĩa có khái niệm đứng trước `giúp`, `cho phép`, `lưu trữ`, `chứa`, `mô tả`, `biểu diễn`, `bao gồm`, `gồm` hoặc `là`. Generator bỏ qua câu không phù hợp; không coi đây là hiểu ngôn ngữ tổng quát hay dịch vụ AI. API cho phép 3–10 câu và báo số thực tế; attempt lưu snapshot, draft/selected answers và version. Mọi thao tác attempt kiểm tra lại quyền truy cập khóa học. Xem `README.md` để biết endpoint và lifecycle.

## Kiểm thử và xác minh

Backend tests use Node built-in test runner. Frontend tests use Vitest, jsdom, and React Testing Library to render actual components.

Mức kiểm chứng tối thiểu theo loại thay đổi:

- Frontend: `npm run lint` và `npm run build`.
- Frontend component regression tests: `npm test` trong `frontend/` (Vitest + jsdom + React Testing Library).
- Backend unit/regression tests: `npm test` trong `backend/`.
- Quiz route regression tests: `npm test -- --test-name-pattern="quiz"` trong `backend/` (các handler production qua router với Prisma injection hẹp).
- Backend tích hợp HTTP/database, gồm quyền truy cập, upload và luồng LMS: `npm run test:integration` trong `backend/` khi Docker stack healthy.
- Backend không đổi schema: khởi động server và kiểm tra endpoint liên quan; tối thiểu kiểm tra `/api/health` khi có database khả dụng.
- Prisma/schema: `npx prisma validate`, xem migration diff/SQL, generate client và kiểm tra migration status trên database mục tiêu phù hợp.
- Authentication: kiểm tra đăng ký, đăng nhập sai/đúng, `/api/auth/me`, token thiếu/hết hạn và bảo đảm password không xuất hiện trong response.
- UI layout: kiểm tra desktop khi thay đổi giao diện; chỉ thêm mobile behavior khi người dùng yêu cầu.

Nếu không thể chạy một bước vì thiếu database, secret, network hoặc dependency, ghi rõ bước nào chưa chạy và lý do. Không thay thế kết quả thực bằng phỏng đoán.

## Checklist trước khi hoàn thành

- Thay đổi đúng phạm vi yêu cầu và không chứa file phát sinh ngoài ý muốn.
- Contract frontend/backend/database vẫn khớp nhau.
- Không commit secret, generated output hoặc dependency directory.
- Validation, error handling, authentication và authorization phù hợp với luồng mới.
- Lint/build/test liên quan đã chạy và kết quả được báo cáo.
- Migration được review và không có thao tác phá hủy dữ liệu ngoài chủ đích.
- README hoặc tài liệu được cập nhật nếu cách thiết lập, biến môi trường, command hoặc API thay đổi.
- Phần bàn giao nêu ngắn gọn: đã đổi gì, đã kiểm tra gì, còn rủi ro hoặc việc tiếp theo nào.

## Những điều không được tự ý làm

- Không reset hoặc xóa database.
- Không sửa/xóa migration cũ để làm migration mới “đẹp hơn”.
- Không vô hiệu hóa validation, authentication, lint hoặc security check chỉ để build xanh.
- Không thêm mock/fake success vào production path.
- Không đổi API response hoặc schema theo cách breaking mà không nêu rõ và cập nhật mọi consumer.
- Không triển khai AI bằng cách gửi tài liệu hoặc dữ liệu người dùng sang dịch vụ bên ngoài khi chưa có yêu cầu, cấu hình và đánh giá quyền riêng tư rõ ràng.

## Trích xuất tài liệu và tóm tắt cục bộ

- PDF.js chạy ở backend trên PDF có lớp văn bản; tối đa 10 MiB, 250 trang và 100.000 ký tự đầu ra. Không hỗ trợ OCR. TXT, Markdown và CSV dùng tối đa 10 MiB.
- Kiểm tra đồng thời phần mở rộng, MIME khi MIME được cung cấp và dấu hiệu/nội dung tệp; MIME trống hoặc `application/octet-stream` được chấp nhận sau khi kiểm tra nội dung.
- Metadata extraction được thêm bằng migration mới. `documentText` tách khỏi nội dung nhập tay; `documentHash`, `extractionStatus`, `extractionErrorCode`, `extractionTruncated` và `sourceRevision` mô tả nguồn. Không tự xử lý dữ liệu lịch sử trong migration.
- Nguồn chung cho assistant, summary và quiz mới ưu tiên document text ở trạng thái thành công, sau đó đến nội dung nhập tay. Thay/gỡ tài liệu xóa text/hash cũ và thay đổi revision; chỉnh nội dung không ghi đè document text thành công. Snapshot bài ôn cũ giữ nguyên.
- `GET /api/courses/lessons/:lessonId/summary` tạo “Tóm tắt trích xuất” từ câu nguồn. `POST /api/courses/lessons/:lessonId/document/process` chỉ cho instructor sở hữu khóa học xử lý lại tài liệu lịch sử.
- Trích xuất summary không phải diễn giải AI; quiz generator vẫn chỉ nhận dạng mẫu câu giới hạn và có thể không tạo đủ câu. Không gửi nội dung sang dịch vụ ngoài.


## Frontend workflows and API gaps

- Session and current user are managed through React Router and `GET /api/auth/me`; network and 5xx errors remain recoverable. The UI supports ADMIN, INSTRUCTOR, and STUDENT roles.
- Dashboard, course sections, lesson reading, protected document preview/download, progress, assignments/grading, local assistant lookup, resumable quiz, and account management use mounted APIs. Course section and selected lesson are URL-backed.
- Quiz autosave is debounced and versioned. In-app leave flows flush pending drafts or ask whether to stay or discard; browser unload warns without promising network persistence. Server remains authoritative for access and grading.
- Frontend checks: `npm test`, `npm run lint`, and `npm run build` from `frontend/`.
- Google OAuth is retired by feature022; email/password, Gmail SMTP and Gemini remain. No API supports OCR, learning recommendations, notifications, or system-wide analytics. Local PDF text-layer extraction and extractive lesson summaries are implemented; do not describe them as OCR or externally generated AI output.
