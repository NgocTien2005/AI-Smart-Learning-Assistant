# Bàn giao MVP Lumina LMS

Đối chiếu ngày **2026-11-07**, baseline `ef3cbf1c06a8fcdd5738252506671c3fb298b311`,
working tree sạch trước lượt này. Phạm vi là các feature 001–009 hiện có.
**Cập nhật sau xác nhận người dùng: 008 đạt 25/26, T023 đã đóng; T026 còn mở.** Không có
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
| [008](../specs/008-improve-auth-entry/verification.md) | Auth hai cột, email/mật khẩu, forgot/reset và recovery | **25/26** | Email/reset thật được người dùng xác nhận; HTTP revocation độc lập đã có; T026 cleanup bị chặn |
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

## T023 — đã đóng theo xác nhận UI của người dùng

Nhật ký ngày 2026-11-05 ghi một forgot request qua UI trên project riêng
`lumina-acceptance-smtp-20261103`, HTTP `http://127.0.0.1:8084/api`, database
`lumina_acceptance`. Recipient đã được người dùng chỉ định và cấp tổng quyền
tối đa **3 email**; ledger agent ghi **1 lượt reserved/submitted**. Lượt xác
nhận này không gửi thêm. Người dùng không báo số lần tự gửi bổ sung, nên không
suy ngân sách còn lại cho lượt tương lai. Không ghi địa chỉ/credentials vào báo cáo.

Đã có: generic confirmation và reset-pending booleans; user báo reset, cùng
HTTP độc lập chứng minh mật khẩu/phiên ban đầu bị từ chối. Một tài khoản kỹ
thuật riêng chứng minh reset200 → dùng lại token400, login mới200 và không
thay đổi state khi từ chối; đây là **DB fixture**, đã dọn về 0.

Sau yêu cầu nêu rõ bốn kết quả, người dùng trả lời “Thử hết rồi ok r”, xác nhận:

1. Đã nhận email khôi phục thật.
2. Reset thành công từ link trong email.
3. Đăng nhập bằng mật khẩu mới thành công.
4. Gửi lại form bằng link đã dùng bị từ chối.

Đây là **user attestation của thao tác mailbox/UI riêng**, không phải agent
quan sát mailbox hoặc SMTP end-to-end tự động. Kết hợp bằng chứng độc lập về
mật khẩu/phiên cũ401, **T023 đã đóng**. Không tự suy timestamp, HTTP status hay
nguyên nhân chính xác của lần từ chối từ lời xác nhận. Fixture kỹ thuật vẫn
được ghi riêng. Xem [record trong 008](../specs/008-improve-auth-entry/verification.md#user-confirmed-email-acceptance--2026-11-07).

Trước bất kỳ lượt thử/mutation mới nào, cần Docker sẵn sàng và xác minh đúng project/container,
loopback port, network/volume cùng actual backend database bằng
`backend/scripts/integration-target.mjs` **trước mọi mutation**. SMTP config
chỉ kiểm boolean bằng service hiện có; không đọc environment/credentials.
Không chạy lại launcher với secret mới trên project cũ, không phục hồi mật
khẩu/token từ profile hoặc khởi động lại controller đã mất credentials.

Không có nhu cầu gửi lại hoặc replay reset để ghi bằng chứng. Docker local vẫn
không truy cập được ở probe xác nhận, nên không tuyên bố current readiness/DB
state hoặc cleanup tài khoản thử đã đạt. Không đọc secret, mailbox, password,
token hay reset URL. Generic200/SMTP accepted/fixture không thay cho xác nhận
mailbox của người dùng; không thay UI/API chỉ vì link cũ vẫn mở được form.

## Dữ liệu thử và cleanup

| Tài nguyên | Trạng thái đã biết | Hành động của lượt này |
| --- | --- | --- |
| Dữ liệu nghiệm thu 001–007 | Registry/cleanup cũ ghi 0 sau khi dọn đúng owner/ID | Không tạo/dọn lại |
| Integration CI | Run trước ghi 0 owned users; named volumes không bị down -v | Không thao tác Docker local |
| SMTP test user ID 1 | Còn giữ ở lần quan sát 2026-11-05; email acceptance nay user-confirmed | DB hôm nay chưa xác minh; không tự reset/xóa trong lượt xác nhận |
| Technical used-token fixture user ID 2 | Đã dọn, 0 fixture users theo evidence ngày 2026-11-05 | Không tạo lại |
| `.artifacts/auth-entry-20261102/chrome` | Directory còn tồn tại; T026 OPEN | Chỉ kiểm tra tồn tại, không đọc nội dung/xóa |
| `.artifacts/auth-visual-fix-20261103/chrome` | Directory còn tồn tại; cleanup limitation ghi riêng | Chỉ kiểm tra tồn tại, không đọc nội dung/xóa |

Automatic approval review trước đó đã từ chối scoped deletion với
`blocked by policy`. Không thử lại bằng đường khác. Không kết luận các profile
đã được scan secrets hoặc dọn xong. Không đụng database/volume local8081,
reset/drop, xóa volume, gửi thêm email hoặc truy cập mailbox trong lượt này.

## Điều kiện bàn giao tiếp theo

T023 đã đóng trong 008 theo bằng chứng được phân loại rõ; T026 vẫn mở và không
tạo convergence task trùng blocker. 009 hoàn thành phạm vi CI, không chứng nhận
mailbox delivery hay production readiness. [Checklist trước triển khai công
khai](production-readiness.md) ghi riêng những quyết định/vận hành chưa kiểm
chứng; chưa tạo feature mới hoặc thay production config cho những phần đó.
# Bổ sung sau bàn giao 001–009: Google và dev5173

2026-11-07: yêu cầu mới mở feature010 bằng script chính thức. Lỗi kết nối5173 đã tái hiện/sửa bằng API same-origin + Vite proxy + dev CORS override; bằng chứng sửa lỗi nằm trong008. Google chỉ đăng nhập tài khoản đã có và đã liên kết chủ động, không tự tạo/gộp theo email. [Verification010](../specs/010-add-google-sign-in/verification.md) và [hướng dẫn cấu hình](google-sign-in.md) ghi kiểm tra local/DB/UI; Google thật chưa cấu hình và T016 còn mở. Không thay trạng thái nghiệm thu lịch sử 001–009, T023 hoặc blocker cleanup T026. Không gửi thêm email thật trong lượt này.

## Bổ sung 2026-11-08 — dataset011 và cloud012

Dataset011 đã bổ sung development8080:18tài khoản tổng hợp,8khóa/48bài tiếng Việt,
26tài liệu hợp lệ,24bài tập cùng enrollment/progress/bài nộp/quiz nhiều trạng thái.
Script cũ dùng shared password và resetting upsert đã được thay bằng target guard,
create-only transaction/ownership registry/dry-run và console riêng cấp access.
5tài khoản có sẵn giữ nguyên thông tin được đối chiếu; chạy lại không đổi dữ liệu.
Xem [demo guide](demo-data.md) và [verification011](../specs/011-seed-complete-demo/verification.md).

Cloud012 là phần mới được người dùng cho phép: Gemini Free, ngân sách0, chỉ nguồn
demo tổng hợp nguyên bản và câu hỏi mẫu. API/panel riêng, không thay công cụ cục bộ,
không ghi quiz/history, không gửi dữ liệu thật; no paid fallback/retry. Full local
checks và isolated/desktop disabled-state có evidence; chưa có key/real-model
acceptance thì012T012 vẫn OPEN. [Cấu hình riêng](demo-cloud-ai.md),
[verification012](../specs/012-demo-cloud-assistant/verification.md).

Google010T016 vẫn cần cấu hình/nghiệm thu provider thật.008T023 giữ bằng chứng
người dùng đã xác nhận; không tự gửi email thêm hoặc suy ngân sách gửi cũ.
008T026 profile cleanup bị policy chặn vẫn OPEN, không retry qua cách khác.
Không gọi toàn bộ app hoàn tất hoặc production-ready; không deploy/PR/merge.
