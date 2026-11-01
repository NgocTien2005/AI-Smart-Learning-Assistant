# Verification — Local Document Study005

2026-11-01. **Implemented frontend; feature acceptance incomplete.** Final full frontend suite fails on the same unrelated quiz history test observed before edits. Required live desktop/HTTP evidence is unavailable.

## Baseline and workflow

Clean tree at65341d991268b79540a6548cfc2d3cf5ec60aaad,186 tracked files. Hash manifest/source copies: .artifacts/document-study-20261101/baseline.json and baseline/. Actual secret environment files/credentials were not read. Official resolver initially selected004; official create-new-feature.ps1 allocated005-improve-document-study. Actual Git branch remainsmain and is independent of resolver feature identity.

Read AGENTS.md, constitution1.0.0, workflow and relevant Lumina/managed skills before each phase. Spec Kit1.2.3 Codex/PowerShell sequential; extensions.yml absent at pre/post checks, no hooks to execute. No installation, initialization or upgrade.

Specify/clarify:18FR,19AC,7SC,7EC,4stories;0 product questions, no unresolved ambiguity. Requirements checklist16/16; standard reviewer checklist generated0/14 then separately reviewed14/14 with evidence. All checklist hashes frozen/read-only during implementation.

Plan generated research/data-model/contracts/quickstart and8decisions. One read-only research agent used as explicitly required by managed plan Phase0. Analyze was strict read-only/no-persist:25FR+SC obligations,23tasks,100% task coverage,0 critical/high/ambiguity/duplication/unmapped findings. No remediation necessary.

## Prior features — separate open acceptance inventory

| Feature | Open task IDs | Remaining area |
| --- | --- | --- |
|001-improve-role-dashboards |T021/T022/T024/T025 | Desktop/HTTP and convergence continuation |
|002-improve-course-workspace |T018/T019/T021/T022 | Desktop/protected resources and continuation |
|003-improve-assignment-workspace |T021/T022/T024/T025 | Desktop/safe submit-grading HTTP and continuation |
|004-improve-practice-quiz |T021/T022/T024/T025 | Desktop/safe quiz HTTP and continuation |

Their spec/tasks/verification were read, not modified, closed or transferred. Hash comparison confirms all tracked001–004 artifacts unchanged.

## Changed files

| File | Result |
| --- | --- |
|frontend/src/components/DocumentAssistantPanel.jsx | Readable history/compact composer; independent read/send guards; immediate duplicate gate; edit-generation draft safety; bounded50 ID reconciliation; stable scroll/latest/focus; honest recovery/history provenance |
|frontend/src/components/LessonSummaryPanel.jsx | Keyed source/lesson scope, current-read cleanup, retry lock, known revision mismatch recovery, distinct source/empty/error states and only supplied metadata/pages |
|frontend/src/components/DocumentStudyPanels.css | New styles scoped to the two panel roots; long content, existing visual palette, compact layout and focus |
|frontend/src/__tests__/frontend.test.js | Existing tests preserved byte-for-byte except import insertion;27 new actual component/router regressions |
|specs/005-improve-document-study/ | Spec/plan/research/data-model/contracts/quickstart/checklists/tasks and this evidence report |

No App/router, CourseWorkspacePage, shared request guard/client, session, quiz implementation, backend/schema/migration/dependency/Docker/constitution/managed skill or earlier feature edits. README conflicts recorded in research.md with source paths, not silently resolved.

## Evidence and checks

| ID | Command / evidence | Outcome and limits |
| --- | --- | --- |
|E00 | frontend npm test before application edits; [baseline log](../../.artifacts/document-study-20261101/tests-baseline.log) | **FAIL**,5 service pass;93 component pass/1 fail of94. Quiz history test cannot find0/1 điểm, original line1425. |
|E01 | Fresh runtime probes/browser inventory; [availability](../../.artifacts/document-study-20261101/runtime-availability.json) | **Unavailable**: Docker Linux engine pipe absent; latest health8080/8081/3000 timeout;0 browser providers, browser access host unavailable, no relevant Lumina window. |
|E02 | Safe-resource question/reply | User replied “Ok” without course/lesson/role identification. No designated resources; no live writes/authenticated tests. |
|E03 | Tests before corresponding implementation: [US1 red](../../.artifacts/document-study-20261101/tests-us1-red.log), [US2 red](../../.artifacts/document-study-20261101/tests-us2-red.log), [US3 red](../../.artifacts/document-study-20261101/tests-us3-red.log), [anchor red](../../.artifacts/document-study-20261101/tests-anchor-red.log) | Expected failures6,3,6,1 respectively establish missing hierarchy/race/draft/source/relative-anchor behavior. |
|E04 | Final frontend npm test; [final log](../../.artifacts/document-study-20261101/tests-final.log) | **FAIL**, exit1.5 service tests pass;120 component pass/1 fail of121. All27 new tests and93 existing component tests pass; same pre-existing quiz history failure now line1426. Full suite remains failed. |
|E05 | frontend npm run lint; [final log](../../.artifacts/document-study-20261101/lint-final.log) | **PASS**, exit0; no rules disabled. |
|E06 | frontend npm run build; [final log](../../.artifacts/document-study-20261101/build-final.log) | **PASS**, exit0; Vite8.2.2/58modules. Host build, not a running deployed image. |
|E07 | backend node --test test/studyAssistant.test.js test/lessonText.test.js; [log](../../.artifacts/document-study-20261101/source-utilities.log) | **PASS**,5 utility tests. Local lookup/source behavior only; no middleware/HTTP/DB proof. |
|E08 | Production source trace/contracts | Owner/enrollment/auth/private-history predicates inspected in backend/src/routes/courses.js/authenticate.js/schema.prisma; unchanged. Source review only. |
|E09 | Baseline hash/checklist/unchanged-test-prefix, placeholder/link and git diff checks | Scope integrity and frozen checklist comparison; see final integrity result below. Not live behavior. |

Intermediate full suite before the final anchor regression passed120/120 component tests plus5service tests: [retained log](../../.artifacts/document-study-20261101/tests-before-anchor.log). That does not replace E04. The unrelated baseline failure is intermittent: quiz test awaits the always-mounted history region then synchronously queries a score before its read necessarily settles. No quiz code/test assertion was changed to mask it.

US1 six cases passed, US2 eight passed, summary eight including two existing passed, workspace four passed in targeted checkpoints. Final full suite includes three additional near-bottom/summary-long/relative-anchor cases. The relative-anchor test first failed when reload-status layout movement altered absolute offsets, then passed after using region-relative offsets. Only final current results are used for acceptance.

## FR/US/AC/SC → task → evidence → result

AC IDs below use the full USn-ACm scheme in spec.md. “Fixture pass” means actual React components with mocked HTTP/jsdom, not current live UI/server.

| FR | US / acceptance | SC | Tasks | Evidence | Result |
| --- | --- | --- | --- | --- | --- |
|001 |US4-AC4 |006/007 |T002/T016/T022 |E04/E08 | Frontend role regression/source unchanged; authenticated server matrix not run |
|002 |US1-AC1;US4-AC2 |001/005 |T005/T006/T017/T021 |E04/E05/E06 | Hierarchy DOM/CSS checks pass; real desktop bounds not run |
|003 |US1-AC2 |002/003 |T005/T006/T021 |E04 | Initial/reload/empty/error retention fixture pass |
|004 |US1-AC3 |002 |T005/T007/T021 |E04 | Both response orders and single confirmed reply fixture pass |
|005 |US1-AC5 |002/006 |T002/T007/T022 |E04/E08 | Latest50/dedup/provenance fixture/source pass; private live history not run |
|006 |US1-AC4 |002/005 |T005/T008/T021 |E04 | Older/near-bottom/relative anchor/latest focus fixture pass; native scroll not run |
|007 |US2-AC1 |003/005 |T009/T012 |E04 | Trimmed boundary validation and keyboard fixture pass |
|008 |US2-AC2 |003 |T009/T010/T012 |E04 | Same-tick duplicate gate and editable pending fixture pass |
|009 |US2-AC3 |002/003 |T009/T010 |E04 | Newer/edit-away-back retained, unchanged draft cleared fixture pass |
|010 |US2-AC4 |003/006 |T009/T011/T022 |E04/E08 | Failure/draft/read-only recovery fixture pass; safe actual POST persistence not run |
|011 |US2-AC5 |003/004 |T002/T011/T015 |E04/E07/E08 |422/local textual no-match distinct fixture/utility pass |
|012 |US2-AC6 |002/006 |T010/T016 |E04 | Mounted draft, context/close/remount and URL panel lifetime fixture pass |
|013 |US3-AC1 |004 |T002/T013/T015/T017 |E04/E07/E08 | Document/manual/unknown source, truncation/optional pages fixture pass; no invented chat provenance |
|014 |US3-AC2/3 |004 |T013–T015 |E04 | Loading/points/empty/unavailable/error/retry/duplicate pending fixture pass |
|015 |US3-AC4;US4-AC1 |002/004 |T004/T009/T010/T013/T014/T016 |E04 | Late read/send/error, lesson/revision/close and mismatch fixture pass; course isolation also retains existing parent key/source contract |
|016 |US4-AC2/3 |001/005 |T008/T012/T015–T017/T021 |E04–E06 | DOM keyboard/focus/long-text and CSS pass; geometry/native dialog/browser keyboard not run |
|017 |US4-AC4 |006 |T002/T016/T021/T022 |E04/E08 | Parent back/forward/direct panel links, both UI roles and quiz stay/discard fixtures pass; full live regression not run |
|018 |All19 AC |007 |T001/T003/T018–T023 |E00–E09 | Evidence/limitations recorded; prior features preserved; feature not accepted |

## Success criteria status

| Criterion | Current evidence / outstanding work |
| --- | --- |
|SC001 | Long DOM text/scoped CSS exist; both viewport bounds/overflow/readability not run (T021). |
|SC002 | Controlled races, draft identities, dedup and scroll fixtures pass; corresponding current live interactions not run. |
|SC003 | Boundaries/duplicates/failures/recovery fixture pass; safe live send not run (T022). |
|SC004 | Summary state/source/revision fixture matrix passes; current live source variants not run (T021/T022). |
|SC005 | DOM labels/Tab/Enter/latest focus and concise messages pass; visible CSS focus/native scrolling/dialog evidence not run (T021). |
|SC006 | Router/quiz-guard fixtures/source authority retained; refresh/current browser/backend deny and regression matrix not run (T021/T022). |
|SC007 | Traceability/status/reasons present; missing checks remain open rather than inferred as success. |

## Live evidence not run and safeguards

No fresh screenshots or bounds at1280×800/1440×900/100% zoom; neither fixture scroll metrics nor old screenshots establish layout. jsdom showModal/close shim in existing dialog tests is not browser-native evidence. E01 blocks current UI, and E02 blocks authenticated safe writes.

Not run: real-role history/send/reload/source-change races, source variants/long content/scroll/keyboard, refresh/back/forward/deep links, dashboard/lesson/protected document/assignment-grading/quiz/account-auth/ADMIN live regression, owner/enrollment/other-user/private-history denials and safe lookup persistence. No token/password/credential values read or printed.

Integration not run: Docker stack unavailable, current HTTP/DB targets cannot be verified, and backend/scripts/integration-check.mjs provisions users/resources then performs Docker SQL-delete cleanup not authorized here. Do not substitute mocks for these checks. Schema/dependency/Docker rebuild/migration checks are not applicable because those files are unchanged.

## Tasks and convergence

Before convergence: T001–T020 and T023 are evidenced implementation/check-execution/documentation tasks (21/23); T021 desktop and T022 HTTP remain open. T018 means the required full suite was executed and reported, not that its unrelated failure is waived.

Convergence assessment and append-only result are recorded below after the managed step.


### First converge and implementation continuation

Managed converge assessed18FR/7SC/19AC/7EC/23tasks/8plan decisions/5principles against current scoped code and evidence, without Git/diff/history. Findings: F1 desktop partial/HIGH, F2 HTTP partial/HIGH, F3 plan D01 body typography partial/LOW (15px instead of16px). Outcome **tasks_appended**, Phase8 T024–T026. Only tasks.md appended during the step; preimage prefix byte comparison passed.0missing/contradicts/unrequested; no constitution violation.

Returned to managed implement: resolver005, checklists16/16 and14/14, review0/0 with all hashes unchanged. T026 changed only the two scoped reading text rules to16px. Build rerun passed, exit0 (E06 latest log,58modules). JS/tests did not change after E04; no unrelated suite rerun to seek a green result. Typography remains source/build evidence, not desktop visual acceptance.

T024/T025 still require E01/E02 external prerequisites; no safe writes/integration attempted. A second converge assesses the resulting source below.


### Second converge and final continuation

Second managed converge assessed the resulting scoped source and26existing tasks, with the same18FR/7SC/19AC/7EC/8decisions/5principles. F3 is satisfied by16px source and rebuilt output; F1/F2 remain partial/HIGH because E01/E02 are unchanged.0missing/contradicts/unrequested; no new code gap identified from the inspected scope. Outcome **tasks_appended**, Phase9 T027/T028, tracing the two live-evidence gaps through earlier tasks. Prefix byte comparison passed; only tasks.md was appended during converge.

Returned again to implement/verify: official prerequisites resolve005, frozen requirements16/16 and study-quality14/14 remain unchanged,0 unchecked. T027/T028 cannot execute with absent runtime/browser/designated resources; no independent implementation task remains. No further duplicate convergence loop is run while external conditions are unchanged. This is **not converged** and not a completed feature.

**Final task state:22/28 complete.** Open T021/T022, T024/T025 and T027/T028 are original desktop/HTTP gates and their append-only continuations, representing two outstanding acceptance groups. T026 is complete. Final npm test remains failed as E04; lint/build and utility tests passed. Full desktop/HTTP/database evidence remains not run with reasons above.

No commit/push/PR/merge/deploy; no seed/reset/delete/provision or secret access. All initial tracked changes outside the three intended source/test files remain untouched, and001–004 artifacts/checklists are preserved. Logs/manifests in .artifacts are local ignored evidence, not committed screenshots or shared CI proof.


Final E09 integrity result: [manifest](../../.artifacts/document-study-20261101/integrity-final.json) confirms186 baseline tracked files checked, only the three intended existing source/test files changed, all001–004 hashes and checklist hashes unchanged, original test prefix preserved,0 missing local Markdown links,0 unresolved placeholders, and git diff --check exit0. Four application files plus11 feature artifacts make15 changed/new files in scope. No generated build/dependency/secret output is tracked.

## Source handoff authorization

The user subsequently requested committing and pushing the work completed for this feature. This authorizes packaging the frontend and feature artifacts; it does not change acceptance:22/28 tasks complete, T021/T022/T024/T025/T027/T028 open, converge outcome tasks_appended, final full frontend suite failed on the unchanged baseline quiz history test, and current desktop/HTTP checks not run. No acceptance task or checklist marker is changed for this handoff. Local ignored evidence remains outside the commit; no PR or deployment is requested.
