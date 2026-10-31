# Research — quyết định và căn cứ

Date2026-10-31. Research agents theo managed plan: workspace_contract_research và workspace_ui_research (read-only), cùng local source review. Không có unknown technology còn mở.

| Decision | Rationale / source | Alternatives |
| --- | --- | --- |
| Scope class riêng shell/lessons | LearningApp.css dùng chung overview/settings/assignments; selector hẹp giữ hồi quy | Sửa global CSS bị loại |
| Controlled inline create, page-owned File | Giữ native File/object qua collapse và payload FormData; CourseEntryDisclosure001 là precedent | Modal mới hoặc form luôn mở bị loại |
| Normalized explicit validation | courses.js POST lessons trim title/content, integer order, content/file; native raw bounds khác normalized | Chỉ native validation không đủ |
| Full-list ordinal và selected giữ khi lọc | Current visible index đánh lại số; selected từ course.lessons và URL đã đúng | Tự chọn bài đầu khi filter bị loại |
| Giữ quiz guard/keys | App key courseId, quiz key course+lesson, safelyNavigateFromQuiz dùng flush/version hiện có | Key toàn reader theo search/section bị loại |
| Request context + ref locks | Native state không chặn rapid activation đồng bộ; GET cũ có thể ghi đè create/progress | Optimistic fake success/refactor toàn mutation bị loại |
| Preview/summary source revision key | Resource thay cùng lesson không được reuse stale panel; không sửa service/parser | Đổi contract nguồn/tạo endpoint mới bị loại |
| Compact description có mở đầy đủ | Text4000 không được đẩy list khỏi viewport; reader content không clipping | Fixed height khóa toàn header bị loại |

Sources: frontend/src/pages/CourseWorkspacePage.jsx, components/PracticeQuizPanel.jsx, DocumentPreview.jsx, DocumentAssistantPanel.jsx; backend/src/routes/courses.js, middleware/authenticate.js, prisma/schema.prisma. Contract details tại contracts/existing-api.md.

Quan sát thật: Docker db/backend running healthy, /api/health8081 statusok; browser Orca hiện /auth, chưa có phiên học tập. Người dùng đang đăng nhập tài khoản thử. Không gọi write/seed/provision để có dữ liệu. Chưa quan sát workspace, không dùng source làm bằng chứng pixel.

Feature001 pending T021/T022/T024/T025 giữ nguyên. Baseline copy/hash frontend và92files tại .artifacts/course-workspace-baseline; không reset/stash/commit.

Baseline limitations ngoài scope: browser history không đi qua workspace quiz guard; document parser có đường lỗi generic500; không sửa backend hoặc hứa autosave mọi đường rời. UI giữ lỗi thật và draft. Assistant lỗi422 có copy cũ phủ nhận PDF extraction: chỉ sửa câu hướng dẫn, không sửa lookup logic.
