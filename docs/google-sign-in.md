# Cấu hình đăng nhập Google

Google chỉ đăng nhập **tài khoản Lumina đã có, đang hoạt động và đã chủ động liên kết**. Không tự tạo STUDENT hay user khác. Email trùng chưa đủ để đăng nhập: trước hết đăng nhập Lumina bằng mật khẩu, vào **Tài khoản → Đăng nhập Google → Kiểm tra liên kết Google → Liên kết Google**. Chọn Google có email trùng email Lumina. Sau khi liên kết thành công, có thể đăng xuất và dùng nút Google. Mật khẩu và vai trò vẫn giữ nguyên; tài khoản bị khóa không được vào qua Google.

## Thiết lập riêng, không gửi giá trị vào chat

1. Trong [Google Auth Platform / Clients](https://console.developers.google.com/auth/clients), chọn/tạo project, cấu hình Branding/Audience theo môi trường thực tế. Nếu app ở chế độ Testing, thêm chính tài khoản được phép thử vào test users theo cấu hình Google.
2. Tạo OAuth client loại **Web application**. Authorized JavaScript origins cho local: `http://localhost`, `http://localhost:5173`, `http://localhost:8080`. Khi dùng địa chỉ `127.0.0.1` hoặc cổng khác, thêm chính origin đó. Origin không có path `/auth`. Chỉ thêm domain HTTPS thật khi triển khai.
3. Luồng GIS popup callback của Lumina dùng **Client ID công khai**, không trao đổi authorization code và không dùng Client Secret. Không đưa Client Secret vào frontend, biến VITE, repository hoặc chat. Không cần Gmail API, App Password SMTP, quyền đọc/gửi email, access token hay refresh token.
4. Mở `.env` gốc bằng editor/terminal riêng; thêm `GOOGLE_CLIENT_ID=<Client ID của bạn>`. Trong `frontend/.env.local`, thêm `VITE_GOOGLE_CLIENT_ID=<cùng Client ID>`. Chỉ sửa các biến này, giữ nguyên dữ liệu/secret đang có. Các file env riêng được git/Docker ignore; không chụp/in toàn bộ file.
5. Docker frontend nhận cùng public ID từ Compose lúc build. Chỉ build/recreate stack dữ liệu hiện có sau khi đã review migration/backup của môi trường đó. Migration thêm nullable unique `User.googleSubject`, không sửa password/role hoặc dữ liệu học. Không reset database hoặc xóa volume. Với Vite, khởi động lại `npm run dev` sau khi sửa env. Nếu chạy backend trên host, thêm `GOOGLE_CLIENT_ID` vào `backend/.env` riêng và restart backend.

```powershell
# Dev frontend5173 + API Docker8080, chạy tại repo gốc sau khi review môi trường đích:
docker compose -f compose.yaml -f compose.dev.yaml up -d --build
```

Không cấu hình `VITE_API_URL` khác origin cho Google trong phạm vi này: cookie challenge HttpOnly/SameSite=Lax cần cùng origin qua proxy. `APP_ORIGIN` là origin công khai thực tế (HTTPS khi public); CORS chỉ cho origin được phép. Client ID phải khớp frontend/backend và Google Console. Nút đầu tiên chuẩn bị yêu cầu, sau đó nút Google chính thức mở cửa sổ chọn tài khoản; có thể hủy yêu cầu nếu đã đóng cửa sổ. Không có One Tap/đăng nhập tự động.

## Nghiệm thu

Người dùng tự thao tác tài khoản Google riêng qua UI; chỉ báo kết quả, không gửi token, password hoặc ảnh màn hình cá nhân. Kiểm tra liên kết thành công, đăng nhập lại cùng Lumina ID/vai trò, mật khẩu vẫn dùng được, tài khoản Google chưa liên kết bị từ chối và không tạo user. Lặp fixture được phép cho ADMIN/INSTRUCTOR/STUDENT; khóa tài khoản hoặc đổi/reset password vẫn có hiệu lực đối với phiên Lumina cũ. Mở được nút hoặc component mock pass không chứng minh Google thật đã đăng nhập được.

Khi lỗi mạng sau liên kết, bấm **Kiểm tra liên kết Google** trước khi thử lại; không tự gửi lại mutation. Google chưa cấu hình/tải lỗi không chặn đăng nhập bằng mật khẩu. Nếu không còn mật khẩu, dùng luồng khôi phục email đã có; không tự gộp tài khoản bằng Google.

## Vận hành và giới hạn

Lưu duy nhất stable Google subject liên kết với user; không lưu token Google. Challenge giới hạn5 phút, một lần, theo browser và intent; link gắn owner/authVersion. Single backend instance: restart làm các yêu cầu đang chờ hết hiệu lực an toàn. Trước scale nhiều replica cần kho challenge chia sẻ được review riêng. Không có unlink/thay Google identity trong phạm vi này. Không ghi request credential, query token, provider claims hoặc profile vào log/evidence.

Nguồn chính thức đã đối chiếu ngày 2026-11-07: [Google setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [nút GIS](https://developers.google.com/identity/gsi/web/guides/display-button), [xác minh ID token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [JS reference](https://developers.google.com/identity/gsi/web/reference/js-reference). Xem [verification feature010](../specs/010-add-google-sign-in/verification.md) để biết phần nào đã chạy thật.
