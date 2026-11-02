# Verification — Assignment workspace003

**Ngày cập nhật**: 2026-11-01. Implementation và kiểm tra độc lập đã thực hiện; **chưa hoàn tất feature acceptance**.

## Baseline và feature cũ

Resolver ban đầu trả002-improve-course-workspace; script create-new-feature chính thức tạo003-improve-assignment-workspace, sequential, không đổi Git branch hoặc init lại. Baseline working tree **clean**,158 tracked hashes, status/diff và copy frontend/src +001/002 trong [baseline](../../.artifacts/assignment-workspace-20261031/baseline/manifest.json). Không commit/stash/reset/ghi đè để làm sạch.

| Feature cũ | Task còn mở lúc bắt đầu | Xử lý |
| --- | --- | --- |
|001-improve-role-dashboards |T021/T022/T024/T025: desktop/HTTP đầy đủ và convergence continuation | Giữ nguyên; không chuyển sang003 hoặc tick hoàn tất |
|002-improve-course-workspace |T018/T019/T021/T022: desktop/protected-resource đầy đủ và continuation | Giữ nguyên; evidence003 không được dùng để tự đóng chúng |

## Quy trình Spec Kit

- Đã đọc AGENTS.md, constitution1.0.0, workflow, skills Lumina và managed skill trước từng bước.
- Specify: script chính thức + active spec-template resolver. Clarify: resolver PathsOnly,0 câu hỏi sản phẩm/0 câu trả lời;10 taxonomy categories Clear, defaults/lifecycle được ghi trong spec. Thiếu tài nguyên nghiệm thu là external gate, không bịa câu trả lời clarify.
- Plan: setup-plan chính thức, research read-only độc lập, UI/API/quyền/schema hiện có; generated research/data-model/contracts/quickstart. Không task backend/schema/migration.
- Checklist: requirements0/16→16/16 sau review riêng; standard custom0/14→14/14 sau generation unchecked và review riêng đã được user ủy quyền. [Review](checklists/review.md). Trong implement cả3 checklist files giữ nguyên hash.
- Tasks:23 task có ID/file/dependency/trace. Analyze prerequisite với no-persist và read-only;22FR/21AC/8SC/8EC,23tasks,5 constitution principles được đối chiếu; không tìm thấy xung đột quan trọng hoặc task không có nguồn. Không ghi file trong analyze.
- Implement: tests mới đỏ trước thay UI (8/8 ca đầu fail do thiếu behavior); thực hiện frontend theo plan, không nới contract. Đã sửa validation accessible label sau một regression đỏ mới, giữ assertions. Không tắt guard/lint/tests.
- Không có .specify/extensions.yml tại pre/post checks, không hook áp dụng cho specify/clarify/plan/checklist/tasks/analyze/implement. Hooks của converge được kiểm tra riêng theo bước đó.

## File thay đổi

| File | Thay đổi |
| --- | --- |
|frontend/src/components/AssignmentsPanel.jsx | List/detail theo role; search/filter/priority; draft theo target; refresh giữ panel; mounted/locks/revision/functional merge; notices scoped; null/0/feedback/deadline; native confirm hiện có |
|frontend/src/components/AssignmentEditor.jsx | Disclosure tạo/sửa, validation, label/error association, focus/collapse và pending |
|frontend/src/components/AssignmentsPanel.css | CSS dưới .assignment-workspace, desktop list/detail, text wrap/scroll/focus; không sửa global/mobile styles |
|frontend/src/services/assignmentView.js | Pure derived status/filter/sort, ID validation, deadline/locale và default submission |
|frontend/src/pages/CourseWorkspacePage.jsx | Chỉ assignment query/callback và functional updater; không đổi lesson/quiz flow |
|frontend/src/__tests__/frontend.test.js |19 tests mới có hành vi meaningful; toàn55 tests cũ vẫn chạy, không bỏ business assertions |
|specs/003-improve-assignment-workspace/ | Spec/plan/research/model/contract/quickstart/checklists/tasks và bảng bằng chứng này |

## Bằng chứng và kết quả

Các link .artifacts là bằng chứng local được Git ignore, không đưa vào commit. Không có screenshot/bounds003 live mới do blocker bên dưới; không dùng ảnh cũ002 làm bằng chứng003.

| ID | Kiểm tra | Kết quả / giới hạn |
| --- | --- | --- |
| E01 | npm test, cwd frontend/, [log cuối](../../.artifacts/assignment-workspace-20261031/tests-final.log), 2026-11-01 00:17 local | **PASS**:5 Node service tests +74 Vitest/jsdom/RTL component tests,0 fail/skip. Có19 assignment tests mới; requests/fixtures mocked, không chứng minh DB/live UI |
| E02 | npm run lint, cwd frontend/, [log](../../.artifacts/assignment-workspace-20261031/lint-final.log) | **PASS**, exit0 |
| E03 | npm run build, cwd frontend/, [log](../../.artifacts/assignment-workspace-20261031/build-final.log) | **PASS**, exit0, Vite8.2.2/54 modules; host build chưa được deploy vào container frontend đang chạy |
| E04 | Fresh localhost8081 read-only HTTP, [JSON](../../.artifacts/assignment-workspace-20261031/http-negative.json), 2026-11-01 00:16 local | **PASS subset**: health200; missing/invalid authentication trên /me, admin users, course15/16, lesson28 document đều401,10/10. Không dùng phiên hợp lệ, không đọc credential/storage, không write. Chưa chứng minh owner/enrollment/ADMIN với token hợp lệ |
| E05 |158 baseline hashes, [scope result](../../.artifacts/assignment-workspace-20261031/scope-final.json), git diff --check | **PASS**: chỉ3 tracked frontend files đổi +3 source files mới +003 artifacts.155 tracked files giữ nguyên, gồm001/002, backend/schema/migrations/packages/constitution/managed skill. Checklists read-only trong implement |
| E06 | Resolver/tooling/artifacts/requirements review | **PASS workflow**:003 active,30/30 checklist-quality items được review, no critical artifact conflict. Không phải product acceptance |
| E07 | Production source contract review, [contract](contracts/assignments.md), [research](research.md) | **SOURCE REVIEW**: route/middleware owner/enrollment, role boundary, scalar response merge, null/0 và deadline được đối chiếu; không coi là HTTP pass |
| E08 | CUA/browser inventory và attempt kiểm current Chrome | **BLOCKED**: browser access host unavailable; sau restart không có Chrome cũ; Chrome mới mở New Tab, Computer Use tự dừng vì không xác định URL Windows đủ tin cậy để enforce policy. Không tiếp tục browser automation hoặc dùng công nghệ khác để vượt stop |

E01 xác minh search body/case, priority/filter/selected-outside, null/0/feedback-only, expiry/focus/new dueAt, draft collapse/switch/error/refresh, duplicate prevention, independent writes reverse response, refresh-old-vs-write, newest read, course replacement/unmount, scalar metadata merge, invalid IDs, URL back/forward, create validation/success focus/reset, delete dialog Escape và long text đầy đủ. Native modal/layout thật vẫn chưa chạy. Early failures được giữ ở red-tests.log, tests-before-label-fix.log và editor-regression.log; E01 là kết quả cuối sau sửa.

## FR / US / AC / SC → task → bằng chứng

PASS component chỉ có nghĩa các ca fixture/component đã đạt. Các hàng cần live vẫn có giới hạn; không hạ acceptance criteria.

| FR | US/AC | SC | Tasks | Evidence | Kết quả / phần còn thiếu |
| --- | --- | --- | --- | --- | --- |
|001 |US4-AC5 |007/008 |T002/T017/T022 |E01/E04/E05/E07 | Guards/regression component và unauth401 đạt; owner/enrollment/ADMIN authenticated pending |
|002 |US1-AC1,US3-AC1 |001 |T005/T006/T014/T016/T021 |E01/E05 | Structure/disclosure component đạt; desktop fold chưa chạy |
|003 |US1-AC2,US2-AC1 |002 |T003–006/T008/T009 |E01 | Search/filter/empty/no-match đạt component; live pending |
|004 |US1-AC1,US2-AC1 |002 |T003/T004/T006/T009 |E01 | Priority/null deadline/feedback-only/zero/tie helper đạt; live pending |
|005 |US1-AC3 |002 |T005/T006 |E01 | Selected detail ngoài filter được giữ và clear; component đạt |
|006 |US1-AC4/6 |003 |T004/T006/T007 |E01/E07 | Requirements/date/points/long text DOM đạt; geometry live pending |
|007 |US1-AC4,US2-AC3 |003 |T005/T007/T008/T009 |E01 | Feedback-only sau hạn + grade0/null component đạt; authenticated read pending |
|008 |US1-AC5/6 |003/004 |T005/T007 |E01 | Focus clock/new dueAt/action gating đạt; server deadline live pending |
|009 |US1-AC5,US2-AC5,US3-AC2 |004 |T005/T007/T010/T012/T014/T015 |E01 | Draft maps/collapse/switch/error/refresh/target-reset đạt component |
|010 |US2-AC1/2 |002/003 |T008/T009 |E01 | Submission selection/identity/body và foreign ID không fallback đạt |
|011 |US2-AC3 |003 |T003/T004/T008/T009 |E01/E07 | Blank→null, integer0, fractional invalid và feedback-only đạt component |
|012 |US3-AC3/4 |004/005 |T013–015 |E01 | Create/edit scalar merge + delete dialog Escape/no write đạt component; native/live pending |
|013 |US1-AC2/5,US2-AC5,US4-AC4 |004 |T005/T010/T012 |E01 | Empty/no-match/refresh error/retry/pending/success có context component đạt |
|014 |US1-AC5,US2-AC4,US3-AC3 |004 |T007/T009/T012/T015 |E01 | Ref-lock duplicate/disabled target và other draft giữ nguyên đạt component |
|015 |US2-AC4/5,US4-AC2 |004 |T010–012 |E01 | A/B reverse writes, stale/latest refresh, unmount/course replacement đạt component |
|016 |US4-AC1 |006 |T010/T011 |E01 | Deep-link/selection/back-forward/invalid IDs component đạt; browser refresh live pending |
|017 |US3-AC2/4/5,US4-AC3 |001/005 |T013/T014/T016/T021 |E01/E05 | Disclosure focus/Escape, dialog cancel, long text DOM đạt; full keyboard/native/bounds pending |
|018 |US4-AC5 |007/008 |T011/T017/T021/T022 |E01/E05 | Existing55 tests + source scope bảo toàn; full live lesson/document/quiz/auth/ADMIN pending |
|019 |US3-AC5,US4-AC3 |005/008 |T002/T016/T023 |E02/E03/E05 | CSS scope và dependency/backend invariants đạt; geometry chưa chạy |
|020 |US4-AC3/4/5 |007 |T017–023 |E01–08 | Automation đạt; desktop + authenticated HTTP thiếu evidence, tasks mở |
|021 |US4-AC5 |008 |T001/T023 |E05 |001/002 hashes và open tasks giữ nguyên |
|022 |US4-AC5,EC08 |007/008 |T002/T021/T022/T023 |E04/E05/E08 | Không live write/seed/delete/credential read; chưa xác định resource thử để nộp/chấm |

Coverage:22FR,21AC,8SC đều có task và evidence path. SC001/005 chưa có geometry/native desktop; SC002/003/004/006 mới có component coverage, không phải full live matrix; SC007 chưa đạt toàn bộ required acceptance; SC008 có scope evidence.

## Phần chưa chạy và điều kiện bên ngoài

- **Desktop live chưa chạy** tại1280×800/1440×900 zoom100% cho hai vai trò, không có screenshots/bounds mới. Computer Use tự dừng (E08). Không chạy fixture browser thay thế và không dùng ảnh cũ. Các tests long-content chỉ chứng minh DOM đủ dữ liệu, không chứng minh overflow/fold/font.
- **Authenticated HTTP/resource tests chưa chạy**: hiện không có phiên hợp lệ được kiểm tra hoặc resource thử cụ thể được xác định. User trả “Ok” cho câu hỏi tài nguyên nhưng chưa nêu tên/ID; không suy thành quyền dùng bất kỳ bài nộp thực nào. Nộp/chấm/create/edit live và từ chối authenticated owner/enrollment/ADMIN giữ pending.
- **Runtime regression rộng chưa chạy**: dashboard, lesson/document, quiz autosave/version/leave, account/auth/ADMIN mới có suite component hiện có + scope hashes, không live smoke. Không sửa lesson/quiz để vượt kiểm tra.
- **Integration suite không chạy**: script mặc định HTTP8080 trong khi stack hiện8081, và luôn register/provision/SQL cleanup Docker DB. Đã đọc flow; healthy không cấp phép cho những write/delete này. Không thay đích rồi tự chạy cleanup.
- Stack db/backend healthy, frontend8081 đang chạy image cũ. E04 chỉ phản ánh liveness/middleware của stack hiện có; E03 host build chưa được đưa vào runtime. Không deploy/rebuild stack để làm xanh nghiệm thu.

## Trạng thái tasks và converge

Sau implement/verify độc lập: T001–T020 và T023 có bằng chứng; T021/T022 giữ mở.

Converge chính thức đã chạy theo managed skill sau implement: prerequisite resolve đúng003; không có before/after hooks. Đối chiếu22FR,21AC,8SC,8EC,23tasks,8 quyết định D01–D08 và5 nguyên tắc constitution với source/tests/evidence hiện có. Không phát hiện thêm gap implementation từ những bằng chứng này; không suy thành full runtime pass.

| Finding | Gap / severity | Source | Bằng chứng thiếu | Task append |
| --- | --- | --- | --- | --- |
| F1 | partial / HIGH | FR002–018/020/022, SC001–007, T021, plan:D07 | Desktop thật hai vai trò/hai viewport, screenshots/bounds mới, keyboard/native dialog/full runtime regression | T024 |
| F2 | partial / HIGH | FR001/020/022, SC003/007, T022, plan:D07 | Phiên hợp lệ, owner/enrollment/ADMIN/cross-resource và nộp/chấm trên resource thử đã xác định | T025 |

Kết quả converge: **tasks_appended**,2partial/HIGH,0missing/contradicts/unrequested; chỉ append Phase8 vào tasks.md, không sửa task cũ/spec/plan/code trong bước converge. Không báo converged.

Đã quay lại implement/verify theo yêu cầu: prerequisite003 hợp lệ; checklist16/16 và14/14 đạt requirements quality, cả3 checklist hashes giữ nguyên. T024/T025 được đối chiếu với prerequisites nhưng không thể hoàn tất vì E08 và chưa xác định tài khoản/tài nguyên thử. Không tiếp tục browser control sau policy stop, không tự provision/write; không chạy lại tests khi không có source change mới. Các log cuối E01–03 vẫn là kết quả kiểm tra implementation hiện tại. Không append lặp task cho cùng external blocker chưa thay đổi.

**Hiện tại21/25 tasks hoàn tất**; T021/T022/T024/T025 mở, đại diện2 nhóm nghiệm thu còn thiếu và task tiếp nối của chúng. Feature003 **chưa hoàn tất**. Cần frontend implementation mới được phục vụ trong môi trường kiểm thử được phép, browser control hoạt động lại và phiên/tài nguyên thử hiện có được xác định trước khi hoàn tất desktop/HTTP acceptance rồi chạy converge lại. Giai đoạn implement/verify nêu trên không commit/push/PR/merge/deploy hoặc thay dữ liệu/schema/backend.

Cập nhật bàn giao source: người dùng sau đó yêu cầu commit và push phần feature đã làm được. Việc đóng gói source không thay đổi kết quả nghiệm thu:21/25 tasks hoàn tất,4 task trên vẫn mở, converge vẫn là tasks_appended. Không tạo PR hoặc deploy theo yêu cầu này; các log .artifacts vẫn là bằng chứng local được ignore.


## Acceptance continuation — 2026-11-02

Kết quả hiện hành của đợt nghiệm thu 001–007; các mục trạng thái trước đây được giữ làm lịch sử. Quyền provisioning/cleanup và automation credentials chỉ áp dụng stack riêng do yêu cầu nghiệm thu mới cấp, thay thế điều kiện thiếu tài nguyên/user-action trong báo cáo cũ; không đổi contract hoặc acceptance criteria.

**Kết quả: đạt phạm vi feature trên stack nghiệm thu riêng.** Hai vai trò, nội dung requirements/submission20.000 ký tự và feedback5.000 ký tự, vùng dài focus/scroll được. Nộp/cập nhật/chấm thật, grade0, feedback-only/null sau hạn, refresh lỗi giữ draft, responseA không ghi đè lựa chọn/draftB, create pending không gửi lặp, native delete cancellation, deadline interval và dispatched focus event trong browser thật. Back/forward/refresh giữ selection; focus-event test không được mô tả là thao tác OS focus. Cross-resource/role/owner/enrollment denial qua server.

Baseline HEAD c55d0054c1ffc029b5f65f0713034a273fdbfdc3, working tree ban đầu sạch; bản source được định danh bằng [source-integrity.json](../../.artifacts/acceptance-20261102/source-integrity.json). Browser Chrome 156 thực, fresh isolated contexts, viewport1280×800/1440×900, deviceScaleFactor1/visualViewport.scale1, zoom mặc định 100%, fonts loaded. HTTP127.0.0.1:8082/api, Compose lumina-acceptance-20261102, DB lumina_acceptance, volume/network riêng; không mutate stack local 8081. [Môi trường cuối](../../.artifacts/acceptance-20261102/environment-final.json).

Bằng chứng **A-FE**: frontend full5 service+184 component PASS, lint/build PASS; **A-BE**:38 backend tests PASS; **A-QUIZ**: production quiz regression được filter thực sự chọn (các file wrapper khác không được tính thành8 quiz cases). **H-INT**: [integration real HTTP/database](../../.artifacts/acceptance-20261102/integration-isolation-confirmed-http.json), cleanup0. Command/cwd/exit/log trong [commands.json](../../.artifacts/acceptance-20261102/commands.json). Component boundaries/races và source review bổ sung cho live, không được coi là từng biến thể đều chạy end-to-end.

**B003**: [browser checks](../../.artifacts/acceptance-20261102/browser-checks.json) theo prefix 003 và layout/current/final/fixed tương ứng; [screenshot PNG](../../.artifacts/acceptance-20261102/screenshots/) và bounds JSON cùng tên nằm trong evidence directory. Trạng thái tổng:280 records,277 PASS và3 historical failed assertions của harness; không xóa failed records. Wrong expected auth return/clipboard wording và capture cũ trước navigation/assets-ready đều có corrected checks; xem [harness-notes.json](../../.artifacts/acceptance-20261102/harness-notes.json). Ảnh lookup fixed-005-* mới thay cho ảnh nhãn bị tràn. Lỗi frontend full suite183/184 được giữ và sửa đúng async test lifecycle; xem [báo cáo chung](../../docs/acceptance-20261102.md).

### Task closure theo bằng chứng

| Task | Phạm vi đã review | Bằng chứng | Kết quả |
| --- | --- | --- | --- |
| T021 | Desktop/state/regression | A-FE + B003 + cross-feature live regression | Đạt toàn nhóm; continuation giữ trong đúng feature |
| T022 | Production HTTP/database/authorization | A-BE/A-QUIZ + H-INT + production role/resource denials | Đạt toàn nhóm; continuation giữ trong đúng feature |
| T024 | Desktop/state/regression | A-FE + B003 + cross-feature live regression | Đạt toàn nhóm; continuation giữ trong đúng feature |
| T025 | Production HTTP/database/authorization | A-BE/A-QUIZ + H-INT + production role/resource denials | Đạt toàn nhóm; continuation giữ trong đúng feature |

Không chuyển task sang feature khác. Các task converge trên là continuation của cùng nhóm nghiệm thu, được đối chiếu riêng trước khi đổi marker; nguyên văn task được giữ. [Closure ledger](../../.artifacts/acceptance-20261102/task-closures.json) giữ mô tả gốc/căn cứ từng ID.

### FR / US / AC / SC traceability

[Ma trận51 dòng](acceptance-20261102.csv) nối toàn bộ22 FR,21US/AC và8 SC → task → typed evidence → kết quả. Mapping FR/AC/SC kế thừa bảng traceability trong artifacts của chính feature; không đặt ID mới hoặc hạ tiêu chí. Những biên chỉ có component/source được nêu rõ trong narrative và báo cáo chung.

Source touch-points đã đối chiếu: `frontend/src/components/AssignmentsPanel.jsx`, `frontend/src/services/assignmentView.js`, `frontend/src/components/AssignmentsPanel.css` cùng production authentication/routes/Prisma. API/backend production/schema/migrations/dependencies không đổi. Checklist markers giữ nguyên. Spec Status được cập nhật; nội dung requirements/plan không bị sửa để hợp thức hóa code.

### Dữ liệu / giới hạn / convergence

[Owned inventory trước cleanup](../../.artifacts/acceptance-20261102/owned-before-cleanup.json):34 users,3 courses,9 lessons,4 assignments,3 submissions, 6 attempts, 59 chat messages và2 progress rows. [Cleanup](../../.artifacts/acceptance-20261102/cleanup.json) chỉ exact owned ID+canonical email; course API dọn upload, các bảng trở về 0; không drop/reset DB hoặc xóa volume. Integration tự dọn các ID riêng của mỗi lượt. Không lặp mutation demo 28 local.

Analyze read-only: không còn findings actionable, coverage30/30 FR+SC có task,21 AC được truy vết; constitution5 principles được giữ. Managed final converge: **converged**, 0 findings/0 tasks_appended; tasks.md giữ nguyên byte trong bước converge. [Kết quả từng feature](../../.artifacts/acceptance-20261102/converge-final.json). Không dùng converge thay runtime evidence. Public deploy/TLS/SMTP/backup/load/security vận hành chưa nghiệm thu.
