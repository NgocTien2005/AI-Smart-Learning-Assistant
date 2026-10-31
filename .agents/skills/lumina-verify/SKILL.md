---
name: lumina-verify
description: >-
  Xác minh thay đổi Lumina LMS hoặc chuẩn bị bàn giao bằng kiểm tra theo phạm vi
  và bằng chứng đối chiếu acceptance criteria. Dùng khi cần quyết định mức kiểm
  chứng, chạy kiểm tra và báo kết quả; không thay thế thiết kế hoặc triển khai.
---

# Kiểm chứng Lumina

## Đầu vào

Đọc [AGENTS.md](../../../AGENTS.md), diff, yêu cầu/spec, acceptance scenarios,
plan/tasks nếu có và scripts trong package hiện tại. Xác định lớp bị ảnh hưởng,
runtime/database có sẵn và phần công việc được phép; không đọc secret để lập báo cáo.

## Chọn bằng chứng theo thay đổi

| Phạm vi | Kiểm chứng cần chọn |
| --- | --- |
| Markdown/skill thuần túy | Frontmatter/naming, link, placeholder, trigger và diff; không chạy toàn bộ app tests chỉ vì thêm tài liệu |
| React/hành vi UI | Frontend tests phù hợp, `npm test`, `npm run lint`, `npm run build` trong `frontend/`; lưu ý npm test gồm Node tests và Vitest component tests |
| Layout/style | Thêm quan sát desktop hiện tại, route/role/viewport, trạng thái dữ liệu và keyboard; mobile chỉ khi được yêu cầu |
| Backend không đổi schema | `npm test` trong `backend/`, production handler regression, endpoint bị ảnh hưởng; khởi động server và tối thiểu `/api/health` khi có database |
| Auth/quyền | Đăng ký, đăng nhập đúng/sai, `/me`, token thiếu/sai/hết hạn, role, owner/enrollment, tài nguyên của người khác và response không có password/hash |
| Quiz | Regression production router với `npm test -- --test-name-pattern="quiz"` và case phù hợp về quyền, snapshot, draft/version, submit; kiểm tra filter thực sự chọn case cần thiết |
| Schema/migration/query | Áp dụng [lumina-prisma](../lumina-prisma/SKILL.md): validate, SQL review, generate/status và dữ liệu/quyền tương ứng; query-only không tự tạo migration |
| Dependency/Dockerfile/schema/migration | Theo AGENTS.md: rebuild image, trạng thái healthy và `/api/health`; kiểm tra startup/migration, không xóa volume |
| HTTP/database integration | Khi Docker healthy, chạy `npm run test:integration` trong `backend/`; đọc script để biết dữ liệu được tạo/dọn và database mà script truy cập |

Đọc command thực tế trước khi chạy; không tự cài dependency, khởi động môi
trường hoặc áp dụng migration chỉ để kiểm tra một tài liệu. Integration script
có ghi/dọn dữ liệu; dùng stack kiểm thử phù hợp, không tùy tiện trỏ tới production.
Nếu đặt `TEST_API_URL`, đối chiếu cả database mà script dùng để chuẩn bị/dọn dữ
liệu, không chỉ HTTP URL. Không chạy seed như một bước kiểm chứng mặc định.

## Đối chiếu và xử lý kết quả

1. Lập bảng **FR → US/AC → task → kiểm tra/bằng chứng → kết quả**; với sửa nhỏ
   không có spec, dùng yêu cầu/tình huống tái hiện làm nguồn, không tạo ID giả
   thành artifact Spec Kit. Bao gồm hành vi âm tính và lỗi mạng khi liên quan.
2. Chạy các bước phù hợp, ghi cwd/command, kết quả và đối tượng thực sự được
   kiểm tra. `backend/test/auth.test.js` dùng harness legacy; quiz injection
   test không chứng minh middleware/database production. `/api/health` hiện
   là liveness; đối chiếu health database và endpoint đọc/ghi thật khi cần.
3. Nếu thất bại, giữ kết quả, tìm nguyên nhân trong phạm vi; không tắt guard,
   validation hoặc lint để xanh. Nếu thiếu điều kiện chạy, ghi **chưa chạy** và
   lý do cụ thể, không ghi pass. Không lặp lại toàn bộ suite khi không có thay
   đổi hay nghi vấn mới cần giải quyết.
4. Phân biệt mock/unit, component render, endpoint thật và UI hiện tại. Ảnh cũ,
   review code, checklist đã tick hoặc converge không thay bằng chứng runtime.
   Nếu đã có `converge` chính thức, chuyển gap về task theo cơ chế phiên bản đó;
   không sửa spec để hợp thức hóa implementation chưa đạt.

## Đầu ra và điều kiện kết thúc

Báo ngắn: đã đổi gì, **đã đạt / thất bại / chưa chạy (lý do)**, tiêu chí còn
thiếu bằng chứng và rủi ro/việc tiếp theo. Nêu rõ giới hạn quan sát, không khẳng
định hệ thống đã chạy thành công nếu mới review. Kiểm tra diff cuối để không
có secret, generated output hoặc thay đổi ngoài phạm vi. Chỉ kết luận yêu cầu
đã đạt khi có bằng chứng tương ứng; bàn giao hạn chế không phải pass.
