# Implementation Plan: Không gian khóa học và đọc bài

**Branch**: artifact `002-improve-course-workspace`; Git branch hiện tại được giữ nguyên.
**Date**: 2026-10-31 | **Spec**: [spec.md](spec.md)

## Summary

Course shell gọn, list/reader hai cột và create disclosure page-owned. Giữ API, URL và quiz handlers. Sửa CourseWorkspacePage, thêm LessonCreateDisclosure và CourseWorkspace.css; sửa riêng copy422 về PDF trong DocumentAssistantPanel; mở rộng test hiện có. Không redesign overview/assignments/students/settings.

## Technical Context

- Language/Version: JavaScript/JSX React19, Node hiện có; Vite8, React Router7.
- Primary Dependencies: React/CSS/platform, UI Feedback/Button/ConfirmDialog và DocumentSelection có sẵn. Không thêm package/font import.
- Storage: state UI tạm; Prisma/Postgres/tệp chỉ đọc contract, không migration.
- Testing: Node service tests + Vitest/jsdom/RTL, lint/build, Chromium/native và API thật nếu có phiên thử.
- Target Platform: desktop1280×800/1440×900 zoom100%; không thiết kế mobile.
- Project Type: hai npm packages độc lập; frontend-only change.
- Performance Goals: không thêm fetch cho search/filter/open disclosure; một write mỗi create/progress đang pending, đọc cũ không đổi ngữ cảnh.
- Constraints: giữ backend/API/schema/session/quiz/assignments; không seed/reset/delete data, commit/push/deploy.
- Scale/Scope: hai vai trò, course shell + Bài học, các section khác chỉ hồi quy.

## Constitution Check

| Principle | Before research / after design |
| --- | --- |
| I Contract | PASS: form multipart title/content/order/document và endpoints giữ nguyên; normalized bounds từ production routes |
| II Authorization | PASS design: không đổi guard, không suy quyền từ role/cache; preview dùng fetchDocument authenticated |
| III Recovery | PASS design: state/draft/File/focus/URL/quiz guard có contracts và scenarios |
| IV Evidence | PASS design: FR/AC/SC nối tasks/tests/browser; unavailable auth không biến thành fixture pass |
| V Integrity | PASS: baseline chụp trước; chỉ frontend+artifacts002; giữ001 và managed sources, không DB writes cho fixture |

Không có waiver. Dùng research agents read-only theo managed Phase0; kết quả tại research.md.

## Project Structure

Artifacts: spec.md, plan.md, research.md, data-model.md, contracts/workspace-ui.md, contracts/existing-api.md, quickstart.md; tasks.md tạo ở bước tasks.

Source:
- frontend/src/pages/CourseWorkspacePage.jsx: chỉ integration shell/reader/create/read guards/progress guard.
- frontend/src/pages/CourseWorkspace.css (mới): desktop scoped.
- frontend/src/components/LessonCreateDisclosure.jsx (mới): controlled form/focus; không fetch/session.
- frontend/src/components/DocumentAssistantPanel.jsx: chỉ sửa copy422 sai về PDF, giữ lookup/history/requests.
- frontend/src/__tests__/frontend.test.js: regression hành vi, giữ tests001.
- frontend/src/components/PracticeQuizPanel.jsx, DocumentPreview.jsx, services, router, LearningApp.css: chỉ đọc/reuse, không sửa nghiệp vụ.

Structure Decision: không di chuyển toàn bộ workspace hoặc refactor mọi mutation; tách form vì có hidden/focus/File lifecycle riêng.

## Thiết kế desktop

Course main thêm class `course-workspace`; chỉ khi section lessons thêm `course-workspace--lessons`. Mọi state loading/error cũng có root class mới. CSS mới áp dụng shell bằng `.course-workspace > .course-header/.workspace-tabs`; body bằng `.course-workspace--lessons .course-section/...`, không selector rộng `.workspace-main button` hoặc token root.

Shell: width min1240/calc100%-64, top16, header padding16; H1 26/34, mô tả mặc định tối đa2 dòng; với mô tả dài có nút Xem mô tả/Thu gọn để đọc đầy đủ bằng keyboard. Tên khóa dài wrap không mất nav. Header dùng metadata gọn, progress ngắn; giữ actions/role. Course title accessible đầy đủ. Nav không sticky thêm, header hiện có giữ72px. Geometry đầu trang nghiệm thu ở trạng thái description mặc định thu gọn; mở rộng chủ động không bị ép chiều cao.

Bài học: heading H2 22/30 và trigger thêm bài bên phải chỉ instructor. Không lặp một form luôn mở. Một trigger trong header lessons; CTA shell từ section khác chuyển lessons và mở form bằng guard quiz. List/reader grid280px minmax(0,1fr), gap20, panel radius12/padding16. Search/filter nằm đầu aside; danh sách cuộn bên trong khi nhiều bài, max-height theo viewport nhưng không cắt reader. Bài ordinal theo course.lessons; aria-current khi selected. Item title wrap; progress text và trạng thái không chỉ màu.

Reader: heading/vị trí/prior-next, actions/capability trước nội dung dài để tài liệu/công cụ dễ tìm; body16/27, pre-wrap/overflow-wrap anywhere, không max-height clipping. Tên bài trong list mặc định2 dòng, accessible name và title giữ đủ, mở rộng khi focus; không cắt tên/nội dung của bài trong reader. Section Bài học giữ H2 và số bài, thu gọn eyebrow trang trí trên desktop. Panel hiện có đặt sau vùng đọc, không tạo fetch/effect mới hoặc đổi logic panel. Có nút Quản lý bài học cho instructor về settings bằng changeSection hiện có.

Review sau browser fixture: chốt list280px và body16/27 theo bounds mới ở cả hai viewport; đây là tinh chỉnh kích thước trình bày, không thay AC hoặc contract. Bằng chứng fixture và phiên thật được tách trong verification.md.

Khi lessonId sai: riêng ErrorState không auto select hoặc fetch panel; không lessonId: EmptyState chọn bài. Filter loại selected: reader giữ, aside giải thích; clear filters gốc được khôi phục. Previous/next theo toàn khóa, không theo filtered list. Không đổi URL persistence của search/filter.

## Disclosure và state

Page owns createOpen, lessonDraft, errors, pending, submit ref lock và notice. Component nhận props, region hidden/mounted, aria expanded/controls; input/file disabled pending; close/Escape vẫn dùng được. Focus input đầu khi mở, trigger khi đóng từ panel; theo dõi focus ownership qua native disabled blur để success trả focus nếu body, không giành search focus. Text/order/File object/error giữ qua collapse; đổi section có thể unmount DOM nhưng page state giữ File, display tên từ object; native input không được set đường dẫn. Success reset File input bằng form reset token, clear only submitted draft, close; failure giữ File.

Normalize title/content trim, integer order (raw empty=0), file validator reuse; invalid labels + focus field đầu. Native maxLength không chặn raw hợp lệ sau trim. Submit noValidate và explicit bounds. File/text phải có ít nhất một nguồn; lỗi file không gửi invalid file. Upsert response lesson theo id/sort order/createdAt. Pending locks đồng bộ trước network; không hứa hủy POST khi close/unmount.

Course GET: AbortController + sequence + mounted guard. Mutation create/progress chụp course generation/context, invalidates obsolete read trước write; chỉ apply nếu page/cùng course còn hiện hành. Không thêm refetch tự clear draft. Các mutation settings ngoài scope giữ semantics. UI active operations đọc theo lesson id; progress lock per id cho phép course mới không nhận response course cũ.

Quiz: changeSection/selectLesson/openLessonPanel và link quản lý mới đều gọi safelyNavigateFromQuiz; giữ PracticeQuizPanel callbacks/key. Không tạo Router blocker hay thay back/forward semantics; kiểm URL/history và báo baseline giới hạn nếu phát hiện. Preview key course/lesson/sourceRevision tránh content stale khi đổi resource.

## Risks và kiểm chứng

- CSS cascade và header dài: bounds4 lượt + chuỗi dài; không giảm nội dung để ép action vào viewport.
- File input hidden/remount: object và filename retained, payload FormData đúng file; dùng actual File trong component tests.
- Quiz flush: regression integrated workspace khi đổi lesson/section/panel, save failure ở lại/bỏ; không chỉ test panel riêng.
- Race: stale course GET, double submit, create failure, progress sau chọn bài khác/unmount; kiểm generation bằng deferred promises.
- Khi lập plan, tab Orca mới ở /auth. Sau triển khai, dùng phiên Chrome hiện có do người dùng đăng nhập; kết quả và giới hạn tại verification.md. Không suy runtime workspace từ source hoặc fixture. CUA lỗi kernel assets nên browser fallback là orca-cli đã đọc guide.

## Complexity Tracking

Không có constitution violation hoặc lớp kiến trúc mới. Shared globals/managed templates giữ nguyên.
