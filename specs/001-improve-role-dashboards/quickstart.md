# Hướng dẫn nghiệm thu sau triển khai

**Date**: 2026-10-30 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

Đây là hướng dẫn chạy/đối chiếu cho giai đoạn implement, không phải báo cáo sản phẩm đã
đạt. Chưa tạo tasks hoặc implementation. Các Vxx bên dưới là kịch bản nghiệm thu,
không phải task ID hoặc checklist review mới.

## Điều kiện và mức bằng chứng

- Node 24+ và packages/lockfiles hiện có theo [AGENTS.md](../../AGENTS.md). Nếu thiếu
  dependencies, dùng npm ci trong đúng package; không tự đổi lockfile/thêm thư viện.
- Unit/component có API mock kiểm chứng UI behavior, không chứng minh backend/DB,
  native dialog hoặc layout pixel. Lint/build không thay browser/HTTP regression.
- Browser cần stack local/test và tài khoản/dữ liệu sẵn có của cả ba vai trò. Không
  tự seed, reset hoặc sửa dữ liệu thật để có ảnh; chuẩn bị dữ liệu thử đúng phạm vi.
- Chuẩn bị course rỗng/chưa học/đang học/hoàn thành/unknown; nhiều khóa để tìm; user
  active/locked, có/không liên kết, nhiều trang, tên/email/description dài.
- Screenshot mới ghi ngày, revision/working tree, route, role, browser/version,
  viewport content area, zoom, font-loaded/fallback và trạng thái dữ liệu. Có thể lưu
  vào `.artifacts/role-dashboards/`; không dùng ảnh cũ làm bằng chứng bản hiện tại.
- [HTTP contract](contracts/existing-api.md), [UI contract](contracts/dashboard-ui.md)
  và [state model](data-model.md) là đầu vào đối chiếu; không log token/secret.

## V01 — Artifacts và ranh giới

Xác định feature bằng resolver/state; đọc constitution 1.0.0. Kiểm placeholder, ID,
reference, link, diff và coverage cuối tài liệu. Bảo toàn managed skills/templates,
source và công việc người dùng. Checklist yêu cầu không phải chứng nhận tests pass.

## V02 — Kiểm tra frontend khi đã có implementation

Từ repository root, chạy trong đúng package:

```powershell
Set-Location frontend
npm test
npm run lint
npm run build
```

Ghi exit code/phạm vi từng lệnh. npm test chạy Node service tests rồi Vitest component
tests. Giữ regression nền trong [frontend.test.js](../../frontend/src/__tests__/frontend.test.js):
session network/late me, course response/URL, profile, search/filter, account/course
breadcrumbs, progress, instructor management/copy, obsolete ADMIN search response.
Mở rộng cùng hạ tầng theo V04–V11; không dùng selector snapshot thay kiểm hành vi.

## V03 — Sáu lượt desktop

| Role | Route | Viewport 1 | Viewport 2 |
| --- | --- | --- | --- |
| STUDENT | `/dashboard` | 1280×800 | 1440×900 |
| INSTRUCTOR | `/dashboard` | 1280×800 | 1440×900 |
| ADMIN | `/admin` | 1280×800 | 1440×900 |

Zoom 100%, đầu trang, tải thành công có ít nhất một mục, disclosure mặc định đóng.
Mỗi lượt chụp mới và đo title/search/tên mục/action đầu: bounding box nằm trong viewport,
không bị sticky header che; action thấy trọn mà chưa cuộn. Document không tràn ngang;
không cắt nội dung để ép số đo đạt. Ngân sách y trong plan chỉ là dự toán cần kiểm thực.

So typography, spacing, control, focus/danger/status ở ba vai trò. Lặp với title 120
ký tự, tên 80, email và description dài: không mất nút/overlap, có thể đọc tên đầy đủ
bằng focus/hover. Ghi font-loaded hoặc fallback. EC-01, SC-001/008.

## V04 — STUDENT: tìm và học tiếp

- Tìm tên/description/instructor không phân biệt hoa/thường; kết hợp từng progress
  filter và khôi phục tập gốc. Phân biệt rỗng/no match.
- Chưa học/đang học/hoàn thành có đúng CTA; khóa không bài/unknown có nhãn và view link,
  không % giả. First incomplete theo order server được mở với đúng lessonId; detail
  giờ không còn incomplete thì mở lessons. Không thay giao diện trang bài học.
- Detail lỗi/403/404 không navigate sai; lỗi dễ thấy dù panel đóng và retry đúng course.
  Component assert path/state; browser xác nhận nơi hiển thị. EC-02/06.

## V05 — INSTRUCTOR: sở hữu và mã

Tìm kiếm, sort tên/cập nhật trên tập được cấp; giữ title/description/counts/mã. Quản lý
mở đúng course/section overview. Clipboard resolved mới báo success; denied phải có mã
thủ công. Phân biệt rỗng/no match/unknown, không biến lượt ghi danh thành người duy nhất.
Kiểm component và clipboard/browser thật. EC-03/07.

## V06 — Disclosure, validation và write

Với mỗi vai trò STUDENT/INSTRUCTOR:

1. Trigger thấy ngay; một lần mở focus input đầu. Nhập/đóng/mở giữ draft, không có
   request; Escape trong panel trả trigger. Closed panel không vào Tab.
2. Title normalized kiểm biên 2/3/120/121, description tối đa 4.000 sau normalization;
   join lowercase/whitespace hai đầu chuẩn hóa đúng 8 hex; invalid hex/length bị báo.
   Native length constraints không được chặn raw value hợp lệ sau trim.
3. Create201/join200/rejoin có progress: đúng một course id, mã/tiến độ thật, clear sau
   success; panel đóng vẫn thấy notice. 400/404/403/network/5xx giữ draft, không success giả.
4. Rapid submit chỉ một write, fields/submit pending, trigger đóng còn dùng được. Đóng
   không có nghĩa hủy server write. Success không giành focus nếu người dùng đã đi nơi khác.
   Error panel đóng chỉ hướng mở lại, không focus input hidden. EC-05/10.

## V07 — ADMIN search và paging

Chỉ managed roles; search tên/email, query ≤120, đổi từ khóa về page1, paging25 và
first/last/one-page controls đúng. Total gắn query/snapshot đã xác nhận; response cũ
không overwrite. Initial failure không hiện 0 tài khoản, no match khác global empty.
Rename user rời query ở trang cuối phải refetch total/pages/hàng mới và clamp/refetch
trang hợp lệ, không mắc kẹt empty last page mất paging. EC-04/09.

## V08 — ADMIN editor và confirmation

- Giữ fields/counts; email read-only, role không có ADMIN. Name trim2–80; save disabled
  khi không có thay đổi hợp lệ. Role confirm đúng email/cũ/mới, active confirm đúng tác động.
- Cancel/Escape không PATCH. Save/toggle chỉ success từ server. Role409 giữ draft và
  effective role cũ; active failure không đổi trạng thái giả.
- Dirty name/role không mất qua GET cùng trang/toggle; toggle chỉ gửi isActive. Save
  khóa editor, serialize save/toggle cùng user, row khác vẫn dùng được.
- PATCH subset không xóa createdAt/counts; toggle không clear dirty. EC-05/08.

## V09 — Races và reconcile

Dùng component tests điều khiển thứ tự response:

- Học tiếp A rồi B, B trả trước; A muộn không navigate/notice ngược. Click lặp cùng
  course và unmount trước response không tạo duplicate/late navigation.
- GET course list cũ đối đầu create/join không làm mất course hoặc duplicate id.
  Chưa có snapshot đầy đủ thì partial upsert không được coi là toàn bộ danh sách/tổng.
- GET course ban đầu còn pending → submit vô hiệu GET → POST thất bại: draft/error còn,
  danh sách kết thúc loading cũ và có GET mới/read-error retry, không spinner vô hạn,
  tổng giả hoặc tự gửi lại POST. Kiểm cùng nguyên tắc phục hồi read ở ADMIN.
- GET ADMIN trước write tới muộn sau PATCH không đảo trạng thái; PATCH hoàn tất sau
  query/page đổi chỉ reconcile view hiện hành, không dùng closure cũ để sửa total.
- Hai user write gần nhau không để GET generation cũ overwrite. Dirty row khác giữ
  nguyên; page shrink theo V07. Write success + refresh failure giữ success và stale label;
  retry chỉ GET. Tách test với write failure để không gửi lại write gây tác động.

## V10 — State và dữ liệu trung thực

Với luồng áp dụng, kiểm initial loading, refresh, loaded empty, no match, read error/
retry, submitting, write failure/success và success+refresh failure. Component kiểm
role=status/alert; browser kiểm thông báo không hidden/clipped. 0 thật được hiển thị,
null/missing có nhãn thay vì rỗng/0/“—%”. Total cũ không gắn query mới. Notice ngoài panel
không bị close/refetch tự xóa. EC-02/03/10.

## V11 — Keyboard, route và CSS ngoài phạm vi

- Tab/Shift+Tab theo DOM, Enter/Space đúng control, label/focus-visible rõ; disclosure
  không trap focus. Browser thật kiểm native ConfirmDialog: initial cancel, Tab trong
  modal, Escape/hủy không write và đóng trả trigger. jsdom không thay native focus.
- Header/brand/home/profile/account/logout/active nav đúng cả ba vai trò. Mở URL sai
  role qua router/GuardedRoute thật, không chỉ mount page trực tiếp.
- Đi qua dashboard rồi mở account/course/auth: chúng không có marker mới; so layout
  khi stylesheet đã loaded. Course crumbs/section/lessonId/panel và quiz giữ hành vi.
- `/me` network/503 có recovery; explicit auth401 xử lý expiry. Không sửa session/API
  service để làm test thuận tiện. EC-01/06/08.

## V12 — HTTP/database và quyền

Khi stack local/test healthy và DB mục tiêu đã xác định, đọc script vì nó tạo/dọn dữ
liệu. Từ thư mục backend:

```powershell
npm run test:integration
```

Đối chiếu [integration-check.mjs](../../backend/scripts/integration-check.mjs), contract
và middleware production: token thiếu/sai/hết hạn, role, owner/enrollment, rejoin giữ
progress, linked409, self-target403/targetADMIN404, lock/sessionrevoked và không có
password/hash trong response. Từ chối không write trái phép. Không buộc backend GET
course deny ADMIN chỉ theo role khi predicate thật là owner/enrollment.

Không seed/reset/xóa volume hoặc gửi dữ liệu ngoài. Health chỉ liveness. Nếu suite lỗi
ở fixture PDF cũ, ghi rõ kết quả và phần dashboard chưa kiểm được; không sửa backend/
validation ngoài scope để làm suite xanh. Kiểm bổ sung chỉ trên dữ liệu thử đã xác định.

## Truy vết yêu cầu → nghiệm thu

V02 chạy regression component liên quan cho mọi hàng; browser/HTTP bổ sung theo Vxx.
Giai đoạn tasks sau này nối task ID vào chuỗi, không tạo ID giả tại bước plan.

| FR | US / AC | SC | Kịch bản và bằng chứng bổ sung |
| --- | --- | --- | --- |
| FR-001 | US1-AC1, US2-AC1, US3-AC1, US5-AC6, US5-AC7 | SC-001, SC-009 | V03/V11 browser, V12 HTTP |
| FR-002 | US1-AC1, US2-AC1, US3-AC1, US5-AC1 | SC-001 | V03 bounds/screenshots |
| FR-003 | US1-AC2 | SC-004 | V04 component/browser |
| FR-004 | US1-AC3, US1-AC5, US2-AC4, US2-AC6, US5-AC4 | SC-003, SC-007 | V04/V05/V10 dữ liệu/state |
| FR-005 | US1-AC3, US1-AC4 | SC-003 | V04/V09 path, browser lessons |
| FR-006 | US1-AC5, US1-AC6 | SC-003, SC-007 | V04/V09/V10, V12 quyền |
| FR-007 | US2-AC2, US2-AC3, US2-AC4 | SC-003, SC-004, SC-007 | V05/V09, clipboard browser |
| FR-008 | US4-AC1, US4-AC2 | SC-002 | V06/V11 toggle/focus |
| FR-009 | US4-AC2, US4-AC5, US4-AC6 | SC-002 | V06/V10 draft/status |
| FR-010 | US4-AC3, US4-AC4, US4-AC5 | SC-009 | V06/V09 normalization/dedupe, V12 |
| FR-011 | US3-AC2, US3-AC7 | SC-004 | V07/V09 query/page authority |
| FR-012 | US3-AC2, US3-AC3 | SC-005 | V07/V08, V12 target/roles |
| FR-013 | US3-AC4 | SC-005 | V08, V12 linked409 |
| FR-014 | US3-AC5 | SC-005 | V08/V11 cancel/focus, V12 revoke |
| FR-015 | US3-AC4, US3-AC6 | SC-005 | V08/V09 dirty/race |
| FR-016 | US1-AC6, US2-AC5, US3-AC7, US4-AC5, US5-AC4, US5-AC5 | SC-007 | V10 state matrix |
| FR-017 | US4-AC5, US5-AC5 | SC-007 | V06/V08/V09 pending/duplicate |
| FR-018 | US5-AC2, US5-AC5 | SC-006, SC-008 | V03/V11 thị giác/keyboard |
| FR-019 | US5-AC1 | SC-001, SC-008 | V03/V11 long data/overflow |
| FR-020 | US5-AC3, US5-AC5 | SC-006 | V11 browser focus, component labels |
| FR-021 | US5-AC6 | SC-007, SC-009 | V11 session, V12 auth/resource |
| FR-022 | US1-AC4, US2-AC3, US5-AC6 | SC-009 | V01/V11 diff/route/CSS, V12 |

## Bằng chứng tại ngày lập kế hoạch

| Kiểm tra | Trạng thái thực tế |
| --- | --- |
| Resolver, CLI/integration và constitution | Đã đối chiếu: feature đúng, CLI 1.2.3, constitution 1.0.0 |
| Clarify / checklist yêu cầu | 0 câu hỏi; 16/16 → 16/16, không phải app pass |
| Research source/contract/CSS | Đã review code, không phải runtime |
| GET health/root localhost:8080, root localhost:5173 | Không truy cập được: mỗi request timeout 4 giây |
| Docker ps | Không kết nối được engine pipe; chưa xác nhận stack healthy |
| Frontend test/lint/build | Chưa chạy; chỉ tạo tài liệu, chưa triển khai |
| Desktop bounds/screenshots/keyboard/native dialog | Chưa chạy; runtime không truy cập được |
| HTTP/database integration và ma trận quyền | Chưa chạy; Docker unavailable, không thay DB để chuẩn bị |

Khi bàn giao implementation, ghi **đã đạt / thất bại / chưa chạy + lý do** theo từng
Vxx, liên kết artifact thật. Không dùng checklist/converge thay bằng chứng runtime.
