# Tự deploy Lumina LMS lên VPS Ubuntu

Hướng dẫn dành cho **VPS mới, một host, một instance backend**, Ubuntu LTS được Docker hỗ trợ. Bạn tự chọn/mua VPS và domain; không có tài nguyên cloud hoặc billing nào được tạo bởi repository. Gemini Free không đồng nghĩa VPS/domain miễn phí. Đây là bộ cấu hình đã kiểm tra merge, **chưa có nghiệm thu trên VPS/domain thật**. Xem [trạng thái bàn giao](release-status-20261117.md) và [production readiness](production-readiness.md).

Bản hiện tại đã qua local web-stack smoke, Caddy parser và isolated HTTP/database integration trên dependency đã vá; production npm audit backend/frontend0 tại2026-11-17. Hãy lấy commit chứa feature024 và đối chiếu [verification](../specs/024-runtime-security-patches/verification.md), không triển khai release cũ còn advisory. Vẫn cần nghiệm thu staging/host thật bên dưới.

Luồng: Internet HTTPS → **Caddy cài trên host** → `127.0.0.1:18080` → Nginx frontend → Express → PostgreSQL. Chỉ Caddy mở80/443. Backend3000 và database5432 không publish. PostgreSQL và uploads có volumes riêng. Không dùng Vite5173 hoặc `compose.dev.yaml` để deploy công khai.

## 1. Chuẩn bị VPS, domain và phần mềm

Chọn Ubuntu LTS còn được [Docker hỗ trợ](https://docs.docker.com/engine/install/ubuntu/). Build image ngay trên VPS cần đủ RAM/disk; chưa có benchmark sizing của dự án, hãy thử trên staging và theo dõi RAM/disk thay vì coi một cấu hình máy là bảo đảm tải. Dùng SSH key, cập nhật hệ điều hành và tài khoản quản trị riêng.

1. Tạo DNS A cho hostname, ví dụ `lms.tenmiencuaban.vn`, trỏ đến IPv4 VPS. Chỉ tạo AAAA nếu IPv6 thực sự được cấu hình. Hostname ví dụ `lms.example.com` trong mẫu **phải thay**.
2. Firewall của nhà cung cấp: cho phép SSH đúng cổng từ IP quản trị của bạn, TCP80/443 cho web; không mở18080/3000/5432. Không bật rule làm mất phiên SSH hiện tại.
3. Cài Docker Engine và Compose plugin theo [hướng dẫn Ubuntu chính thức](https://docs.docker.com/engine/install/ubuntu/#install-using-the-apt-repository). Yêu cầu **Engine28+**, **Compose2.24.4+**. Không dùng Docker Desktop trên VPS Linux.
4. Cài Caddy bằng [package Ubuntu chính thức](https://caddyserver.com/docs/install#debian-ubuntu-raspbian), chạy như systemd service trên host. Không thay host Caddy bằng container rồi giữ upstream127.0.0.1:18080: đó là loopback khác.

Trên SSH terminal VPS:

```bash
sudo docker version
sudo docker compose version
caddy version
```

Không đặt secret trong frontend hoặc biến `VITE_*`. Không gửi `.env`, key, mật khẩu, token, reset URL hoặc ảnh terminal vào chat/issue.

## 2. Chuyển đúng bản code lên VPS

Các thay đổi mới có thể còn trên branch local, chưa có ở `main` hoặc remote. **Không clone main rồi cho rằng đã có bản sửa.** Hai lựa chọn:

- Khi đã push/review hợp lệ: clone bằng quyền Git riêng và checkout **đúng SHA** đã kiểm chứng, không nhúng PAT trong URL/lệnh shell.
- Khi push còn bị chặn: tạo source archive từ commit local. Archive chỉ chứa file tracked, không chứa `.env`, uploads, node_modules hoặc browser profile đã ignore. Kiểm tra `git status` trước; thay đổi chưa commit không được đưa vào archive.

PowerShell trên máy development, tại thư mục repo:

```powershell
git status --short
git rev-parse HEAD
git archive --format=tar --output=lumina-release.tar HEAD
Get-FileHash .\lumina-release.tar -Algorithm SHA256
scp .\lumina-release.tar ubuntu@YOUR_VPS_IP:/tmp/lumina-release.tar
```

Lưu SHA và checksum riêng để đối chiếu. Không dùng text pipe/redirect PowerShell5.1 để tạo archive binary. File archive không được commit.

Trên VPS mới, kiểm checksum với giá trị vừa ghi rồi giải nén vào **thư mục mới**:

```bash
sha256sum /tmp/lumina-release.tar
mkdir -m 750 ~/lumina
tar -xf /tmp/lumina-release.tar -C ~/lumina
cd ~/lumina
```

Nếu thư mục đã có bản triển khai/dữ liệu thì dừng, làm theo bước cập nhật cuối tài liệu; không giải nén đè một release đang chạy.

## 3. Tạo cấu hình riêng trên VPS

```bash
cd ~/lumina
umask 077
cp -n deploy/web.env.example .env.web
chmod 600 .env.web
nano .env.web
```

Điền trong editor riêng:

| Biến | Giá trị |
| --- | --- |
| `LUMINA_DOMAIN` | Hostname thực tế, ví dụ `lms.tenmiencuaban.vn`; không có scheme, port, path, wildcard hoặc dấu cách |
| `POSTGRES_PASSWORD` | Ngẫu nhiên, ví dụ64 ký tự hex; dùng hex để an toàn trong DATABASE_URL |
| `JWT_SECRET` | Giá trị ngẫu nhiên **khác** DB password, ít nhất32 byte |
| `SMTP_USER`, `SMTP_APP_PASSWORD` | Tùy chọn, nhập riêng; Gmail cần App Password phù hợp, không phải mật khẩu Gmail thường |
| `GEMINI_API_KEY` | Tùy chọn; chỉ key của project Free đã kiểm tra billing tắt |
| `GEMINI_FREE_ONLY_CONFIRMED`, `GEMINI_CHAT_ALLOWED` | `true` chỉ khi bạn đã đọc điều khoản Free và cho phép chat theo nguồn đã chọn; mặc định `false` |
| `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD` | ADMIN đầu tiên; email thật bạn kiểm soát, password12–72 ký tự, không dùng123456789 hoặc mật khẩu demo |

Bạn có thể tạo từng secret bằng `openssl rand -hex 32` trong terminal **riêng**, rồi nhập vào editor. Không đưa output vào evidence/chat. Tắt việc ghi phiên terminal/screen capture khi cấu hình. Không chạy `cat .env.web`, `docker inspect ...Config.Env` hoặc `docker compose config` không có `--quiet` với secret thật.

Không đưa dataset local/demo lên public host, không chạy seed. Override luôn tắt `LUMINA_DEMO_ALLOWED`, nhưng **không tự xóa dữ liệu demo nếu bạn đã nhập nhầm**. Nếu target không mới, kiểm tra có dữ liệu thật/demo và lập kế hoạch riêng trước khi tiếp tục. Không thay DB password của volume đã khởi tạo chỉ bằng cách sửa env.

## 4. Build và khởi động stack riêng

Trong **Bash trên VPS**, định nghĩa helper để mọi lệnh dùng cùng project/file/env:

```bash
cd ~/lumina
dc() {
  sudo docker compose -p lumina-web --env-file .env.web \
    -f compose.yaml -f compose.web.yaml "$@"
}
dc config --quiet
dc up -d --build --wait --wait-timeout 180
dc ps
curl --fail --silent --show-error http://127.0.0.1:18080/api/health
dc exec -T backend ./node_modules/.bin/prisma migrate status
dc exec -T db psql -U postgres -d lumina_lms -c 'SELECT current_database();'
```

Không dùng `--continue-on-error`, không sửa migration cũ, không migrate reset. Backend tự `prisma migrate deploy` khi khởi động. Config fail khi thiếu domain/DB password/JWT; kiểm tra hostname trong editor vì Compose chỉ kiểm tra có giá trị, không kiểm DNS/đúng hostname.

`!override` **thay** mapping8080 của base bằng đúng127.0.0.1:18080. Kiểm tra trên host bằng `sudo ss -lnt`: không có18080 ở0.0.0.0/::, không có public3000/5432. Không dựa riêng vào UFW vì Docker có rule networking riêng. Không ghép dev override sau web override.

Health200 chỉ là liveness. Nếu migration/database/storage không đạt, dừng trước khi mở domain. Không đăng raw container logs; chỉ ghi status/mã lỗi đã loại secret.

## 5. Tạo ADMIN rồi bỏ bootstrap secrets

```bash
dc exec -T backend npm run admin:create
```

Lệnh từ chối email đã tồn tại, không sửa tài khoản cũ. Bản sửa validator email nằm trong feature023; phải dùng đúng release. Khi thành công:

1. Xóa ba dòng `ADMIN_BOOTSTRAP_*` khỏi `.env.web` bằng editor riêng.
2. Recreate **backend** với env còn lại để bỏ bootstrap secrets khỏi runtime; key Gemini/SMTP phải vẫn còn trong `.env.web` riêng nếu được bật:

```bash
dc up -d --no-deps --wait --wait-timeout 180 backend
dc exec -T frontend nginx -s reload
curl --fail --silent --show-error http://127.0.0.1:18080/api/health
```

Nginx có thể giữ IP backend cũ sau recreate; reload sau khi backend healthy. Không xóa volume để xử lý502. Với restart thông thường cùng container thì không cần cấp key lại; recreate chỉ giữ key nếu env riêng vẫn có nó.

## 6. Bật HTTPS qua Caddy

Chỉ áp dụng cho VPS mới hoặc sau khi đã review cấu hình Caddy hiện có. Sao lưu cấu hình cũ trước khi sửa; không ghi đè site khác.

```bash
sudo cp -n /etc/caddy/Caddyfile /etc/caddy/Caddyfile.before-lumina
sudo nano /etc/caddy/Caddyfile
```

Dùng nội dung [deploy/Caddyfile.example](../deploy/Caddyfile.example), thay `lms.example.com` bằng **đúng LUMINA_DOMAIN**. Caddy trên host proxy về127.0.0.1:18080. Mẫu bỏ request-bearing runtime logs để tránh reset URL lọt log; điều này giảm chẩn đoán, bạn cần monitoring trạng thái/latency/disk đã loại dữ liệu nhạy cảm riêng.

```bash
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
sudo systemctl is-active caddy
curl --head http://lms.tenmiencuaban.vn
curl --fail --silent --show-error https://lms.tenmiencuaban.vn/api/health
```

Phải thay hostname trong hai lệnh cuối. Với DNS đúng và80/443 truy cập được, Caddy tự cấp/gia hạn TLS và chuyển HTTP sang HTTPS. Lưu trữ chứng chỉ của service phải writable/persistent. Nếu DNS/AAAA sai hoặc cổng bị chặn, sửa điều kiện đó, không tắt TLS validation. Xem [điều kiện HTTPS của Caddy](https://caddyserver.com/docs/automatic-https).

## 7. Nghiệm thu trước khi đưa link cho người khác

Trên HTTPS staging, dùng tài khoản kiểm thử riêng, không dùng tài khoản seed:

- ADMIN đăng nhập, quản trị được user; public registration không tạo ADMIN.
- INSTRUCTOR tạo course/lesson, upload tài liệu hợp lệ, tạo bài tập; instructor khác bị từ chối.
- STUDENT tham gia, đọc/tải tài liệu được phép, cập nhật progress, nộp bài/quiz và xem chấm điểm. Tài khoản chưa tham gia không xem được nội dung.
- `/api/auth/me`, logout và hết hạn/thu hồi phiên hoạt động. Reset thành công từ email thật phải thu hồi phiên cũ và từ chối submit link đã dùng. Recipient/quyền gửi là do operator cấp mới; không tái dùng ngân sách email local.
- Nếu bật Gemini: chọn nguồn được phép và đồng ý chia sẻ, hỏi hai lượt với trích dẫn; kiểm thông báo quota/lỗi. Model thật hiện là3.1Flash-Lite, không retry/fallback giả. Không gửi tài liệu mật, dữ liệu cá nhân hoặc secret lên Free service. Có key/HTTP200 không chứng minh billing tắt hoặc suy luận đúng.
- Refresh deep link, protected document preview/download và upload giới hạn đúng qua HTTPS; không còn OAuth Google.
- Tạo backup DB **và uploads**, restore sang target trống riêng và kiểm lại quyền/file/login trước khi coi backup có thể dùng.

**Giới hạn hiện có:** PostgreSQL app role vẫn làpostgres; rate limit/quota theo process, request.ip thấy proxy nên nhiều người dùng chia sẻ budget IP. Không bật `trust proxy=true`, nới guard hoặc scale nhiều replica tùy tiện. Xác định least privilege, topology/client-IP, concurrency và giám sát trước khi phục vụ người dùng thật ở quy mô rộng. Bản kit không tuyên bố đã giải quyết những điều này.

## 8. Sao lưu, cập nhật và khôi phục

Áp dụng [quy trình operations](operations.md): thống nhất RPO/RTO/retention, dừng luồng ghi để DB/uploads cùng thời điểm, backup riêng và mã hóa/lưu ngoài VPS. `pg_dump` không chứa uploads; backup nằm trên cùng VPS không bảo vệ khi mất VPS. Bản backup phải được bảo vệ như dữ liệu thật; không upload CI artifact.

Trên đúng project đã xác minh, ví dụ tạo dump **bên trong DB container**, rồi `docker cp` binary ra đường dẫn private; không pipe dump binary qua PowerShell5.1. Restore chỉ sang database/project mới, không dùng `--clean`, reset/drop hoặc `down -v`. Trình tự chi tiết và drill tổng hợp nằm trong operations; production restore của bạn vẫn cần diễn tập.

Khi update: ghi SHA/image ID và migration status hiện tại, backup nhất quán, review SQL migration mới và đưa code đúng release vào thư mục mới. Build image mới trước cửa sổ bảo trì; dùng **cùng project lumina-web** để giữ đúng volumes, cùng env riêng đã bảo vệ. Chạy migration deploy theo startup rồi health/DB/storage/role smoke; reload Nginx khi backend IP đổi. Không regenerate secrets/khởi tạo project khác vì nhầm đó là bản update.

Rollback chỉ app image/code tương thích với schema đang có; không tự rollback/xóa migration. Nếu không tương thích, dừng writes và thực hiện forward-fix hoặc kế hoạch restore đã thử. Giữ volumes và source cũ cho đến khi operator quyết định. Không deploy revision mà hosted CI chưa được đối chiếu nếu release policy của bạn yêu cầu CI.

## Nguồn và mức kiểm chứng

Bộ config có test synthetic merge, Caddy parser và local web-stack smoke ở [feature023](../specs/023-self-host-deploy/verification.md). Hostname thật, TLS/renewal, VPS firewall, mail, provider quota, backup thực và tải của bạn chưa được kiểm chứng. Không có deployed URL/benchmark/provider-success giả.

Đối chiếu chính thức2026-11-17: [Docker production](https://docs.docker.com/compose/how-tos/production/), [merge/override](https://docs.docker.com/reference/compose-file/merge/), [port publishing](https://docs.docker.com/engine/network/port-publishing/), [Caddy HTTPS](https://caddyserver.com/docs/automatic-https), [Caddy reverse proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy).
