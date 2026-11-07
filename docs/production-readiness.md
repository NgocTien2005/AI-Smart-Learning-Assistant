# Production readiness — Lumina LMS

Review ngày **2026-11-07**, theo cấu hình versioned tại `ef3cbf1`, không đọc
`.env`, secret store hoặc Docker environment. Đây là checklist chuẩn bị bàn
giao, **không phải chứng nhận production-ready hoặc kế hoạch deploy đã duyệt**.
Nguồn và giới hạn nghiệm thu: [MVP handoff](mvp-handoff.md).

## Cổng cần kiểm chứng trước khi mở công khai

| Hạng mục | Cấu hình thực tế trong repository | Bằng chứng cần có trước triển khai | Trạng thái |
| --- | --- | --- | --- |
| Domain, TLS và mạng | `frontend/nginx.conf` chỉ listen80/server_name_; `compose.yaml` publish `${FRONTEND_PORT:-8080}:80`; DB/backend không publish port | Domain được chọn, DNS/TLS và renew được kiểm; HTTPS/API/upload/reset-link qua đúng proxy; firewall/binding đúng môi trường | CHƯA CẤU HÌNH/KIỂM CHỨNG |
| Origin/CORS/reset origin | Compose dùng APP_ORIGIN, mặc định HTTP localhost; `src/config/env.js` đọc APP_ORIGIN/CORS_ORIGIN | Origin triển khai thống nhất; origin hợp lệ được chấp nhận, origin khác bị từ chối; email trỏ đúng HTTPS origin | CHƯA KIỂM CHỨNG MÔI TRƯỜNG THẬT |
| Proxy và IP/rate limit | Nginx forward X-Forwarded-*; Express chưa set trust proxy; forgot limiter dùng request.ip, Map từng process | Chọn topology proxy rồi kiểm IP/rate-limit thực tế, spoofed forwarding headers và behavior sau restart; nhiều instance cần quyết định riêng | CHƯA KIỂM CHỨNG; KHÔNG TỰ ĐỔI GUARD |
| Secrets và quyền vận hành | JWT_SECRET bắt buộc production; Compose nhận DB/JWT/SMTP/bootstrap qua environment; DB/app hiện dùng user postgres | Cơ chế cấp/rotate/revoke secret và quyền truy cập được chọn; readiness chỉ boolean; review quyền DB phù hợp; không dùng demo credentials | CHƯA KIỂM CHỨNG |
| Admin bootstrap | `backend/scripts/create-admin.mjs` qua npm run admin:create; README yêu cầu bỏ biến bootstrap sau khi tạo | Bootstrap đúng target, xác nhận admin đăng nhập/quyền; bỏ cấu hình bootstrap sau dùng; không đụng tài khoản local | CHƯA CHẠY TRÊN PRODUCTION |
| Email recovery | Gmail SMTP; token 30 phút, single use qua POST; generic forgot response | 008 T023 đã được người dùng xác nhận email/reset/login/link đã dùng; vẫn cần kiểm APP_ORIGIN/SMTP trên môi trường triển khai riêng | MVP PASS (USER-CONFIRMED); PRODUCTION CHƯA KIỂM CHỨNG |
| Google tùy chọn | GIS popup + public Client ID; nullable unique User.googleSubject; chỉ liên kết chủ động tài khoản đã có, không tự tạo/gộp user | Client ID frontend/backend khớp, authorized HTTPS origins/Branding/Audience, consent riêng và nghiệm thu thật theo feature010 T016; log không chứa credential | IMPLEMENTED/LOCAL TESTED; GOOGLE THẬT CHƯA CẤU HÌNH/NGHIỆM THU |
| Google challenge/topology | Cookie HttpOnly/SameSite=Lax, Secure theo APP_ORIGIN HTTPS; challenge Map5 phút/1000 entry, 20 yêu cầu/IP/5 phút, một process | Cùng origin qua proxy; kiểm browser cookie/TLS/FedCM/popup trên domain thật. Multi-replica cần kho challenge chia sẻ; IP/proxy limiter cần review theo topology | CHƯA KIỂM CHỨNG PUBLIC; KHÔNG TỰ SCALE/DEPLOY |
| Persistence và backup/restore | PostgreSQL17 trong postgres_data; uploads trong uploads_data; startup migrate deploy | Chọn RPO/RTO/lịch giữ bản sao; backup DB và upload có tính nhất quán; restore vào target mới, kiểm quyền/dữ liệu/file; bảo vệ backup như dữ liệu nhạy cảm | CHƯA THỬ BACKUP/RESTORE |
| Migration và release/rollback | Backend chạy prisma migrate deploy trước server; migrations bất biến | Review status/SQL trên target, backup trước release; rollback app tương thích dữ liệu; không sửa migration cũ hoặc reset database | CHƯA KIỂM CHỨNG RELEASE THẬT |
| Health và monitoring | DB có pg_isready; backend /api/health chỉ là liveness; restart unless-stopped | Query DB và upload storage smoke riêng; theo dõi lỗi/latency/capacity, cảnh báo và người xử lý; log không token/reset URL/password | CHƯA CÓ BẰNG CHỨNG VẬN HÀNH |
| Tải và security trên topology thật | CI có functional/authorization regressions; chưa có load/security acceptance theo mục tiêu triển khai | Chọn concurrency/data/latency mục tiêu; thử tải và quyền/auth/upload trên staging riêng; review image/dependency advisories, không tự nâng lockfile | CHƯA KIỂM CHỨNG |
| Kiểm soát thay đổi | CI contents:read, actions pinned, 3 jobs; main protected:false ở lần query hiện tại | Chủ repository quyết định required checks/review/branch rules; kiểm run đúng revision trước release | HOSTED PUSH PASS; BRANCH GATE CHƯA THIẾT LẬP |

Dockerfiles hiện dùng `node:24-alpine`, frontend runtime `nginx:1.27-alpine`,
database `postgres:17-alpine`. Đây là inventory từ source, không phải kết quả
vulnerability scan hoặc tuyên bố image phù hợp cho production. Không có
image/dependency/lockfile nào được nâng trong review này.

Không dùng một `/api/health`200 để kết luận database đọc/ghi được. Backup database
không bao gồm uploads_data; cần kiểm cả hai phần khi restore. Dump/upload có
thể chứa dữ liệu nhạy cảm và không được upload làm CI artifact. Không
backup/restore hoặc xóa tài nguyên của local8081 trong nhiệm vụ này.

## Thông tin cần chốt cho một nhiệm vụ triển khai riêng

Chủ hệ thống cần chỉ định môi trường/host, domain và topology TLS/proxy; người
quản lý secrets/SMTP và mailbox thử; RPO/RTO, retention và mức tải dự kiến;
người vận hành/cảnh báo và quyền deploy. Không đoán các quyết định này từ cấu
hình local. Sau đó mới lập plan kiểm chứng trên staging riêng và phạm vi
release được phép; checklist này không tạo quyền deploy/PR/merge.

T026 là cleanup profile thử nghiệm của máy phát triển, không phải feature
production còn thiếu. Task vẫn OPEN do policy, không được xóa theo cách khác
hoặc ghi đạt khi chưa có proof.

## Tài liệu chính thức đã đối chiếu

- [Docker Compose in production](https://docs.docker.com/compose/how-tos/production/): xét riêng port, environment, restart và logging; chưa tạo production override.
- [Express production security](https://expressjs.com/en/advanced/best-practice-security/): cơ sở kiểm TLS và cấu hình bảo vệ; không thêm dependency hoặc đổi chính sách.
- [Express behind proxies](https://expressjs.com/en/guide/behind-proxies/): trust proxy phải khớp topology/forwarding headers; không đặt true mặc định.
- [PostgreSQL17 SQL dump/restore](https://www.postgresql.org/docs/17/backup-dump.html): phương pháp dump và restore DB; review này chưa chạy backup/phục hồi.
