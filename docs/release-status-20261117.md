# Trạng thái hoàn thiện và bàn giao2026-11-17

Ứng dụng có implementation và bằng chứng cho các luồng LMS ba vai trò; chưa thể nói mọi nghiệm thu hoặc production readiness đều hoàn tất. Không dùng số checkbox thay bằng chứng. [System verification2026-11-16](system-verification-20261116.md) ghi package gates, isolated LMS/dataset và role UI; [feature022](../specs/022-remove-google-auth/verification.md) ghi bản gỡ OAuth; [feature021](../specs/021-gemini-lesson-chat/verification.md) ghi chat model thật.

## Phần đã có bằng chứng

- 001–007:175/175 task lịch sử, auth/dashboard/course/lesson/doc/progress/assignment/grading/quiz/account/admin có regression và integration; không tự coi mọi trường hợp trình duyệt là đã chạy hôm nay.
- 008:25/26; T023 email/reset thực do người dùng xác nhận, giữ nguyên lịch sử. Không có email mới nào được gửi trong lượt hoàn thiện này.
- 009:18/18 tại evidence gốc; CI được viết và có hosted runs lịch sử. Các SHA local mới cần hosted run riêng.
- 010 OAuth: đã **ngừng hỗ trợ** bởi022. T016 chưa nghiệm thu provider thật và không được tick thành pass; không còn là chức năng cần cấu hình cho bản hiện tại.
- 011 dataset:16/16;18 synthetic users/8courses/48lessons/26docs/24assignments trong evidence lịch sử. Không seed hoặc xóa dữ liệu mặc định trong lượt này, không đưa dataset/password demo lên public.
- 012 demo hữu hạn:12/13, T012 chưa nghiệm thu4 action thật; tách biệt với chat mới. UI dùng chat021; web override tắt marker demo. Không chạy lại provider chỉ để đổi checkbox của demo cũ.
- 013–020: các task portfolio/architecture/security/tests/UI/local-AI/operations/docs đã có verification theo phạm vi gốc; không phải chứng nhận bảo mật hay triển khai public.
- 021 chat:7/9 tại đầu lượt này; model3.1Flash-Lite đã trả2 câu hỏi qua UI,1 trích dẫn hợp lệ mỗi lượt. Sửa transport503 và schema quiz lẫn chat, không mock/tự retry. T006/T008 còn mở như bảng bên dưới.
- 022:5/5 nghiệm thu local:232 frontend tests,85 backend,21 quiz runner,25 CI helpers,102 HTTP/database operations,15 role/browser records; sau đó Docker Desktop gặp lỗi môi trường, không trình bày checkpoint healthy như trạng thái hiện tại.
- 023: thêm bộ deploy opt-in, sửa lỗi email bootstrap ADMIN đã tái hiện; validation cấu hình và backend regression có evidence riêng. Chưa chạy VPS/Caddy/TLS thật.

## Việc còn mở và điều kiện đóng

| Nơi giữ task | Trạng thái/điều kiện |
| --- | --- |
|008 T026 | Policy đã chặn xóa profile thử; không thử phương pháp khác. Chỉ đóng khi có cleanup proof hợp lệ và được phép. Không chặn chức năng LMS/public host |
|010 T016 | Historical provider acceptance chưa chạy; chức năng đã retired. Không cần cấp Client ID, không giả thành pass |
|012 T012 | Demo cũ chưa nghiệm thu4 action; không thay bằng2 đáp án chat. Không tự gửi tài liệu/email hoặc bật demo trên public host |
|021 T006 | Còn enabled native Cancel/Clear ở hai desktop sizes; cần Docker runtime hoạt động, chọn nguồn tổng hợp và kiểm thao tác thật. Component tests không thay thế quan sát này |
|021 T008 | Handoff/remote theo dependencyT006; push/hosted exact SHA mới chưa có sau khi Git credential dialog bị hủy. Không bypass credentials hoặc tự merge |
|023 T005 | Build/health stack web mới, Caddy parser, DNS/TLS/renewal, quyền ba role, protected upload, optional mail/chat, recovery trên staging do operator chọn |
|Public release | Review dependency/image advisories, quyền DB tối thiểu, proxy/IP-limiter shared budget, tải, monitoring, backup/restore thực, domain/secret ownership |

## Dependency audit trước deploy

Audit production backend2026-11-17 phát hiện6 package advisory (3High/3Moderate), frontend0. Các package được báo gồmbody-parser,fast-uri,multer,nodemailer,pdfjs-dist,qs. Đây là dependency-level findings, không phải bằng chứng exploit đã chạy vào Lumina. PDF.js advisory có điều kiện viewer scripting; backend hiện trích text với isEvalSupported=false, không render scripting viewer, nhưng vẫn phải review/cập nhật dependency thay vì coi audit là sạch.

Remediation được tách khỏi bộ config, không tự `npm audit fix --force` hoặc nâng hàng loạt. Xem báo cáo kiểm chứng dependency bổ sung khi có; cho đến khi có lockfile/bản vá và integration đã kiểm, **không coi release này đã qua cổng dependency security**.

## Môi trường và dữ liệu

Docker Linux engine pipe chưa kết nối được ở đầu lượt; lần trước start/restart Desktop và Windows service thất bại vì timeout/quyền OS. Vite có thể phục vụ UI nhưng API502 nếu8080 không hoạt động. Không xóa volume để sửa lỗi này. Cần khôi phục Docker Desktop/service bằng quyền máy, sau đó kiểm health và actual backend database identity; giữ env Gemini riêng, không recreate backend làm mất key.

Các volumes/restore fixtures của isolated test được giữ và liệt kê trong verification tương ứng; containers/network cleanup đã có ownership checks. Không xóa volumes, không đụng local8081 hoặc profile bị policy chặn. Không thu thập secret/browser profile/raw authenticated request để làm evidence.

## Cách deploy

Bạn đã chọn VPS Ubuntu. Làm theo [deploy-vps.md](deploy-vps.md); không có host/domain/tài nguyên trả phí được agent tạo. Chuyển **đúng commit local** bằng git archive nếu chưa push được, không clone main và tưởng đã có mọi bản sửa. Không có deployed URL hoặc hosted CI mới được dựng lên. Sau deploy staging, thực hiện toàn bộ acceptance trong guide trước khi công khai.
