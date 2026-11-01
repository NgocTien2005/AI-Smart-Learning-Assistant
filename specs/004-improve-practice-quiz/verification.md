# Verification — Quiz004

2026-11-01. In progress; chưa hoàn tất acceptance.

## Baseline

Resolver trước specify trả003; script chính thức cấp004-improve-practice-quiz. Git branch không đổi. Working tree baseline clean,172tracked SHA256; status/diff/copy frontend-src và001–003 ở [baseline manifest](../../.artifacts/quiz-workspace-20261101/baseline/manifest.json). Không commit/stash/reset.

| Feature cũ | Tasks còn mở lúc bắt đầu |
| --- | --- |
|001 | T021/T022/T024/T025 |
|002 | T018/T019/T021/T022 |
|003 | T021/T022/T024/T025 |

Không chuyển hoặc đóng task/artifact cũ. Chỉ acceptance004 được đánh giá ở đây.

## Workflow

Đã đọc AGENTS/constitution1.0.0/workflow/Lumina và managed skills. Spec Kit1.2.3/Codex/PowerShell; official feature/template/plan/tasks resolver. Không init/upgrade. Không .specify/extensions.yml ở các bước; không hook áp dụng. Clarify0 câu hỏi sản phẩm,10taxonomy Clear, [review](checklists/review.md); câu trả lời tài nguyên “ok” không có ID.

Checklist generation unchecked rồi separate authorized review: requirements16/16, quiz-quality14/14. Implement đóng băng3checklist hashes. Analyze read-only/no-persist:20FR/7SC/17AC/7EC/23tasks/5principles, không gap quan trọng/unmapped task. Sau phát hiện encoding của PowerShell pipe, artifacts được ghi lại đúng nội dung dự kiến bằng UTF-8 writer/ASCII-escaped JSON và analyze đối chiếu lại; không giảm tiêu chí. Đây là lỗi tooling, không chứng cứ regression đỏ.

Regression thật trước application code: [red-tests-valid.log](../../.artifacts/quiz-workspace-20261101/red-tests-valid.log),15ca mới đều fail trước implementation. Lượt red-tests.log trước đó lỗi parse do encoding, không được tính là red behavior test. Sau đó bổ sung5ca gồm lost-acknowledgement đỏ trước sửa ([log](../../.artifacts/quiz-workspace-20261101/uncertain-write-red.log)). Kết quả cuối bên dưới là căn cứ bàn giao.

## File thay đổi

| File | Nội dung |
| --- | --- |
| frontend/src/components/PracticeQuizPanel.jsx | History/detail composition; per-attempt queue/version/pending, unknown acknowledgement, explicit recovery, flush/create/submit/open/read race guards; lesson-key wrapper |
| frontend/src/components/QuizHistory.jsx | Filter/count/selection/no-match/date/null0, current-history read retry |
| frontend/src/components/QuizCreateDisclosure.jsx | Mặc định đóng, giữ count, focus/Escape, pending/success lifecycle |
| frontend/src/components/PracticeQuizPanel.css | Scoped .practice-panel.quiz-workspace, desktop history/detail, typography/wrapping/focus; không global/mobile styles |
| frontend/src/__tests__/frontend.test.js |20 regression mới;3setup cũ mở disclosure trước create, không bỏ business assertions |
| specs/004-improve-practice-quiz/ | Spec/plan/research/model/contract/quickstart/checklists/tasks/verification |

## Evidence và kết quả

Các link .artifacts là bằng chứng local được ignore; không commit log/generated output. Không screenshot/bounds004, không lấy ảnh cũ làm live.

| ID | Kiểm chứng | Kết quả / giới hạn |
| --- | --- | --- |
| E01 | frontend/: npm test, [log](../../.artifacts/quiz-workspace-20261101/tests-final.log),2026-11-01 12:04 local | **PASS**, exit0:5Node service +94Vitest/jsdom/RTL component tests,0fail/skip.74tests cũ +20quiz mới. Fixtures/mock requests, không chứng minh DB/live UI. |
| E02 | frontend/: npm run lint, [log](../../.artifacts/quiz-workspace-20261101/lint-final.log) | **PASS**, exit0, không disable rule. |
| E03 | frontend/: npm run build, [log](../../.artifacts/quiz-workspace-20261101/build-final.log) | **PASS**, exit0, Vite8.2.2/57modules. Host build, chưa phục vụ trong runtime kiểm thử. |
| E04 |20 targeted quiz regressions, [log](../../.artifacts/quiz-workspace-20261101/quiz-tests-final.log) | **PASS component**. Bao phủ history/filter/empty/read-error/selection, stale reads, same-attempt no-op, queue A→B→A, newer answers/version, lost write ack, failed/no retry loop, conflict rebase/GET error/other-tab submitted, create/submit duplicate/flush/failure, discard/Escape, count/legacy0/long DOM, keyboard Space và URL back/forward/remount. |
| E05 | backend/: node --test test/quizAttempts.test.js test/studyQuiz.test.js, [log](../../.artifacts/quiz-workspace-20261101/backend-quiz-isolated.log) | **PASS**,9/9.5production-router tests với Prisma/user injection +4generator tests. Bao gồm owner/enrollment recheck/snapshot/version/concurrent submit/legacy/count; không chạy production authenticate hoặc database thật. |
| E06 |172baseline hashes/checklists/git diff --check, [scope](../../.artifacts/quiz-workspace-20261101/scope-final.json) | **PASS**:2tracked frontend files đổi,170tracked giữ nguyên,3source mới +004artifacts.001–003/backend/schema/dependency/constitution/managed files giữ nguyên.3checklist hashes frozen. |
| E07 | Fresh Docker/localhost8081, [runtime](../../.artifacts/quiz-workspace-20261101/runtime-status.json),2026-11-01T05:04:49Z | **BLOCKED**: daemon pipe unavailable; GET /api/health ECONNREFUSED.0protected HTTP checks,0write. Docker healthy ở khảo sát đầu trước gián đoạn không phải evidence hiện tại. |
| E08 | Fresh cua.getState | **BLOCKED**: browser access host unavailable,0browser tabs truy cập được; không quan sát quiz/screenshot/bounds. Không đọc credential/storage hoặc chiếm phiên Chrome không liên quan. |
| E09 | backend/: npm test -- --test-name-pattern="quiz", [log](../../.artifacts/quiz-workspace-20261101/backend-quiz-regression.log) | **FAIL**,exit1: hook teardown backend/test/auth.test.js35 gọi Server.close với ERR_SERVER_NOT_RUNNING khi chạy filter; source legacy không đổi. Production quiz case được chọn đã pass. E05 kiểm toàn bộ9case quiz/generator riêng; không che hoặc sửa test legacy ngoài scope. |
| E10 | Managed workflow/source contract review | **REVIEW**:20FR/17AC/7SC/7EC/23tasks/8design decisions/5principles; checklist30/30 đạt chất lượng sau review riêng, không là test pass. Contract giữ production path và predicate thật; không diễn giải requireStudent no-op là role guard. |

E04 keyboard radio ban đầu gặp giới hạn jsdom thiếu CSS.escape cho user-event Arrow simulation. Component kiểm Tab+Space/onChange thật; arrow keys/native modal/browser geometry vẫn thuộc runtime chưa chạy. ConfirmDialog dùng shim showModal/close đã có trong tests, không là native-browser proof. Long text DOM đầy đủ không chứng minh bounds/overflow/font.

Các lỗi kiểm chứng trong quá trình: encoding đã sửa;4selector test mới thiếu ordinal prefix đã sửa selector nhưng giữ business assertions; ca lost-acknowledgement xác nhận bug thật và được sửa bằng uncertain baseline, không skip validation. E01–03 là kết quả cuối sau source fix cuối.

## FR/US/AC/SC → task → evidence → kết quả

PASS component là giới hạn fixture/component; acceptance live không được suy từ tests hoặc source.

| FR | US/AC | SC | Task | Evidence | Kết quả / phần còn thiếu |
| --- | --- | --- | --- | --- | --- |
|001 |US4-AC4 |006/007 |T002/T022 |E05/E06/E10 | Predicate/fixture owner/enrollment đạt; authenticated HTTP/ADMIN hiện chưa chạy |
|002 |US1-AC1,US4-AC1 |001 |T005/T007/T013/T021 |E01–04 | Structure/disclosure component đạt; panel-top/fold desktop chưa chạy |
|003 |US1-AC2 |002 |T005/T006 |E01/E04 | Filter/count/selected-outside/no-match đạt component; live pending |
|004 |US1-AC1,US3-AC3 |002 |T005/T006/T014 |E01/E04/E10 | Sourced history/order-preservation/null0/legacy component+review; real history pending |
|005 |US1-AC3 |002 |T003/T007 |E01/E04 | No auto-create/open, same-ID không mất draft, resume đúng fixture |
|006 |US2-AC1/2 |003 |T008/T009 |E01/E04 |5states, older/pending/uncertain acknowledgement không false saved đạt fixture |
|007 |US2-AC1/2/5 |003/004 |T008/T009/T011/T016 |E01/E04/E05 |550ms queue/version/keys hidden/snapshot đạt component+router fixture; live pending |
|008 |US2-AC3 |003 |T008/T010 |E01/E04 | Failed giữ draft/no timer retry; conflict edits blocked, explicit rebase/load saved/GET errors đạt |
|009 |US2-AC4 |004 |T008/T010 |E01/E04 | Flush create/switch/close/parent leave; stay/discard/Escape component đạt; native/live pending |
|010 |US2-AC5 |004 |T008/T011 |E01/E04/E05 | Latest-save trước submit, duplicates/disabled/failure retain/result đạt fixture |
|011 |US3-AC1/2 |004/005 |T014/T015 |E01/E04 | Collapsed/count retention/focus/Escape/no opening write/pending/success đạt |
|012 |US3-AC2 |004 |T014/T016 |E01/E04/E05 |3..10/source422/actual fewer/no invented reopened request count đạt fixture+review |
|013 |US3-AC3/4 |002/004 |T014/T016 |E01/E04/E05 | Result0/legacy/source/keys-after-submit/back-history-no-write đạt fixture |
|014 |US1-AC4,US2-AC3/5,US3-AC2 |002/003/004 |T003/T005/T007/T010/T016 |E01/E04 | Empty/error/loading/retry/pending/success giữ detail/context đạt component |
|015 |US1-AC4,US2-AC2,US3-AC4,US4-AC3 |003/004 |T003/T004/T007–T012 |E01/E04 | Latest-open/history mutation/lesson remount/old response/queued write guarded đạt fixture |
|016 |US4-AC3 |006 |T012/T017 |E01/E04/E06 | Parent URL unchanged; back/forward/remount resume server-confirmed fixture đạt; real refresh pending |
|017 |US3-AC1,US4-AC2 |001/005 |T010/T012–T015/T021 |E01/E04/E08 | Tab/Space/disclosure focus/Escape/long DOM đạt; full native arrows/dialog/geometry pending |
|018 |US4-AC4 |006/007 |T002/T004/T012/T017/T022 |E01/E05/E06 |74existing frontend tests còn pass, shared flows/code unchanged; full runtime regression chưa chạy |
|019 |US4-AC4,EC07 |006 |T001/T002/T018–T023 |E01–E10 | Required frontend pass, backend filtered FAIL riêng; runtime/browser/resource prerequisites thiếu, tasks mở |
|020 |US4-AC4 |007 |T001/T002/T013/T017/T023 |E06/E10 | Frontend-only/desktop, old tasks/artifacts preserved, no dependency/backend/data writes/commit/deploy |

| SC | Trạng thái |
| --- | --- |
|001 | Implementation/source có; thiếu desktop screenshots/bounds/fold/overflow. |
|002 | Component fixtures đạt; chưa nghiệm thu lịch sử thật. |
|003 | Component races/recovery đạt; live concurrency chưa chạy. |
|004 | Component/router fixture đạt; safe live create/draft/submit/leave chưa chạy. |
|005 | Basic DOM keyboard/focus/dialog shim/long content đạt; desktop/native đầy đủ chưa chạy. |
|006 | Frontend bắt buộc đạt, isolated backend9pass; filtered backend command fail legacy; HTTP/UI runtime chưa đủ bằng chứng. |
|007 | Scope/hash/checklists đạt, không thay001–003 hoặc protected layers. |

## External blockers và tasks

Không live writes. Resource reply “ok” chưa xác định tên/ID tài nguyên thử; không suy thành quyền dùng bất kỳ attempt thật nào. Không provision/seed/reset/delete hoặc tạo tài nguyên cho ảnh/test. Integration script đã review: register/provision/SQL cleanup và HTTP8080 mặc định, Docker DB mục tiêu; hiện stack không healthy/không truy cập, chưa được phép cho các write/cleanup đó nên không chạy.

Desktop chưa chạy cả hai vai trò×hai viewport/zoom100%, chưa có screenshots/bounds mới hoặc geometry proof. Browser host unavailable; localhost8081 ECONNREFUSED, host build chưa được phục vụ. Không đưa fixture/ảnh cũ/source review thành live pass. Authenticated owner/enrollment/ADMIN/cross-attempt/invalid payload và draft/submit thực đều chưa chạy. Runtime regression dashboard/lesson/document/assignments/grading/account/auth chỉ có component suite và scope evidence hiện tại.

Trước converge: T001–T020 và T023 hoàn tất phần có evidence; T021/T022 giữ mở,21/23.

## Converge và lượt implement/verify tiếp nối

Managed speckit-converge đã chạy sau implement, resolver004 và hooks absent. Đối chiếu20FR/17AC/7SC/7EC/23tasks/8D/5principles theo artifacts và code/evidence. Không phát hiện implementation gap mới từ những bằng chứng này; không suy source/tests thành live pass.

| Finding | Gap/severity | Source | Work remaining |
| --- | --- | --- | --- |
| F1 | partial/HIGH | T021, FR002–018/019, SC001–006, plan:D01/D07/D08 | Fresh desktop two roles/two viewports, native keyboard/dialog/bounds/long-content/live regression |
| F2 | partial/HIGH | T022, FR001/007/018/019, SC003/004/006, plan:D08 | Healthy test runtime, identified existing safe resources and valid-session HTTP owner/enrollment/ADMIN/draft/submit |

Outcome **tasks_appended**: append T024/T025 vào Phase8.0missing/contradicts/unrequested,2partial/HIGH. Chỉ tasks.md được append trong converge; preimage được lưu từ verify trước đó và prefix byte comparison đạt. Không sửa task cũ/code/spec/plan/checklists trong converge.

Đã quay lại implement/verify: prerequisite004 hợp lệ; requirements16/16, quiz-quality14/14, review0/0 đều0unchecked và cả3hashes giữ nguyên. T024/T025 phụ thuộc browser/runtime/session/resource chưa có (E07/E08); không thể hoàn tất, không seed/provision/write. Source không thay đổi sau E01–03 nên không chạy lặp toàn bộ frontend checks chỉ vì cập nhật Markdown. Backend filtered failure E09 được giữ nguyên trong báo cáo, không sửa legacy test ngoài scope; E05 không thay authenticated runtime.

**Trạng thái cuối:21/25tasks hoàn tất. T021/T022/T024/T025 mở**, đại diện2nhóm nghiệm thu và task tiếp nối, không phải4tính năng mới. Feature004 **chưa hoàn tất nghiệm thu**, không báo converged. Không chạy vòng converge lặp để append trùng cùng external blockers chưa thay đổi. Cần test runtime phục vụ implementation mới, browser host khả dụng và phiên/tài nguyên thử cụ thể trước implement/verify/converge tiếp theo. Giai đoạn implement/verify nêu trên không commit/push/PR/merge/deploy.

Cập nhật bàn giao source: người dùng sau đó yêu cầu commit/push phần đã triển khai. Việc đóng gói source không đóng T021/T022/T024/T025 hoặc đổi outcome tasks_appended; backend filtered failure E09 và các giới hạn runtime vẫn được giữ trong báo cáo. Không tạo PR/deploy theo yêu cầu này. Logs .artifacts vẫn được ignore, chỉ có báo cáo bằng chứng được đưa vào source control.
