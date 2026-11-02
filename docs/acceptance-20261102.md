# Nghiệm thu và ổn định Lumina 001–007 — 2026-11-02

Đạt phạm vi nghiệm thu LMS 001–007 trên **stack kiểm thử riêng**. 32 task nghiệm thu còn mở đã được đối chiếu và đóng trong đúng feature; tổng 175/175 task. Không tạo feature mới, không commit/push/PR/merge/deploy. Đây không phải chứng nhận sẵn sàng triển khai công khai.

## Môi trường và quyền

Baseline HEAD `c55d0054c1ffc029b5f65f0713034a273fdbfdc3`, working tree sạch; [baseline](../.artifacts/acceptance-20261102/baseline.json) lưu 223 hashes. Specify CLI 1.2.3/constitution 1.0.0; resolver chính thức và no-persist cho từng feature, active state vẫn007; không suy từ branch.

Compose **lumina-acceptance-20261102**, HTTP **http://127.0.0.1:8082/api**, DB/user **lumina_acceptance**, volumes/network có prefix project; DB không publish host port. [Môi trường trước](../.artifacts/acceptance-20261102/environment-before.json), [môi trường cuối](../.artifacts/acceptance-20261102/environment-final.json). Đã so mount source khác hoàn toàn volume local `ai-smart-learning-assistant_postgres_data`. Harness còn query read-only qua Prisma backend để xác nhận đúng database và địa chỉ server trước provisioning/cleanup.

Browser Chrome 156.0.8078.76 thật, headless với profile riêng và context riêng từng role; 1280×800/1440×900, zoom mặc định 100%, deviceScaleFactor1/visualViewport.scale1. Fonts ready trước bounds và ảnh cuối. Runtime là production app+PostgreSQL thật, không mock response. Trì hoãn **delivery của response thật** và browser Network blocking dùng để tái hiện pending/races/network error. Component Vitest/jsdom và DB fixture legacy được ghi riêng.

Orca restart làm mất controller và credentials thử chỉ có trong RAM. Đã restart đúng container IDs cũ, không recreate DB/backend hoặc đọc environment secret; rotate credentials chỉ của owned test IDs 5/7/8 để nối tiếp, ID 38 phục vụ cleanup. Không đọc credentials/token/cookie storage của browser hoặc người dùng. Stack local 8081 không có business mutation trong đợt này; quyền demo 28 trước đây không được dùng lại.

## Lỗi đã sửa và file chính

| Phần | Nguyên nhân / thay đổi | Bằng chứng |
| --- | --- | --- |
| Dashboard typography | Inter 700 bị thiếu trong font request; thêm 700 vào font hiện có tại frontend/src/App.css | Browser font-match trước 600/sau 700; sáu fold/bounds role×viewport |
| Local lookup header | Legacy 40×40 icon rule đè text eyebrow; override scoped trong frontend/src/components/DocumentStudyPanels.css | Ảnh trước, scrollHeight84/box40; bốn geometry checks+ảnh fixed-005 sau sửa |
| Quiz-history test gián đoạn | Test đọc score khi vùng history đã mount nhưng GET chưa render; await row và giữ GET ở trạng thái delayed rõ ràng | Full failed 183/184 giữ nguyên; hai full suite sau sửa 5+184 PASS |
| Filtered backend quiz test | Global teardown đóng server chưa chạy khi auth test bị lọc | Chuyển lifecycle vào chính auth test; full 38 PASS và production quiz case PASS |
| Integration safety | Harness từng hard-code localDB/project; thêm integration-target.mjs, target identity/port/network/volume/health/backend-DB checks và SQL stdin | Guard tests + integration real; thiếu/mismatch target bị từ chối trước write |
| PDF fixture | Dữ liệu giả header PDF không hợp lệ không phải ca upload thành công | Shared valid PDF fixture; NO_TEXT success riêng, corrupt400/CORRUPT_DOCUMENT riêng; không nuốt parser error |
| Documentation | README backlog extraction/summary và frontend README src/data không đúng implementation | README.md/frontend/README.md sửa; local text-layer/extractive capabilities xác nhận source+runtime |

Thêm compose.acceptance.yaml, docs/acceptance-testing.md, fixtures/pdf.mjs và integrationTarget.test.js. Không đổi production backend/routes/auth/session/schema/migration/dependency/lockfile. Artifacts từng feature chỉ cập nhật Status, verification, ma trận CSV và marker task có bằng chứng; plan/requirements/checklists/managed skills/constitution giữ nguyên. [Source integrity](../.artifacts/acceptance-20261102/source-integrity.json). [Danh s?ch file thay ??i](../.artifacts/acceptance-20261102/changed-files.json).

## Kết quả kiểm tra

| Kiểm tra | Kết quả cuối | Log / giới hạn |
| --- | --- | --- |
| Frontend npm test | PASS 5 service+184 component | [full final](../.artifacts/acceptance-20261102/frontend-controlled-history-final.log); failed full suite được giữ ở [lượt trước](../.artifacts/acceptance-20261102/frontend-after-header-fix.log) |
| Frontend npm run lint / build | PASS/PASS | [lint](../.artifacts/acceptance-20261102/frontend-lint-controlled-final.log), [build](../.artifacts/acceptance-20261102/frontend-build-stabilized.log) |
| Backend npm test | PASS 38 | [full](../.artifacts/acceptance-20261102/backend-complete-final.log); auth harness legacy được phân biệt production HTTP |
| Backend quiz regression | PASS named production handler test | [quiz](../.artifacts/acceptance-20261102/backend-quiz-target-final.log);8 runner entries bao gồm wrapper files, không phải 8 quiz cases |
| npm run test:integration | PASS production HTTP/PostgreSQL | [log](../.artifacts/acceptance-20261102/integration-isolation-confirmed.log), [method/path/status+IDs+cleanup0](../.artifacts/acceptance-20261102/integration-isolation-confirmed-http.json) |
| Docker/current desktop | PASS health/DB reads/writes; hai viewport/roles theo API | [browser checks](../.artifacts/acceptance-20261102/browser-checks.json), [127screenshots](../.artifacts/acceptance-20261102/screenshots/), bounds JSON cùng thư mục evidence |
| Browser raw assertion ledger |277 PASS/280 records;3 historical failed harness assertions giữ lại | [Giải thích và corrected checks](../.artifacts/acceptance-20261102/harness-notes.json); không gọi 280/280 PASS |
| Public deploy/TLS/domain/CORS thật/SMTP delivery/backup-restore/load | CHƯA CHẠY | Ngoài đợt nghiệm thu feature; không thay bằng integration local |

[Commands/cwd/exit codes](../.artifacts/acceptance-20261102/commands.json) và typed evidence giúp phân biệt failure cũ, sửa harness, component, source và live. Không dùng một isolated passing test che full suite fail. Lỗi quiz-history nay có nguyên nhân test race đã tái hiện và regression delayed; không tuyên bố đã sửa một production history bug chưa quan sát được.

## Ma trận truy vết và task

CSV của mỗi feature có từng hàng FR, US/AC và SC, nối tới task và evidence. Tổng136 FR+144 AC+51 SC=331 hàng; mapping kế thừa artifacts hiện có, không tạo acceptance ID mới.

| Feature / FR / US-AC / SC | Task đóng trong đợt này | Evidence chính / kết quả |
| --- | --- | --- |
| [001-improve-role-dashboards](../specs/001-improve-role-dashboards/verification.md#acceptance-continuation--2026-11-02) —22 FR/32 AC/9 SC | T021/T022/T024/T025 | B001+A-FE+H-INT; PASS; [63hàng](../specs/001-improve-role-dashboards/acceptance-20261102.csv) |
| [002-improve-course-workspace](../specs/002-improve-course-workspace/verification.md#acceptance-continuation--2026-11-02) —17 FR/19 AC/6 SC | T018/T019/T021/T022 | B002+A-FE+H-INT; PASS; [42hàng](../specs/002-improve-course-workspace/acceptance-20261102.csv) |
| [003-improve-assignment-workspace](../specs/003-improve-assignment-workspace/verification.md#acceptance-continuation--2026-11-02) —22 FR/21 AC/8 SC | T021/T022/T024/T025 | B003+A-FE+H-INT; PASS; [51hàng](../specs/003-improve-assignment-workspace/acceptance-20261102.csv) |
| [004-improve-practice-quiz](../specs/004-improve-practice-quiz/verification.md#acceptance-continuation--2026-11-02) —20 FR/17 AC/7 SC | T021/T022/T024/T025 | B004+A-FE+H-INT; PASS; [44hàng](../specs/004-improve-practice-quiz/acceptance-20261102.csv) |
| [005-improve-document-study](../specs/005-improve-document-study/verification.md#acceptance-continuation--2026-11-02) —18 FR/19 AC/7 SC | T021/T022/T024/T025/T027/T028 | B005+A-FE+H-INT; PASS; [44hàng](../specs/005-improve-document-study/acceptance-20261102.csv) |
| [006-improve-account-workspace](../specs/006-improve-account-workspace/verification.md#acceptance-continuation--2026-11-02) —19 FR/19 AC/7 SC | T021/T022/T024/T025 | B006+A-FE+H-INT; PASS; [45hàng](../specs/006-improve-account-workspace/acceptance-20261102.csv) |
| [007-improve-admin-workspace](../specs/007-improve-admin-workspace/verification.md#acceptance-continuation--2026-11-02) —18 FR/17 AC/7 SC | T019/T020/T022/T023/T024/T025 | B007+A-FE+H-INT; PASS; [42hàng](../specs/007-improve-admin-workspace/acceptance-20261102.csv) |

Các nhóm base acceptance và converge continuation giữ trong feature gốc, không chuyển/đóng hàng loạt theo build. [Closure ledger 32task](../.artifacts/acceptance-20261102/task-closures.json) lưu nguyên văn, lý do, bằng chứng từng ID. Trạng thái sau implement:001 25/25,002 22/22,003 25/25,004 25/25,005 28/28,006 25/25,007 25/25.

## Phạm vi live đã hoàn thành

- **001**: Ba vai trò, sáu tổ hợp viewport; danh sách/action trong fold, Inter 700 thực sự được tải. Create/join pending chỉ một write, disclosure/draft/notice, rejoin giữ progress, completed/progress filters và clipboard thành công/từ chối đã kiểm trên browser thật. ADMIN search/page/editor/confirm/revocation dùng bằng chứng 007 trong cùng stack và cùng implementation JS. Các biên thiếu metadata, lỗi503 và thứ tự response bổ sung bằng component tests, không gắn nhãn live.

- **002**: Hai vai trò ở cả hai viewport với title/course/content dài; selected ngoài filter vẫn đọc được, progress được server xác nhận, File object qua disclosure và upload thật, keyboard/Escape/focus. URL/deep link/refresh/back, protected text/PDF preview và download; quiz pending flush giữ URL trước acknowledgement. Races course/unmount và biên validation có component evidence; API owner/enrollment/ADMIN denial là production HTTP.

- **003**: Hai vai trò, nội dung requirements/submission20.000 ký tự và feedback5.000 ký tự, vùng dài focus/scroll được. Nộp/cập nhật/chấm thật, grade0, feedback-only/null sau hạn, refresh lỗi giữ draft, responseA không ghi đè lựa chọn/draftB, create pending không gửi lặp, native delete cancellation, deadline interval và dispatched focus event trong browser thật. Back/forward/refresh giữ selection; focus-event test không được mô tả là thao tác OS focus. Cross-resource/role/owner/enrollment denial qua server.

- **004**: Hai vai trò, lịch sử riêng, draft và kết quả 0, actualCount ít hơn requestedCount, không có key trước submit, snapshot giữ qua thay nguồn. Debounce/version/tuần tự, conflict409 thật với client thứ hai, GET retry lỗi/khôi phục, save failure và native stay/discard/focus, fast attempt/lesson và submit duplicate đã kiểm live. Long prompts/options do generator thật tại hai viewport. Legacy selectedAnswersNULL là fixture dữ liệu có chủ đích trong DB riêng; không phải luồng tạo mới thông thường. Browser unload chỉ có warning handler theo source/component review, không tuyên bố mạng đã lưu khi đóng browser.

- **005**: Hai vai trò ở hai viewport; local lookup history/send trong cả hai thứ tự response, latest50/dedup, draft mới không bị xóa, failed send/history recovery không tự replayPOST, older-reader scroll/latest focus và URL lifecycle. Nguồn document/manual/PDF trang 1/short empty/unavailable/truncated/sourceRevision đều có production HTTP/browser evidence. Historical replies giữ nguyên sau revision mới, không có citation giả. Lỗi CSS nhãn 40×40 tái hiện live đã sửa scoped và kiểm geometry trên đúng asset mới ở cả bốn lượt. Long points và các trường hợp metadata không được API cung cấp dùng component fixtures, được phân biệt rõ.

- **006**: Ba vai trò×hai viewport, identity 80 ký tự, password ban đầu đóng; label/autocomplete/focus/clear đã kiểm. Profile save 200 rồi /me lỗi mạng giữ known account read-only và draft mới, GET-only retry, late success/401 sau logout/replacement không ảnh hưởng session mới. Wrong-current400, mismatch không write, uncertain network không replay, confirmed password đổi bằng credentials của tài khoản thử tự tạo (có khoảng trắng quan trọng), logout/relogin và old-session401 thật. Không truy cập credential store/browser storage, không ghi password/token vào evidence. Các biên 6/72, same-token replacement và response permutations có component tests.

- **007**: Hai viewport với managed list/editor/long identity, search response cũ, selection/draft/focus; real empty trước provisioning, no-match và 25-per-page/clamp sau rename khỏi query. Confirm role/cancel, toggle-only lock/unlock giữ draft, linked409, self403/otherADMIN404/invalid400, revocation và late admin write sau replacement đều có production evidence. Saved 200 nhưng reload bị chặn mạng có confirmation riêng, retry chỉ GET và một PATCH. Account006/quiz/grading/local tools hồi quy bằng cùng bộ dữ liệu riêng. Quyền mới của đợt nghiệm thu cho phép automation role/status/password trên tài khoản thử tự tạo; không áp dụng cho tài khoản local thật.

Không tuyên bố đã đo hỗ trợ screen reader/OS file-picker thực hoặc unload network persistence: label/status/focus kiểm qua browserDOM/native keyboard, chọn File bằng CDP File input, focus deadline bằng dispatched event và interval. Native ConfirmDialog dùng browser thật. Các tổ hợp lỗi không có production API để tạo tự nhiên vẫn là component fixtures, không đổi contract để tạo chúng.

## Dữ liệu kiểm thử và cleanup

[Danh sách ID trước cleanup](../.artifacts/acceptance-20261102/owned-before-cleanup.json): users 5–38; courses 2/3/4; lessons 4–11/18; assignments 2/3/4/6; 3 submissions, 6 attempts, 59 chat, 2 progress. Registry tạo tài nguyên và HTTP evidence nằm cùng thư mục; email được chuẩn hóa theo production contract khi đối chiếu ownership. Integration có ID riêng từng lượt và tự dọn xong.

[Cleanup](../.artifacts/acceptance-20261102/cleanup.json) dùng course DELETE API của đúng owner rồi delete đúng 34 cặp ID+email đã xác minh trong DB riêng; các bảng trở về 0. Upload cleanup kiểm theo course API. Không reset/drop DB hoặc xóa volume. Stack/volume riêng còn giữ để review cấu hình; credentials thử không được ghi ra tệp/Git và không còn tài khoản thử hoạt động sau cleanup.

## Analyze / converge / phần vận hành

Analyze read-only theo managed skill:187/187 FR+SC có task,144 AC liên kết đầy đủ, không có unmapped requirement/task, placeholder, ambiguity/duplication hay constitution conflict actionable;5 principles giữ nguyên. Resolver no-persist giữ state 007, hooks absent. Managed converge cho cả 001–007: **converged**, 0 findings/0 tasks_appended; tất cả tasks.md giữ nguyên byte trong bước converge, không có Git/spec/plan/code writes. [Báo cáo từng feature](../.artifacts/acceptance-20261102/converge-final.json). Converge không thay runtime evidence.

Trước deploy công khai vẫn cần domain/TLS, secret rotation/management, CORS theo môi trường thật, SMTP delivery/reset, backup/restore, vận hành/monitoring và kiểm tải/security theo mục tiêu triển khai. Các bước này chưa được chứng nhận bởi đợt nghiệm thu local này.
