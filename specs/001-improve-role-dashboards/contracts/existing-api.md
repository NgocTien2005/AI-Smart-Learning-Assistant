# Contract HTTP hiện có — giữ nguyên

**Date**: 2026-10-30 | **Plan**: [plan.md](../plan.md)

Tài liệu đối chiếu source production, không phải thiết kế API mới hoặc bằng chứng đã
gọi HTTP thành công. Không thay endpoint, payload, status, middleware hoặc schema.

## Đường đi và nguyên tắc chung

UI → [apiRequest](../../../frontend/src/services/api.js) → `/api` mount trong
[production app](../../../backend/src/app.js) →
[authenticate](../../../backend/src/middleware/authenticate.js) → role/resource check →
[Prisma schema](../../../backend/prisma/schema.prisma) → response → state UI.
[backend/app.js](../../../backend/app.js) là harness auth legacy, không phải runtime server.

- Base URL giữ `VITE_API_URL` và default hiện có. API client thêm Bearer và JSON content
  type; không copy logic fetch/session vào component mới.
- Thiếu token: 401 `{code: AUTH_REQUIRED, error}`. Token invalid/expired, user không còn/
  bị khóa hoặc authVersion lệch: 401 `{code: SESSION_INVALID, error}`. Authenticate đọc
  user hiện tại từ DB, không chỉ tin role trong JWT.
- authorizeRole sai role: 403 `{error}`. Boundary/resource errors giữ `{error}` cùng
  metadata/code đang có. Unhandled production error: 500 JSON, không lộ stack/secret.
- Client chỉ clear phiên theo explicit auth-expiration code hiện có. Network, 5xx,
  403 và 409 giữ đúng đường lỗi/phục hồi, không tự coi là hết phiên. AbortError được giữ
  nguyên; không biến abort một GET bị thay thế thành toast lỗi mạng.
- Không trả/log password/hash/token/secret. UI không cần đọc `.env` để diễn giải contract.

## Requests liên quan

| Request | Input và quyền | Thành công / lỗi chính |
| --- | --- | --- |
| GET `/api/auth/me` | authenticate; không có payload mới | 200 `{user:{id,name,email,role}}`; auth errors như trên |
| GET `/api/courses` | authenticate; INSTRUCTOR lọc instructorId=user.id, vai trò khác lọc enrollment của user hiện tại | 200 `{courses}` với instructor `{id,name,email}`, `_count:{lessons,enrollments}` và scalar course; sort updatedAt desc. STUDENT có thêm completedLessons/progressPercent |
| POST `/api/courses` | authenticate + INSTRUCTOR; `{title,description}`; trim, title 3–120, description tối đa 4.000; mô tả không string hiện được coi là rỗng | 201 `{course}` gồm instructor/counts và joinCode server sinh 8 hex uppercase; 400 validation, 403 sai role |
| POST `/api/courses/join` | authenticate + STUDENT; `{joinCode}` string trim/uppercase, regex 8 hex | 200 `{course}` kèm tiến độ thực tế; enrollment trùng được chấp nhận, không reset progress; 400 sai mã, 404 mã không có, 403 sai role |
| GET `/api/courses/:courseId` | authenticate; integer id > 0; owner HOẶC enrollment hiện tại | 200 `{course}`; lessons order asc rồi createdAt asc, STUDENT có isCompleted/completedAt; 400 id, 404 không tồn tại, 403 không có quyền tài nguyên |
| GET `/api/admin/users?q=...&page=...` | authenticate + ADMIN; q string trim/cắt 120, search name/email không phân biệt hoa thường; page integer 1..100000, default 1 | 200 `{users,page,pageSize,total,totalPages}`; pageSize=25, totalPages=ceil(total/25), có thể 0; 400 page, 403 role |
| PATCH `/api/admin/users/:userId` | authenticate + ADMIN; id integer > 0, không self-target; managed user phải STUDENT/INSTRUCTOR; `{name,role}` hoặc `{isActive}` theo tác vụ | 200 `{user:{id,name,email,role,isActive}}`; 400 input/no valid changes, 403 self-target/role, 404 missing hoặc target ADMIN, 409 linked data khi đổi role |

Nguồn: [auth routes](../../../backend/src/routes/auth.js),
[courses routes](../../../backend/src/routes/courses.js), [admin routes](../../../backend/src/routes/admin.js).

## Chi tiết ADMIN cần bảo toàn

- Danh sách chỉ STUDENT/INSTRUCTOR, sort createdAt desc rồi id desc. Mỗi user có
  id/name/email/role/isActive/createdAt và `_count:{courses,enrollments,submissions}`.
- Name trim, 2–80 ký tự. Role chỉ INSTRUCTOR/STUDENT. Instructor còn sở hữu khóa hoặc
  student còn enrollment không đổi role được (409); không xóa liên kết để ép thành công.
- isActive phải boolean. Đổi role hoặc active thực sự tăng authVersion; đổi tên không
  thu hồi phiên. Không gửi email như một trường edit hoặc cung cấp lựa chọn ADMIN.
- Response PATCH không có createdAt/counts. Merge vào record; giữ bản chỉnh local riêng.
  Làm mới count/pages sau write bằng GET hiện có, không yêu cầu server trả field mới.
- Total thuộc kết quả query của hai managed roles, không phải số tài khoản toàn hệ thống.

## Ma trận quyền phải mô tả đúng

| Thao tác | STUDENT | INSTRUCTOR | ADMIN |
| --- | --- | --- | --- |
| UI `/dashboard` | Có | Có | Guard client từ chối |
| UI `/courses/:id` | Guard role có; server còn kiểm tài nguyên | Guard role có; server còn kiểm tài nguyên | Guard client từ chối |
| UI `/admin` | Guard client từ chối | Guard client từ chối | Có |
| UI `/account` | Phiên hợp lệ | Phiên hợp lệ | Phiên hợp lệ |
| GET courses | Tập enrollment, có progress | Tập sở hữu | Tập enrollment nếu có; không phải list mọi course |
| POST course | 403 | Được nếu input hợp lệ | 403 |
| POST join | Được nếu input hợp lệ | 403 | 403 |
| GET detail course | Owner/enrollment predicate | Owner/enrollment predicate | Cùng predicate, không bypass |
| GET/PATCH admin users | 403 | 403 | Managed target và validation như trên |

**Lưu ý**: GET list/detail courses không có blanket role deny cho ADMIN tại backend.
Frontend mới là nơi không cung cấp giao diện course cho ADMIN. Không viết test buộc
backend GET course trả 403 chỉ vì role=ADMIN; kiểm predicate thực và không thêm bypass.

## Contract điều hướng giữ nguyên

- Student bắt đầu/tiếp tục: `/courses/:id?section=lessons&lessonId=:firstIncompleteId`;
  nếu detail hiện không còn bài chưa hoàn thành thì `/courses/:id?section=lessons`.
- Student ôn lại: khu vực lessons hiện có; khóa rỗng/thiếu dữ liệu: xem `/courses/:id`.
- Instructor quản lý: `/courses/:id?section=overview`.
- Role home ADMIN `/admin`, STUDENT/INSTRUCTOR `/dashboard`; account/logout và xử lý
  return destination giữ [navigation](../../../frontend/src/services/navigation.js).
- Không thay contract section/lessonId/panel hoặc lifecycle quiz ở màn hình đích.

## Thay đổi trước/sau

HTTP, data model và quyền server: **không đổi**. Phần thay đổi là trình bày, validation
frontend khớp normalization server và quản lý request/draft tại hai page. Negative tests
phải kiểm status/không write đúng predicate hiện có; mock component không chứng minh
middleware hoặc database production đã chạy. Xem [quickstart](../quickstart.md).
