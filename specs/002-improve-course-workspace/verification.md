# Verification — 002 improve course workspace

Date: 2026-10-31. **Feature chưa hoàn tất nghiệm thu**. Kết quả dưới đây phân biệt component, browser fixture và app thật; checklist yêu cầu đã tick không chứng minh sản phẩm/tests đạt.

## Workflow và baseline

- Resolver chính thức xác nhận `specs/002-improve-course-workspace`; giữ Git branch hiện tại. Constitution 1.0.0, managed skills/templates/scripts và backend không thay đổi.
- Specify → clarify (0 quyết định thiếu) → plan → checklist → tasks → analyze → implement đã thực hiện. Analyze read-only ban đầu có 1 LOW: summary plan thiếu tên file copy422; sửa summary sau khi báo cáo, phân tích lại không còn xung đột quan trọng. Không có extensions.yml/hook đăng ký.
- Requirements checklist 16/16; custom workspace-quality 12/12 sau generation unchecked và lượt review riêng được ủy quyền. Markers không bị sửa trong implement.
- Baseline trước002: [manifest92 files](../../.artifacts/course-workspace-baseline/manifest.json), source copies, git-status.txt và git-diff.patch. [Final scope audit](../../.artifacts/course-workspace-baseline/final-scope.json) so hash từng file.
- Feature001 được giữ nguyên: **T021/T022/T024/T025 còn thiếu nghiệm thu**, không tick hoặc chuyển sang002. Các thay đổi dashboard/admin/AppLayout/tests001 có sẵn trong working tree được bảo toàn.

## Thay đổi trong002

| File | Thay đổi |
| --- | --- |
| frontend/src/pages/CourseWorkspacePage.jsx | Compact shell, description disclosure, selected/filter/ordinal/invalid state, reader actions, create integration và read/progress/create guards |
| frontend/src/components/LessonCreateDisclosure.jsx (mới) | Controlled disclosure; draft/File do page giữ; hidden/focus/Escape/disabled/field errors; không fetch |
| frontend/src/pages/CourseWorkspace.css (mới) | Scoped desktop shell và section lessons; typography/list/reader/long text/focus |
| frontend/src/components/DocumentAssistantPanel.jsx | Chỉ sửa copy lỗi422 cho đúng PDF text-layer/no OCR |
| frontend/src/__tests__/frontend.test.js | Thêm10 regression tests, cập nhật tên submit trong test overview có sẵn |

Không đổi backend, services/router/guards/quiz/assignments business logic, schema/migration/dependency/global CSS. CourseRoute vẫn key workspace theo courseId. Preview/summary/assistant thêm source key; quiz key/flush/version giữ nguyên.

## Bằng chứng và kết quả

Các đường dẫn `.artifacts/` bên dưới là bằng chứng local được Git ignore, không được đưa vào repository hoặc bản push. Các ảnh live có thể chứa dữ liệu phiên thử; reviewer cần tiếp cận bằng chứng đó qua môi trường local phù hợp.

| ID | Kiểm tra / đối tượng | Kết quả |
| --- | --- | --- |
| E01 | `npm test`, cwd frontend, [log](../../.artifacts/course-workspace-baseline/tests.log) | **PASS**: 5 service +55 component tests, 0 fail/skip; Vitest/jsdom/RTL, fetch mocked |
| E02 | `npm run lint`, cwd frontend, [log](../../.artifacts/course-workspace-baseline/lint.log) | **PASS**, exit0 |
| E03 | `npm run build`, cwd frontend, [log](../../.artifacts/course-workspace-baseline/build.log) | **PASS**, exit0; Vite8.2.2,51 modules |
| E04 | Current source, isolated Chrome156, API fixture interception, two roles×two viewports×normal/long | **PASS fixture geometry**, 8 new captures; [bounds](../../.artifacts/course-workspace-browser/bounds.json), [script](../../.artifacts/course-workspace-browser/check.mjs) |
| E05 | Same isolated fixture browser: Enter/Space open, Escape close/focus return, File retain, confirmed mock201 collapse/reset, no-match keeps reader | **PASS fixture native keyboard/File**. Not a real upload, not OS file-picker/dialog acceptance |
| E06 | Existing Chrome STUDENT session, real localhost8081 after refresh; course16, lessons28/75 | **PASS observed subset**: list/read, no-match reader retention, next lesson, extractive summary short-source state; back/forward/refresh preserve lessonId/panel. [AX evidence](../../.artifacts/course-workspace-live/student-read.json), [window screenshot](../../.artifacts/course-workspace-live/student-reader-window.png) |
| E07 | Current Docker/HTTP probes | db/backend healthy, frontend running8081; `/api/health` returns status ok; [10 negative HTTP probes](../../.artifacts/course-workspace-live/unauthenticated-http.json): missing/invalid dummy bearer on /me, admin users, course16, lesson28 document/summary all401. Authenticated course/summary read renders in E06, so real resource read works; liveness alone is not treated as DB proof |
| E08 | 92 baseline hashes, source inventory and `git diff --check` | **PASS scope review**: only3 existing source files differ from baseline +2 new source files;001/backend/constitution/managed files unchanged; no whitespace errors |
| E09 | Authenticated Chrome INSTRUCTOR session, course15 lesson76, responsive emulation and `window.innerWidth/innerHeight/devicePixelRatio`; Chrome page zoom reset with Ctrl+0 | **PASS exact instructor viewport** at 1280×800 and 1440×900 CSS px, DPR≈2; PNG dimensions 2560×1600 and 2880×1800. [bounds](../../.artifacts/course-workspace-live/instructor-viewport-bounds.json), [1280×800 capture](../../.artifacts/course-workspace-live/instructor-course15-1280x800-zoom100.png), [1440×900 capture](../../.artifacts/course-workspace-live/instructor-course15-1440x900-zoom100.png). See E14 for Student |
| E10 | Real INSTRUCTOR disclosure and keyboard interactions on course15; existing file was selected locally but not uploaded in the final interaction | **PASS observed subset**: disclosure opens by click/Enter; title/body draft and selected local file survive collapse/reopen; Tab/Shift+Tab moves between fields; Escape closes and restores focus to “Thêm bài học”; file then cleared. Native picker opened. Does not prove Student or all viewport/dialog/error cases |
| E11 | Real INSTRUCTOR owner session on course15; existing attached course text was previewed/downloaded; assignment section viewed read-only | **PASS observed subset**: owner preview and protected download succeeded; assignment/submission list rendered; Dashboard/Account and lesson URL/history navigation were revisited. No grading/quiz writes; cross-role denial and Student enrollment access remain pending. A separate accidental QA lesson write is recorded below |
| E12 | Real INSTRUCTOR session on course15 at 1440×900; direct browser accessibility observations | **PASS observed subset**: mixed-case title query `vÒNg` returned the matching lesson with ordinal04 while the previously selected reader and outside-filter notice remained; mixed-case content query `DiScLoSuRe` returned the QA lesson whose body contains that word; a nonmatching query showed the no-match message and retained the reader. Search was cleared afterwards. Other filters and roles remain pending |
| E13 | Fresh read-only runtime check, 2026-10-31 14:54 +07: `docker compose ps --format json` and `GET /api/health` through localhost8081 | db/backend running and healthy; frontend running on8081; health returned `status: ok`. This confirms current liveness/container health, not protected resource authorization or the integration suite |
| E14 | Authenticated Chrome STUDENT session, course16 lesson28, 2026-10-31 14:58–14:59 +07; DevTools bounds and fresh viewport captures after Ctrl+0 | **PASS normal-data subset** at both required CSS viewports, DPR≈2; title/search/first item/reader/action rectangles recorded, `scrollWidth` equals viewport and title font Lexend 26px/700 was loaded. [bounds](../../.artifacts/course-workspace-live/student-viewport-bounds.json), [1280×800](../../.artifacts/course-workspace-live/student-course16-1280x800-zoom100.png), [1440×900](../../.artifacts/course-workspace-live/student-course16-1440x900-zoom100.png). With both lessons completed, “Chưa hoàn thành” showed no match and retained the selected reader with notice. Full keyboard/long-data/race/other-route matrix remains pending |
| E15 | Existing Docker containers automatically restarted after Docker Desktop was started; subsequent backend startup logs reviewed | Backend startup ran `prisma migrate deploy`; logs report 10 migrations found and **No pending migrations to apply**. Backend/db then reported healthy and `/api/health` returned `ok`. No integration suite was run |

E01 final run at12:47:55 local. E02/E03 were rerun after the final source/style change; later edits are evidence/artifact updates only. Initial red component run exposed7 missing/new behavior failures before implementation; final E01 supersedes them. Geometry initially failed on a long lesson title; two-line list title with full accessible name/focus expansion and compact section spacing corrected it; all8 final captures passed. Diagnostic `long-before-fix.png` has an incorrect viewport and is **not** acceptance evidence.

E04 normal/long screenshots: [student1280](../../.artifacts/course-workspace-browser/student-1280-normal.png), [student1440](../../.artifacts/course-workspace-browser/student-1440-normal.png), [instructor1280](../../.artifacts/course-workspace-browser/instructor-1280-normal.png), [instructor1440](../../.artifacts/course-workspace-browser/instructor-1440-normal.png), [long instructor1280](../../.artifacts/course-workspace-browser/instructor-1280-long.png). All use viewport scale1 and current loaded fonts; fonts.check true, H1 computed700 26px Lexend. Long fixture: course120, lesson160, description4000, body≈36000 plus unbroken1000-character token; 100000 content boundary is tested in E01, not claimed as a browser capture.

| Fixture /1280×800 | Search top | First item bottom | Reader heading bottom | Horizontal overflow |
| --- | --- | --- | --- | --- |
| STUDENT normal | 470.30 | 669.30 | 505.30 | none |
| STUDENT long | 552.59 | 772.59 | 647.59 | none |
| INSTRUCTOR normal | 511.30 | 631.30 | 546.30 | none |
| INSTRUCTOR long | 593.59 | 734.59 | 688.59 | none |

1440×900 also passes; full rectangles in E04. These prove fixture geometry, not the complete live acceptance matrix.

## FR / US / AC / SC → tasks → evidence

PASS here is limited to the evidence type shown. “Partial” means required live/regression evidence remains; it does not lower the criterion.

| Requirement | US/AC | SC | Task | Evidence | Result / remaining |
| --- | --- | --- | --- | --- | --- |
| FR001 | US4-AC4 | SC006 | T012/T014/T019 | E01 actual route guards deny ADMIN course/STUDENT admin; E07 unauth401, E08 unchanged server; E11 instructor owner read | Component PASS; live Student enrollment and denied cross-role matrix pending |
| FR002 | US1-AC1,US4-AC1 | SC001 | T002/T004/T013/T018 | E04 fixture bounds; E09/E14 exact live viewports and screenshots | Both-role normal-data viewport subset PASS; instructor element bounds and long-data live matrix pending |
| FR003 | US1-AC2/5 | SC002 | T003/T004 | E01 filter/ordinal/no-match tests; E06 no-match; E12 instructor title/content case and ordinal; E14 Student incomplete filter | Component and observed live subset PASS; full filter combinations pending |
| FR004 | US1-AC3 | SC002 | T003/T004 | E01 selected/filter/URL; E05/E06/E12/E14 reader retained with outside-filter notice | PASS observed subset |
| FR005 | US1-AC4 | SC002 | T003/T004/T018 | E01 invalid/no-selection/prevnext; E06 next/back/forward/refresh panel; E11 lesson route/history revisit | PASS observed subset; full deep-link/sections matrix pending |
| FR006 | US2-AC1,US3-AC5 | SC001/004 | T004/T007/T013 | E01 management to settings; E04 long-reader layout; E09/E14 live instructor/student shell/list/reader | Component/fixture and normal-data live layout subset PASS; full matrix pending |
| FR007 | US2-AC2/3 | SC004 | T006/T007/T019 | E01 stale preview, summary out-of-order, quiz tests; E06 summary; E11 instructor owner preview/download | Owner protected read PASS; Student/enrollment and denied/error permission cases pending |
| FR008 | US2-AC4 | SC004 | T007 | E08 copy-only review; disclosure text-layer/no OCR/limits; E06 extractive source state | Copy review PASS; no new AI capability |
| FR009 | US3-AC1/2 | SC003 | T009/T010/T011 | E01 draft/File/section remount/focus; E05 Enter/Space/Escape/File; E10 live instructor disclosure/focus | Component/fixture and instructor live subset PASS; full instructor viewport/error cases pending |
| FR010 | US3-AC3 | SC003 | T009/T011 | E01 normalized title/content/order/file-only multipart and invalid no write; E10 native picker opened | Component PASS; live normalized validation/server-error lifecycle pending |
| FR011 | US3-AC4 | SC003 | T009/T011 | E01 deferred duplicate/success503/focus outside; E05 mock201/reset; E11 unintended create visibly appeared | Component/fixture PASS; accidental write is not controlled acceptance; duplicate/error lifecycle still pending |
| FR012 | US1-AC5,US2-AC5 | SC004 | T003/T008/T014 | E01 missing progress disabled/no progressbar, errors/retry, pending states; E06 no-match/summary empty | Component PASS; live full async/error set pending |
| FR013 | US2-AC5,US4-AC3 | SC004 | T005/T006/T008/T011/T014 | E01 keyed course A/B late GET, progress delayed correctid, preview stale, pending create duplicate; E08 mounted/read guards | Component PASS; live request races pending |
| FR014 | US4-AC1/2 | SC005 | T010/T012/T013/T014/T018 | E01 focus/labels/selected; E04/E05 keyboard/long; E10 instructor keyboard/focus/dialog | Partial: Student and full keyboard/dialog matrix at both live viewports pending |
| FR015 | US2-AC3 | SC004 | T006/T007/T011/T014 | E01 integrated quiz flush failure/stay/discard, URL unchanged until decision; unchanged quiz version/conflict tests; E11 assignment page read-only | Component PASS; live quiz autosave/version/leave dialog pending |
| FR016 | US4-AC4 | SC001/006 | T002/T012/T013/T018 | E01 route marker changes; E08 all selectors scoped, global CSS unchanged | Static/component PASS; live outside-route CSS captures pending |
| FR017 | US4-AC4 | SC006 | T012/T014/T020 | E01 session/guard/assignments/grade regressions; E08 backend/router/quiz/schema hashes unchanged; E11 assignment read-only | Partial: Student/ADMIN live role boundaries and grading regression pending |

Coverage: all17FR, all19AC and all6SC have a task and evidence path. SC001/003/004/005/006 retain live acceptance gaps; SC002 has live reading evidence but full filter/deep-link matrix is incomplete. No SC is claimed complete from unit/fixture alone.

## Runtime limitations / outstanding acceptance

- E14 records the last confirmed STUDENT session on course16 after the instructor session in E09–E12. After a restart, browser control could not determine the current Chrome URL with enough confidence to continue; the current authenticated session is not confirmed. No credential, token, or browser storage was read.
- E09 and E14 record exact live CSS viewports and fresh screenshots for each role at both required sizes after Ctrl+0. E14 also records selected element rectangles and loaded font; E09 records viewport dimensions only. Screenshots are 2× CSS size because DPR≈2. Long-data checks remain fixture-only; full live async/error/race/outside-route matrix remains incomplete.
- E10 opened the native file picker and tested disclosure draft/focus behavior. During the earlier dialog interaction, Enter submitted the create form; the live app now contains a server-created lesson titled “QA draft only 2026-10-31” with local test text and an attached sample text document in course15. Course15 has one enrolled learner, so the lesson is visible in that course. It was not deleted because this task forbids deletion; no further write has been sent. This accidental write is not counted as controlled success/retry validation.
- E11 confirms owner preview/download for an attached course text and read-only assignment rendering. Student enrollment access, denied cross-role document access, real quiz autosave/version/leave behavior, and grading writes remain unverified. No actual grading or quiz write was sent.
- `npm run test:integration` **not run**: script provisions/registers and SQL-cleans data against its Docker DB; user forbids autonomous provision/seed/delete. Healthy Docker alone does not authorize that cleanup. No backend code changed.
- E15 records the later Docker restart and migration-startup check. Existing source checks were not rerun because source did not change; prior E01/E02/E03 results remain the recorded results.

## Task and convergence status

T001–T017 and T020 have implementation/automation/documentation evidence above. T018/T019/T021/T022 remain unchecked; E09–E14 close observed live subsets, not the full interaction/resource acceptance matrix.

Converge outcome **tasks_appended**: 17FR,19AC,6SC,8EC,20 existing tasks,8 design decisions and5 constitution principles assessed. No confirmed new source gap; two HIGH partial verification gaps (F1 desktop/native/outside-route matrix, F2 protected resources/role matrix) appended as T021/T022 in Phase8, without rewriting old tasks or code. No mandatory hooks configured. Result is **18/24 complete**, with T018/T019/T021/T022 open; these are two outstanding acceptance areas plus their traceable convergence continuations.

Returned to implement → verify for Phase8: gate requirements16/16 and workspace12/12 remains read-only. E07 missing/invalid-token HTTP checks and E11 owner preview/download are recorded. No source changed and successful frontend suites were not repeated without a reason. Converge is not reported clean and does not certify the missing Student, denied-access, quiz, or grading runtime evidence.


## Acceptance continuation — 2026-11-02

Kết quả hiện hành của đợt nghiệm thu 001–007; các mục trạng thái trước đây được giữ làm lịch sử. Quyền provisioning/cleanup và automation credentials chỉ áp dụng stack riêng do yêu cầu nghiệm thu mới cấp, thay thế điều kiện thiếu tài nguyên/user-action trong báo cáo cũ; không đổi contract hoặc acceptance criteria.

**Kết quả: đạt phạm vi feature trên stack nghiệm thu riêng.** Hai vai trò ở cả hai viewport với title/course/content dài; selected ngoài filter vẫn đọc được, progress được server xác nhận, File object qua disclosure và upload thật, keyboard/Escape/focus. URL/deep link/refresh/back, protected text/PDF preview và download; quiz pending flush giữ URL trước acknowledgement. Races course/unmount và biên validation có component evidence; API owner/enrollment/ADMIN denial là production HTTP.

Baseline HEAD c55d0054c1ffc029b5f65f0713034a273fdbfdc3, working tree ban đầu sạch; bản source được định danh bằng [source-integrity.json](../../.artifacts/acceptance-20261102/source-integrity.json). Browser Chrome 156 thực, fresh isolated contexts, viewport1280×800/1440×900, deviceScaleFactor1/visualViewport.scale1, zoom mặc định 100%, fonts loaded. HTTP127.0.0.1:8082/api, Compose lumina-acceptance-20261102, DB lumina_acceptance, volume/network riêng; không mutate stack local 8081. [Môi trường cuối](../../.artifacts/acceptance-20261102/environment-final.json).

Bằng chứng **A-FE**: frontend full5 service+184 component PASS, lint/build PASS; **A-BE**:38 backend tests PASS; **A-QUIZ**: production quiz regression được filter thực sự chọn (các file wrapper khác không được tính thành8 quiz cases). **H-INT**: [integration real HTTP/database](../../.artifacts/acceptance-20261102/integration-isolation-confirmed-http.json), cleanup0. Command/cwd/exit/log trong [commands.json](../../.artifacts/acceptance-20261102/commands.json). Component boundaries/races và source review bổ sung cho live, không được coi là từng biến thể đều chạy end-to-end.

**B002**: [browser checks](../../.artifacts/acceptance-20261102/browser-checks.json) theo prefix 002 và layout/current/final/fixed tương ứng; [screenshot PNG](../../.artifacts/acceptance-20261102/screenshots/) và bounds JSON cùng tên nằm trong evidence directory. Trạng thái tổng:280 records,277 PASS và3 historical failed assertions của harness; không xóa failed records. Wrong expected auth return/clipboard wording và capture cũ trước navigation/assets-ready đều có corrected checks; xem [harness-notes.json](../../.artifacts/acceptance-20261102/harness-notes.json). Ảnh lookup fixed-005-* mới thay cho ảnh nhãn bị tràn. Lỗi frontend full suite183/184 được giữ và sửa đúng async test lifecycle; xem [báo cáo chung](../../docs/acceptance-20261102.md).

### Task closure theo bằng chứng

| Task | Phạm vi đã review | Bằng chứng | Kết quả |
| --- | --- | --- | --- |
| T018 | Desktop/state/regression | A-FE + B002 + cross-feature live regression | Đạt toàn nhóm; continuation giữ trong đúng feature |
| T019 | Production HTTP/database/authorization | A-BE/A-QUIZ + H-INT + production role/resource denials | Đạt toàn nhóm; continuation giữ trong đúng feature |
| T021 | Desktop/state/regression | A-FE + B002 + cross-feature live regression | Đạt toàn nhóm; continuation giữ trong đúng feature |
| T022 | Production HTTP/database/authorization | A-BE/A-QUIZ + H-INT + production role/resource denials | Đạt toàn nhóm; continuation giữ trong đúng feature |

Không chuyển task sang feature khác. Các task converge trên là continuation của cùng nhóm nghiệm thu, được đối chiếu riêng trước khi đổi marker; nguyên văn task được giữ. [Closure ledger](../../.artifacts/acceptance-20261102/task-closures.json) giữ mô tả gốc/căn cứ từng ID.

### FR / US / AC / SC traceability

[Ma trận42 dòng](acceptance-20261102.csv) nối toàn bộ17 FR,19US/AC và6 SC → task → typed evidence → kết quả. Mapping FR/AC/SC kế thừa bảng traceability trong artifacts của chính feature; không đặt ID mới hoặc hạ tiêu chí. Những biên chỉ có component/source được nêu rõ trong narrative và báo cáo chung.

Source touch-points đã đối chiếu: `frontend/src/pages/CourseWorkspacePage.jsx`, `frontend/src/pages/CourseWorkspace.css`, `frontend/src/components/DocumentPreview.jsx` cùng production authentication/routes/Prisma. API/backend production/schema/migrations/dependencies không đổi. Checklist markers giữ nguyên. Spec Status được cập nhật; nội dung requirements/plan không bị sửa để hợp thức hóa code.

### Dữ liệu / giới hạn / convergence

[Owned inventory trước cleanup](../../.artifacts/acceptance-20261102/owned-before-cleanup.json):34 users,3 courses,9 lessons,4 assignments,3 submissions, 6 attempts, 59 chat messages và2 progress rows. [Cleanup](../../.artifacts/acceptance-20261102/cleanup.json) chỉ exact owned ID+canonical email; course API dọn upload, các bảng trở về 0; không drop/reset DB hoặc xóa volume. Integration tự dọn các ID riêng của mỗi lượt. Không lặp mutation demo 28 local.

Analyze read-only: không còn findings actionable, coverage23/23 FR+SC có task,19 AC được truy vết; constitution5 principles được giữ. Managed final converge: **converged**, 0 findings/0 tasks_appended; tasks.md giữ nguyên byte trong bước converge. [Kết quả từng feature](../../.artifacts/acceptance-20261102/converge-final.json). Không dùng converge thay runtime evidence. Public deploy/TLS/SMTP/backup/load/security vận hành chưa nghiệm thu.
