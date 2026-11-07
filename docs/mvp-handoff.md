# Bàn giao MVP Lumina LMS

Đối chiếu ngày **2026-11-07**, baseline `ef3cbf1c06a8fcdd5738252506671c3fb298b311`,
working tree sạch trước lượt này. Phạm vi là các feature 001–009 hiện có.
**Chưa hoàn tất nghiệm thu toàn bộ: feature 008 còn T023 và T026.** Không có
thay đổi production, schema, migration, dependency hoặc giao diện trong lượt
đối chiếu này. Không có lỗi production mới được tái hiện để sửa.

## Chức năng và bằng chứng

| Feature | Phạm vi đã triển khai | Task | Bằng chứng và giới hạn |
| --- | --- | --- | --- |
| [001](../specs/001-improve-role-dashboards/verification.md) | Dashboard theo vai trò, trạng thái và điều hướng | 25/25 | Nghiệm thu production HTTP/DB và desktop ngày 2026-11-02 |
| [002](../specs/002-improve-course-workspace/verification.md) | Khóa học/bài học, URL, tài liệu và tiến độ | 22/22 | Owner/enrollment, upload/download, lịch sử và desktop |
| [003](../specs/003-improve-assignment-workspace/verification.md) | Giao/nộp/chấm bài và hạn nộp | 25/25 | HTTP/DB production, thành công/từ chối và browser |
| [004](../specs/004-improve-practice-quiz/verification.md) | Quiz, snapshot, draft/version, lưu/tiếp tục/nộp | 25/25 | Quyền từng thao tác, production router, HTTP/DB và browser |
| [005](../specs/005-improve-document-study/verification.md) | Tra cứu cục bộ, PDF text-layer và tóm tắt trích xuất | 28/28 | Nguồn/revision, extraction, HTTP/DB và desktop; không OCR/AI ngoài |
| [006](../specs/006-improve-account-workspace/verification.md) | Tài khoản, đổi mật khẩu, thu hồi phiên | 25/25 | Ba vai trò, recovery, phiên cũ và browser |
| [007](../specs/007-improve-admin-workspace/verification.md) | Quản trị tài khoản, role, khóa/mở và tìm kiếm | 25/25 | Quyền server, pending/races và browser; ADMIN không mặc định bypass nội dung khóa học |
| [008](../specs/008-improve-auth-entry/verification.md) | Auth hai cột, email/mật khẩu, forgot/reset và recovery | **24/26** | Component, production HTTP/DB và desktop đã có; email-origin acceptance còn một phần, cleanup bị chặn |
| [009](../specs/009-setup-quality-ci/verification.md) | Frontend/backend/HTTP-database CI riêng biệt | **18/18** | Workflow/local/Linux checks và actual hosted push đã pass |

[Nghiệm thu 001–007](acceptance-20261102.md) ghi 175 task, 187 FR/SC và 144
acceptance scenario, cùng ma trận riêng trong từng feature. Những đoạn đầu báo
cáo feature ghi “incomplete” có ngày trước đợt nghiệm thu là lịch sử; đọc cùng
phần nghiệm thu được bổ sung sau đó. Task và bằng chứng không chuyển vào CI.
OAuth, OCR, notifications, recommendations, analytics và AI ngoài vẫn nằm ngoài
phạm vi này.

## Kiểm tra đã chạy và kiểm tra của lượt này

| Loại bằng chứng | Kết quả | Điều được chứng minh |
| --- | --- | --- |
| Frontend local trước đó | PASS: 5 service + 211 component, lint/build | Verification 008/009; không phải lượt chạy mới hôm nay |
| Backend local trước đó | PASS: full 38 và quiz regression | Legacy auth harness được phân biệt với production router/HTTP |
| Integration local trước đó | PASS trên stack riêng, cleanup đúng tài khoản | HTTP và actual backend database đã đối chiếu; không chỉ đổi URL |
| Desktop trước đó | PASS theo phạm vi, 1280×800/1440×900 | Browser thật và fixtures ghi riêng; không phải quan sát UI mới hôm nay |
| [Hosted push CI `42061961868`](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42061961868) | **PASS cả frontend/backend/integration** tại `ef3cbf1` | Actual GitHub-hosted run; trạng thái được query lại trong lượt này |
| Audit hiện tại | PASS resolver, recount, source provenance và đối chiếu tài liệu | Source không đổi so với revision hosted đã pass; 7 file auth khớp manifest mới nhất |
| SMTP/integration/browser local mới | **CHƯA CHẠY** | Docker daemon không truy cập được; không suy readiness hoặc khởi động/recreate stack |

Manifest 001–007 cũ khớp byte 103/108 file được kiểm tra. Bốn file auth/test đã
được thay bằng feature 008 có manifest mới; một fixture PDF lịch sử không khớp
manifest cũ. Fixture hiện tại không phải thay đổi mới của lượt này và được bao
phủ bởi integration của hosted revision nêu trên. Không dùng manifest cũ để
khẳng định cả 108 file vẫn giống hệt. Hashes chỉ là provenance, không thay bằng
chứng runtime hoặc mailbox.

JSON audit, baseline, command/cwd/exit và kiểm tra link/diff được lưu cục bộ
trong `.artifacts/mvp-handoff-20261107/`, bị Git ignore. Evidence cũ vẫn nằm
trong các thư mục ignored đã dẫn ở verification từng feature. Clone repository
mới không tự có các tệp này; artifact hosted có thời hạn 7 ngày theo workflow.

## T023 — phần còn thiếu và cách tiếp tục an toàn

Nhật ký ngày 2026-11-05 ghi một forgot request qua UI trên project riêng
`lumina-acceptance-smtp-20261103`, HTTP `http://127.0.0.1:8084/api`, database
`lumina_acceptance`. Recipient đã được người dùng chỉ định và cấp tổng quyền
tối đa **3 email**; **1 lượt đã reserved/submitted, còn tối đa 2 lượt**. Không
ghi địa chỉ riêng hoặc credentials vào báo cáo. Không gửi email mới trong audit.

Đã có: generic confirmation và reset-pending booleans; user báo reset, cùng
HTTP độc lập chứng minh mật khẩu/phiên ban đầu bị từ chối. Một tài khoản kỹ
thuật riêng chứng minh reset200 → dùng lại token400, login mới200 và không
thay đổi state khi từ chối; đây là **DB fixture**, đã dọn về 0.

Chưa có kết quả đủ rõ cho mailbox receipt, login mới trên chính tài khoản của
lượt email và POST reuse của chính link nhận từ email. Người dùng đã xác nhận
chỉ mở trang nhập mật khẩu ở bước dùng lại link. ResetPasswordPage chỉ kiểm
định dạng khi mở; `POST /api/auth/reset-password` mới kiểm single use. Không
có bằng chứng reset lần hai được chấp nhận, nên không đổi UI/API để che form.

Để tiếp tục, cần Docker sẵn sàng và xác minh lại đúng project/container,
loopback port, network/volume cùng actual backend database bằng
`backend/scripts/integration-target.mjs` **trước mọi mutation**. SMTP config
chỉ kiểm boolean bằng service hiện có; không đọc environment/credentials.
Không chạy lại launcher với secret mới trên project cũ, không phục hồi mật
khẩu/token từ profile hoặc khởi động lại controller đã mất credentials.

Người dùng tự xem email/link, nhập mật khẩu và báo riêng từng kết quả. Khi cần
lượt mới phải kiểm tra ngân sách và quyền gửi trước; sau reset cần login mới,
từ chối mật khẩu/phiên cũ và submit lại link ngay khi còn hạn. Link quá hạn
30 phút không đủ phân biệt “đã dùng” với “hết hạn”. Không replay password
mutation khi kết quả chưa chắc chắn. Generic200, SMTP accepted và fixture không
được dùng để đóng T023; task vẫn **OPEN/PARTIAL**.

## Dữ liệu thử và cleanup

| Tài nguyên | Trạng thái đã biết | Hành động của lượt này |
| --- | --- | --- |
| Dữ liệu nghiệm thu 001–007 | Registry/cleanup cũ ghi 0 sau khi dọn đúng owner/ID | Không tạo/dọn lại |
| Integration CI | Run trước ghi 0 owned users; named volumes không bị down -v | Không thao tác Docker local |
| SMTP test user ID 1 | Còn giữ ở lần quan sát 2026-11-05 cho nghiệm thu email | DB hôm nay chưa xác minh; không reset/xóa |
| Technical used-token fixture user ID 2 | Đã dọn, 0 fixture users theo evidence ngày 2026-11-05 | Không tạo lại |
| `.artifacts/auth-entry-20261102/chrome` | Directory còn tồn tại; T026 OPEN | Chỉ kiểm tra tồn tại, không đọc nội dung/xóa |
| `.artifacts/auth-visual-fix-20261103/chrome` | Directory còn tồn tại; cleanup limitation ghi riêng | Chỉ kiểm tra tồn tại, không đọc nội dung/xóa |

Automatic approval review trước đó đã từ chối scoped deletion với
`blocked by policy`. Không thử lại bằng đường khác. Không kết luận các profile
đã được scan secrets hoặc dọn xong. Không đụng database/volume local8081,
reset/drop, xóa volume, gửi thêm email hoặc truy cập mailbox trong lượt này.

## Điều kiện bàn giao tiếp theo

Giữ T023/T026 trong 008; không tạo convergence task trùng blocker. Chỉ đóng
khi có đủ bằng chứng tương ứng. 009 hoàn thành phạm vi CI, không chứng nhận
mailbox delivery hay production readiness. [Checklist trước triển khai công
khai](production-readiness.md) ghi riêng những quyết định/vận hành chưa kiểm
chứng; chưa tạo feature mới hoặc thay production config cho những phần đó.
