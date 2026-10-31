---
name: lumina-react-ui
description: >-
  Triển khai hoặc sửa component, page, điều hướng, state và CSS React của
  Lumina LMS theo yêu cầu hoặc thiết kế đã rõ, bảo toàn session và quiz.
  Quyết định bố cục/redesign trước triển khai dùng lumina-ui-design.
---

# Triển khai React UI Lumina

## Đầu vào

Đọc [AGENTS.md](../../../AGENTS.md), yêu cầu/spec và thiết kế nếu có. Truy từ
`frontend/src/app/App.jsx` qua page/component, `services/api.js`, helper request
liên quan đến route trong `backend/src/routes/` và model được dùng. Đối chiếu
payload, response, lỗi và quyền trước khi thay component. Xem test và CSS đang
được import; dùng [lumina-api-contract](../lumina-api-contract/SKILL.md) khi
phát hiện cần thay contract, thay vì tự chế response ở UI.

## Giữ các bất biến của luồng hiện có

- `SessionContext.jsx` xác minh danh tính bằng `/api/auth/me`; cached user/role
  không phải nguồn quyền. Giữ guard và điều hướng ADMIN/INSTRUCTOR/STUDENT.
  Lỗi mạng/5xx phải cho phục hồi; không tự xóa phiên hợp lệ như khi token hết hạn.
  Đọc `apiErrors.js` để giữ phân biệt mã lỗi authentication với lỗi khác.
- Trong `CourseWorkspacePage.jsx`, giữ section và lesson được chọn trong URL;
  bảo toàn query liên quan khi chuyển panel, refresh, back/forward và deep link.
  Kiểm tra response đến trễ khi đổi course/lesson, không render dữ liệu tài
  nguyên cũ dưới URL mới; tận dụng guard/request cancellation đang có.
- Với `PracticeQuizPanel.jsx`, đọc toàn bộ luồng draft, debounce, hàng đợi lưu,
  version conflict, submit và callback trước khi rời panel. Giữ lựa chọn khi lưu
  thất bại, flush thay đổi trước điều hướng trong app hoặc cho ở lại/bỏ thay đổi
  rõ ràng. Browser unload chỉ cảnh báo, không hứa network save sẽ hoàn tất.
  Server vẫn quyết định quyền, version và chấm điểm; snapshot cũ không bị đổi.

## Thực hiện

1. Dùng function component/hooks; side effect trong effect hoặc handler.
   Request đi qua API client và cấu hình `VITE_API_URL`, kể cả luồng tài liệu
   cần authentication. Xử lý cả non-2xx và lỗi mạng, giữ input để retry hữu ích.
2. Tái sử dụng `components/ui/`, layout, panel và dependency hiện có; tách theo
   trách nhiệm khi cần, không refactor rộng hoặc thêm package để sửa một UI nhỏ.
   Kiểm tra cascade giữa CSS nền, auth và trang LMS trước khi thêm rule.
3. Bao quát loading/empty/error/success/disabled; label gắn input, keyboard,
   focus-visible và thông báo `alert`/`status` thích hợp. Giữ focus khi mở/đóng
   dialog và tránh nested interactive controls.
4. Mỗi dữ liệu hiển thị phải có nguồn từ contract; không biến dữ liệu thiếu
   thành số 0 hoặc fake success. Dùng đúng
   [giới hạn capability](../../../docs/development-workflow.md#gioi-han-capability).

## Kiểm chứng và hoàn thành

Chạy frontend regression phù hợp với hành vi đổi, `npm test`, `npm run lint`
và `npm run build` trong `frontend/` theo script hiện tại. Khi chỉnh UI, kiểm tra
desktop trên trang thực tế, các vai trò/trạng thái bị ảnh hưởng và keyboard;
chỉ mở rộng mobile khi được yêu cầu. Không coi mocked component test là bằng
chứng API/database hoạt động. Dùng [lumina-verify](../lumina-verify/SKILL.md)
để tổng hợp tiêu chí, lệnh/kết quả, giới hạn chưa chạy và đường dẫn thay đổi.
Hoàn thành khi hành vi yêu cầu và các bất biến liên quan có bằng chứng, hoặc
bàn giao rõ phần còn chưa xác minh cùng nguyên nhân.
