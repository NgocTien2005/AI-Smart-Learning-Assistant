# Verification — role dashboards

Date: 2026-10-31. Feature: [spec](spec.md), [plan](plan.md), [tasks](tasks.md).

## Preflight và analysis

- Working tree ban đầu chỉ có .agents/.specify/docs/specs untracked; không có source diff.
- CLI 1.2.3/integration ok; active feature resolve đúng. Không có extensions.yml/hooks.
- Checklist generation 20 unchecked, sau review được ủy quyền 20/20 yêu cầu đạt; built-in 16/16. Không phải kết quả sản phẩm.
- Tasks generation: 23 tasks, US1=3, US2=2, US3=4, US4=3, US5=3, setup/foundation=2, polish=6. Không có [P] cùng file.
- Analyze read-only: 31 keys (22 FR, 9 SC) có coverage; 23/23 tasks có nguồn. Critical/high/medium/low=0; không có unmapped task hoặc constitution violation. Spec/plan/constitution không đổi.
- Ignore kiểm tra: node_modules/dist/generated và .env của packages đã được ignore; Docker contexts có .dockerignore. Không publish npm nên không thêm .npmignore.
- Node v25.2.0. Baseline npm test frontend: **5 service tests + 23 component tests PASS**.
- Probe mới: localhost:8080/api/health, :3000/api/health và :5173 đều timeout 3 giây. Docker engine pipe không tồn tại. Chưa khởi động DB, migrate, seed hoặc thay dữ liệu.

## Kết quả implementation

Đã triển khai frontend trong phạm vi. **Chưa chứng nhận feature hoàn tất** vì chưa có môi trường API/database thật để hoàn thành T021/T022. Không thay spec, plan, constitution, backend, API, schema, migration, lesson page, session service hoặc dependency.

| File | Kết quả thay đổi |
| --- | --- |
| `frontend/src/pages/DashboardPage.jsx` | List/search trước, totals sau; state trung thực; normalized validation; write/list generations, first-incomplete/latest-intent, clipboard feedback |
| `frontend/src/pages/AdminPage.jsx` | Editor trực tiếp gọn; effective role tách draft; khóa cả row khi write; giữ dirty; GET authority theo query hiện hành, clamp/refetch page; success tách refresh failure |
| `frontend/src/components/CourseEntryDisclosure.jsx` | Controlled inline disclosure, giữ draft/error, aria-controls/expanded, focus/keyboard và recovery sau native disabled blur |
| `frontend/src/components/AppLayout.jsx` | Marker chỉ dashboard/admin; bỏ self breadcrumb ADMIN; không đổi session/nav/guards |
| `frontend/src/pages/RoleDashboards.css` | Mọi selector có route ancestor; layout mới min-width1024, không đổi root tokens/global CSS hoặc mobile behavior |
| `frontend/src/__tests__/frontend.test.js` | Thêm 22 component regressions có điều khiển thứ tự async; giữ baseline session/course/quiz/account/auth |

## Bằng chứng và command

Các đường dẫn `.artifacts/` dưới đây là output local được ignore, không phải file production. E04/E05 dùng API fixture qua interception của Chromium, **không phải backend/database pass**; mọi request API trong harness đó được chặn, không ghi dữ liệu thật. Không dùng ảnh cũ.

| ID | Command / phạm vi | Kết quả |
| --- | --- | --- |
| E01 | `frontend/`: `npm test`; log [dashboard-tests.log](../../.artifacts/dashboard-tests.log) | PASS: 5 Node service tests + 45 Vitest component tests, 0 fail, 0 skipped; kết thúc 00:35:40 ngày31/10/2026 local |
| E02 | `frontend/`: `npm run lint`; [log](../../.artifacts/dashboard-lint.log) | PASS, exit0, không warning cuối cùng |
| E03 | `frontend/`: `npm run build`; [log](../../.artifacts/dashboard-build.log) | PASS, exit0, Vite8.2.2, 49 modules; output dist được ignore |
| E04 | Chromium156.0.8078.76 headless, Vite source hiện tại, 3 roles × 2 viewports × normal/long; [bounds JSON](../../.artifacts/role-dashboards/fixture-bounds.json), [harness](../../.artifacts/role-dashboards/fixture-browser-check.mjs) | PASS geometry fixture: 12 ảnh mới; title/search/item/primary action đầu trong viewport; document không tràn ngang; deviceScaleFactor1/pageScale1. Font probe chi tiết bên dưới |
| E05 | Cùng Chromium/harness E04: native Enter/Space/Tab/Escape, giữ draft, đóng bỏ Tab order; submit success focus; native ADMIN dialog; account/auth sau dashboard | PASS trong fixture: mở focus input, đóng trả trigger, Tab đi search; dialog cancel mặc định, Tab vòng, Escape không PATCH và trả focus; account/auth không có marker |
| E06 | Source/contract review từ UI tới production routes/middleware/schema; `git diff --check`, phạm vi file, CSS ancestor | PASS review/static; không chứng minh server runtime. Chỉ 6 file frontend thay đổi/thêm; không đổi lockfile, common CSS, course/lesson, service hoặc backend |
| E07 | Runtime probes trước triển khai và mới sau Orca restart: `docker compose ps --format json`, health8080/3000 timeout3s | BLOCKED: thiếu `dockerDesktopLinuxEngine` pipe; cả hai HTTP timeout. Không có stack healthy hoặc DB test mục tiêu đã xác nhận |
| E08 | `backend/`: `npm run test:integration` | **CHƯA CHẠY** do E07; đã review script, không chạy seed/reset/migrate/cleanup hay provision dữ liệu |

Lượt red đầu sau bổ sung regression: 8/32 component fail theo hành vi chưa có; reporter DOM lớn khiến process cạn bộ nhớ. Lượt trung gian sau code: 31/32 đạt, còn assertion text matcher của test mới không khớp text node chứa counts; đã sửa matcher để vẫn kiểm effective role. Lint trung gian có 1 ref-cleanup warning, đã sửa capture object ổn định. E01/E02/E03 là kết quả cuối, không tắt test/lint/guard/validation.

E05 phát hiện focus BODY sau native submit disabled, trong khi jsdom không tự blur như Chromium. Đã sửa disclosure theo dõi focus ownership, trả trigger khi panel đóng và focus mất về body; giữ focus ở search nếu người dùng đã chuyển. E01 có regression riêng cho cả hai, E05 chạy lại đạt sau sửa.

Orca restart xảy ra sau các command cuối đã kết thúc. Đã đọc lại log đầy đủ và các artifact còn lưu, không chạy lại suite đã đạt. Chỉ sửa newline cuối DashboardPage để `diff --check` sạch; không đổi behavior sau E01–E05. Vite/Chromium do lượt làm việc trước chạy đã ngừng, không còn listener5173/9334 khi kiểm lại.

### Số đo desktop với fixture

Các số dưới lấy trực tiếp E04; đây là kiểm layout với fixture, chưa phải sáu lượt đăng nhập/API thật của quickstart V03.

| Role / viewport | Action normal: bottom(px) | Action long: bottom(px) | Overflow ngang |
| --- | --- | --- | --- |
| STUDENT1280×800 | 604.5 | 629.5 | Không |
| STUDENT1440×900 | 583.5 | 629.5 | Không |
| INSTRUCTOR1280×800 | 560.5 | 585.5 | Không |
| INSTRUCTOR1440×900 | 539.5 | 585.5 | Không |
| ADMIN1280×800 | 456.39 | 456.39 | Không |
| ADMIN1440×900 | 456.39 | 456.39 | Không |

Ảnh đại diện: [student long](../../.artifacts/role-dashboards/student-1280x800-long.png), [instructor](../../.artifacts/role-dashboards/instructor-1280x800-normal.png), [admin long](../../.artifacts/role-dashboards/admin-1280x800-long.png). Mỗi role có đủ 1280×800/1440×900, normal/long, tên file theo harness. Đã xem trực tiếp ảnh và đối chiếu bounds; fixture gồm title120, name80, email dài, description dài, progress/counts có nguồn fixture rõ ràng.

Font probe ghi computed H1 family `Lexend, sans-serif` cho mọi ảnh; `document.fonts.check('14px Inter')` true ở cả ba role. Probe `18px Lexend` true ở course dashboards nhưng false tại ADMIN; probe đó dùng weight400, khác H1 weight700, nên chưa kết luận font glyph thực tế của ADMIN là loaded hay fallback. Cần ghi nhận font thực tế đúng weight trong lượt live còn lại; không dùng computed family riêng lẻ để chứng minh font đã tải.

### Nhóm regression E01

Tên dưới là tên test có trong `frontend.test.js`, có thể tìm trực tiếp, không phải test mới được mô tả nhưng chưa chạy.

| Mã nhóm | Regression tiêu biểu đã chạy |
| --- | --- |
| R1 STUDENT | `course cards use compact non-nested actions and honest student progress states`; `dashboard omits its redundant breadcrumb and keeps course search and progress filtering aligned`; `latest continue-learning intent wins and selects first incomplete lesson`; `continue error retries same course and all-complete detail falls back to lessons`; `unmounted dashboard ignores late detail and pending same-course activation is serialized` |
| R2 INSTRUCTOR | `instructor cards link to course management and keep personal progress out`; `instructor search and sort preserve owned course actions and clipboard denial exposes real code` |
| R3 Disclosure/write | `role disclosure retains draft and focus without sending on open, close or Escape`; `join normalizes whitespace and lowercase, locks duplicates and keeps success outside closed panel`; `failed normalized form validation never sends and server failure preserves the draft`; `create validates normalized title and description boundaries without native raw length clipping`; `closed pending disclosure keeps focus outside and failure offers reopening with draft`; `successful pending submit returns lost panel focus but never steals explicitly moved focus` |
| R4 Course races | `initial course read superseded by a failed write can recover and ignores its late response`; `successful join before first list snapshot never presents partial totals and ignores older GET` |
| R5 ADMIN | `admin ignores an obsolete search response after a faster newer result`; `admin initial error has no confirmed zero total and exposes read retry`; `admin toggle preserves unsaved profile and locks the whole row during write`; `admin role conflict preserves draft and cancel never patches` |
| R6 ADMIN async | `admin successful write plus refresh error retains confirmed record and retry never repeats PATCH`; `admin rename on last page clamps and fetches authoritative remaining page`; `admin delayed write reconciles current normalized query and preserves another dirty row`; `admin stale pre-write GET cannot undo confirmed active state; name invalid disables save`; `two independent admin writes cannot be undone by an intermediate refresh` |
| R7 Hồi quy | `actual route guards deny admin course UI and students admin UI`; `route marker is removed when leaving dashboard for account or course and admin has no self breadcrumb`; baseline startup/late-me/session, login redirect, account/profile/header roles, course URL/response, quiz draft/conflict, assignments/summary tests; 5 Node service tests |

## Truy vết FR / US / AC / SC → task → bằng chứng

“Đạt component” chỉ kết luận phạm vi test mocked. “Một phần” giữ nguyên yêu cầu nghiệm thu còn cần dữ liệu/API thật. Không suy từ marker checklist hoặc task sang pass của sản phẩm.

| FR | US / AC | SC | Task | Bằng chứng | Kết quả / còn thiếu |
| --- | --- | --- | --- | --- | --- |
| FR-001 | US1-AC1, US2-AC1, US3-AC1, US5-AC6/7 | SC-001/009 | T002/015/021/022 | E01:R7, E04–07 | Router/header đạt component/fixture; còn live role/HTTP |
| FR-002 | US1-AC1, US2-AC1, US3-AC1, US5-AC1 | SC-001 | T002/004/007/009/016/021 | E04 bounds/ảnh, E06 DOM | Đạt layout fixture; còn V03 với API thật |
| FR-003 | US1-AC2 | SC-004 | T003/004 | E01:R1 | Đạt component search/filter; live V04 chưa chạy |
| FR-004 | US1-AC3/5, US2-AC4/6, US5-AC4 | SC-003/007 | T003/004/006/007/017 | E01:R1/R2, E06 | Đạt dữ liệu/state component; live V04/V05/V10 chưa chạy |
| FR-005 | US1-AC3/4 | SC-003 | T003/005 | E01:R1 | Đạt path/intent component; mở bài qua API thật chưa chạy |
| FR-006 | US1-AC5/6 | SC-003/007 | T003/004/005/022 | E01:R1, E06 | Đạt lỗi/retry component; HTTP quyền còn thiếu |
| FR-007 | US2-AC2/3/4 | SC-003/004/007 | T006/007 | E01:R2 | Đạt search/sort/link/clipboard mock; clipboard thật/ownership HTTP chưa chạy |
| FR-008 | US4-AC1/2 | SC-002 | T012/013/014/021 | E01:R3, E04/E05 | Đạt component/native fixture; cần live context |
| FR-009 | US4-AC2/5/6 | SC-002 | T012/013/014 | E01:R3, E05 | Đạt draft/status/focus component/native fixture; live write chưa chạy |
| FR-010 | US4-AC3/4/5 | SC-009 | T012/014/022 | E01:R3/R4, E05 | Đạt normalization/dedupe component; create/join/progress server thật chưa chạy |
| FR-011 | US3-AC2/7 | SC-004 | T008/009/011/022 | E01:R5/R6 | Đạt query/generation/authority/clamp component; live paging chưa chạy |
| FR-012 | US3-AC2/3 | SC-005 | T008/009/010/022 | E01:R5/R6, E04/E06 | Đạt editor/roles/counts component/fixture; target/role HTTP chưa chạy |
| FR-013 | US3-AC4 | SC-005 | T008/010/022 | E01:R5, E06 | Đạt cancel/conflict/draft component; linked409 thật chưa chạy |
| FR-014 | US3-AC5 | SC-005 | T008/010/021/022 | E01:R5/R6, E05 | Đạt lock/confirmation/native cancel fixture; revoke thật chưa chạy |
| FR-015 | US3-AC4/6 | SC-005 | T008/010/011 | E01:R5/R6 | Đạt dirty/row lock/concurrent refresh component; live flow chưa chạy |
| FR-016 | US1-AC6, US2-AC5, US3-AC7, US4-AC5, US5-AC4/5 | SC-007 | T004/007/009/011/014/017 | E01:R1–R6, E06 | Đạt read/write/partial data/refresh semantics trong component/review; live state matrix còn thiếu |
| FR-017 | US4-AC5, US5-AC5 | SC-007 | T005/010/012/014/017 | E01:R1/R3/R4/R5/R6 | Đạt pending/ref locks/failed-read recovery component; live chưa chạy |
| FR-018 | US5-AC2/5 | SC-006/008 | T016/017/021 | E04/E05/E06 | Đạt style/focus fixture và semantic review; cần live context |
| FR-019 | US5-AC1 | SC-001/008 | T002/016/021 | E04 bounds normal/long | Đạt geometry fixture; chưa công bố SC-001/008 hoàn tất |
| FR-020 | US5-AC3/5 | SC-006 | T012/013/015/017/021 | E01:R3/R5/R7, E05 | Native dialog/disclosure đạt fixture; keyboard các live flows còn thiếu |
| FR-021 | US5-AC6 | SC-007/009 | T015/017/022 | E01:R7 + Node service tests, E06 | Giữ recovery/guards; chưa có auth/resource HTTP |
| FR-022 | US1-AC4, US2-AC3, US5-AC6 | SC-009 | T002/015/016/023/021/022 | E01:R7, E05/E06 | Diff/scoping đạt; course native layout/HTTP regression chưa chạy |

### Trạng thái success criteria

| SC | Task / bằng chứng | Trạng thái nghiệm thu |
| --- | --- | --- |
| SC-001 | T002/004/007/009/016/021; E04 đủ12 captures | Một phần: geometry fixture đạt, sáu lượt với API thật chưa chạy |
| SC-002 | T012/013/014/021; E01:R3, E05 | Component/native fixture đạt; live context còn thiếu |
| SC-003 | T003/005/006/007; E01:R1/R2 | Component paths đạt; server/lesson navigation thật chưa chạy |
| SC-004 | T003/006/008/011; E01:R1/R2/R5/R6 | Component search/sort/paging/race đạt; live chưa chạy |
| SC-005 | T008/009/010/011/022; E01:R5/R6,E05 | Component/editor/native cancel fixture đạt; HTTP save/409/revoke chưa chạy |
| SC-006 | T012/013/015/016/017/021; E01/E05 | Native disclosure/dialog với fixture đạt; chưa đủ mọi live control |
| SC-007 | T003/006/008/012/014/017/022; E01 | Các regressions có kiểm soát đạt; live HTTP/clipboard/state matrix còn thiếu |
| SC-008 | T016/021; E04/E05 | Typography/long geometry fixture đạt; live context còn thiếu |
| SC-009 | T002/012/015/023/021/022; E01/E06 | Diff/route/session regression đạt; quyền và dữ liệu thật chưa xác minh |

## Quickstart và phần bị chặn

| Kịch bản | Đã thực hiện | Chưa thực hiện |
| --- | --- | --- |
| V01/V02 | Resolver, artifacts, requirement quality review, analyze; frontend tests/lint/build và diff | Không |
| V03 | 12 captures/bounds Chromium của current source, normal/long, fixture API | 6 lượt với phiên/API/database thật |
| V04/V05 | Search/progress/sort/action paths/clipboard denial/continue races component; layout fixture | Mở bài, ownership và clipboard thật |
| V06 | Draft/disclosure/validation boundaries/pending/success/error component; native keyboard/submit focus fixture | Create/join/progress thật, server failures trong browser |
| V07/V08/V09 | ADMIN query/draft/confirmation/pending/authoritative paging/conflict/stale GET/multirow write component; native cancel fixture | Save/toggle/conflict/page shrink với backend/database thật |
| V10 | Read/write/state semantics qua component và review | Live state matrix và vị trí thông báo với real API |
| V11 | Actual router guards component, session regressions; native disclosure/dialog; account/auth không marker với CSS đã load | Native course/lesson/quiz regression và đầy đủ keyboard với phiên/API thật |
| V12 | Review `backend/scripts/integration-check.mjs`, routes/middleware/schema và target dự kiến | HTTP/database integration; E07 ngăn chạy |

Script integration mặc định dùng HTTP `http://localhost:8080/api`, nhưng SQL provision/cleanup đi qua `docker compose exec -T db psql -U postgres -d lumina_lms`; chỉ override TEST_API_URL không đủ để đổi DB target. Script có register, provision Admin, UPDATE/INSERT fixture và DELETE cleanup. Chưa có stack healthy/test DB đã xác nhận nên không chạy script, không seed/reset/delete DB. Không khẳng định có lỗi baseline PDF hoặc regression backend vì chưa chạy suite này.

Các giới hạn còn lại là điều kiện ngoài frontend: Docker engine/API/database test chưa sẵn sàng và chưa có các phiên/dữ liệu thật để nghiệm thu đầy đủ. Khi môi trường sẵn sàng, hoàn tất T021/T022 (và task converge tham chiếu chúng), cập nhật đúng từng Vxx rồi converge lại. Không cần tạo feature/constitution/tasks mới hoặc thay contract.

## Kết quả converge và tiếp tục implement

Converge đã chạy theo managed skill, dùng resolver `-RequireSpec -RequireTasks -IncludeTasks` với no-persist. Inventory gồm 22FR + 9SC + 32AC, 23tasks, 13 nhóm quyết định plan (shell/list/grid/disclosure/validation/progress/clipboard/admin roles/drafts/authority/states/CSS/verification) và 5 nguyên tắc constitution. Đánh giá code hiện tại trong scope, không dùng git/history trong bước converge.

| ID | Type / severity | Nguồn | Gap còn lại | Task append |
| --- | --- | --- | --- | --- |
| F1 | partial / HIGH | SC-001/002/006/008/009, US1-AC1/4, US2-AC1/3, US3-AC1, US5-AC1/3/6/7, plan desktop verification, T021 | Geometry/native checks fixture đã có; chưa đủ browser với phiên/API thật, full keyboard/course/lesson/quiz regression và font ADMIN đúng weight | T024 |
| F2 | partial / HIGH | FR-001/010/012–015/021/022, SC-005/007/009, Constitution II/IV, T022 | Chưa có HTTP/database/authorization/create/join/save/409/revoke thật; không dùng mock chứng minh write/deny | T025 |

Metrics: missing0 / partial2 / contradicts0 / unrequested0; critical0 / high2 / medium0 / low0. Không phát hiện gap code bổ sung từ đối chiếu; thiếu runtime không được coi là đạt. **Outcome: `tasks_appended`, 2 tasks trong Phase9**, không phải `converged`. Trong bước này chỉ append tasks.md; không sửa code/spec/plan/constitution hoặc marker task cũ. Không có extension hooks trước/sau.

Sau converge đã tiếp tục managed implement: resolver xác nhận cùng feature, checklist read-only vẫn requirements16/16 và dashboard-quality20/20; không có câu hỏi/approval đang chờ. T024 phụ thuộc phiên/API/database thật và dữ liệu thử; T025 phụ thuộc stack test healthy/DB target. E07 vừa được kiểm lại sau restart vẫn thiếu engine pipe và HTTP timeout, nên không lặp suite/probe thất bại với điều kiện cũ, không khởi động hay sửa DB để tạo điều kiện giả. Không có phần code độc lập nào còn tồn đọng được xác định.

Trạng thái cuối: **21/25 task đã thực hiện**, 4 marker còn unchecked: T021/T022 và phần tiếp nối T024/T025 (hai nhóm nghiệm thu bị chặn, không phải bốn tính năng mới). T023 hoàn tất tài liệu truy vết và giới hạn, không chứng nhận SC đã pass. Feature **chưa hoàn tất nghiệm thu**, giữ nguyên phạm vi/tiêu chí. Không commit/push/PR/merge/deploy.


## Acceptance continuation — 2026-11-02

Kết quả hiện hành của đợt nghiệm thu 001–007; các mục trạng thái trước đây được giữ làm lịch sử. Quyền provisioning/cleanup và automation credentials chỉ áp dụng stack riêng do yêu cầu nghiệm thu mới cấp, thay thế điều kiện thiếu tài nguyên/user-action trong báo cáo cũ; không đổi contract hoặc acceptance criteria.

**Kết quả: đạt phạm vi feature trên stack nghiệm thu riêng.** Ba vai trò, sáu tổ hợp viewport; danh sách/action trong fold, Inter 700 thực sự được tải. Create/join pending chỉ một write, disclosure/draft/notice, rejoin giữ progress, completed/progress filters và clipboard thành công/từ chối đã kiểm trên browser thật. ADMIN search/page/editor/confirm/revocation dùng bằng chứng 007 trong cùng stack và cùng implementation JS. Các biên thiếu metadata, lỗi503 và thứ tự response bổ sung bằng component tests, không gắn nhãn live.

Baseline HEAD c55d0054c1ffc029b5f65f0713034a273fdbfdc3, working tree ban đầu sạch; bản source được định danh bằng [source-integrity.json](../../.artifacts/acceptance-20261102/source-integrity.json). Browser Chrome 156 thực, fresh isolated contexts, viewport1280×800/1440×900, deviceScaleFactor1/visualViewport.scale1, zoom mặc định 100%, fonts loaded. HTTP127.0.0.1:8082/api, Compose lumina-acceptance-20261102, DB lumina_acceptance, volume/network riêng; không mutate stack local 8081. [Môi trường cuối](../../.artifacts/acceptance-20261102/environment-final.json).

Bằng chứng **A-FE**: frontend full5 service+184 component PASS, lint/build PASS; **A-BE**:38 backend tests PASS; **A-QUIZ**: production quiz regression được filter thực sự chọn (các file wrapper khác không được tính thành8 quiz cases). **H-INT**: [integration real HTTP/database](../../.artifacts/acceptance-20261102/integration-isolation-confirmed-http.json), cleanup0. Command/cwd/exit/log trong [commands.json](../../.artifacts/acceptance-20261102/commands.json). Component boundaries/races và source review bổ sung cho live, không được coi là từng biến thể đều chạy end-to-end.

**B001**: [browser checks](../../.artifacts/acceptance-20261102/browser-checks.json) theo prefix 001 và layout/current/final/fixed tương ứng; [screenshot PNG](../../.artifacts/acceptance-20261102/screenshots/) và bounds JSON cùng tên nằm trong evidence directory. Trạng thái tổng:280 records,277 PASS và3 historical failed assertions của harness; không xóa failed records. Wrong expected auth return/clipboard wording và capture cũ trước navigation/assets-ready đều có corrected checks; xem [harness-notes.json](../../.artifacts/acceptance-20261102/harness-notes.json). Ảnh lookup fixed-005-* mới thay cho ảnh nhãn bị tràn. Lỗi frontend full suite183/184 được giữ và sửa đúng async test lifecycle; xem [báo cáo chung](../../docs/acceptance-20261102.md).

### Task closure theo bằng chứng

| Task | Phạm vi đã review | Bằng chứng | Kết quả |
| --- | --- | --- | --- |
| T021 | Desktop/state/regression | A-FE + B001 + cross-feature live regression | Đạt toàn nhóm; continuation giữ trong đúng feature |
| T022 | Production HTTP/database/authorization | A-BE/A-QUIZ + H-INT + production role/resource denials | Đạt toàn nhóm; continuation giữ trong đúng feature |
| T024 | Desktop/state/regression | A-FE + B001 + cross-feature live regression | Đạt toàn nhóm; continuation giữ trong đúng feature |
| T025 | Production HTTP/database/authorization | A-BE/A-QUIZ + H-INT + production role/resource denials | Đạt toàn nhóm; continuation giữ trong đúng feature |

Không chuyển task sang feature khác. Các task converge trên là continuation của cùng nhóm nghiệm thu, được đối chiếu riêng trước khi đổi marker; nguyên văn task được giữ. [Closure ledger](../../.artifacts/acceptance-20261102/task-closures.json) giữ mô tả gốc/căn cứ từng ID.

### FR / US / AC / SC traceability

[Ma trận63 dòng](acceptance-20261102.csv) nối toàn bộ22 FR,32US/AC và9 SC → task → typed evidence → kết quả. Mapping FR/AC/SC kế thừa bảng traceability trong artifacts của chính feature; không đặt ID mới hoặc hạ tiêu chí. Những biên chỉ có component/source được nêu rõ trong narrative và báo cáo chung.

Source touch-points đã đối chiếu: `frontend/src/pages/DashboardPage.jsx`, `frontend/src/pages/AdminPage.jsx`, `frontend/src/pages/RoleDashboards.css` cùng production authentication/routes/Prisma. API/backend production/schema/migrations/dependencies không đổi. Checklist markers giữ nguyên. Spec Status được cập nhật; nội dung requirements/plan không bị sửa để hợp thức hóa code.

### Dữ liệu / giới hạn / convergence

[Owned inventory trước cleanup](../../.artifacts/acceptance-20261102/owned-before-cleanup.json):34 users,3 courses,9 lessons,4 assignments,3 submissions, 6 attempts, 59 chat messages và2 progress rows. [Cleanup](../../.artifacts/acceptance-20261102/cleanup.json) chỉ exact owned ID+canonical email; course API dọn upload, các bảng trở về 0; không drop/reset DB hoặc xóa volume. Integration tự dọn các ID riêng của mỗi lượt. Không lặp mutation demo 28 local.

Analyze read-only: không còn findings actionable, coverage31/31 FR+SC có task,32 AC được truy vết; constitution5 principles được giữ. Managed final converge: **converged**, 0 findings/0 tasks_appended; tasks.md giữ nguyên byte trong bước converge. [Kết quả từng feature](../../.artifacts/acceptance-20261102/converge-final.json). Không dùng converge thay runtime evidence. Public deploy/TLS/SMTP/backup/load/security vận hành chưa nghiệm thu.
