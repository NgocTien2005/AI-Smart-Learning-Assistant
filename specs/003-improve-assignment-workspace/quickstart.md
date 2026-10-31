# Kiểm chứng feature003

## Điều kiện và bằng chứng

Đọc AGENTS.md và contract. Dùng tài khoản/resource thử hiện có được xác định an toàn; không seed/provision/reset/delete. Không đọc token/password hoặc dùng browser storage. Fixture/component không thay live. Computer Use đã dừng trong lượt tạo feature vì không xác định URL Windows đủ tin cậy; chưa được coi là browser acceptance.

## Kịch bản

| ID | Cách kiểm tra / expected |
| --- | --- |
| V01 | Trong frontend chạy npm test, npm run lint, npm run build; lưu log mới, tất cả phải pass. Suite có Node service và Vitest component. |
| V02 | Browser thật hai vai trò×1280×800/1440×900, zoom100%; ảnh/bounds mới, viewport/overflow/font/visible list+detail trong fold; không mở form tạo trước list. Normal và long data thật nếu có. |
| V03 | Student search title/body mixedcase, filters/priority, no-match khác empty; selected outside filter giữ detail/clear filter. Null deadline, grade null/0, feedback-only sau hạn. |
| V04 | Instructor select assignment/submission, list counts/pending, grade0/feedback null; draft A/B, failure/retry/refresh, double submit; chỉ viết trên resource thử được chỉ định. |
| V05 | Keyboard Tab/ShiftTab/Enter/Space/Escape, create/edit/submission disclosure focus/retain/reset, delete dialog hủy/Escape không write, long text không horizontal overflow. |
| V06 | Switch nhanh assignment/submission/course, delayed requests và refresh-vs-write; back/forward/refresh/deep link/invalid ID; draft chỉ tồn tại lifetime panel. Dùng component deferred requests trước, live riêng nếu có. |
| V07 | Dashboard, shell/lesson/protected document, quiz autosave/version/leave, account/auth, ADMIN boundary; full npm test là component evidence, runtime smoke riêng. |
| V08 | Docker health/read-only HTTP thật: health + missing/invalid token trên course/assignment/admin. Với phiên phù hợp kiểm owner/enrollment/cross-resource denial và không write trái phép; liveness không chứng minh DB/authorization. |
| V09 | So158 baseline hashes với final; chỉ frontend allowlist +003/state được đổi, old001/002/open tasks và backend/dependency/constitution/managed files giữ nguyên. |

Không chạy integration suite chỉ vì healthy: backend/scripts/integration-check.mjs đăng ký/provision và SQL-cleanup trên Docker DB. Chỉ chạy sau khi đối chiếu đích và có phép cho các write/cleanup; hiện chưa có. Dừng phần phụ thuộc runtime khi thiếu điều kiện, hoàn tất phần độc lập và giữ task nghiệm thu mở.
