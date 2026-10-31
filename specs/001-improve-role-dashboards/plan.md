# Implementation Plan: Cải thiện dashboard theo vai trò Lumina

**Branch**: Git hiện tại `main`; tên ngữ cảnh resolver `001-improve-role-dashboards` | **Date**: 2026-10-30 | **Spec**: [spec.md](spec.md)

**Input**: `specs/001-improve-role-dashboards/spec.md`. Feature được lấy từ resolver/state, không suy từ branch. Dừng sau Phase 1 design; chưa tạo tasks hoặc code.

## Summary

Giữ ứng dụng và quyền hiện có, cải thiện hai điểm vào: STUDENT/INSTRUCTOR tại
`/dashboard`, ADMIN tại `/admin`. Dùng header hiện có, masthead gọn, tìm kiếm và
danh sách ở đầu; thống kê phụ sau danh sách. Tạo/tham gia qua disclosure inline.
ADMIN giữ editor trực tiếp trong article hai tầng. Thêm CSS có phạm vi route;
bổ sung guard frontend cho request, pending và bảo toàn draft để đạt spec.

[Research](research.md) chốt D01–D09; [data-model](data-model.md) mô tả nguồn và
state hiện có; [UI contract](contracts/dashboard-ui.md) và [HTTP contract](contracts/existing-api.md)
ràng buộc tương tác. [Quickstart](quickstart.md) có ma trận FR → US/AC → SC → kiểm chứng.

## Technical Context

**Language/Version**: JavaScript ES modules, JSX, CSS; Node.js 24+ theo AGENTS.md.
Phiên bản thực tế khi implement phải lấy từ package/lockfile, không đổi runtime trong feature.

**Primary Dependencies**: React 19.2.8, react-router-dom 7.18.2, Vite 8.2.2 theo
package hiện tại; không thêm dependency. Backend Express 5.2.1/Prisma 7.10.0 chỉ là
contract context, không sửa.

**Storage**: PostgreSQL và dữ liệu server giữ nguyên; session storage qua API client
hiện có; disclosure/draft/request state chỉ trong memory của page. Không migration,
không thêm localStorage persistence.

**Testing**: Node service tests, Vitest 4.1.11 + jsdom + React Testing Library; ESLint
và Vite build qua scripts frontend. Desktop/keyboard/native dialog cần browser thật.
HTTP/database regression dùng stack kiểm thử và script integration hiện có.

**Target Platform**: Desktop browser tại 1280×800 và 1440×900, zoom 100%, viewport
content area. Ghi browser/version và font-loaded/fallback khi nghiệm thu; dùng
browser hiện có, không thêm browser matrix hoặc mobile feature.

**Project Type**: Web application với hai npm package độc lập, Docker/Nginx reverse
proxy. Chỉ thay frontend và tài liệu/test liên quan.

**Performance Goals**: Không thêm request cho lọc/sắp xếp course vốn chạy client-side;
giữ debounce ADMIN 250ms, paging server 25. Không thêm vòng refetch vô hạn; pending
không chặn hàng không liên quan. Không đưa SLO hay benchmark hạ tầng mới vào feature.

**Constraints**: Giữ API/authorization/session và URL bài học. Không backend/schema/
migration/dependency/OAuth/analytics/AI ngoài. Không redesign account/course/auth.
CSS mới cần scope route ngay cả khi stylesheet vẫn được tải ở route khác.

**Scale/Scope**: 3 vai trò, 2 route chính, 5 US/22 FR/32 AC/9 SC; grid course theo
tập dữ liệu API hiện có, ADMIN 25 tài khoản/trang. Không thêm server pagination course
hoặc tổng thống kê toàn hệ thống.

## Constitution Check

Đây là gate tuân thủ của **kế hoạch**, không phải chứng nhận implementation.

| Nguyên tắc constitution 1.0.0 | Trước Phase 0 | Sau Phase 1 design | Căn cứ / nghĩa vụ tiếp theo |
| --- | --- | --- | --- |
| I. Contract nhất quán | Đủ điều kiện | Đáp ứng trong thiết kế | [HTTP contract](contracts/existing-api.md), đọc production routes; payload/response không đổi. |
| II. Quyền trên server/tài nguyên | Đủ điều kiện | Đáp ứng trong thiết kế | Không đổi guard/predicate; ma trận nghiệm thu gồm auth, role, owner/enrollment và từ chối không write. |
| III. UX rõ và phục hồi | Đủ điều kiện | Đáp ứng trong thiết kế | Disclosure/state/focus/status và CSS scope được chốt; runtime chưa xem được, không tuyên bố UI đạt. |
| IV. Bằng chứng chất lượng | Đủ điều kiện | Đáp ứng trong thiết kế | [Quickstart](quickstart.md) map đủ FR/AC/SC; app checks còn chưa chạy, có lý do. |
| V. Toàn vẹn dữ liệu/phạm vi | Đủ điều kiện | Đáp ứng trong thiết kế | Không migration/seed/write DB, không sửa app ở giai đoạn này; dùng thư viện có sẵn và diff nhỏ. |

Không có vi phạm cần miễn trừ. Không thay constitution, managed skills, shared template
hoặc script Spec Kit. Không có extensions.yml cho before/after clarify/plan.
Thiếu runtime không cản trở việc viết plan nhưng là phần nghiệm thu còn thiếu.

## Project Structure

### Documentation (this feature)

```text
specs/001-improve-role-dashboards/
├── spec.md                         # Giữ nguyên sau clarify
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md             # Giữ marker, cập nhật ghi chú được giao
└── contracts/
    ├── dashboard-ui.md
    └── existing-api.md
```

`tasks.md` chưa được tạo; thuộc giai đoạn sau.

### Source Code (repository root)

Các đường dẫn dưới là kế hoạch tương lai, chưa sửa/thêm source trong lần này:

```text
frontend/src/
├── components/
│   ├── AppLayout.jsx               # Route marker, bỏ crumb dư của /admin
│   ├── CourseEntryDisclosure.jsx   # Mới: vùng create/join và focus lifecycle
│   └── ui/                         # Reuse Button/Feedback/ConfirmDialog
├── pages/
│   ├── DashboardPage.jsx           # Bố cục, notice, pending/request guards
│   ├── AdminPage.jsx               # Hàng gọn, drafts, writes, refresh/paging
│   ├── RoleDashboards.css          # Mới: styles scoped desktop
│   └── LearningApp.css             # Chỉ đọc, giữ stylesheet chung
├── app/                            # Router/session chỉ đọc
├── services/                       # API client chỉ đọc
└── __tests__/frontend.test.js       # Mở rộng regression hiện có
backend/src/ + backend/prisma/       # Chỉ đọc contract/schema
```

**Structure Decision**: Giữ pages chịu trách nhiệm dữ liệu và actions; chỉ tách
disclosure có lifecycle riêng. Không di chuyển toàn bộ course card, tạo state
framework hay refactor application shell.

## Thiết kế desktop được chọn

### Thứ tự vùng và ngân sách khung nhìn

| Vùng | STUDENT/INSTRUCTOR | ADMIN |
| --- | --- | --- |
| Header hiện có | Logo/home, nav, profile/role, account, logout | Giữ home quản trị và profile/role |
| Masthead gọn | H1 theo vai trò, mô tả ngắn; trigger tạo/tham gia bên phải | H1 “Giảng viên và học viên”, mô tả ranh giới quản lý |
| Notice luôn hiện khi có kết quả | Tạo/tham gia/copy/học tiếp; không nằm trong vùng hidden | Save/toggle/refresh, không bị GET tự xóa |
| Panel khi chủ động mở | Disclosure inline, mặc định đóng | Không có create/join |
| Toolbar + danh sách | Search; progress filter hoặc sort; số kết quả; grid | Search + total đúng query; articles và phân trang |
| Phụ | Totals sau danh sách, dùng dữ liệu thật | Không thêm KPI toàn hệ thống |

Giữ header khoảng 72px, main `min(1240px, calc(100% - 64px))`, padding trên 24px,
section gap 16–24px. Masthead khoảng tối đa 84px ở dữ liệu thông thường, không dùng tên
dài làm H1. Với panel đóng, mục đầu dự kiến bắt đầu y ≤ 350px, đáy primary action đầu
dự kiến ≤ 720px tại 1280×800; các số này là ngân sách thiết kế cần đo, chưa phải kết quả.
Không dùng fixed height/overflow clipping để ép đạt. Nghiệm thu spec là action thấy
trọn trong viewport đầu ở cả hai kích thước, kể cả dữ liệu dài cần kiểm tra.

Course grid giữ 3 cột `minmax(0,1fr)`, gap 20px, card padding 16px, radius 12px.
Tên/mô tả mặc định tối đa hai dòng; DOM/accessible name giữ tên đầy đủ, `title` hỗ trợ
hover và tên được mở rộng khi link nhận focus để đọc bằng bàn phím. Metadata, progress
và CTA gọn, không lồng button trong link. Không khóa chiều cao card; hàng actions ở cuối
nhờ flex. Link title và CTA vẫn mở cùng khóa theo ý nghĩa hiện tại.

ADMIN giữ article hai tầng: email/status/date ở trên; tên, role, counts và hai
actions ở hàng dưới. Grid các vùng co được, role/counts tối thiểu khoảng 150px,
editor tên `minmax(0,1.4fr)`, actions auto và có wrap. Bỏ min-width 280px trên control
chỉ trong scope mới; email/name wrap khi dài. Không bỏ field hoặc chuyển edit sang modal.

### Typography, spacing và màu

| Thành phần | Quyết định |
| --- | --- |
| Font | Inter cho body/control, Lexend cho heading; fallback Segoe UI/sans-serif hiện có; không thêm font hoặc network import |
| H1 / H2 / card title | 30/36, 22/30, 18/25px; weight theo font đã tải |
| Body / label / metadata | 14/21, 13/18, 12/18px; độ tương phản và nhãn rõ |
| Spacing | Nhịp 4, 8, 12, 16, 24, 32px; cùng vai trò thị giác dùng cùng khoảng cách |
| Button/input | Cao tối thiểu 40px, CTA 42px, search 44px; padding và disabled nhất quán |
| Surface/palette | Dùng --lumina-ink/muted/border/primary/surface hiện có; nền #f4f7fb, hover #0e57bd, focus #77a8ef, danger #bd2735 trên #fff0f1 |
| State | Văn bản kèm màu; success/error/loading không chỉ dùng icon hoặc chuyển màu |

Có thể alias token dưới marker, không đổi token `:root`. Kiểm tra font hiện có đã
tải hoặc fallback trong browser; kích thước đề xuất không thay bằng chứng layout.

### Disclosure, focus và trạng thái

- Trigger type=button, aria-expanded/controls với ID ổn định; focus trường đầu sau mở.
  Panel là region có label, không aria-modal hoặc trap focus.
- Page giữ isEntryOpen, draft, errors và submitting; component nhận open/onOpenChange
  và giữ refs/focus. Panel mounted/hidden, có rule scoped đảm bảo
  hidden thật sự không render và không vào Tab order. Đóng không clear/submit.
- Escape trong panel hoặc nút đóng thu gọn và trả focus trigger; không bắt Escape toàn trang.
- Submit lock đồng bộ và disabled controls trong khi gửi, ngăn draft mới bị clear bởi
  response cũ. Trigger đóng vẫn dùng được. Success clear trường đã gửi, thu gọn và giữ
  notice ngoài panel; chỉ chuyển focus về trigger khi focus còn ở panel sắp đóng,
  không giành focus nếu người dùng đã đi nơi khác.
- Error giữ draft; nếu panel mở thì focus field lỗi đầu khi xác định được, nếu panel
  đóng thì notice chỉ đường mở lại, không tự giành focus.
- Reuse StatusMessage/FieldError/LoadingState/EmptyState/ErrorState. Continue error có
  retry gắn đúng course và phải thấy dù vị trí card đã cuộn; clipboard denied có mã
  thủ công, chỉ success khi writeText hoàn tất.
- ConfirmDialog ADMIN giữ semantics hiện có (cancel mặc định, Escape, Tab/focus return).
  Copy đổi role nêu email, role cũ→mới và dữ liệu liên kết, bỏ thuật ngữ “Backend”.

## Ranh giới CSS và file thay đổi

AppLayout xác định chính xác pathname `/dashboard` hoặc `/admin` để thêm
`role-dashboard-shell` vào root hiện có. Không suy từ role đơn thuần vì account/course
cũng dùng layout. Điều kiện breadcrumb chỉ loại trang ADMIN gốc, giữ nested-course crumbs.

RoleDashboards.css được import sau LearningApp.css tại hai page. Mọi selector dưới
`.role-dashboard-shell`; modifier riêng cho course/admin. Bố cục mới áp dụng desktop
(min-width 1024px), không thêm mobile behavior hoặc sửa media rule cũ. State/accessibility
của disclosure hoạt động độc lập kích thước. CSS của dialog ADMIN được scope qua marker
ancestor và class confirm-dialog hiện có; không thêm prop hoặc đổi ConfirmDialog dùng chung.

| File dự kiến | Thay đổi có mục tiêu | Giữ nguyên / cách kiểm tra |
| --- | --- | --- |
| DashboardPage.jsx | Sắp vùng, notices ngoài panel, validation normalized, null totals, load/write/open guards | Payload/course state/action paths; US1/US2/US4 |
| CourseEntryDisclosure.jsx (mới) | Gom trigger/panel/form và focus; nhận open/onOpenChange, draft/action props từ page | Không tạo open state thứ hai, tự fetch hoặc lưu persistent state; keyboard/form regression |
| AdminPage.jsx | Compact markup, valid-snapshot status, row write lock, giữ dirty drafts, authoritative refresh và page clamp | Contract/managed roles/confirm và search sequence; US3 |
| AppLayout.jsx | Root marker và bỏ crumb ADMIN dư | Profile/home/account/logout và course crumbs ngoài scope |
| RoleDashboards.css (mới) | Tokens alias, layout, controls/focus/status scoped desktop | Account/course/auth không nhận marker |
| frontend.test.js | Thêm hành vi và races gắn acceptance | Dùng hạ tầng tests hiện có, không test CSS bằng selector snapshot thay browser |

Không có file backend/Prisma/session/API service dự kiến sửa. Nếu implement phát hiện
cần vượt ranh giới đó, phải nêu mismatch và quyết định phạm vi trước phần phụ thuộc.

## Đồng bộ dữ liệu và lỗi

[Data-model](data-model.md) và [UI contract](contracts/dashboard-ui.md) là quy tắc chuẩn:
read snapshot thuộc query/generation; mutation xác nhận theo payload chụp; draft riêng
với dữ liệu hiệu lực. Không lẫn abort client với hủy transaction server.

- GET cũ bị invalidate trước create/join và sau success; upsert course theo id. Nếu cần
  reconcile danh sách thì chỉ response generation hiện tại được ghi state.
- Write failure sau khi GET đầu bị vô hiệu phải kết thúc loading cũ và tải lại GET có
  guard hoặc hiện read-error/retry rõ. Giữ write error/draft; không tự retry POST/PATCH,
  không để danh sách loading vô hạn hay coi partial upsert là toàn bộ tập khóa.
- Học tiếp dùng generation cho ý định mới nhất; unmount hủy GET và vô hiệu navigate.
  Nếu server giờ không còn bài chưa hoàn thành, mở khu vực lessons hiện có.
- ADMIN serialize write theo user, giữ dirty drafts qua GET/toggle. Refetch theo query/
  page hiện hành sau success; nếu page vượt totalPages mới thì chuyển tới trang hợp lệ
  và tải lại, không hiện “chưa có tài khoản” trong lúc chỉnh trang.
- Write success + refresh error là hai kết quả riêng; giữ dữ liệu đã xác nhận, nhãn stale,
  retry GET. Không gửi write tự động khi người dùng chỉ muốn cập nhật danh sách.
- API client xử lý explicit 401 hết phiên như trước; network/5xx/403/409 không tự logout.
  Không lấy cached role làm quyền mới; không thêm ADMIN bypass.

## Rủi ro và cách giảm

| Rủi ro | Cách giảm và bằng chứng phải có |
| --- | --- |
| UI runtime không có ở bước plan | Ghi probes trong research; chụp/đo 6 tổ hợp sau implement khi môi trường sẵn sàng |
| CSS selector cũ thắng cascade hoặc hidden | Scope, import order, specificity tối thiểu; đo cả route ngoài phạm vi, hidden/Tab tests |
| Draft mất khi response tới | Row write lock, chụp payload, dirty map riêng; tests GET/toggle/save lỗi và query đổi |
| GET/PATCH chồng lấn, empty last page | Generation, authoritative total/page, clamp có guard; test phản hồi đảo thứ tự |
| Font/dữ liệu dài làm vượt viewport | Không fixed height; bounds đo với font-loaded/fallback và tên/email dài |
| HTTP integration không chạy hoặc lỗi có sẵn | Không báo pass; tách lỗi baseline/fixture PDF trong script hiện có, không sửa backend để xanh |
| Sửa shared header ảnh hưởng route khác | Marker theo pathname, kiểm account/course/auth và actual route guards |

## Kiểm chứng và kết thúc giai đoạn

[Quickstart](quickstart.md) quy định commands, scenarios V01–V12 và coverage của toàn bộ
FR/US/AC/SC. Sau implement cần npm test, lint, build; browser thật cho layout/native focus;
HTTP/database khi stack kiểm thử healthy. Plan này không chứa task ID hoặc test code.

Đã thực hiện ở giai đoạn này: khảo sát/clarify, probes đọc, kiểm Spec Kit và artifacts.
Chưa thực hiện: app tests, lint/build, desktop screenshot/keyboard, HTTP/database integration.
Không khởi động DB/stack hoặc chạy seed trong giai đoạn chỉ viết tài liệu.

## Complexity Tracking

Không có ngoại lệ constitution hoặc dependency/kiến trúc mới cần biện minh.
Một component disclosure và một stylesheet scoped là phần tách mới có mục đích.
