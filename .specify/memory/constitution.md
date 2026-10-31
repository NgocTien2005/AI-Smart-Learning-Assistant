<!--
Sync Impact Report — comment tạm phục vụ review; bỏ trước khi commit.
Version change: scaffold chưa phê chuẩn → 1.0.0 (thiết lập lần đầu).
Modified principles: năm mục mẫu được thay bằng nguyên tắc Lumina I–V bên dưới.
Added sections: Ranh giới hệ thống và dữ liệu; Quy trình phát triển và cổng chất lượng;
Governance được điền với quy tắc sửa đổi và kiểm tra tuân thủ.
Removed sections: không; đã bỏ placeholder và ví dụ scaffold không áp dụng.
Template sync: không chỉnh template/managed skill; các lệnh đọc constitution lúc chạy.
Follow-up: không có giá trị hoặc quyết định còn để trống.
-->

# Lumina LMS Constitution

## Core Principles

### I. Contract nhất quán từ giao diện tới dữ liệu

- Mọi thay đổi PHẢI truy vết UI → request → route production → middleware →
  Prisma/nguồn tệp → response. Payload, validation, response và consumer PHẢI
  khớp nhau; không giả dữ liệu hoặc che lỗi cấu hình để UI trông hoạt động.
- API PHẢI giữ prefix `/api`, HTTP status có ý nghĩa, dạng lỗi `{ error: ... }`
  và mã lỗi/metadata mà consumer dùng. Input PHẢI được validate trước truy cập
  database; email phải được chuẩn hóa nhất quán bằng `trim().toLowerCase()`.
- Thay đổi breaking PHẢI nêu tác động, cập nhật consumer/test/tài liệu và làm
  rõ quyết định chưa xác định trước khi thực hiện phần phụ thuộc.
- Đánh giá backend PHẢI theo `backend/server.js` và `backend/src/app.js`.
  `backend/app.js` là harness auth legacy; test harness không chứng minh
  production handler đã đúng.

Lý do: một hành động học tập phải có ý nghĩa thống nhất ở UI, API và dữ liệu.

### II. Authorization trên server và từng tài nguyên

- Protected route PHẢI xác thực phiên và user hiện tại. Role authorization PHẢI
  được kiểm tra riêng với ownership/enrollment; ẩn nút hoặc đọc role từ cache/
  JWT không thay thế kiểm tra server.
- Từng thao tác PHẢI kiểm tra owner/enrollment/attempt owner áp dụng. Không suy
  ADMIN có quyền bypass nội dung khóa học. Mở/lưu/nộp quiz PHẢI kiểm tra lại
  quyền khóa học hiện tại, kể cả sau khi người dùng đã rời khóa.
- Thay đổi quyền PHẢI được kiểm chứng cả thành công và từ chối: token thiếu/
  sai/hết hạn, sai role, tài nguyên của người khác và dữ liệu không hợp lệ khi
  áp dụng. Từ chối không được để lại write trái phép.
- Response KHÔNG ĐƯỢC chứa password/hash, secret nội bộ hoặc stack trace; log
  không được chứa token/password/secret. Đăng ký công khai không được cấp ADMIN.

Lý do: quyền thuộc về thao tác trên tài nguyên, không thuộc về màn hình.

### III. Trải nghiệm học tập rõ ràng và có thể phục hồi

- Thiết kế PHẢI làm rõ hành động chính theo vai trò: ADMIN quản trị tài khoản;
  INSTRUCTOR quản lý nội dung/chấm bài được phép; STUDENT học, làm/nộp bài và
  xem tiến độ. PHẢI ưu tiên thành phần dùng chung khi đáp ứng nhu cầu; không
  tự thêm tính năng hoặc số liệu mà API chưa hỗ trợ.
- UI PHẢI phân biệt loading, empty, error/retry, success và disabled khi áp
  dụng; không biến dữ liệu thiếu thành số 0 đã xác nhận. Form PHẢI có label,
  keyboard interaction, focus nhìn thấy và thông báo lỗi accessible.
- Session PHẢI được xác minh qua `/api/auth/me`; lỗi mạng/5xx phải cho phục hồi,
  không tự coi là token hết hạn. Section/bài đang chọn PHẢI nằm trong URL;
  response đến trễ không được thay nội dung của tài nguyên mới.
- Sửa UI quiz PHẢI bảo toàn autosave/version và lựa chọn khi lưu lỗi. Luồng
  rời trong app phải flush draft hoặc cho ở lại/bỏ thay đổi chưa lưu rõ ràng.
  Browser unload chỉ cảnh báo, không hứa lưu mạng đã hoàn tất. Server vẫn
  quyết định quyền, chấm điểm và trạng thái attempt.
- Đổi layout PHẢI xem desktop hiện tại theo route/role khi môi trường cho phép;
  mobile chỉ mở rộng khi được yêu cầu. Không xem được phải ghi hạn chế, không
  coi ảnh cũ hoặc đọc CSS là bằng chứng giao diện hiện tại đã đạt.

### IV. Kết luận chất lượng gắn với bằng chứng

- Yêu cầu/acceptance criteria PHẢI liên kết tới task hoặc sửa lỗi cụ thể và
  cách kiểm chứng. Chọn test/check theo tác động; build xanh, checklist đã
  tick hoặc task đã đánh dấu không thay thế kiểm chứng hành vi.
- Frontend thay đổi PHẢI có test phù hợp, lint và build theo scripts hiện tại;
  backend thay đổi phải có regression và endpoint/authorization liên quan.
  Schema/dependency/Docker đổi PHẢI có kiểm tra tương ứng trong AGENTS.md.
- Integration PHẢI dùng môi trường kiểm thử phù hợp khi Docker stack healthy.
  Khi có database, thay backend phải kiểm tra endpoint liên quan và tối thiểu
  `/api/health`; liveness đó không chứng minh query database hoạt động.
- Bàn giao PHẢI phân biệt **đã đạt, thất bại, chưa chạy và lý do**, cùng loại
  bằng chứng. Mock, component test, legacy harness, ảnh cũ và code review
  không được trình bày như bằng chứng toàn hệ thống hiện tại đã chạy thành công.
- Markdown/skill thuần túy PHẢI được kiểm tra nội dung, cấu trúc, link và diff;
  không chạy toàn bộ app tests chỉ vì thêm tài liệu. KHÔNG ĐƯỢC tắt validation,
  authentication, lint hoặc security check để làm kiểm tra xanh.

### V. Toàn vẹn dữ liệu và thay đổi có kiểm soát

- Thay đổi PHẢI nhỏ, đúng yêu cầu, tìm nguyên nhân gốc và giữ công việc không
  liên quan của người dùng. Không refactor rộng hoặc thêm dependency khi
  platform/dependency hiện có đáp ứng rõ nhu cầu.
- Schema PHẢI được đối chiếu với quan hệ, migration và consumer. Thay schema
  PHẢI tạo migration mới; không sửa migration đã áp dụng hoặc generated client.
  PHẢI nêu tác động hàng cũ, constraint, foreign key và delete behavior;
  review SQL, validate, generate và kiểm tra status trên database đích phù hợp.
- KHÔNG ĐƯỢC reset/drop database, xóa volume hoặc dữ liệu khi chưa được yêu cầu
  rõ ràng. Công cụ đề nghị reset do drift không tự tạo quyền xóa dữ liệu.
  Query PHẢI giới hạn dữ liệu cần dùng và tránh N+1.
- Text tài liệu PHẢI tách khỏi nội dung nhập tay; thay/gỡ tài liệu phải vô hiệu
  nguồn cũ và cập nhật revision theo contract. Snapshot quiz cũ PHẢI giữ nguyên;
  không tự xử lý tài liệu lịch sử trong migration.
- KHÔNG ĐƯỢC đọc/in/commit secret hoặc gửi tài liệu/dữ liệu người dùng tới
  dịch vụ AI ngoài khi chưa có yêu cầu, cấu hình và đánh giá quyền riêng tư rõ.

## Ranh giới hệ thống và dữ liệu

- Lumina hiện có hai package độc lập: React/Vite ở frontend và Express/Prisma/
  PostgreSQL ở backend. PHẢI tái sử dụng ranh giới hiện có khi phù hợp; phiên
  bản/lệnh cụ thể lấy từ package, lockfile và AGENTS.md hiện tại.
- Assistant là tra cứu cục bộ; summary là **tóm tắt trích xuất**; quiz dùng mẫu
  câu giới hạn và có thể không tạo đủ câu. PDF chỉ trích lớp văn bản, không
  OCR. PHẢI mô tả đúng capability và trạng thái thiếu nguồn.
- OAuth, notifications, recommendations, analytics và AI ngoài không phải
  capability mặc định. Khi được yêu cầu mới, PHẢI đặc tả phạm vi và contract
  tương ứng trước triển khai; không đưa CTA giả hoạt động vào production.
- Docker Compose là môi trường tích hợp mặc định; backend container tự deploy
  migration lúc startup. Dependency/Dockerfile/schema/migration đổi PHẢI
  rebuild image và kiểm tra health/endpoint theo AGENTS.md.
- Mâu thuẫn tài liệu/code PHẢI ghi cả đường dẫn và mức đã kiểm chứng. Ví dụ,
  backlog cuối `README.md` còn gộp extraction/summary dù
  `backend/src/services/documentProcessing.js` và summary route trong
  `backend/src/routes/courses.js` đã có implementation. Không lấy mô tả cũ
  làm căn cứ khẳng định thiếu API. Xem khảo sát trong
  [development-workflow.md](../../docs/development-workflow.md), rồi đối chiếu
  source hiện tại; snapshot tài liệu không thay thế contract hay bằng chứng chạy.

## Quy trình phát triển và cổng chất lượng

1. PHẢI đọc [AGENTS.md](../../AGENTS.md), yêu cầu và luồng liên quan trước khi
   sửa. Giả định chưa rõ ảnh hưởng dữ liệu, API công khai, schema hoặc phạm vi
   PHẢI được làm rõ trước phần phụ thuộc; không hỏi lại thao tác thường đã giao.
2. Feature cần đặc tả PHẢI dùng các bước Spec Kit đang cài: constitution →
   specify → clarify → plan → checklist → tasks → analyze → implement → converge.
   Constitution dùng chung, không tạo lại mỗi feature. Lỗi nhỏ rõ phạm vi được
   dùng luồng tái hiện → nguyên nhân → sửa → kiểm chứng.
3. Spec PHẢI có nhu cầu, vai trò, phạm vi/ngoài phạm vi và acceptance criteria;
   plan phải có quyết định kỹ thuật, tác động hệ thống/dữ liệu và kiểm chứng;
   tasks phải có ID, phụ thuộc, file và cách xác minh. PHẢI giữ truy vết
   yêu cầu → user story/acceptance scenario → task → bằng chứng.
4. Feature/artifact PHẢI lấy từ resolver/state của bản Spec Kit đang dùng,
   không suy từ Git branch. `lumina-*` chỉ bổ sung ngữ cảnh; không sửa trực tiếp
   skill/lệnh/template do công cụ quản lý để lách workflow.
5. Checklist kiểm tra chất lượng yêu cầu, không chứng nhận tests pass. Analyze
   PHẢI giữ read-only; converge bổ sung task theo giới hạn ghi chính thức,
   không tự sửa spec để hợp thức hóa code. PHẢI tôn trọng gate review/approval
   thực sự của công cụ và nêu nguồn khi gặp.
6. Trước bàn giao, PHẢI đối chiếu acceptance criteria với bằng chứng và kiểm tra
   diff. Chọn/chạy lệnh chi tiết theo AGENTS.md và
   [lumina-verify](../../.agents/skills/lumina-verify/SKILL.md). Thiếu điều kiện
   chạy phải ghi chưa chạy; không kết luận đạt khi tiêu chí thiếu bằng chứng.

## Governance

Constitution quy định nguyên tắc dùng chung cho spec, plan, tasks, thực thi
và review Lumina. AGENTS.md giữ hướng dẫn vận hành; code production, schema
và kiểm chứng là căn cứ hiện trạng. PHẢI ghi xung đột giữa các nguồn và làm rõ
quyết định cần thiết, không âm thầm chọn nguồn thuận tiện.

Sửa constitution PHẢI xuất phát từ thay đổi nguyên tắc được yêu cầu hoặc đã
thống nhất, nêu lý do và tác động tới artifacts đang hoạt động. Review PHẢI
đối chiếu nguyên tắc bị ảnh hưởng; vi phạm phải được ghi thành công việc xử lý,
không bỏ qua bằng checkbox hoặc pha loãng nguyên tắc cho khớp code.

Version dùng semantic versioning: MAJOR cho bỏ/định nghĩa lại nguyên tắc gây
không tương thích; MINOR cho nguyên tắc/mục mới hoặc mở rộng nghĩa vụ; PATCH
cho làm rõ câu chữ không đổi nghĩa vụ. PHẢI cập nhật ngày sửa đổi, ghi tác động
đồng bộ trong comment review tạm theo lệnh constitution và bỏ trước khi commit.
Lần đầu này là 1.0.0; không sửa template hoặc tự tạo feature tiếp theo.

**Version**: 1.0.0 | **Ratified**: 2026-10-28 | **Last Amended**: 2026-10-28
