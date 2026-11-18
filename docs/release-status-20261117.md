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
- 021 chat:8/9; model3.1Flash-Lite đã trả2 câu hỏi qua UI,1 trích dẫn hợp lệ mỗi lượt. T006 native Send/Cancel/Clear đã đạt ở1280×800 và1440×900; T008 remote handoff còn mở.
- 022:5/5 nghiệm thu local lịch sử:232 frontend tests,85 backend,21 quiz runner,25 CI helpers,102 HTTP/database operations,15 role/browser records. Docker từng gặp lỗi môi trường rồi đã phục hồi; trạng thái runtime mới ghi ở phần môi trường bên dưới.
- 023:5/6; bộ deploy opt-in, lỗi email bootstrap ADMIN đã sửa; config tests, Caddy parser và stack web riêng/ba role đã chạy thật. T005 còn phần VPS/DNS/TLS/renewal và staging của operator.
- 024: bản vá có mục tiêu cho6 package advisory, backend production audit hiện0; regression parser, backend/quiz và rebuilt Node24 integration có [bằng chứng riêng](../specs/024-runtime-security-patches/verification.md). Không phải chứng nhận không còn mọi lỗ hổng.

## Việc còn mở và điều kiện đóng

| Nơi giữ task | Trạng thái/điều kiện |
| --- | --- |
|008 T026 | Policy đã chặn xóa profile thử; không thử phương pháp khác. Chỉ đóng khi có cleanup proof hợp lệ và được phép. Không chặn chức năng LMS/public host |
|010 T016 | Historical provider acceptance chưa chạy; chức năng đã retired. Không cần cấp Client ID, không giả thành pass |
|012 T012 | Demo cũ chưa nghiệm thu4 action; không thay bằng2 đáp án chat. Không tự gửi tài liệu/email hoặc bật demo trên public host |
|021 T006 | ĐÃ ĐẠT: native Send/Cancel/Clear hai desktop sizes; xem native-controls-20261117.json. Không còn là task mở |
|021 T008 | Local handoff đã ghi, push/hosted exact SHA mới chưa có sau khi Git credential dialog bị hủy. Không bypass credentials hoặc tự merge |
|023 T005 | Local web build/health, Caddy parser và ba role đã đạt. Còn DNS/TLS/renewal, protected upload/mail/chat/recovery trên VPS staging do operator chọn |
|Public release | Review dependency/image advisories, quyền DB tối thiểu, proxy/IP-limiter shared budget, tải, monitoring, backup/restore thực, domain/secret ownership |

## Dependency audit trước deploy

Audit production backend2026-11-17 ban đầu phát hiện6 package advisory (3High/3Moderate), frontend0. Feature024 đã vá Multer2.5.0, Nodemailer10.1.4, PDF.js6.2.108 và cập nhật body-parser2.4.0, fast-uri3.1.9, qs6.17.1 theo range cha. Audit sau `npm ci`: **backend0/frontend0** tại thời điểm ghi nhận. Express/Prisma và dependency frontend không đổi.

PDF.js advisory có điều kiện viewer scripting, không phải exploit đã tái hiện ở đường text extraction của Lumina. PDF6 không còn đọc option `isEvalSupported`; đã bỏ option thừa, không giả nó là guard. PDF/text/Unicode/no-text/size/page/timeout và protected upload/quiz/auth được kiểm qua tests cùng Docker Node24. Có thêm lỗi gzip hỏng trả500 đã tái hiện và sửa thành JSON400 giới hạn đúng decoder errors. Không dùng `audit fix --force`, không thay schema/giảm guards. Audit0 chỉ có nghĩa không còn advisory được công cụ báo cho dependency production tại lúc kiểm, không chứng nhận bảo mật hoặc thay image/OS advisories.

## Môi trường và dữ liệu

Docker engine không kết nối được ở đầu lượt; operator đã mở lại Docker Desktop, agent mở lại Vite5173. Backend local được cập nhật có guard, cài lockfile bằng npm ci trong cùng container rồi restart để giữ private env; hash source khớp, backend/database identity xác minh lại. Hai origin5173/8080 hiện health200, OAuth cũ404, boolean Gemini key/Free/chat và SMTP vẫn true. Readiness SMTP không chứng minh delivery; không gửi email mới. Không đọc/in giá trị secret hoặc recreate backend làm mất key.

Các volumes/restore fixtures của isolated test được giữ và liệt kê trong verification tương ứng; containers/network cleanup đã có ownership checks. Không xóa volumes, không đụng local8081 hoặc profile bị policy chặn. Không thu thập secret/browser profile/raw authenticated request để làm evidence.

## Cách deploy

Bạn đã chọn VPS Ubuntu. Làm theo [deploy-vps.md](deploy-vps.md); không có host/domain/tài nguyên trả phí được agent tạo. Chuyển **đúng commit local** bằng git archive nếu chưa push được, không clone main và tưởng đã có mọi bản sửa. Không có deployed URL hoặc hosted CI mới được dựng lên. Sau deploy staging, thực hiện toàn bộ acceptance trong guide trước khi công khai.

## Cập nhật lựa chọn miễn phí2026-11-18

Người dùng đổi sang gói Free. Feature025 bổ sung Supabase private Storage và Brevo HTTPS recovery, giữ local/Gmail SMTP mặc định và auth/role APIs. Xem [hướng dẫn deploy miễn phí](deploy-free.md), [bằng chứng025](../specs/025-free-hosting-adapters/verification.md). Local97backend/26quiz runner/29CI checks, Prisma validate/generate và rebuilt isolated103HTTP/database ops đạt. Provider contracts dùng fake transport; chưa có Supabase/Brevo/Render thật hoặc hosted CI mới. T008 của025 giữ mở cho cấu hình riêng và nghiệm thu thực tế, không thay bằng chứng lịch sử008. Hướng dẫn VPS phía trên trở thành phương án tùy chọn, không phải yêu cầu mua dịch vụ.
