---
name: lumina-prisma
description: >-
  Đề xuất, triển khai hoặc review data model, migration và truy vấn Prisma của
  Lumina LMS, gồm tác động dữ liệu và kiểm chứng database/Docker. Dùng cho
  thay đổi lớp dữ liệu; contract HTTP và quyền dùng lumina-api-contract.
---

# Prisma và dữ liệu Lumina

## Đầu vào

Đọc [AGENTS.md](../../../AGENTS.md), `backend/prisma/schema.prisma`, migration
liên quan, `backend/prisma.config.ts`, `backend/src/lib/prisma.js` và consumer
trong route production/UI. Kiểm tra package scripts, Dockerfile và Compose nếu
cách generate/deploy chịu ảnh hưởng. Không đọc hoặc in giá trị file secret.

## Chọn thay đổi nhỏ nhất

1. Với query-only, giữ schema; xem quyền lọc dữ liệu và response cần gì trước
   khi chọn `select`/`include`. Tránh N+1, lấy thừa dữ liệu nhạy cảm và pagination
   không ổn định. Đánh giá transaction/concurrency theo thao tác thực tế, đặc
   biệt draft quiz có version; không thay update có điều kiện bằng write mù.
2. Với model/migration, ghi quan hệ và consumer bị ảnh hưởng; nêu tác động tới
   hàng cũ, null/default/backfill, unique/index, foreign key và delete behavior.
   Xem chuỗi cascade User/Course/Lesson tới enrollment, progress, submission,
   chat và quiz trước khi đổi quan hệ. Nêu rủi ro mất dữ liệu và phương án áp
   dụng/phục hồi phù hợp, không hứa rollback tự động.
3. Schema là nguồn model hiện hành nhưng vẫn đối chiếu SQL lịch sử. Nếu khác
   index, constraint hoặc default, ghi cả đường dẫn và phần chưa xác minh trên
   database; không sửa migration cũ để làm chúng trông khớp nhau.
4. Quyết định schema/data chưa được xác định rõ phải được làm rõ trước khi
   mutate. Tạo migration mới có tên mô tả cho thay đổi mới. Chỉ chạy migration
   development trên database development được xác định; nếu công cụ đề nghị
   reset do drift thì dừng thao tác đó và báo lý do. Không reset/drop database,
   xóa volume hoặc dùng `docker compose down -v` nếu chưa có yêu cầu rõ ràng.
5. Giữ dữ liệu document extraction riêng với nội dung nhập tay, revision/hash
   và quiz snapshot theo contract khi chạm các model đó. Không backfill tài liệu
   lịch sử ngầm trong migration. Generated client không sửa tay hoặc commit.

## Kiểm chứng và hoàn thành

- Review migration SQL/diff trước khi áp dụng, nhất là thao tác phá hủy, khóa
  bảng, cột bắt buộc và constraint trên dữ liệu đã có.
- Trong `backend/`, dùng Prisma đã có của project để chạy `npx prisma validate`,
  `npx prisma generate` và `npx prisma migrate status` trên database mục tiêu
  phù hợp. Nếu dependency chưa có, không để `npx` tự lấy phiên bản khác; chuẩn
  bị bằng lockfile theo AGENTS.md khi việc đó nằm trong phạm vi được giao.
- Schema/migration đổi: rebuild Docker, kiểm tra health của db/backend và
  `/api/health`, endpoint bị ảnh hưởng và integration khi môi trường cho phép.
  Backend container tự `migrate deploy`; không trỏ host nhầm vào `db:5432`.
- Query-only: regression dữ liệu/quyền và endpoint liên quan; không cần tạo
  migration hoặc rebuild image chỉ vì dùng skill này.

Đầu ra: model/query trước/sau, tác động dữ liệu/constraint/delete behavior,
SQL đã review, database đích theo môi trường (không connection string), bằng
chứng kiểm chứng và bước chưa chạy. Kết thúc qua
[lumina-verify](../lumina-verify/SKILL.md); không tuyên bố migration đã áp dụng
chỉ vì schema validate hoặc client generate thành công.
