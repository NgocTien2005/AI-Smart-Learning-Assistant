# Contract hiện có — chỉ đọc, không thay đổi API

Source: backend/src/app.js, middleware/authenticate.js, middleware/authorizeRole.js, routes/courses.js và frontend/src/services/api.js.

| Request | Payload/response | Quyền và lỗi quan trọng |
| --- | --- | --- |
| GET /api/courses/:courseId | {course:{...assignments:[...submissions]}}; instructor thấy các bài nộp/student public fields; student chỉ bài mình | authenticate + owner/enrollment;400 ID,404 course,403 chưa có quyền |
| POST /api/courses/:courseId/assignments | {title,description,points,dueAt};201 {assignment:{...submissions:[]}} | INSTRUCTOR owner;400 validation,403 owner |
| PATCH /api/courses/assignments/:assignmentId | Các field title/description/points/dueAt được thay;200 {assignment} không có submissions, phải merge giữ submissions | INSTRUCTOR owner;400/403/404;409 điểm tối đa thấp hơn điểm đã chấm hoặc serializable conflict |
| DELETE /api/courses/assignments/:assignmentId |204 no body | INSTRUCTOR owner;400/403/404; native confirm hiện có, không live delete để nghiệm thu |
| PUT /api/courses/assignments/:assignmentId/submission | {content};200 {submission} | STUDENT enrolled;400 content,403 enrollment,404,409 overdue/already graded/concurrent insert |
| PATCH /api/courses/assignments/:assignmentId/submissions/:studentId | {grade:null hoặc integer0..points,feedback};200 {submission} không kèm student | INSTRUCTOR owner;400/403/404/409; merge giữ student identity từ GET |

Lỗi JSON giữ {error,...}; middleware thiếu/sai token401 với code AUTH_REQUIRED/SESSION_INVALID. Không đọc/in token; requests qua apiRequest. Không thêm assignment detail endpoint, server sorting/search, rubric, notifications hoặc grade version.

## Contract UI

- CourseWorkspacePage đọc assignmentId/submissionId từ query; callbacks dùng functional setParams, bảo toàn query không liên quan. Null=không chỉ định; raw invalid ID phải báo rõ.
- AssignmentsPanel nhận course, isInstructor, selectedAssignmentId/selectedSubmissionId, onSelectAssignment/onSelectSubmission và onAssignmentsChange(updater). Khi dùng độc lập không callback/router thì selection local tương đương cho component tests.
- onAssignmentsChange nhận updater(assignments mới nhất) và không merge theo snapshot cũ. Course key/mounted guard chặn thông báo hoặc mutation response cũ đụng course mới.
- Refresh dùng GET course, chỉ cập nhật assignments sau request/revision guard, không làm unmount panel. Không trích credential hoặc gọi fetch trực tiếp thay API client.
