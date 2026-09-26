# AI Smart Learning Assistant

Lumina LMS là nền tảng quản lý học tập dành cho hai vai trò `STUDENT` và `INSTRUCTOR`. Repository đã có luồng xác thực gồm đăng ký, đăng nhập, khôi phục phiên, lấy thông tin người dùng hiện tại và đăng xuất. Sau khi xác thực, người dùng được đưa vào dashboard responsive tương ứng với vai trò học viên hoặc giảng viên.

## Chạy dự án

Yêu cầu Node.js 24+ và PostgreSQL.

### Backend

Tạo `backend/.env` từ `backend/.env.example`, sau đó chạy:

```powershell
cd backend
npm ci
npx prisma migrate deploy
npx prisma generate
npm run dev
```

### Frontend

```powershell
cd frontend
npm ci
npm run dev
```

Frontend mặc định gọi API tại `http://localhost:3000`. Có thể cấu hình địa chỉ khác bằng `VITE_API_URL` trong `frontend/.env`.

## Kiểm tra

```powershell
cd backend
npm test
npx prisma validate

cd ../frontend
npm run lint
npm run build
```

Các nút đăng nhập mạng xã hội và quên mật khẩu hiện được đánh dấu “Sắp có”; dự án chưa giả lập thành công cho các luồng chưa có backend tương ứng.
