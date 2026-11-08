# Dữ liệu demo tổng hợp

Dataset `lumina-demo-v2` bổ sung dữ liệu development; không thay thế dữ liệu cũ.
Không tự seed khi server khởi động. Chỉ áp dụng sau khi operator xác minh đúng
Docker project, HTTP frontend và database backend đang kết nối.

## Inventory

- 1 ADMIN, 4 INSTRUCTOR, 12 STUDENT hoạt động và 1 STUDENT đã khóa.
- Email `*@demo.lumina.invalid`, tên có nhãn `[Demo]`, không gửi thư.
- 8 khóa: lập trình, SQL, web, Git, mạng/an toàn, phân tích dữ liệu, tự học,
  quản lý dự án. Mỗi giảng viên sở hữu 2 khóa; mỗi khóa có 6 bài tiếng Việt.
- 26 tài liệu: 8 TXT, 8 Markdown, 8 CSV và 2 PDF có text layer. PDF được in từ
  HTML tự soạn trong `backend/scripts/demo-seed/documents/`, đã kiểm tra trích
  xuất và hiển thị. Không có OCR hoặc nội dung lấy từ dữ liệu cá nhân.
- Enrollment có giới hạn, tiến độ 0/một phần/hoàn tất, 24 bài tập có hạn nộp,
  bài chưa nộp/chờ chấm/đã chấm, quiz chưa làm/draft/đã nộp đúng lifecycle.
- Lịch sử chat chuẩn bị sẵn có nhãn rõ; không phải kết quả model AI.

`student1` tham gia cả 8 khóa để khám phá. Các học viên khác chỉ tham gia một
phần. `student2` không tham gia khóa đầu; `instructor2` không sở hữu khóa đầu.
ADMIN quản trị tài khoản, không được tự bypass quyền xem nội dung khóa học.

## Preview và apply

Backend phải được build với migration mới. Development cần cả hai Compose file:

```powershell
docker compose -f compose.yaml -f compose.dev.yaml up -d --build --no-deps backend
node backend/scripts/seed-demo.mjs --project ai-smart-learning-assistant --api http://localhost:8080/api --dry-run
powershell -NoProfile -File scripts/start-demo-seed.ps1
```

Launcher mở console riêng để hiển thị mật khẩu ngẫu nhiên riêng cho từng tài
khoản **duy nhất lúc tạo**. Giữ console riêng, không bật transcript hoặc gửi
ảnh/password vào chat. Script không lưu file credentials, không ghi secret vào
manifest/evidence. Seed không tự cấp lại hoặc đổi mật khẩu khi chạy lại.
Nếu mất thông tin, operator cần luồng khôi phục được cho phép riêng; không dùng
seed để reset tài khoản. Email `.invalid` không thể dùng nhận thư khôi phục.

`--apply --private-console` yêu cầu TTY thực; không redirect đầu ra. Chế độ
`--acceptance` chỉ dành cho project kiểm thử `lumina-acceptance-ci-demo-*`,
không dùng thay cơ chế riêng tư của development. Không có credential production
hoặc Gmail cần thiết để seed.

## Guard, chạy lại và lỗi

Target phải được chỉ định rõ; script từ chối production project, remote Docker,
HTTP không loopback, cổng 8081, sai project/network/volume/port, backend không
healthy, thiếu marker development hoặc backend kết nối database khác.
`LUMINA_DEMO_ALLOWED=true` chỉ có trong Compose dev/acceptance; không thêm vào
cấu hình production. Marker không thay thế các kiểm tra target khác.

Dry-run không tạo password, file hoặc row. Apply dùng namespace mới, create-only
và một transaction cho toàn bộ rows/ownership registry. Xung đột email/join code
chưa có registry sẽ bị từ chối, không nhận dữ liệu đó làm seed-owned. Chạy lại
kiểm tra registry, quan hệ và hash tài liệu rồi báo `unchanged`; không cập nhật
nội dung/tài khoản hay tạo trùng. Nếu ownership/file thay đổi hoặc bị thiếu,
script dừng thay vì tự ghi đè sửa lại.

File và database không có transaction chung. Sự cố trong apply có thể giữ file
`demo-v2-<UUID>.*` vừa tạo; không tuyên bố rollback file. Không tự xóa file hoặc
thử lại bằng cách bỏ guard. Giữ báo cáo lỗi và yêu cầu review cleanup riêng.

## Kiểm thử và cleanup

```powershell
node scripts/ci/seed-integration.mjs
```

Harness tạo project/network/volumes riêng và secret thử lúc chạy; kiểm tra DB
backend thực sự kết nối, migration status, preview, xung đột, apply, chạy lại,
giữ tài khoản sentinel và HTTP authorization/lifecycle bằng credentials trong RAM.
Báo cáo allowlist ở `ci-results/seed-integration/summary.json` và `http.json`
chỉ chứa kết quả, IDs, method/path/status, không raw requests/tokens/passwords.

Harness cleanup rows do chính lượt thử tạo và dừng đúng stack riêng; named
volumes cùng tài liệu tổng hợp được giữ và báo cụ thể. Không thao tác local8081,
không `down -v`. Không có lệnh cleanup dataset development tự động. Chỉ xóa khi
người dùng yêu cầu, sau review manifest/ownership; tuyệt đối không xóa theo mỗi
đuôi email hoặc theo tên chứa “demo”.
