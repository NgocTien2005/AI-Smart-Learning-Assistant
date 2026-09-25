# AGENTS.md

## Mục tiêu của repository

Đây là dự án **AI Smart Learning Assistant (Lumina LMS)**, một LMS hướng tới hai vai trò `INSTRUCTOR` và `STUDENT`.

Trạng thái hiện tại là một prototype authentication:

- Frontend React/Vite có giao diện đăng nhập và đăng ký.
- Backend Express cung cấp API đăng ký, đăng nhập và lấy người dùng hiện tại.
- PostgreSQL/Prisma đã mô hình hóa `User`, `Course`, `Enrollment`, `Lesson` và `ChatMessage`.
- Chức năng khóa học, bài học, upload tài liệu và AI chưa có API/UI hoàn chỉnh.

Mọi thay đổi phải giúp dự án tiến gần hơn tới một hệ thống có thể hiểu, kiểm thử và vận hành được; không chỉ làm cho màn hình “trông như đã chạy”.

## Cấu trúc chính

```text
.
├── frontend/                 React 19 + Vite 8
│   ├── src/main.jsx          Điểm khởi tạo React
│   ├── src/App.jsx           UI và logic authentication hiện tại
│   ├── src/App.css           Style của trang authentication
│   └── src/index.css         Global style
└── backend/                  Express 5 + Prisma 7 + PostgreSQL
    ├── server.js             HTTP server, middleware và auth routes
    ├── prisma.config.ts      Prisma CLI configuration
    └── prisma/
        ├── schema.prisma     Database schema
        └── migrations/       Lịch sử migration đã commit
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

Frontend mặc định gọi `http://localhost:3000`. Chỉ tạo `frontend/.env` khi cần override:

```dotenv
VITE_API_URL=http://localhost:3000
```

Không đọc hoặc in giá trị secret vào log, test output, issue hay phần bàn giao.

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

Các endpoint đang tồn tại:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` với header `Authorization: Bearer <token>`

Role hợp lệ là `INSTRUCTOR` và `STUDENT`.

Lưu ý baseline đã biết: form đăng ký frontend hiện thu thập `name` nhưng payload không gửi `name`, trong khi backend bắt buộc field này. Vì vậy đăng ký từ UI hiện trả lỗi `400`. Khi công việc chạm vào authentication, phải xử lý hoặc ít nhất kiểm thử hồi quy contract này; không được coi luồng đăng ký hiện tại là hoạt động.

Các nút social login, quên mật khẩu, điều khoản và chính sách hiện chỉ là UI placeholder. Không mô tả chúng là tính năng đã triển khai.

## Kiểm thử và xác minh

Repository hiện chưa có automated test suite. Khi thêm business logic đáng kể, ưu tiên bổ sung test thay vì chỉ kiểm thử thủ công.

Mức kiểm chứng tối thiểu theo loại thay đổi:

- Frontend: `npm run lint` và `npm run build`.
- Backend không đổi schema: khởi động server và kiểm tra endpoint liên quan; tối thiểu kiểm tra `/api/health` khi có database khả dụng.
- Prisma/schema: `npx prisma validate`, xem migration diff/SQL, generate client và kiểm tra migration status trên database mục tiêu phù hợp.
- Authentication: kiểm tra đăng ký, đăng nhập sai/đúng, `/api/auth/me`, token thiếu/hết hạn và bảo đảm password không xuất hiện trong response.
- UI responsive: kiểm tra ít nhất desktop và mobile khi thay đổi layout.

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
