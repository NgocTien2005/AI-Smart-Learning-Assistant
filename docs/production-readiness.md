# Production readiness — Lumina LMS

Feature019 adds a [safe operations/recovery guide](operations.md), bounded
new-container logging and proxy privacy/header defaults. Its synthetic drill
evidence is recorded separately in specs/019-deployment-operation-foundations;
the historical table below is not retroactive production certification.

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
| OAuth Google | Đã gỡ UI/SDK/API/config theo feature022; endpoint cũ404 | Giữ column lịch sử dormant, không xóa tài khoản/migration. Dùng email/mật khẩu | RETIRED, không phải provider acceptance pass |
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

### Bổ sung cấu hình demo 2026-11-08

| Hạng mục mới | Cấu hình thực tế | Điều kiện trước public | Trạng thái |
| --- | --- | --- | --- |
| Dataset011 | Bảng ownership riêng;18user `.invalid`,8course/48lesson/26document; marker chỉ ở Compose dev/acceptance | Không bật marker/seed trong production; review tài khoản demo và cleanup theo yêu cầu riêng, không reset hoặc xóa theo email prefix | DEV ĐÃ SEED/ISOLATED ĐÃ KIỂM; KHÔNG SEED PRODUCTION |
| Gemini012 | Panel/API riêng, nguồn demo nguyên bản, câu hỏi hữu hạn, optional key chỉ server; global20lượt/ngày/process, active1, cooldown20giây | Key/rotation/quyền vận hành và provider terms; billing phải tắt cho budget0; nhiều replica cần quota durable; không mở tài liệu thật khi chưa có quyền gửi riêng | LOCAL CONTROLLED/DISABLED CHECKS; REAL MODEL CHƯA NGHIỆM THU |
| Chi phí và dữ liệu AI | Gemini3.8Flash Free tier, không tool/search/fallback/retry; store:false | App không thể xác minh project billing; cờ xác nhận không bảo đảm miễn phí nếu operator dùng key project trả phí. Free-tier data có thể cải thiện sản phẩm/human review | CHỈ DEMO TỔNG HỢP; CHƯA PRODUCTION-READY |

Các bổ sung trên không đổi cổng domain/TLS/backup/monitoring/SMTP còn mở. OAuth được ngừng hỗ trợ theo022, không còn là điều kiện cấu hình.
Không deploy trong lượt này; xem [verification011](../specs/011-seed-complete-demo/verification.md)
và [verification012](../specs/012-demo-cloud-assistant/verification.md).

- [Docker Compose in production](https://docs.docker.com/compose/how-tos/production/): xét riêng port, environment, restart và logging; chưa tạo production override.
- [Express production security](https://expressjs.com/en/advanced/best-practice-security/): cơ sở kiểm TLS và cấu hình bảo vệ; không thêm dependency hoặc đổi chính sách.
- [Express behind proxies](https://expressjs.com/en/guide/behind-proxies/): trust proxy phải khớp topology/forwarding headers; không đặt true mặc định.
- [PostgreSQL17 SQL dump/restore](https://www.postgresql.org/docs/17/backup-dump.html): phương pháp dump và restore DB; review này chưa chạy backup/phục hồi.

## Actual chat follow-up2026-11-16

Feature021 now pins real Free3.1Flash-Lite/generateContent for conversation, with dedicated chat schema, exact quotation validation and no automatic model fallback/retry. Two actual synthetic-source UI answers accepted; see feature021 verification. Old finite-demo3.8 acceptance remains distinct. Billing-disabled confirmation remains operator responsibility; Free data use/privacy, per-process rate limits, TLS/backups/monitoring and public deployment review remain release gates. OAuth is retired by022.

## Opt-in VPS kit2026-11-17

See [VPS Ubuntu deployment](deploy-vps.md) and [release status](release-status-20261117.md). Feature023 supplies a merge-tested override: exclusive127.0.0.1:18080 frontend port, host Caddy HTTPS example, required domain and server-only Gemini settings, demo disabled. Default compose/dev stack unchanged. Actual web image build, Caddy/DNS/TLS, production SMTP/Gemini/storage/restore and topology load remain unverified. Dependency audit findings must be resolved/reviewed before public release; config validation does not satisfy that gate.

## Patched runtime release2026-11-17

Feature024 resolves the6 reported production npm advisories with targeted direct/transitive updates and actual Node24 integration. Current npm audit backend/frontend0 is not a certification; image/OS review and public topology/privacy/load/recovery gates remain. New web stack and Caddy parser tested locally (023 evidence); actual VPS domain/TLS/renewal, SMTP delivery, deployment-specific roles/storage/restore and operational ownership remain023T005. Docker recovered, default5173/8080 health200 and private provider readiness preserved. See release-status-20261117.md and024 verification for current scope instead of historical table statuses.
