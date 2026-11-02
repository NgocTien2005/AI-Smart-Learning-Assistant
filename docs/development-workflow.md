# Phát triển Lumina LMS với Spec Kit

Bộ `lumina-*` bổ sung ngữ cảnh repository cho GitHub Spec Kit. Quy tắc chung
ở [AGENTS.md](../AGENTS.md); skill không thay thế lệnh do Spec Kit quản lý.
Tài liệu này được đối chiếu ngày **2026-10-28** với code trong working tree,
Specify CLI cục bộ và [repository chính thức](https://github.com/github/spec-kit).
Các ghi nhận hiện trạng dưới đây là mốc khảo sát, cần kiểm tra lại khi sử dụng.

Đợt [nghiệm thu 001–007 ngày 2026-11-02](acceptance-20261102.md) bổ sung kết quả
runtime trên stack riêng, sửa các mô tả README/fixture integration đã lỗi thời
và xác nhận tooling đã được init từ các feature trước. Các ghi nhận ngày
2026-10-28 bên dưới vẫn là lịch sử khảo sát; không dùng trạng thái thiếu runtime
hoặc thiếu `.specify/` tại mốc đó để mô tả repository hiện tại.

## Kết quả khảo sát và giới hạn bằng chứng

| Phần đã đọc | Implementation và ý nghĩa khi phát triển |
| --- | --- |
| [Frontend package](../frontend/package.json), [backend package](../backend/package.json) | Hai package độc lập; React 19/Vite 8, Express 5/Prisma 7; không có npm workspace gốc. Test frontend kết hợp Node tests và Vitest/jsdom/React Testing Library; backend dùng Node test runner. |
| [Router](../frontend/src/app/App.jsx), [session](../frontend/src/app/SessionContext.jsx), [layout](../frontend/src/components/AppLayout.jsx) | Guard theo role, khôi phục phiên qua `/api/auth/me`, lỗi mạng/5xx có trạng thái phục hồi. ADMIN vào quản trị; INSTRUCTOR/STUDENT vào dashboard. |
| [Dashboard](../frontend/src/pages/DashboardPage.jsx), [course workspace](../frontend/src/pages/CourseWorkspacePage.jsx), auth/account/admin pages | Dashboard dùng API; workspace đọc `section`, `lessonId`, `panel` từ query. Khi đổi course có key/guard để hạn chế response cũ. |
| [Quiz panel](../frontend/src/components/PracticeQuizPanel.jsx), [assistant](../frontend/src/components/DocumentAssistantPanel.jsx), [summary](../frontend/src/components/LessonSummaryPanel.jsx), [preview](../frontend/src/components/DocumentPreview.jsx), [assignments](../frontend/src/components/AssignmentsPanel.jsx), [UI chung](../frontend/src/components/ui/) | Các panel có request thật; quiz có draft/version, flush khi rời panel và cảnh báo unload. Không suy ra mọi đường rời app đã được bảo vệ chỉ từ callback này. |
| [API client](../frontend/src/services/api.js), [API errors](../frontend/src/services/apiErrors.js), [navigation](../frontend/src/services/navigation.js), [lesson guard](../frontend/src/services/lessonRequestGuard.js) | Base URL qua `VITE_API_URL`, lỗi HTTP/network được phân biệt; tài liệu dùng authenticated fetch. |
| [CSS nền](../frontend/src/index.css), [App CSS](../frontend/src/App.css), [LMS CSS](../frontend/src/pages/LearningApp.css) | Có nhiều lớp style và selector cũ; xác định markup đang render và cascade trước khi sửa. Không coi selector tồn tại là màn hình hiện tại. |
| [Runtime entry](../backend/server.js), [production app](../backend/src/app.js), [routes](../backend/src/routes/) | Mount dưới `/api`; courses mount router quiz. [Legacy app](../backend/app.js) là harness khác, không phải server production. |
| [Authentication](../backend/src/middleware/authenticate.js), [role middleware](../backend/src/middleware/authorizeRole.js), [courses](../backend/src/routes/courses.js), [quiz](../backend/src/routes/quizAttempts.js), [admin](../backend/src/routes/admin.js), [auth](../backend/src/routes/auth.js) | Token được đối chiếu user hiện tại, active/authVersion; role và quyền owner/enrollment là các kiểm tra riêng. ADMIN không có bypass nội dung mặc định trong predicate course. |
| [Schema](../backend/prisma/schema.prisma), [migrations](../backend/prisma/migrations/), [Prisma config](../backend/prisma.config.ts), [client adapter](../backend/src/lib/prisma.js) | Quan hệ cascade, progress/submission uniqueness, quiz JSON snapshot/draft/version và document metadata phải được xem cùng consumer. Không chỉnh generated client. |
| [Backend tests](../backend/test/), [frontend tests](../frontend/src/__tests__/frontend.test.js), [service tests](../frontend/src/services/) | Auth regression import legacy app; quiz regression dùng production router với Prisma injection, không qua toàn bộ middleware thật. Test render có mock API, không chứng minh DB hoạt động. |
| [Compose](../compose.yaml), [backend image](../backend/Dockerfile), [frontend image](../frontend/Dockerfile), [Nginx](../frontend/nginx.conf), [integration script](../backend/scripts/integration-check.mjs) | DB/backend ở network nội bộ, frontend public; backend startup chạy migrate deploy. Integration gọi HTTP, tạo tài khoản/dữ liệu và dọn qua Docker DB; có tác động dữ liệu kiểm thử. |

Lần tạo skill này chỉ khảo sát tĩnh và kiểm tra tooling. Không mở UI, chạy app,
app tests, integration, migration hay seed; không kết luận hệ thống hiện tại healthy.
Không đọc `.env`, credential store hoặc in giá trị secret.

### Mâu thuẫn cần giữ rõ nguồn

| Nguồn A | Nguồn B | Ghi nhận và phần chưa xác minh |
| --- | --- | --- |
| Cuối [README.md](../README.md), mục Frontend workflows: backlog còn gộp PDF text extraction/OCR và summaries | Phần Trích xuất tài liệu và tóm tắt cùng README, [AGENTS.md](../AGENTS.md), [documentProcessing.js](../backend/src/services/documentProcessing.js), summary route trong [courses.js](../backend/src/routes/courses.js), [LessonSummaryPanel](../frontend/src/components/LessonSummaryPanel.jsx) | Code có trích text PDF cục bộ và summary trích xuất. OCR vẫn chưa có. Đây là mô tả tài liệu không nhất quán; chưa kiểm chứng runtime trong lần này. Câu “PDF preview ... does not extract” chỉ nói preview frontend, không phủ nhận extraction backend. |
| [frontend/README.md](../frontend/README.md) mô tả `src/data` là prototype data cho course detail | Không có `frontend/src/data` trong cây khảo sát; [DashboardPage](../frontend/src/pages/DashboardPage.jsx) và [CourseWorkspacePage](../frontend/src/pages/CourseWorkspacePage.jsx) gọi API | Mô tả cấu trúc đã lệch; không tạo dữ liệu giả theo README cũ. |
| [Progress migration](../backend/prisma/migrations/20261008120000_add_lesson_progress/migration.sql) tạo index `LessonProgress_lessonId_idx` | Model `LessonProgress` trong [schema](../backend/prisma/schema.prisma) không khai báo index `lessonId` | Khác biệt giữa SQL lịch sử và schema; chưa kiểm tra DB đích/drift. Không tự sửa SQL lịch sử hoặc schema trong nhiệm vụ tài liệu này. |
| [Integration script](../backend/scripts/integration-check.mjs) gửi fixture `%PDF-1.4` kèm nội dung `not extracted` và chờ request thành công | [documentProcessing.js](../backend/src/services/documentProcessing.js) parse PDF bằng PDF.js; `processUploadForStorage` trong [courses.js](../backend/src/routes/courses.js) không chuyển `CORRUPT_DOCUMENT` thành upload thành công | Có dấu hiệu fixture cũ không phù hợp parser mới. Đây là nghi vấn từ code review, chưa phải kết quả chạy integration thất bại. |

Các điểm trên được ghi nhận, không sửa ứng dụng/tài liệu cũ ngoài phạm vi. Khi
ảnh hưởng một feature, đưa việc đối chiếu vào spec/plan và kiểm chứng đúng nguồn.

<a id="gioi-han-capability"></a>
## Giới hạn capability cần giữ trong spec và UI

- Assistant tra cứu các đoạn liên quan trong tài liệu/nội dung cục bộ; không phải
  hội thoại với dịch vụ AI ngoài. Summary chọn câu nguồn dưới nhãn **Tóm tắt trích xuất**.
- Quiz dùng mẫu câu định nghĩa giới hạn trong [studyQuiz.js](../backend/src/utils/studyQuiz.js),
  có thể tạo ít câu hoặc từ chối khi thiếu nguồn phù hợp; không phải hiểu ngôn ngữ tổng quát.
- PDF chỉ trích lớp văn bản bằng PDF.js, không OCR. Nguồn chung được resolve trong
  [lessonText.js](../backend/src/utils/lessonText.js); xem code hiện tại để lấy giới hạn,
  ưu tiên nguồn và revision. Thay tài liệu không được sửa snapshot quiz cũ.
- Không tự thêm dịch vụ AI ngoài, OAuth, notifications, recommendations hay analytics.
  Nếu được yêu cầu như feature mới, cần đặc tả phạm vi, API/quyền/dữ liệu và cấu hình
  tương ứng; không mô tả chúng là capability đã có.

## Chọn skill

| Skill | Khi dùng và đầu ra chính |
| --- | --- |
| [lumina-speckit](../.agents/skills/lumina-speckit/SKILL.md) | Bắt đầu/tiếp tục SDD; xác định feature, giai đoạn, artifacts và bước tiếp theo. |
| [lumina-ui-design](../.agents/skills/lumina-ui-design/SKILL.md) | Cần quyết định thiết kế; vấn đề quan sát được, bố trí, trạng thái và tiêu chí nghiệm thu. |
| [lumina-react-ui](../.agents/skills/lumina-react-ui/SKILL.md) | Triển khai/sửa React hoặc CSS; thay đổi bảo toàn luồng session, URL, quiz và accessibility. |
| [lumina-api-contract](../.agents/skills/lumina-api-contract/SKILL.md) | Backend/API và kết nối UI; contract, truy vết, validation và ma trận quyền. |
| [lumina-prisma](../.agents/skills/lumina-prisma/SKILL.md) | Model/migration/query; tác động dữ liệu, SQL và kiểm chứng database phù hợp. |
| [lumina-verify](../.agents/skills/lumina-verify/SKILL.md) | Xác minh/bàn giao; acceptance criteria gắn bằng chứng và trạng thái rõ ràng. |

Các skill để automatic discovery mặc định, không đặt explicit-only policy.
Chỉ đọc skill chuyên môn đang cần, không tải cả bộ cho mọi thay đổi. Không có
`references/` hay `scripts/` phụ vì chưa có quy trình lặp lại cần tự động hóa;
hướng dẫn dùng chung nằm trong tài liệu này và AGENTS.md.

Ví dụ gọi trong chat, dùng được khi agent đã nhận diện bộ skill:

```text
$lumina-speckit Tiếp tục thay đổi đang hoạt động; xác định artifacts và bước còn thiếu trước khi sửa code.
$lumina-ui-design Đánh giá desktop dashboard STUDENT hiện tại, đề xuất phân cấp và tiêu chí nghiệm thu, chưa sửa code.
$lumina-react-ui Sửa lỗi chuyển bài hiển thị response cũ; giữ section/lesson trong URL và draft quiz.
$lumina-api-contract Review quyền tải tài liệu khi học viên đã rời khóa học; truy vết UI tới route production.
$lumina-prisma Review truy vấn danh sách học viên để giảm dữ liệu lấy thừa; không đổi schema.
$lumina-verify Đối chiếu diff với acceptance criteria, chạy kiểm tra phù hợp và báo phần chưa chạy.
```

## Spec Kit cục bộ và setup chưa thực hiện

Quan sát bằng `specify version`, `specify --help`, `specify init --help`,
`uv tool list` và source bundled của package đã cài:

- CLI: **specify-cli 1.2.3**, chạy trên Windows, Python runtime của CLI 3.14.3.
  `uv` khả dụng. Đây là runtime CLI, không yêu cầu Python validator phải cùng bản.
- Repository chưa có `.specify/`, `specs/`, constitution hay skill `speckit-*`.
  `specify integration status` báo `Not a Spec Kit project (no .specify/ directory)`.
  Không có active feature để tiếp tục tại mốc khảo sát.
- Bundle 1.2.3 có đủ chín bước dưới đây, gồm `converge`; **chưa bước nào được
  scaffold thành skill trong repo**. Không đánh đồng thiếu init với phiên bản
  không hỗ trợ lệnh. Chưa chạy end-to-end các lệnh đó tại Lumina.

Setup là công việc sau, **không chạy trong lần tạo skill này**. Theo
[hướng dẫn repository có sẵn, tag v1.2.3](https://github.com/github/spec-kit/blob/v1.2.3/docs/guides/existing-projects.md),
tạo baseline review được, giữ nguyên thay đổi người dùng và init ngay repo gốc.
Không cần tạo project khác hoặc đặc tả lại toàn bộ ứng dụng hiện có.

1. Kiểm tra lại version/help và executable agent. Nếu môi trường khác chưa có
   Spec Kit, chuẩn bị Python 3.11+, uv và agent, rồi cài từ kênh chính thức;
   ví dụ pin bản đã đối chiếu (không phải yêu cầu nâng cấp máy hiện tại):

   ```powershell
   uv tool install specify-cli==1.2.3
   specify version
   ```

   Xem [installation chính thức](https://github.com/github/spec-kit/blob/v1.2.3/docs/installation.md).
   Không chạy cài/upgrade khi CLI phù hợp đã có.

2. Trong repo gốc, khi nhiệm vụ setup đã được giao:

   ```powershell
   specify init --here --integration codex --script ps
   ```

   Repo không rỗng có merge prompt của công cụ. Với harness không tương tác,
   sau khi đã có baseline và review đường dẫn có thể ghi đè, biến thể chính thức
   là thêm `--force --non-interactive`. `--force` có thể thay file ở managed paths;
   không dùng nó như tùy chọn an toàn mặc định. Review diff và bảo toàn `lumina-*`.

3. Kiểm tra setup và các file được sinh:

   ```powershell
   specify integration status --json
   specify artifact list --json
   git diff --stat
   git status --short
   ```

   Đọc managed skills đã sinh thay vì tự chép template. Với
   [integration codex 1.2.3](https://github.com/github/spec-kit/blob/v1.2.3/docs/integrations/codex.md),
   vị trí là `.agents/skills/speckit-<command>/SKILL.md`, gọi trong chat bằng
   `$speckit-...`; không gõ các lệnh chat này trong terminal. `--skills` đã là
   layout mặc định; không cần thêm flag đó. Agent có thể cần tải lại phiên để
   nhận skill mới; kiểm tra danh sách thực tế trước khi gọi.

Không tạo lại hoặc chỉnh trực tiếp `speckit-*`, shared scripts/templates hay
integration metadata do công cụ quản lý. Việc thêm bundle/extension/preset hoặc
upgrade cũng không thuộc lần này.

## Xác định feature và artifact

Theo [quickstart](https://github.com/github/spec-kit/blob/v1.2.3/docs/quickstart.md)
và `common.ps1`/`check-prerequisites.ps1` trong bundle cục bộ 1.2.3:

- Resolver ưu tiên `SPECIFY_FEATURE_DIRECTORY`, sau đó khóa `feature_directory`
  trong `.specify/feature.json`. Đổi Git branch không đổi active feature.
  `SPECIFY_INIT_DIR` là override project root khi cần, không phải feature ID.
- `specify` tạo thư mục feature dưới `specs/` và lưu state. Dùng đường dẫn thực
  tế từ script, không tự chọn thư mục theo số lớn nhất hoặc đoán từ branch.
- Sau init và sau khi có feature, có thể đọc paths mà không ghi lại state:

  ```powershell
  ./.specify/scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly
  ```

  JSON có `FEATURE_DIR`, `FEATURE_SPEC`, `IMPL_PLAN`, `TASKS`. `-PathsOnly` chỉ
  resolve, không xác nhận artifacts đủ. Trong bản đã khảo sát, nó dùng `-NoPersist`;
  prerequisite thông thường có thể persist override vào feature state.
- Các bước tiếp theo dùng prerequisite flags của chính managed skill đã cài.
  Với kiểm tra read-only ở 1.2.3, `SPECIFY_FEATURE_NO_PERSIST=1` trong process
  thực hiện ngăn resolver ghi feature state, kể cả khi dùng override; giữ và
  khôi phục giá trị cũ nếu đặt trong session. Vẫn dùng đủ prerequisite flags
  để validate artifacts, không thay bằng `-PathsOnly` rồi coi là đã validate.
  Kiểm tra lại cơ chế này khi đổi phiên bản; không sửa shared script để cưỡng
  ép read-only. Đọc hooks cấu hình cùng managed skill để biết side effect.
- Artifact thường gặp: `.specify/memory/constitution.md`; trong `FEATURE_DIR`
  có `spec.md`, `plan.md`, `tasks.md`, `checklists/`, cùng `research.md`,
  `data-model.md`, `contracts/`, `quickstart.md` khi bước plan cần. Không tạo tất
  cả file rỗng để trông đủ quy trình. Luôn lấy paths từ resolver phiên bản đang dùng.

Nếu state/override không hợp lệ hoặc trỏ nhiều ngữ cảnh khác nhau, báo rõ đường
dẫn và hỏi feature cần tiếp tục nếu không thể xác định từ yêu cầu. Không chạy
`specify` mới chỉ để chữa thiếu state của feature đã tồn tại.

## Quy trình feature

Đây là quy trình đầy đủ của Lumina trên Spec Kit 1.2.3; tên dưới đây là cú pháp
chat Codex. Đọc kết quả từng bước, tiếp tục trong phạm vi được giao, không chèn
approval cho mọi thao tác thông thường.

| Bước | Trách nhiệm và ngữ cảnh Lumina |
| --- | --- |
| `$speckit-constitution` | Thiết lập nguyên tắc chung một lần: contract, quyền theo tài nguyên, giữ dữ liệu/migration, khả năng cục bộ và bằng chứng kiểm chứng theo AGENTS.md. Chỉ cập nhật khi nguyên tắc thay đổi; không tạo lại mỗi feature. |
| `$speckit-specify` | Nhu cầu và lý do, vai trò, user stories, phạm vi/ngoài phạm vi, acceptance criteria và tình huống âm tính; không nhét quyết định kỹ thuật vào nhu cầu. |
| `$speckit-clarify` | Giải quyết điều chưa rõ ảnh hưởng hành vi, dữ liệu, API/schema/phạm vi. Ghi câu trả lời vào spec, không hỏi lại quyết định đã có. |
| `$speckit-plan` | Quyết định kỹ thuật dựa trên code hiện có; map router/session/UI → request → production route/middleware → model, tác động consumer, dữ liệu/migration, rủi ro và kiểm chứng. Đọc skill chuyên môn tương ứng. |
| `$speckit-checklist` | Kiểm tra chất lượng yêu cầu: rõ, đủ, nhất quán, kiểm tra được. Đây không phải test suite hoặc chứng nhận implementation đã pass. |
| `$speckit-tasks` | Task ID, user story/requirement nguồn, file cần sửa, thứ tự phụ thuộc và cách xác minh. Chỉ đánh dấu song song nếu thực sự độc lập; không yêu cầu tự spawn agent. |
| `$speckit-analyze` | Đối chiếu spec/plan/tasks theo cơ chế read-only của lệnh. Báo xung đột/gap; việc sửa artifacts diễn ra ở bước phù hợp sau phân tích, không ghi trong analyze. |
| `$speckit-implement` | Thực hiện task theo dependency, giữ contract/quyền, chạy kiểm chứng phù hợp qua `lumina-verify`; completion checkbox phải có căn cứ. |
| `$speckit-converge` | Sau implement trên tasks hiện tại, đối chiếu code với spec/plan/tasks và constitution; bổ sung công việc còn thiếu theo cơ chế chính thức, rồi quay lại implement nếu cần. |

Checklist có hai loại: `checklists/requirements.md` được specify/clarify duy trì;
custom checklist do reviewer đánh giá chất lượng yêu cầu. Với bundle 1.2.3,
implement đọc checkbox như gate và **dừng hỏi khi còn item chưa tick**, không
tự sửa marker. Chỉ tick khi tiêu chí chất lượng đã được đánh giá; không tick
để bỏ qua gate. Đây là yêu cầu từ công cụ, không phải quy trình xin phép cho
mọi sửa file. Xem [implement chính thức](https://github.com/github/spec-kit/blob/v1.2.3/templates/commands/implement.md).

Bundle `analyze` 1.2.3 cũng yêu cầu approval trước khi gọi lệnh chỉnh sửa thủ
công tiếp nối từ đề xuất remediation. Khi gate đó áp dụng, giải thích yêu cầu
từ managed skill đã đọc; không coi báo cáo analyze là quyền tự sửa artifacts.
Không thêm gate này cho công việc độc lập thông thường. Xem
[analyze chính thức](https://github.com/github/spec-kit/blob/v1.2.3/templates/commands/analyze.md).

`converge` trong bundle 1.2.3 phân loại gap và chỉ append phase Convergence với
task ID mới, nguồn FR/SC/US-AC/plan/constitution. Nó không viết code, sửa
spec/plan hoặc đổi thứ tự/ID task cũ. Không còn gap thì giữ `tasks.md` nguyên
byte và báo `converged`; còn gap thì `tasks_appended` và quay lại implement.
Không dùng bước này để mở rộng yêu cầu hoặc coi đánh giá code là test runtime.
Xem [converge chính thức](https://github.com/github/spec-kit/blob/v1.2.3/templates/commands/converge.md).

Khi phiên bản khác thiếu một lệnh: báo tên/version/bước thiếu, dùng các lệnh
thực sự có. Có thể ghi review thủ công với nhãn rõ nếu phù hợp nhiệm vụ; không
tạo skill giả `speckit-converge` hoặc tự nâng cấp để che thiếu capability.

## Truy vết và kiểm chứng

Giữ chuỗi **yêu cầu → user story/acceptance scenario → task → bằng chứng** trong
artifacts đang dùng, không tạo thêm hệ thống quản lý song song. Một hàng minh
họa cho thay đổi bảo toàn điều hướng (không phải feature đã được tạo):

| Yêu cầu | User story / acceptance | Task | Bằng chứng cần có |
| --- | --- | --- | --- |
| FR-001: giữ bài đang đọc khi refresh | US1/AC1: học viên đã ghi danh mở deep link rồi refresh vẫn đọc đúng bài | T001: sửa file workspace xác định trong plan và regression tương ứng | Test render dùng query, quan sát desktop với API thật; báo riêng phần chưa chạy |

Kiểm tra theo phạm vi trong [lumina-verify](../.agents/skills/lumina-verify/SKILL.md)
và AGENTS.md. Build xanh không thay test/authorization/UI. `/api/health` trong
[health route](../backend/src/routes/health.js) chỉ trả liveness, không query DB;
đổi schema cần cả Docker health/migration và endpoint thật. Mock và ảnh cũ phải
được ghi đúng loại bằng chứng. Báo **đã đạt, thất bại, chưa chạy và lý do**.

Lỗi nhỏ có phạm vi rõ có thể đi thẳng **tái hiện → tìm nguyên nhân → sửa → kiểm
chứng**, ghi căn cứ và bằng chứng trong bàn giao. Không buộc tạo feature hoặc
cài bug extension. Nếu phát hiện quyết định mới ảnh hưởng dữ liệu/API/schema/
phạm vi, làm rõ trước khi làm phần phụ thuộc và chuyển sang luồng đặc tả khi cần.

## Rà soát trigger của bộ skill

Các tình huống sau là tiêu chí review định tuyến; chúng không phải kết quả app tests.

| Yêu cầu thực tế | Skill chính | Hành vi cần kiểm tra |
| --- | --- | --- |
| “Tiếp tục feature sau khi checkout branch khác” | lumina-speckit | Resolve state/override, không đoán feature từ branch; tiếp tục artifacts đã có. |
| “Nút mở bài lỗi, đã có repro rõ” | lumina-react-ui; lumina-speckit nếu cần chọn luồng | Luồng sửa ngắn, không bắt constitution/spec/plan mới. |
| “Đề xuất lại dashboard, chưa viết code” | lumina-ui-design | Quan sát desktop hoặc nêu không xem được; thiết kế có nguồn API, chưa sửa React. |
| “Sửa response cũ khi đổi lesson” | lumina-react-ui | Truy contract, giữ URL và request guard, bảo toàn quiz draft/version. |
| “Review student tải tài liệu của course khác” | lumina-api-contract | Tách token/role/enrollment, truy production route, có case bị từ chối và không giả quyền ADMIN. |
| “Thêm constraint hoặc tối ưu Prisma query” | lumina-prisma | Xem consumer/SQL/tác động dữ liệu; query-only không sinh migration, schema đổi cần kiểm tra tương ứng. |
| “Build pass, bàn giao giúp” | lumina-verify | Đối chiếu AC, chọn kiểm tra theo diff; báo thiếu runtime thay vì kết luận hoàn thành từ build. |
| “Chỉ sửa typo tài liệu” | Không bắt nạp workflow feature | Kiểm tra tài liệu/diff phù hợp, không chạy toàn bộ application tests. |

Trigger có thể phối hợp khi công việc đi qua nhiều lớp; tránh nạp hai skill chỉ
vì cùng từ khóa UI/API nếu không có quyết định thuộc cả hai phạm vi.
