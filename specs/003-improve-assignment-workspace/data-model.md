# Dữ liệu và trạng thái UI

Không tạo model/migration. Nguồn: backend/prisma/schema.prisma và production routes/courses.js.

| Entity | Fields/quan hệ dùng | Validation/lifecycle giữ nguyên |
| --- | --- | --- |
| Course | id, instructor; assignments[] qua GET course; owner/enrollment | Chỉ instructor owner hoặc user đã ghi danh truy cập nội dung; không ADMIN bypass |
| Assignment | id, courseId, title, description, dueAt nullable, points, createdAt; submissions[] | Title trim3–160, description trim bắt buộc≤20000, points integer1–1000; dueAt hợp lệ/null; không hạ max dưới điểm đã chấm |
| Submission | id, assignmentId, studentId, content, submittedAt, grade nullable, feedback nullable; student{id,name,email} cho instructor | Content trim bắt buộc≤20000; unique assignmentId/studentId; student update chỉ grade null/chưa quá hạn; grade null hoặc integer0..points, feedback≤5000 |
| UI draft | create object; edit/submission per assignmentId; grade per submissionId | Không lưu DB/localStorage; giữ trong panel khi thu/chọn/refresh; reset đúng target sau confirmed success |
| UI selection | assignmentId/submissionId query và default local | Không thêm trạng thái nghiệp vụ; invalid explicit ID có error; không đọc bài nộp của user khác |
| Async state | request generation, mutation revision, per-operation lock, mounted guard | Pending→success/error; refresh cũ bỏ nếu write mới, unmount không update; không server version mới cho assignment |

Grade0 không phải null. Feedback-only không tự chuyển thành graded. Server vẫn quyết định deadline/quyền và409. Query-only search/filter chỉ trên dữ liệu đã có, không công bố dữ liệu chưa được trả.
