# Contract HTTP hiện có — không thay đổi

Nguồn: backend/src/app.js, routes/courses.js, middleware/authenticate.js, authorizeRole.js, prisma/schema.prisma. Frontend services/api.js giữ VITE_API_URL + bearer và auth error handling.

| Request | Consumer / contract |
| --- | --- |
| GET /api/auth/me | Session authority; network/5xx recovery, explicit SESSION_INVALID xử lý expiry |
| GET /api/courses/:id | owner/enrollment; ordered lessons, metadata; STUDENT progress; assignments có sẵn |
| POST /api/courses/:id/lessons | INSTRUCTOR owner; multipart title/content/order/document; title trim2–160, content trim100000, integer order0–10000; content hoặc file; 201 {lesson} |
| PUT/DELETE /api/courses/lessons/:id/progress | STUDENT enrollment; response isCompleted/completedAt; phản hồi cập nhật đúng lesson id |
| GET /api/courses/lessons/:id/document | Protected binary, fetchDocument/downloadDocument hiện có, không public URL |
| GET .../:id/summary | Extractive source points, lỗi hiện có; không diễn giải AI |
| GET/POST .../:id/chat | Local assistant history/lookup; không thêm remote service |
| quiz endpoints | PracticeQuizPanel quản lý attempts/draft/version/submit/flush; không đổi payload/lifecycle |

Settings/assignments/students endpoints và middleware giữ nguyên. ADMIN không bypass predicate owner/enrollment; router frontend vẫn deny course UI theo role. Response lỗi {error,...code}; không đổi/nuốt lỗi. PDF.js text layer local, không OCR; metadata/source ưu tiên tài liệu thành công rồi manual content, snapshot quiz cũ giữ nguyên.
