# Deploy Lumina miễn phí: Render + Supabase + Brevo

Đây là hướng dẫn demo/portfolio theo quota Free kiểm tra ngày2026-11-18, không thuê VPS hoặc mua domain. Nền tảng có thể đổi điều kiện hoặc yêu cầu xác minh tài khoản. Chỉ chọn **Free**, không thêm billing/nâng cấp gói. Nếu dashboard yêu cầu trả phí cho một bước, dừng bước đó; không coi trial credit là miễn phí lâu dài.

Frontend static trên Render → backend Express Docker trên Render → PostgreSQL và Storage **private** trên Supabase. Quên mật khẩu dùng Brevo HTTPS, Gemini giữ tùy chọn Free. Auth vẫn là email/mật khẩu của Lumina, không chuyển sang Supabase Auth hoặc Google OAuth.

## 1. Lấy đúng code

Phải dùng revision có feature025; bản archive d8716a8 ở hướng dẫn VPS cũ chưa có adapter này. Xem [verification025](../specs/025-free-hosting-adapters/verification.md). Thay đổi có thể còn ở branch local `feat/free-hosting-adapters`, chưa ở remote/main. Ghi SHA bằng `git rev-parse HEAD`, kiểm tra tests/CI đúng SHA trước khi phát hành. Render cần đọc được revision qua Git integration; cấp quyền Git riêng và push branch hợp lệ trước, không nhúng token vào URL, không cần public repository hoặc merge main. Chưa push được thì chưa thể hoàn tất các bước deploy từ Git bên dưới.

## 2. Tạo Supabase Free mới

1. Tạo project **mới dành cho Lumina demo**. Chọn Free, mật khẩu DB ngẫu nhiên và lưu riêng. Không dùng lại database local/production, không import dataset thật hoặc tài khoản demo có mật khẩu yếu.
2. **Tắt Data API** trong project settings (theo [hướng dẫn Supabase](https://supabase.com/docs/guides/database/hardening-data-api)) trước khi chạy migration. LMS dùng Prisma, không cần endpoint PostgREST. Các bảng public chứa password hash/reset metadata; không để API anon đọc chúng. Nếu dashboard không có nút tắt, làm theo tài liệu chính thức để không expose schema ứng dụng, rồi xác minh trước khi deploy. Không thêm public policy để làm ứng dụng chạy. Storage API là dịch vụ riêng vẫn cần hoạt động.
3. Trong **Connect → Session pooler**, lấy URI IPv4 cổng **5432**, không chọn transaction6543 hoặc mua IPv4 add-on. Giữ nguyên hostname/username đúng project. Database thường là `postgres`; không thay thành `lumina_lms` nếu chưa tạo DB đó. URL-encode mật khẩu có ký tự đặc biệt trong editor riêng.
4. Runtime `DATABASE_URL`: dùng URI trên với `sslmode=verify-full` để pg kiểm chứng TLS. `MIGRATION_DATABASE_URL`: cùng host/user/database, dùng `sslmode=require&sslaccept=strict` cho Prisma CLI. Không thay đổi target giữa hai URI. Nếu cần CA tùy project, tải certificate từ dashboard và đưa vào Render **Secret Files**: runtime dùng `sslrootcert=/etc/secrets/supabase-ca.crt`, CLI dùng `sslcert=/etc/secrets/supabase-ca.crt`. Không đặt `sslaccept=accept_invalid_certs`, `no-verify` hoặc `NODE_TLS_REJECT_UNAUTHORIZED=0`. Kết nối TLS thật vẫn cần nghiệm thu trên project của bạn.
5. Storage → tạo bucket tên **`lumina-documents`**, **Public OFF**, giới hạn file10MiB. Không tạo policy cho anon/authenticated và không tạo public/signed link. Backend dùng server key và tự kiểm quyền LMS; JWT Lumina không phải Supabase JWT. Không giới hạn MIME bucket theo extension vì adapter gửi bytes dạng `application/octet-stream`; server vẫn validate loại/nội dung tệp trước lưu.
6. Project settings → API keys: lấy **secret key** `sb_secret_...` hoặc legacy **service_role**, nhập riêng vào `SUPABASE_STORAGE_KEY` phía backend. Không dùng publishable/anon key. Key server bypass RLS: tuyệt đối không đưa vào frontend, Git, screenshot hoặc chat.

Supabase Free có quota và có thể pause khi ít hoạt động. Database và file là hai phần backup khác nhau; không dựa vào project Free như bản backup duy nhất. [Giới hạn gói](https://supabase.com/pricing), [pause](https://supabase.com/docs/guides/platform/free-project-pausing), [pooler](https://supabase.com/docs/guides/database/connecting-to-postgres).

## 3. Tạo Brevo Free để gửi email qua HTTPS

1. Tạo tài khoản Free, hoàn tất bước xác minh/duyệt transactional email nếu được yêu cầu. Không mua credits/nâng cấp.
2. Trong Senders, thêm địa chỉ gửi **bạn sở hữu**, xác minh bằng code/email do Brevo gửi. Đây là thao tác bạn chủ động làm trên dashboard, không dùng quyền gửi cũ trong chat.
3. Nếu chỉ có Gmail, không thể xác thực domain `gmail.com`. Brevo có thể thay phần domain bằng domain của họ; việc được phép gửi và khả năng vào inbox phụ thuộc chính sách/duyệt của Brevo. **Không bảo đảm gửi tùy ý chỉ vì có API key.** Nếu provider không duyệt sender miễn phí, giữ nghiệm thu mail mở; không tự mua domain hoặc giả delivery.
4. Tạo **API key** cho HTTPS (không phải SMTP key), nhập riêng vào backend `BREVO_API_KEY`; đặt `EMAIL_FROM` là đúng sender đã verify. Chỉ đặt `BREVO_SENDER_VERIFIED=true` sau khi dashboard xác nhận. Đây là xác nhận cấu hình của operator, không phải bằng chứng delivery.
5. Free hiện giới hạn300email/ngày; vượt quota có thể lỗi hoặc xếp hàng, làm link30phút hết hạn trước khi đến. Theo dõi quota và chỉ thử với mailbox/quyền gửi mới bạn cấp. Không tự chạy mail thật trong CI.

Backend gọi HTTPS443 một lần; không dùng SMTP, không tự retry hoặc fallback sau timeout. Forgot vẫn trả generic response khi sender được cấu hình dù provider từ chối; HTTP200 không chứng minh đã nhận thư. Chỉ người dùng mở mailbox riêng mới xác nhận delivery/reset. [API](https://developers.brevo.com/docs/send-a-transactional-email), [Free](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan), [sender](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email).

## 4. Tạo frontend Render Static Site trước

Render → New → **Static Site**, kết nối đúng repo/branch revision025:

| Setting | Giá trị |
| --- | --- |
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Environment | `NODE_VERSION=24` |
| Redirects/Rewrites | Source `/*`, Destination `/index.html`, Action **Rewrite** |

Ghi URL HTTPS được cấp, ví dụ `https://lumina-web-XXXX.onrender.com` (chỉ là ví dụ). Chưa có backend thì chưa nghiệm thu đăng nhập. Sau bước5 thêm `VITE_API_URL` và rebuild frontend. Chỉ biến API origin này được đưa vào frontend; tuyệt đối không copy toàn bộ env backend.

## 5. Tạo backend Render Free Web Service

New → **Web Service**, cùng repo/branch:

| Setting | Giá trị |
| --- | --- |
| Language/runtime | **Docker** |
| Root Directory | `backend` |
| Dockerfile Path | `./Dockerfile` |
| Instance | **Free** |
| Health Check Path | `/api/health` |
| Docker Command / Pre-deploy | Để mặc định / không dùng pre-deploy trả phí |

Dockerfile pin Node24, `npm ci` sinh Prisma client; startup chạy migration trước server. Render cấp `PORT`, Express lắng nghe cổng đó. Không chạy Compose hoặc tạo Render Postgres Free30ngày; dùng Supabase đã chuẩn bị.

Backend Environment nhập riêng theo [mẫu tham khảo](../deploy/free.env.example):

| Biến | Cách đặt |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL`, `MIGRATION_DATABASE_URL` | Hai URI cùng target/TLS ở bước2 |
| `JWT_SECRET` | Random ít nhất32byte, khác DB password; lưu riêng |
| `APP_ORIGIN`, `CORS_ORIGIN` | Chính xác URL HTTPS **frontend**, không có slash cuối/path; không dùng wildcard |
| `DOCUMENT_STORAGE` | `supabase` |
| `SUPABASE_URL` | `https://PROJECT-REF.supabase.co`, không path/query |
| `SUPABASE_STORAGE_BUCKET` | `lumina-documents` |
| `SUPABASE_STORAGE_KEY` | Server secret hoặc legacy service_role, chỉ backend |
| `EMAIL_PROVIDER` | `brevo` |
| `BREVO_API_KEY`, `EMAIL_FROM`, `BREVO_SENDER_VERIFIED` | Bước3; false khi chưa verify |
| `LUMINA_DEMO_ALLOWED` | `false` |
| `GEMINI_API_KEY` | Tùy chọn, nhập riêng; không tự chuyển key local lên cloud |
| `GEMINI_FREE_ONLY_CONFIRMED`, `GEMINI_CHAT_ALLOWED` | `true` chỉ nếu Free/billing tắt và bạn chấp thuận chia sẻ theo nguồn; nếu chưa thì `false` |

Không cần SMTP_USER/SMTP_APP_PASSWORD khi chọn brevo. Không đưa ADMIN_BOOTSTRAP_* vào service; không seed khi startup. Đợi build/deploy thành công, mở `https://BACKEND.onrender.com/api/health`. Health200 chỉ liveness, migration/DB/quyền cần smoke riêng.

Quay lại frontend Environment: `VITE_API_URL=https://BACKEND.onrender.com` **không `/api`**, rebuild/deploy frontend. Khi đổi frontend URL phải sửa cả APP_ORIGIN/CORS_ORIGIN backend; khi đổi backend URL phải rebuild frontend. Hai dịch vụ phải dùng cùng release tương thích. Không dùng localhost5173/8080 trong cấu hình public.

## 6. Tạo ADMIN một lần từ máy local

Render Free không có shell/one-off job; không dùng hướng dẫn yêu cầu dashboard Shell trả phí. Dùng Node24+ và package backend đã cài theo lockfile (`npm ci`) trên máy riêng. Migration phải thành công ở bước5 trước.

Tạo file **ignored** `.artifacts/free-hosted-admin.env` bằng editor riêng, không sửa `backend/.env` đang dùng local. Điền DATABASE_URL (runtime URI đúng project mới), `DOTENV_CONFIG_PATH` trỏ đến một file rỗng riêng, `EXPECTED_DATABASE_HOST` đúng host Session pooler, `EXPECTED_PROJECT_REF`, `FREE_DEPLOY_TARGET_CONFIRMED=NEW_EMPTY_PROJECT`, và `ADMIN_BOOTSTRAP_NAME/EMAIL/PASSWORD` (12–72ký tự, không mật khẩu seed). Không gửi nội dung file, không bật transcript/screenshot terminal.

Tại `backend/`, chạy lệnh sau; guard chỉ cho đúng pooler/project/db mới và chưa có user:

```powershell
node --env-file=../.artifacts/free-hosted-admin.env scripts/bootstrap-free-admin.mjs --check-only
node --env-file=../.artifacts/free-hosted-admin.env scripts/bootstrap-free-admin.mjs
```

Script c? guard ri?ng, kh?ng c?n d?n JavaScript v?o terminal. --check-only ch? ki?m tra h?nh d?ng c?u h?nh, kh?ng ch?ng minh database ??ng ho?c tr?ng; l?nh th?t ki?m tra User.count tr??c khi t?o ADMIN. N?u l?nh b?o k?t qu? kh?ng ch?c ch?n, ki?m tra ??ng nh?p/admin ?? c? tr??c, kh?ng t? ch?y l?i mutation. X?a file env ri?ng khi xong b?ng thao t?c c?a b?n, ??ng terminal; kh?ng thu th?p v?o evidence.

Bootstrap không đổi user đã có. Nếu đã có tài khoản và cần nâng quyền, đó là thao tác quản trị riêng, không bỏ điều kiện user.count để chạy hướng dẫn cho DB mới. Public registration chỉ STUDENT/INSTRUCTOR. Không dùng tài khoản demo/password123456789 trên web công khai.

## 7. Nghiệm thu trước khi chia sẻ link

- ADMIN đăng nhập/quản trị; INSTRUCTOR tạo course/lesson, upload PDF có text hoặc TXT/MD/CSV ≤10MiB; STUDENT ghi danh, tải đúng bytes. Instructor khác, student chưa tham gia/đã rời và thiếu token đều bị từ chối. Bucket Public OFF, không có policy anon; không lấy URL storage trực tiếp làm tính năng.
- Restart/redeploy backend: tài liệu vẫn tải được từ Supabase. Thay/gỡ tài liệu đúng object, reprocess/summary/quiz hoạt động, snapshot cũ giữ nguyên. Provider lỗi phải báo lỗi, không âm thầm ghi vào local disk.
- Tạo file chỉ ở project mới; kiểm quota/storage. Không đổ DB local sang hosted vì bản ghi basename cũ **không** mang theo file uploads. Không có auto-migration dữ liệu trong feature025.
- Với quyền gửi mới: forgot từ UI → nhận email thật → mở link riêng → reset → đăng nhập mật khẩu mới → từ chối mật khẩu/phiên cũ → submit link đã dùng bị từ chối. Không đưa token/link vào log/chat. Sau timeout không tự gửi/reset lại; kiểm trạng thái trước.
- Test ba role, assignment/chấm điểm, quiz draft/submit, progress, tài khoản, deep-link refresh, preview/download. Nếu bật Gemini, kiểm model thật với dữ liệu bạn chủ động cho phép; không lấy mock làm pass.
- Backup DB và private bucket, restore trên target riêng. Supabase Data API vẫn tắt; key không xuất hiện trong frontend bundle. Hosted CI đúng SHA và provider acceptance ghi riêng với local tests.

## Giới hạn và xử lý lỗi

- Free backend ngủ sau15phút không truy cập; lần mở đầu có thể chậm hoặc gặp lỗi mạng. Đợi health sẵn rồi chủ động retry thao tác đọc; không tự replay reset/upload khi chưa biết kết quả. Không dùng keepalive để hứa dịch vụ luôn bật. [Render Free](https://render.com/docs/free).
- `503 STORAGE_UNAVAILABLE`: kiểm tên bucket/private flag/server key/quota và project còn hoạt động; không bật public, dùng anon key hoặc fallback local để chữa. `404 DOCUMENT_NOT_FOUND`: object không còn hoặc file legacy chưa được chuyển; không tự tạo dữ liệu giả.
- Forgot503: thiếu cấu hình/verify flag. Generic200 nhưng chưa nhận thư: xem trạng thái transactional/sender/quota bằng dashboard riêng, kiểm Spam; không đăng provider raw logs chứa reset URL. Accepted không phải delivery.
- Origin403: APP_ORIGIN/CORS_ORIGIN phải đúng frontend, VITE_API_URL đúng backend và rebuild frontend. Không tắt CORS. Đăng nhập lỗi DB/TLS: xác minh đúng session pooler5432, certificate và migration, không bỏ TLS.
- App hiện một instance; rate limit theo process và proxy IP có thể chia sẻ budget. Không nới guards/scale tùy tiện. DB bootstrap dùng postgres cho demo mới; least privilege/monitoring/backup vẫn là release gate trước người dùng thực.
- Lỗi DB hoặc timeout sau upload có thể để lại object orphan; bản vá ưu tiên giữ file có thể đã được DB commit. Cleanup chỉ exact object theo quyền/đối chiếu, không xóa bucket/prefix hàng loạt. Xóa ở dashboard ngoài app có thể làm tham chiếu DB bị mất; backend không tự sửa dữ liệu thật.

Code/tests local không chứng minh đã deploy, lưu storage thật, gửi mail thật hoặc Free/billing của tài khoản bạn. Những phần đó giữ mở ở T008 cho đến khi có nghiệm thu riêng. [Trạng thái feature025](../specs/025-free-hosting-adapters/verification.md), [hướng dẫn VPS tùy chọn](deploy-vps.md).
