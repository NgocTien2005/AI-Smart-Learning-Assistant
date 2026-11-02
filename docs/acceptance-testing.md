# Kiểm thử tích hợp trong stack riêng

Áp dụng AGENTS.md. `compose.yaml` tiếp tục phục vụ môi trường local hiện có.
`compose.acceptance.yaml` tạo database `lumina_acceptance`, volume/network theo
project và frontend chỉ bind loopback. Không mount database hoặc upload của
project khác; không dùng volume external hoặc tên volume dùng chung.

Chọn project mới có prefix `lumina-acceptance-` và một cổng chưa dùng. Ví dụ
PowerShell dưới đây tạo secrets chỉ trong process, không ghi giá trị ra tệp/log:

```powershell
$acceptanceProject = 'lumina-acceptance-local'
$existingAcceptance = docker ps -aq --filter "label=com.docker.compose.project=$acceptanceProject"
if ($LASTEXITCODE -ne 0) { throw 'Docker chưa sẵn sàng' }
if ($existingAcceptance) { throw 'Chọn project mới; không thay secrets của stack đã tồn tại' }
$env:ACCEPTANCE_PORT = '8082'
$env:ACCEPTANCE_DB_PASSWORD = node -e "process.stdout.write(require('node:crypto').randomBytes(24).toString('hex'))"
$env:ACCEPTANCE_JWT_SECRET = node -e "process.stdout.write(require('node:crypto').randomBytes(48).toString('hex'))"
New-Item -ItemType Directory -Force .artifacts/acceptance | Out-Null
New-Item -ItemType File -Force .artifacts/acceptance/empty.env | Out-Null
docker compose --env-file .artifacts/acceptance/empty.env -f compose.acceptance.yaml -p $acceptanceProject up -d --build
docker compose --env-file .artifacts/acceptance/empty.env -f compose.acceptance.yaml -p $acceptanceProject ps
$env:TEST_COMPOSE_PROJECT = $acceptanceProject
$env:TEST_API_URL = "http://127.0.0.1:$($env:ACCEPTANCE_PORT)/api"
Set-Location backend
npm test
npm test -- --test-name-pattern="quiz"
npm run test:integration
```

Không đổi secrets rồi recreate database/backend của project đã có; giữ chúng
trong process quản lý stack cho tới khi hoàn tất vận hành cần thiết. Không dùng
`docker compose config` hoặc inspect toàn bộ environment để chẩn đoán rồi đưa
secret vào output. Tệp env rỗng ngăn Compose tự nạp `.env` local của repository.

`integration-target.mjs` từ chối chạy nếu thiếu target, project không thuộc
prefix kiểm thử, URL không phải loopback với cổng cụ thể, hoặc container/cổng/
network/volume/database không khớp. Database và backend phải healthy. SQL chỉ
đi qua stdin tới container database đã xác minh; không dùng tên database local
hoặc Compose project mặc định để provision/cleanup. Chỉ thay `TEST_API_URL` là
không đủ.
Harness cũng query read-only qua Prisma trong backend và đối chiếu tên database
cùng địa chỉ server PostgreSQL với container database đã xác minh. Database có
cùng tên ở một server khác vẫn bị từ chối trước khi provision/cleanup.

Suite đăng ký tài khoản có tên riêng cho mỗi lần chạy, bootstrap ADMIN trong
database kiểm thử, kiểm API production rồi dọn đúng tài khoản đó. Nó không
reset/drop database hay xóa volume. Fixture PDF dùng chung với parser regression:
PDF trống hợp lệ kiểm `NO_TEXT`/nguồn nhập tay; PDF hỏng có ca400
`CORRUPT_DOCUMENT` riêng. Không bỏ validation để upload thành công.

Có thể đặt `TEST_EVIDENCE_PATH` tới tệp trong `.artifacts/` để lưu project,
HTTP/database target, method/path/status, ID tài nguyên và số tài khoản sở hữu
còn lại sau cleanup. Không lưu body, Authorization, token hoặc password.

Browser acceptance phải ghi rõ bản code, role, route, viewport/zoom, dữ liệu,
screenshot/bounds và loại bằng chứng. Dữ liệu test có chủ đích trong database
riêng là dữ liệu kiểm thử; không mô tả nó là dữ liệu thật của người dùng. Nếu
dùng row có hình dạng legacy, phải ghi rõ cách chuẩn bị và giữ snapshot nguyên.
Component/API injection, browser với mock, browser với stack kiểm thử thật và
stack local hiện có là các loại bằng chứng khác nhau.

Phạm vi này không chứng nhận deploy công khai, TLS/domain, SMTP thực, backup/
restore, tải lớn hay vận hành nhiều máy. Không tự dọn stack/volume local. Mọi
cleanup bổ sung chỉ nhắm ID/tài nguyên do chính đợt kiểm thử tạo, sau khi lưu
bằng chứng và đối chiếu target.
