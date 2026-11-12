# Gemini miễn phí cho dữ liệu demo

Tài liệu này dành cho API demo hữu hạn cũ. Giao diện bài học hiện dùng
[Chat Gemini với câu hỏi tự do và nguồn được chọn](gemini-chat.md); launcher chat
riêng mở phạm vi nguồn sau xác nhận. API demo vẫn chỉ cho dữ liệu tổng hợp.

Đã có đường gọi model thật qua server; mặc định **tắt**. Chỉ nguồn tổng hợp
nguyên bản của dataset `lumina-demo-v2` được phép gửi. Backend xác minh quyền
owner/enrollment hiện tại, registry ID và đối chiếu chính xác nội dung/tài liệu
với nguồn tự soạn; bài thật hoặc bài demo đã sửa bị từ chối trước khi gọi Google.
ADMIN không được bypass quyền khóa học.

## Gói miễn phí và cấu hình riêng

1. Mở [Google AI Studio](https://aistudio.google.com/api-keys), tạo/chọn project
   có Free tier và **chưa bật billing**. Không nâng cấp gói hoặc bật dịch vụ trả
   phí trong nhiệm vụ này. API key Gemini khác Google OAuth Client ID.
2. Tạo key riêng, không gửi key vào chat, ảnh, Git hoặc frontend/VITE.
3. Chạy từ repository:

```powershell
powershell -NoProfile -File scripts/start-demo-cloud-ai.ps1
```

Console riêng xác minh target demo8080, yêu cầu operator xác nhận project chưa
bật billing và nhập key ẩn. Không lưu file credential/transcript; key chỉ truyền
qua process environment vào backend Compose dev, được xóa khỏi process launcher
sau lệnh. Không đọc/in Docker environment. Launcher không gọi model hoặc gửi email.
Backend cần giữ key trong runtime để hoạt động; không coi đây là secret manager
cho production. Chỉ báo readiness/kết quả, không gửi key.

Windows PowerShell5.1: launcher dùng `scripts/configure-demo-cloud.mjs` để tách
stdout/stderr của Docker khỏi error stream PowerShell và giữ đúng exit code.
Thông báo `Image ... Building` trên stderr không tự chứng minh build lỗi. Nếu
đã gặp `NativeCommandError` ở bản launcher cũ, backend có thể đã nhận cấu hình;
kiểm tra readiness boolean trước khi nhập lại key hoặc recreate. Exit code khác0
vẫn là thất bại; không bỏ qua kiểm tra healthy hoặc gọi model để giả thành công.

Có thể cấu hình riêng `GEMINI_API_KEY` và `GEMINI_FREE_ONLY_CONFIRMED=true` trong
môi trường operator rồi chạy cả `compose.yaml` và `compose.dev.yaml`. Chỉ chạy
Compose mặc định sẽ không truyền key/marker cloud. Recreate mà không nhập lại key
qua launcher có thể tắt cloud; lỗi cấu hình phải được báo rõ, không fallback.

Ứng dụng **không thể kiểm tra billing của project Google**. Ngân sách0 được bảo
toàn bằng project thực sự chưa bật billing; cờ xác nhận không biến project trả phí
thành miễn phí. Không dùng key của project đã bật billing. Khi hạn mức provider
hết hoặc model không khả dụng, dừng và hiển thị lỗi, không đổi model/gói hay tự retry.
Giới hạn app:20lượt/ngày UTC/process,1lượt đồng thời,20giây/user, nguồn10000ký tự,
output3072tokens, response128KiB và timeout30giây. Restart reset counter; chưa có
quota nhiều instance/durable. Không dùng cấu hình demo này cho triển khai công khai.

Theo [bảng giá](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.8-flash),
`gemini-3.8-flash` hiện có Free tier cho text. Hạn mức/khả dụng tùy tài khoản và
có thể thay đổi; cần đối chiếu AI Studio. Free-tier input/output có thể được dùng
cải thiện sản phẩm và human review theo [điều khoản](https://ai.google.dev/gemini-api/docs/terms#unpaid-services).
`store:false` chỉ tắt lưu Interaction có thể truy hồi, không thay đổi điều khoản
dữ liệu miễn phí. Vì vậy không gửi dữ liệu thật, thông tin cá nhân hoặc nội dung riêng.

## Sử dụng và nghiệm thu

Đăng nhập bằng tài khoản được phép, mở một khóa/bài demo nguyên bản → **AI cloud
demo**. Chọn câu hỏi mẫu rồi chủ động bấm Hỏi theo nguồn / Giải thích / Tóm tắt
bằng AI / Tạo3câu ôn tập. Không có ô nhập câu hỏi tự do trong phạm vi hiện được
cho phép; hỏi đáp tổng quát bằng tài liệu thật cần quyền gửi dữ liệu mở rộng riêng.
GET kiểm tra readiness không gọi Google. Câu hỏi, payload và nguồn được dựng ở
server, không nhận text/URL/upload/history từ client.

Kết quả phải ghi Gemini/model thật, có trích nguồn được đối chiếu nguyên văn và
nêu thiếu căn cứ khi không đủ nguồn. Trích dẫn hợp lệ không bảo đảm mọi diễn giải
đúng; người học cần đối chiếu bài gốc. Phản hồi bị cắt, sai schema/model/citation
hoặc lỗi provider bị từ chối. Không lưu model reasoning, raw requests/responses,
lịch sử cloud hoặc sửa quiz/điểm hiện có. Câu ôn cloud là gợi ý riêng, không có
autosave/chấm điểm của attempt cục bộ.

Để đóng nghiệm thu thật feature012T012: operator cấu hình key riêng, thực hiện
đủ4action trên UI, đánh giá tiếng Việt/căn cứ/giới hạn và chỉ báo kết quả. Không
copy key, token, nội dung private hoặc raw provider payload vào evidence. Bộ test
mock/disabled-state và CI không thay thế bước này; không gọi Gemini tự động mỗi PR.

## API và troubleshooting

`GET/POST /api/courses/lessons/:lessonId/cloud-assistant`; POST chỉ nhận
`{mode,questionId}` hữu hạn theo [contract](../specs/012-demo-cloud-assistant/contracts/http.md).
403: sai quyền hoặc nguồn không thuộc demo nguyên bản.503: chưa có key/free-only
confirmation/marker hoặc chưa xác minh được nguồn.429: quota/busy/cooldown hoặc
provider hết hạn mức.502: provider/model/output chưa dùng được.504: timeout.
409: nguồn đổi trong khi chờ. Không tự phát lại request sau lỗi.

Tra cứu cục bộ, tóm tắt trích xuất và quiz theo mẫu vẫn tồn tại riêng; không gọi
chúng là model sinh nội dung và không dùng chúng để giả thành công khi cloud lỗi.
