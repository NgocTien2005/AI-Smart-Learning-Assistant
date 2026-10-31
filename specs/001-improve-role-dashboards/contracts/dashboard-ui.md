# Contract tương tác dashboard và ADMIN

**Date**: 2026-10-30 | **Spec**: [spec.md](../spec.md) | **Plan**: [plan.md](../plan.md)

Đây là contract giao diện dự kiến để implement; không có code mới trong bước plan.
Dữ liệu/state chi tiết tại [data-model.md](../data-model.md), request/quyền tại
[existing-api.md](existing-api.md).

## Page shell và dữ liệu hiển thị

- AppLayout chỉ thêm marker cho đúng pathname `/dashboard` và `/admin`, giữ header
  role-aware. Bỏ breadcrumb ADMIN tự trỏ về chính trang; course crumbs/account giữ nguyên.
- H1: “Khóa học của tôi”, “Khóa học đang giảng dạy” hoặc “Giảng viên và học viên”.
  Profile vẫn cung cấp tên/vai trò; không để tên dài làm masthead chiếm viewport.
- Search và danh sách là vùng chính; course totals phía sau danh sách. ADMIN không có
  create/join course hoặc số liệu mới ngoài contract đang trả.
- Course title/link, description, instructor/ownership, số bài và tiến độ/count tương
  ứng không mất khi compact. Unknown có nhãn, 0 chỉ là giá trị thật của snapshot hợp lệ.
- Không gộp “Chưa có bài học” với “Chưa bắt đầu”, “Tiến độ chưa có dữ liệu” hoặc lỗi tải.
- Mọi control có label; tên course đầy đủ có trong accessible name. Chuỗi dài wrap/
  clamp có cách đọc đủ; khi keyboard focus tên khóa có thể mở rộng, không cắt mất nút.

## CourseEntryDisclosure dự kiến

| Phần | Contract |
| --- | --- |
| Page sở hữu | isEntryOpen, draft title/description/joinCode, field errors, pending, submit callback và notice |
| Component sở hữu | Trigger, region id, refs và focus lifecycle; nhận open/onOpenChange từ page, không có open state thứ hai hoặc fetch/token/storage |
| Trigger | type=button, label theo role, aria-expanded và aria-controls; thấy trong viewport đầu |
| Panel | Region có label, mặc định hidden; hidden không còn trong layout/Tab order; vẫn giữ draft |
| Open | Một lần kích hoạt; focus input đầu. Không gửi request |
| Close | Một lần kích hoạt/Escape trong panel; giữ draft/error, trả focus trigger khi cần. Không gửi request |
| Sending | Ref lock trước request, fields/submit disabled; trigger đóng còn dùng được; write không được coi đã hủy vì đóng panel |
| Success | Chỉ khi server xác nhận: clear trường đã gửi, upsert đúng một course, thu gọn; notice/mã/progress vẫn đọc được ngoài panel |
| Error | Draft nguyên vẹn, thông báo lỗi rõ; nếu panel đóng thì có hướng mở lại, không auto focus vào phần hidden |

Không dùng aria-modal/trap focus cho disclosure inline. Nếu đang gửi mà người dùng đã
đưa focus ra vùng khác, success không cướp focus; chỉ trả trigger khi panel chứa focus
sắp đóng. Không dùng raw maxLength8 chặn normalization join; rule business giữ nguyên.

## Học tiếp và sao chép

- Bắt đầu/tiếp tục gọi detail hiện có, chọn first incomplete theo thứ tự server; không
  thêm “bài học gần nhất”. Ôn tập/view/management giữ URL và role action như contract HTTP.
- Pending khóa gửi lặp cùng course; chọn course khác làm ý định mới nhất thắng. Abort/
  response cũ/unmount không navigate hoặc thay notice đang phục vụ tác vụ mới.
- Lỗi học tiếp có thông báo dễ thấy và “Thử lại” đúng course; không giấu trong form thu
  gọn. Thử lại vẫn phải kiểm quyền qua request như trước.
- Copy chỉ báo success sau clipboard resolved. Nếu bị từ chối, đưa mã thật và hướng
  sao chép thủ công; không thay bằng chuỗi giả hoặc lỗi chung mất mã.

## ADMIN editor và confirmation

- Article hai tầng, đầy đủ email/status/date/name/role/counts/actions. Email read-only;
  role chỉ hai managed roles. Pending lock chung theo row, không cho save và toggle
  cùng row chạy song song; không khóa search hoặc row khác.
- Name/role draft khác với effective record; GET/toggle không clear dirty. Save lỗi,
  kể cả 409, giữ bản nhập; không hiển thị draft role như quyền đã áp dụng.
- Confirmation role hiển thị target email + cũ/mới; active nêu rõ khóa hoặc mở và tác
  động. Dùng lại ConfirmDialog; không có thuật ngữ kỹ thuật nội bộ trong lời nhắc.
- Hủy/Escape không PATCH. Confirm chụp target/payload, đặt lock đồng bộ trước write;
  response chỉ cập nhật sau server success, không có optimistic role/active.
- Success reconcile query/page hiện hành với GET có guard; clamp và GET lại trang
  hợp lệ nếu shrink. Phân biệt state đang chỉnh trang với global empty.
- Save/toggle thành công nhưng refresh thất bại: notice phân biệt hai kết quả, giữ
  record đã xác nhận và dirty khác, retry chỉ GET. Không auto gửi lại write.
- Query đổi bắt đầu page1; debounce250ms và cancellation/sequence được giữ. Total luôn
  gắn query/snapshot; dữ liệu cũ được đánh dấu, không trình bày total cũ là của query mới.

## Ma trận phản hồi

| Trạng thái | Nội dung / hành động | Không được làm |
| --- | --- | --- |
| Initial loading | Status tải và chưa có số lượng xác nhận | Hiện 0 tài khoản/bài/progress như kết quả thật |
| Refreshing | Giữ snapshot cũ nếu có + nhãn đang cập nhật/kết quả trước | Gán snapshot cũ cho query mới hoặc overwrite dirty |
| Loaded empty | Phân biệt không có khóa/tài khoản; hướng create/join phù hợp role | Trộn với lỗi tải |
| No search match | Nhắc điều chỉnh từ khóa/filter; số phù hợp được xác nhận | Nhầm với chưa từng có dữ liệu |
| Read failure | ErrorState + retry GET, old snapshot có nhãn nếu giữ | Tự logout vì network/5xx hoặc fake empty |
| Mutation pending | Row/task disabled, status xử lý, lock đồng bộ | Gửi lặp hoặc khóa toàn màn hình không cần thiết |
| Mutation failure | Error/field error, giữ draft và effective data | Xóa nhập liệu hoặc báo success |
| Mutation success | Server-confirmed data, notice ngoài panel; refresh theo generation | Refetch âm thầm xóa success |
| Success + refresh failure | Giữ success, nói chưa làm mới được và retry GET | Báo write thất bại rồi gửi lại PATCH/POST |
| Session/permission error | Dùng API/session guard và recovery hiện có | Cấp quyền bằng CSS, cache hoặc dữ liệu cũ |

Feedback giữ role=status cho tiến trình/thành công, role=alert cho lỗi theo component
hiện có. Không lặp cùng một lỗi bằng nhiều live region cùng lúc. Tab order theo DOM,
focus-visible rõ; dialog ADMIN giữ modal focus/cancel/return thực tế. Native focus và
readability cần nghiệm thu browser, không chỉ assertions jsdom.

## Ranh giới tái sử dụng

Giữ Button, Feedback, ConfirmDialog và API services như hiện tại. Page truyền class/
props đã được hỗ trợ; không sửa global semantics để phục vụ riêng dashboard. Toàn bộ
CSS mới phải có route marker ancestor; shared selectors account/workspace và các root
tokens không thay đổi. Source dự kiến và chỉ tiêu geometry nằm trong [plan](../plan.md);
ma trận nghiệm thu nằm trong [quickstart](../quickstart.md).
