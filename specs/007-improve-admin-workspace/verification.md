# Verification — ADMIN007

Updated 2026-11-02 (Asia/Bangkok). **Frontend implementation and required automated checks passed. Current authenticated desktop checks and the specifically authorized name change/restoration now have live evidence. Full feature acceptance remains incomplete.** This is not a converged/feature-complete claim.

## Changed files

| File | Change |
| --- | --- |
| [AdminPage.jsx](../../frontend/src/pages/AdminPage.jsx) | Verified ADMIN/generation-keyed workspace; compact list and optional selected editor; per-account drafts/locks/outcomes; search/page reconciliation; explicit403 recovery and existing native confirmations |
| [AdminWorkspace.css](../../frontend/src/pages/AdminWorkspace.css) | New account-administration-only desktop styles,16px primary text, compact unselected rows, side editor, long wrapping and focus/disabled states |
| [frontend.test.js](../../frontend/src/__tests__/frontend.test.js) |24 added component/router cases; existing ADMIN fixtures adapted for verified context and explicit selection; every original ADMIN assertion retained |
| This007 directory | spec/plan/research/data-model/contracts/quickstart, requirement checklists/review, tasks and this evidence report |

Shared App/AppLayout/SessionContext/api.js/ConfirmDialog, all006 account implementation, backend/API/schema/migrations/packages/lockfiles/Docker and001–006 artifacts are unchanged relative to the captured baseline. The shared test file preserves every unrelated existing test AST, including006.

## Evidence and check results

Local logs and fixture helpers are ignored artifacts in [.artifacts/admin-workspace-20261101](../../.artifacts/admin-workspace-20261101/). Fixtures are not live API/database success.

| ID | Check / evidence | Result |
| --- | --- | --- |
| E00 | [baseline.json](../../.artifacts/admin-workspace-20261101/baseline.json), original source copies; HEAD e4ccbf2913ed5f3fee16b6eb98bb42bd4eb92a53;198 tracked+13 untracked=211 hashes, existing006 dirty work included | Captured before any application edit |
| E01 | Frontend baseline npm test, [tests-baseline.log](../../.artifacts/admin-workspace-20261101/tests-baseline.log) | PASS5 service+160 component cases; historical quiz-history flake not reproduced/fixed |
| E02 | Tests-first [admin-red.log](../../.artifacts/admin-workspace-20261101/admin-red.log), final full [tests-final.log](../../.artifacts/admin-workspace-20261101/tests-final.log) |18 initial missing-behavior failures; final full npm test PASS5 service+184 component cases,0 skipped/failures |
| E03 | Frontend npm run lint, [lint-final.log](../../.artifacts/admin-workspace-20261101/lint-final.log) | PASS exit0; no disabled rules/guards/tests |
| E04 | Frontend npm run build, [build-final.log](../../.artifacts/admin-workspace-20261101/build-final.log) | PASS exit0,61 modules; final build assets differ from existing8081 deployment |
| E05 | [runtime.json](../../.artifacts/admin-workspace-20261101/runtime.json), [stack.json](../../.artifacts/admin-workspace-20261101/stack.json), [runtime-final.json](../../.artifacts/admin-workspace-20261101/runtime-final.json) |8081 /api/health200; Compose backend/db healthy/frontend running; read-only DB metadata lumina_lms/public succeeds.8080/3000 unavailable. Liveness/metadata is not authenticated feature success |
| E06 | [http-readonly.json](../../.artifacts/admin-workspace-20261101/http-readonly.json): real GET /api/admin/users without token and with invalid synthetic token | PASS401 AUTH_REQUIRED/SESSION_INVALID; no user/list leaked. No live mutation |
| E07 | [browser-observations.json](../../.artifacts/admin-workspace-20261101/browser-observations.json), fresh fixture bounds/PNGs below; current source rendered by temporary Vite harness isolated on127.0.0.1:5177 | Real embedded-browser fixture DOM/keyboard observations only; synthetic ADMIN and in-memory fetch, no live API |
| E08 | [integrity-final.json](../../.artifacts/admin-workspace-20261101/integrity-final.json),211 baseline hashes, checklist freeze, Espree AST/assertion comparison, local Markdown references/IDs/placeholders and git diff --check | PASS onlyAdminPage/shared test changed versus baseline, plus new scoped CSS/007 docs; all prior task files and unrelated tests preserved |
| E09 | Native Chrome follow-up: fresh DevTools viewport PNGs and DOM bounds, listed below | Clear component-fixture captures at both required CSS viewport sizes; does not certify authenticated API behavior or the full keyboard/state matrix |
| E10 | [live-verification-server.json](../../.artifacts/admin-workspace-20261101/live-verification-server.json), [runtime-continued.json](../../.artifacts/admin-workspace-20261101/runtime-continued.json) | Current unmocked frontend served temporarily at127.0.0.1:5178 with same-origin /api proxy to existing8081; source/CSS200, health200, anonymous ADMIN401. Existing8081 deployment remains unchanged |
| E11 | [cors-proxy-recovery.json](../../.artifacts/admin-workspace-20261101/cors-proxy-recovery.json), [browser-cors-recovery.json](../../.artifacts/admin-workspace-20261101/browser-cors-recovery.json) | Temporary proxy CORS defect reproduced and corrected; after restart, requests with browser Origin reach health200 and protected endpoints401. A real browser POST to login with empty JSON reaches production validation400. This does not prove successful login |
| E12 | [live-admin-identity-list.json](../../.artifacts/admin-workspace-20261101/live-admin-identity-list.json), [live-role-boundaries.json](../../.artifacts/admin-workspace-20261101/live-role-boundaries.json), [live-resource-denials.json](../../.artifacts/admin-workspace-20261101/live-resource-denials.json) | Actual demo ADMIN63, INSTRUCTOR29 and STUDENT28 authenticated through normal UI after explicit user instruction; production /me and role/resource-denial checks PASS. No credential values are saved in evidence |
| E13 | [live-ui-checks.json](../../.artifacts/admin-workspace-20261101/live-ui-checks.json), [live-final-summary.json](../../.artifacts/admin-workspace-20261101/live-final-summary.json), fresh chrome-live PNGs/bounds below |60 recorded browser checks:58 PASS,2 failed harness assertions retained and corrected by explicit follow-up checks. Actual Chrome156 at1280×800/1440×900, default100% zoom, DPR1/visual scale1; real production requests, no mock responses |
| E14 | [live-authorized-name-write.json](../../.artifacts/admin-workspace-20261101/live-authorized-name-write.json), W01–W08 in E13 | Exactly two successful PATCH28 requests: authorized rename then exact restoration. Actual saved-but-reload-failed, GET-only retry, pending duplicate suppression, independent-account draft and filtered-out editor PASS. Final server confirms original names, roles and active states |
| E15 | [live-existing-study-resources.json](../../.artifacts/admin-workspace-20261101/live-existing-study-resources.json), E13 A01–A04/S01–S10/R01–R03 | Live read-only account/password disclosure/recovery and learning-flow regressions PASS in their recorded scope. No profile/password/quiz/grading/lookup business mutation; full write/leave/revocation matrix remains open |

Intermediate runs: one new empty-result fixture incorrectly used a helper's default populated list; corrected to explicit empty array. A new route assertion attempted to serialize a React DOM node on failure, producing an allocation error; the same null check now compares a Boolean. The failed full run is retained in tests-first-failed.log; the completed final full suite passes. An intermediate root-directory invocation lacked frontend test configuration; route-final.log records it, and it is not counted as a required-package pass. No unrelated baseline failure was hidden or fixed. No validation/test assertion was removed to obtain PASS.

## Spec Kit workflow

Installed CLI/integration1.2.3, Codex/PowerShell/sequential. Official resolver identified006; official create-new-feature allocated007-improve-admin-workspace. No init/upgrade, Git branch switch, constitution1.0.0 rewrite or managed skill/script edit. extensions.yml absent at pre/post steps; no applicable hooks.

Specify:18FR,17AC,7SC. Clarify found no critical unresolved question: preserve current per-ID mounted-page drafts and q/page controls, no unsupported filter or URL contract. Plan used lumina-ui-design and one read-only managed Phase0 research dispatch; contract traced through production app/middleware/Prisma. See [research.md](research.md) and [contracts/admin.md](contracts/admin.md), including documentation conflicts with file paths.

Built-in requirements16/16. Custom admin-quality generated0/16, then a separate user-authorized evidence review set16/16. All3 checklist files frozen before implement and unchanged afterwards. Checked quality criteria do not mean tests/live acceptance passed.

Analyze ran strictly read-only/no-persist via official resolver:25 obligations(18FR+7SC),17AC,21 tasks;100% covered,0 unmapped/ambiguous/duplicate/critical/high findings. Implementation uses lumina-react-ui and lumina-verify; no shared006/session contract changes. Existing ignore rules/private packages were checked without adding publishing/setup work.

## Current desktop / browser evidence

**Historical E07–E11 observations follow.** They describe earlier fixture/capture/login limitations at the time of those runs. The authenticated continuation below supersedes their statements about missing login/resources and unavailable live captures; their failed attempts remain evidence rather than being recast as passes.

CUA host unavailable; Orca embedded browser fallback succeeded after loading orca-cli. The new localhost8081 tab displayed the normal unauthenticated sign-in screen. No credential storage was read, and no real password/token was retrieved/entered.

A separate, visibly labeled **COMPONENT FIXTURE — synthetic ADMIN; no live API/database writes** renders the actual current AdminPage/AppLayout/SessionProvider and styles. The temporary harness/fixtures live only in ignored artifacts, never production source. Native browser viewport commands requested1280×800 and1440×900 with device scale1; observed visualViewport.scale1. Browser evidence is not an authenticated server-role test or definitive browser-zoom certification.

| Fixture observation | Evidence / result |
| --- | --- |
| List,1280×800 | [bounds](../../.artifacts/admin-workspace-20261101/bounds-fixture-1280-list.json), [PNG](../../.artifacts/admin-workspace-20261101/screenshots/fixture-1280-list.png); main1180px, document scroll/client width1265, no horizontal overflow, no automatic editor |
| List,1440×900 | [bounds](../../.artifacts/admin-workspace-20261101/bounds-fixture-1440-list.json), [PNG](../../.artifacts/admin-workspace-20261101/screenshots/fixture-1440-list.png); main1180px, scroll/client width1425, no horizontal overflow |
| Selected editor,1280×800 | [bounds](../../.artifacts/admin-workspace-20261101/bounds-fixture-1280-editor.json), [PNG](../../.artifacts/admin-workspace-20261101/screenshots/fixture-1280-editor.png); selected editor measured inside main; heading focused; controls reachable by scroll/keyboard |
| Selected editor,1440×900 | [bounds](../../.artifacts/admin-workspace-20261101/bounds-fixture-1440-editor.json), [PNG](../../.artifacts/admin-workspace-20261101/screenshots/fixture-1440-editor.png); same scoped grid, no horizontal overflow |
| Native confirmation | [bounds](../../.artifacts/admin-workspace-20261101/bounds-fixture-1280-dialog.json), [PNG](../../.artifacts/admin-workspace-20261101/screenshots/fixture-1280-dialog.png); real dialog520px, initial focusHủy; Escape canceled and restored row action focus, no write |
| CSS cascade | Initial actual computed primary paragraph14px exposed inherited dashboard rule; scoped fix yields16px. Compact full-width rows and optional editor preserve hierarchy |
| Capture limitation | PNGs visibly repeat/clip portions under embedded viewport emulation; retained honestly, not accepted as complete visual proof. Pointer click did not reliably activate the intended control; DOM focus followed by native Enter did. Cause not diagnosed/changed in application scope |

No images are old screenshots; none are claimed as live ADMIN acceptance. Existing8081 JS asset /assets/index-BVzSWY_8.js differs from current build /assets/index-eMRUy7m0.js. No deployed stack/asset was replaced. Authenticated007 layout, complete visual/zoom acceptance and live regressions remain open.

### Continuation: native Chrome and current frontend

The continuation used lumina-speckit/lumina-verify and computer-use. Official no-persist resolution still selected007; hooks remain absent, checklist gates remain16/16+16/16, with no marker edits. No application code changed during this continuation, so the completed full test/lint/build results above remain the latest relevant runs; they were not repeated for evidence-only documentation.

Native Chrome rendered the same visibly labeled synthetic fixture. Its built-in **Capture screenshot** command produced clear viewport images without the repeated/clipped portions observed in E07. Native device-toolbar fields were set to1280×800 and1440×900. The Chrome menu was visually observed at100% browser zoom after Ctrl+0; this is separate from the device toolbar's Fit to window preview. Captured DOM metrics report visualViewport.scale1 and devicePixelRatio approximately2, so PNG pixel dimensions are2560×1600 and2880×1800 respectively. All bounds below are CSS pixels. These are fresh source-fixture captures, not authenticated production account screenshots.

| Fixture state | Fresh screenshot | Fresh bounds |
| --- | --- | --- |
|1280×800 list | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-fixture-1280-list.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-1280-list.json) |
|1280×800 selected long identity | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-fixture-1280-editor.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-1280-editor.json) |
|1280×800 entire editor after scroll | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-fixture-1280-editor-scrolled.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-1280-editor-scrolled.json) |
|1280×800 native confirmation | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-fixture-1280-dialog.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-1280-dialog.json) |
|1440×900 list | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-fixture-1440-list.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-1440-list.json) |
|1440×900 selected long identity | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-fixture-1440-editor.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-1440-editor.json) |
|1440×900 entire editor after scroll | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-fixture-1440-editor-scrolled.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-1440-editor-scrolled.json) |

Observed: main width1180; selected list approximately642.21 and editor513.79; no horizontal overflow at either size; primary text16px; long identity wraps, zero submissions displays0, and role/name/save controls remain reachable by scrolling. The native dialog is520px wide and its initial active DOM element isHủy. This adds E09 fixture visual evidence for FR-004/007/009/015/016, US1-AC1/3, US3-AC1, US4-AC1/2 and SC-001/006 through T006/T008/T012/T014–T016/T019/T022. It does not close those tasks' required live counterparts.

A native Escape attempt after switching between detached DevTools and the browser did **not** yield a dismissed dialog in the follow-up bounds: [observation](../../.artifacts/admin-workspace-20261101/bounds-chrome-1280-after-native-cancel.json). Keyboard delivery was synthetic/unverified and browser-versus-page focus was not established, so this attempt is not a successful native cancel test or a diagnosed application failure. E07's separately observed cancel remains scoped to that earlier fixture session. Complete native keyboard/visible-focus acceptance stays open. No confirmation was submitted and no account state changed.

Current application assets are now available independently of the older8081 frontend: the temporary ignored [Vite verification config](../../.artifacts/admin-workspace-20261101/vite.live-verification.config.mjs) serves the real frontend source at **http://127.0.0.1:5178**, with an empty API base and existing /api proxy to **http://localhost:8081**. It loads no env files, adds no mock, and changes no package, app source, Docker service or database. HTTP source checks confirm current AdminPage/scoped CSS and the injected empty API base. Health200 and anonymous administration401 are the only live endpoint outcomes added here; no authenticated operation was exercised.

In native Chrome, opening localhost:8081/admin displayed /auth with a session-expired notice. Opening the current5178/admin then displayed its normal /auth sign-in screen. No credential value or browser storage was retrieved, copied or entered. Chrome is left at **http://127.0.0.1:5178/auth**, ready for the user to sign in normally with an existing permitted test ADMIN. The5178 verification server remains running for that step; the synthetic5177 fixture server is stopped. A pending question requests the existing ADMIN ID, target ID and specific permitted new name; the earlier “Ok” supplied none of these. Real role/status changes remain user-performed.

### Recovery after CORS report and Orca restart

The user reported an access-denied error while attempting to use5178. The temporary verification proxy forwarded **Origin: http://127.0.0.1:5178** to the existing backend; production CORS in [src/app.js](../../backend/src/app.js) rejected it with403 **Origin không được phép truy cập** before authentication. Health/admin requests using deployed Origin localhost:8081 instead returned200/401. The earlier E10 shell checks omitted Origin and therefore missed this verification-environment defect; they did not establish that browser login worked.

Only the ignored temporary Vite config changed: its loopback /api reverse proxy now supplies the existing deployed origin **http://localhost:8081** upstream. This keeps backend CORS configuration, authentication, role checks, public APIs and application source unchanged; it neither grants ADMIN nor bypasses token/resource authorization. No application dependency, Docker service or database was changed.

Orca restarted after this config fix and before browser inspection finished. Recovery confirmed the corrected config persisted, the5178 process had stopped, and the existing embedded tab remained with no loaded URL. Only the needed verification server was restarted; the same tab was reused at **http://127.0.0.1:5178/auth**. No Spec Kit generation, implementation, full tests or fixture captures were repeated.

Fresh E11 requests through5178 with the browser Origin now return health200, /auth/me401 AUTH_REQUIRED and /admin/users401 AUTH_REQUIRED. An actual embedded-browser POST **/api/auth/login** with empty JSON and no credentials returns400 **Email và mật khẩu là bắt buộc**. This confirms browser POST reaches the production validation boundary rather than the prior CORS403; it is not successful account authentication and made no account mutation.

The reused tab shows the normal login form with no verified ADMIN session. Native Chrome is no longer running. No password/token/browser credential was retrieved, guessed, copied or entered. The interrupted question was replaced with a request for the user to sign in normally in that tab, without sending credentials in chat. Existing ADMIN/target IDs and specific permitted name edits remain undesignated. T019/T020/T022/T023 remain open and the latest converge outcome remains tasks_appended.

### Authenticated continuation and authorized restoration — 2026-11-02

The user explicitly instructed self-login. Existing publicly documented local demo accounts in README were used through the normal login form: ADMIN63, INSTRUCTOR29 and STUDENT28. No credential store, cookie/token storage, private environment file or real password was retrieved. The documented demo password was entered only into the normal form and is not copied into evidence or this report. The original Orca tab authenticated as ADMIN63 remains available; its session was not logged out during cleanup.

Reliable capture used the installed Chrome156 browser in a separate temporary profile with isolated off-record contexts, native CDP mouse/keyboard input and actual current5178 frontend requests to the existing8081 production API. This is a real browser/runtime check, although Chrome ran headless. It is distinct from the synthetic5177 fixture. New-profile default zoom100%, CSS viewport1280×800 and1440×900, devicePixelRatio1 and visualViewport.scale1 were recorded. No dependency was installed. Browser network emulation produced real failures/delays; no successful API response was fabricated. The request recorder retained only method/path/status/timing or error name, never headers, tokens or request bodies.

| Current live desktop state | Screenshot | Bounds / result |
| --- | --- | --- |
|1280×800 list | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-live-1280-list.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-live-1280-list.json); list first, no automatic editor/overflow |
|1280×800 long unsaved name and keyboard focus | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-live-1280-editor-keyboard.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-live-1280-editor-keyboard.json);80-character draft, visible3px focus, reachable fields |
|1280×800 real native confirmation | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-live-1280-dialog.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-live-1280-dialog.json); modal, initial Hủy, Escape cancels/restores trigger; no lock request |
|1440×900 list | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-live-1440-list.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-live-1440-list.json); no horizontal overflow |
|1440×900 selected editor after scroll | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-live-1440-editor-scrolled.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-live-1440-editor-scrolled.json); name/role/save reachable |
|1440×900 actual offline error | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-live-1440-offline-error.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-live-1440-offline-error.json); previous result labeled, retry available |
|1440×900 confirmed save and failed reload | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-live-1440-saved-reload-failed.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-live-1440-saved-reload-failed.json); success identifies28, failed read distinct, editor29/draft retained |
|1440×900 restored target leaves search | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-live-1440-restored-no-match.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-live-1440-restored-no-match.json); no-match, editor closed, no automatic replacement |
|1280×800 confirmed outcome plus reload error | [PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-live-1280-confirmed-reload-error.png) | [JSON](../../.artifacts/admin-workspace-20261101/bounds-chrome-live-1280-confirmed-reload-error.json); long network message wraps |
|Restored final list, both sizes | [1280 PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-live-1280-final-restored.png), [1440 PNG](../../.artifacts/admin-workspace-20261101/screenshots/chrome-live-1440-final-restored.png) | [1280 bounds](../../.artifacts/admin-workspace-20261101/bounds-chrome-live-1280-final-restored.json), [1440 bounds](../../.artifacts/admin-workspace-20261101/bounds-chrome-live-1440-final-restored.json) |

E13 L01–L16 establish actual editor/close/input focus, invalid-name blocking, exact80 validity, separate per-account drafts, no-match/recovery, native Escape with zero write, offline read/retry and delayed search reconciliation. L18–L24 cover account route, refresh, deep link, back/forward resetting local admin state, actual ADMIN course denial and logout while a read is pending. R01/R02 verify both nonADMIN roles receive production403 and the protected admin route renders no workspace; R03 verifies all three roles are denied another instructor's existing course6. The current ADMIN's course15 content returns403. Production GET /api/courses returns200 with an empty relation-scoped list for ADMIN; that does not grant course-content access.

For the authorized write test, user consent specifically named STUDENT28, original “Trần Gia Bảo”, temporary “Trần Gia Bảo (kiểm thử 007)”, then exact restoration. ADMIN63 was verified immediately before the first save. The first PATCH returned a real200; its delivery to the component was held while another account29 was selected and an unsaved name draft entered. Switching Chrome offline before releasing that real response caused the actual follow-up GET to fail. The UI retained the target28 saved confirmation separately from reload failure and did not overwrite29's draft. Repeated save activation produced only one PATCH; target fields/save/lock were disabled while pending. GET retry sent no PATCH. The first retry GET was later aborted by an intentional search change; W08 separately waited for a complete retry200, current results and preserved draft.

The second and final PATCH28 restored “Trần Gia Bảo” while searching “kiểm thử 007”. The confirmed new result no longer matched, so the editor closed and no other account was selected. An authoritative GET afterwards confirmed28 STUDENT/active and29 INSTRUCTOR/active with their exact original names. Account29's draft remained unsaved. There were exactly two successful business writes, both name-only28; no role/status/password/quiz/grading/lookup mutation, data seed/reset/delete or resource provisioning.

**Failed harness records retained:** E13 contains60 records,58 passing and2 false, not60 passes. L17 incorrectly expected all ADMIN course endpoints to403; production source permits a relation-scoped empty list. L17a/L17b and the actual existing-course L22 check correct the test expectation without changing the contract. W02's initial target-control query omitted the required control result; W02a's corrected selector confirmed one held PATCH200 and disabled name/save/lock. Neither initial failed assertion is silently removed or presented as a product pass. Other discarded attempts (network emulation before Network.enable, Enter without char delivery, treating inline document preview as a dialog, and malformed wait selectors) were corrected in the harness before their explicit accepted checks; they are not successful application checks or diagnosed application defects.

E15 A01/A02 verifies all three roles' account identity, password disclosure focus/autocomplete, close/unmount and trigger focus, without entering a password. A03/A04 blocks the genuine /me network request and verifies recoverable retry without new login. S01–S10 reads the existing course15/lesson27, protected TXT preview, extractive summary/sourceRevision3, local lookup history and draft-preserving read reload, quiz history, existing student submission and instructor grading form. These use existing data only; no question, quiz answer, grade, profile or password was submitted. They do not certify live autosave/conflict/dirty-quiz leave or password/session revocation. Screenshots named chrome-live-student-* and chrome-live-instructor-* remain in E13's evidence directory.

The disposable test Chrome ADMIN was logged out and that browser process/contexts closed after verification. The original Orca ADMIN tab and current5178 verification server remain available. The existing8081 deployment/containers/data model are unchanged. Application source did not change during this continuation; completed E02/E03/E04 remain the latest relevant full test/lint/build, with no unnecessary rerun for evidence Markdown.

## Traceability: FR / US / AC / SC → task → evidence

PASS is scoped to the evidence stated. E02 is component/service evidence; E12–E15 are live evidence. Missing live transitions remain explicit and do not become passes because a component test or screenshot exists.

| Acceptance | FR | SC | Tasks | Evidence | Result |
| --- | --- | --- | --- | --- | --- |
| US1-AC1 list identity/role/status before optional editor | FR-004/015 | SC-001/006 | T004/T006/T008/T015/T019/T022 | E02; E13 L01/L07/L13 and both current desktop list PNGs | Component and live PASS |
| US1-AC2 search/page/current results | FR-002/012 | SC-003 | T004/T007/T008/T019 | E02 query/page/clamp; E13 L09/L16 delayed current-query result | Component PASS; live search PASS, multipage unavailable with4accounts |
| US1-AC3 explicit one editor/close/switch/local drafts | FR-004/007 | SC-003/006 | T004/T006/T008/T019 | E02; E13 L01–L10; E14 W03/W07 | Component and live close/switch/search/draft PASS |
| US1-AC4 loading/empty/no-match/error/accurate totals/read retry | FR-003 | SC-004/007 | T004/T007/T008/T019 | E02; E13 L09/L14–L16; E14 W03/W08 | Component PASS; live loading/no-match/error/retry PASS; no truly empty dataset available |
| US2-AC1 supported editable fields and exact validation | FR-005/006/015 | SC-002/005 | T002/T004/T009/T020 | E02 exact2/80/invalid/400; E13 L04/L05/L07; E14 successful allowed name update | Component PASS; live invalid/80 UI and name save PASS; complete server validation matrix open |
| US2-AC2 per-account duplicate/conflicting locks/independent targets | FR-008 | SC-002/003 | T004/T009/T011/T019 | E02 concurrent writes; E14 W02a onePATCH/disabled controls and W03 other-account draft | Component PASS; live duplicate/pending/selection PASS; concurrent successful different-account writes not authorized |
| US2-AC3 retained draft/field versus409/operation/uncertain/no replay | FR-007/011 | SC-002/003 | T004/T009–T011/T020 | E02 role conflict/400/404/network503/malformed; E14 read failure retains draft and no replay | Component PASS; live read recovery PASS; rejected/uncertain business writes not exercised |
| US2-AC4 target-specific saved versus reload error/GET-only retry | FR-010/013 | SC-003/004 | T004/T010/T011/T019/T020/T022/T023 | E02; E14 W03–W08 real PATCH200/offlineGET/complete retry200/other draft | Component and specifically authorized live name flow PASS |
| US2-AC5 filtered selection/clamp/no automatic replacement | FR-012/013 | SC-003/004 | T004/T007/T011/T019 | E02 page clamp/oldGET; E14 W05 actual restoration removes current match | Component PASS; live filtered-out editor PASS; live page clamp unavailable |
| US3-AC1 native target confirmation/cancel/focus/no routine name prompt | FR-009/016 | SC-002/005/006 | T004/T012/T014/T019/T020 | E02; E13 L11/L12; E14 two name saves without confirmation | Component and live native lock-dialog cancel/focus/name-save PASS; role/status confirmation success user action NOT RUN |
| US3-AC2 toggle-only payload/draft/server restrictions | FR-001/005/008 | SC-002/005 | T002/T004/T012/T014/T020/T023 | E02; E12/E13 L17a self403/ID400/notfound404; production contract | Component/source and live listed denials PASS; linked-role/status mutation/revocation open |
| US3-AC3 authorization loss/expiry/logout/replacement/late results | FR-013/014 | SC-003/005 | T004/T005/T013/T014/T019/T020 | E02 late401/403/new-session outcomes; E13 L24 read/logout; E15 A03/A04 network /me recovery | Component and live listed recovery/logout cases PASS; live pending-write session loss/revocation NOT RUN |
| US3-AC4 nonADMIN admin-denial/ADMIN course boundary/no new capabilities | FR-001/014/018 | SC-005/006 | T002/T004/T005/T014/T020/T023 | E02/E06; E12/E13 R01–R03/L17b/L20/L22 and document403 | Component and authenticated live route/API/resource denial PASS |
| US4-AC1 two desktop sizes/long content/reachable controls | FR-016 | SC-001 | T004/T015/T016/T019/T022 | E02 long/missing0; E13 clear current chrome-live PNGs/bounds; E14 both-size network messages | Component and live sampled desktop cases PASS; no accepted use of clipped fixture captures |
| US4-AC2 labels/focus/keyboard/native dialog/messages | FR-009/016 | SC-006 | T004/T012/T014–T016/T019/T022 | E02 associations; E13 L01–L06/L11/L12/L15, visible focus3px; E14 status/alert | Component and live recorded keyboard/native-dialog/message cases PASS |
| US4-AC3 local route lifetime/006+LMS regression | FR-017 | SC-003/006 | T004/T005/T016/T017/T019/T022 | E02 full184 components; E13 L18–L24; E15 A01–A04/S01–S10 | Component PASS; live read/navigation/account disclosure/recovery PASS; live quiz save/conflict/dirty-leave and profile/password/grading mutation regression incomplete |
| US4-AC4 honest baseline/prior tasks/typed evidence | FR-018 | SC-007 | T001–T004/T017–T021 | E00–E15, retained harness failures and this report | Reporting PASS, overall acceptance incomplete |

| Success criterion | Tasks/evidence | Status |
| --- | --- | --- |
| SC-001 two real desktop layouts | T006/T008/T015/T016/T019/T022, E13/E14 | Current sampled desktop/long draft/error/no overflow PASS |
| SC-002 zero/one mutations and accurate feedback | T004/T009/T011/T014/T017/T020, E02/E14 | Component and two authorized name writes/duplicate gate PASS; live user role/status cases open |
| SC-003 no obsolete target/session/draft effects | T004/T005/T007/T010/T011/T013/T014/T019, E02/E13/E14 | Component races and live search/selection/draft/read-logout PASS; full live transition matrix open |
| SC-004 saved/reload failure/read-only retry/clamp | T007/T010/T011/T019, E02/E14 | Real confirmed write/offline read/GET-only recovery/filtered selection PASS; live multipage clamp unavailable |
| SC-005 existing authorization boundaries/user live action | T002/T005/T012–T014/T020/T023, E06/E08/E12 | Authenticated role/resource/self/notfound/ID denial PASS; user role/status/revocation/otherADMIN-target open |
| SC-006 keyboard/local route/account/LMS regressions | T006/T008/T014–T017/T019/T022, E02/E13/E15 | Live keyboard/native dialog/URL/read regressions PASS; full stateful learning/account matrix open |
| SC-00717AC/full check/baseline/evidence reporting | T001–T004/T016–T021, E00–E15 | Reporting PASS; does not certify missing runtime criteria |

## Required live checks not run / incomplete

| Check | Conditions still missing | Task |
| --- | --- | --- |
| Complete stateful account/LMS regression matrix | E13/E15 now establish current authenticated desktop, keyboard, URL, account disclosure/recovery and read-only learning flows. Live profile save/failed identity-refresh, user password change/revocation, quiz autosave/version/conflict/dirty-leave and grading writes were not authorized on designated resources in this continuation. Existing full component suite PASS is separate evidence | T019/T022 |
| Real role/status confirmation success, draft-preserving toggle, session revocation and lost permission while pending | The authorized two name writes are complete and restored. User-performed role/lock/unlock operations have not occurred. No agent role/status mutation is permitted; existing four managed accounts all have linked records | T020/T023 |
| Complete production validation/otherADMIN-target/multipage matrix | Authenticated roles/self/invalidID/notfound/course/document denials pass. No otherADMIN target exists; only4managed accounts prevents live25-per-page/clamp cases. Linked-role rejection, uncertain mutation and pending-write session replacement remain component/source evidence only; no provisioning or additional mutation to manufacture coverage | T019/T020/T022/T023 |
| HTTP/database integration | Stack healthy and read-only metadata observed; script provisions and cleans resources, authorization for that is absent. Do not infer permission from health or anonymous reads | T020 |

Exactly two explicitly authorized real name updates to28 succeeded and the original name was restored; E14 verifies final server state. No role/status/password/quiz/grading/lookup business mutation, resource creation, seed/reset/delete or integration provisioning/cleanup occurred. Synthetic fixture behavior is never counted as these live writes.

## Prior features — independent open acceptance

| Feature | Original open task IDs |
| --- | --- |
|001 | T021/T022/T024/T025 |
|002 | T018/T019/T021/T022 |
|003 | T021/T022/T024/T025 |
|004 | T021/T022/T024/T025 |
|005 | T021/T022/T024/T025/T027/T028 |
|006 | T021/T022/T024/T025 |

All original task text saved in E00, all file hashes preserved. None closed/transferred into007. Feature006's pre-existing implementation remains intact.

## Tasks / convergence
**19/25 tasks checked**: T001–T018 and T021 completed. T019/T020/T022/T023/T024/T025 remain open; T021 records their outcomes, not success. E12–E15 complete specific subcases without claiming those broader acceptance tasks are finished.

Managed speckit-converge ran after implementation, using official no-persist resolution and inspecting current source against18FR+7SC+17AC,8 plan decisions,5 constitution principles and21 original tasks. Outcome **tasks_appended**, Phase8, T022/T023: two HIGH partial findings, F1 current authenticated desktop/complete visual evidence and F2 authenticated HTTP/safe-resource/user role-status acceptance. No additional missing/contradicting/unrequested code was found in scope. Its only write appended the new task phase; the entire existing tasks prefix was byte-identical to tasks-before-converge.md. No Git or application/spec/plan writes occurred during convergence; no hooks configured.

Returned to implement/verify: checklist gates remain16/16 and16/16 with unchanged frozen hashes. E12–E15 subsequently resolve authentication/current capture/designated name-write conditions and supply the live evidence above. T019/T022 still include unperformed stateful account/LMS regression, and T020/T023 still include user role/status/revocation and unavailable resource cases. Those broad tasks remain open; completed subcases are recorded without closing or transferring earlier feature tasks. No independent application-code gap was identified; remaining verification depends on the conditions listed above.

Managed speckit-converge was repeated after the authenticated verification against18FR+7SC+17AC,8 plan decisions,5 constitution principles and23 existing tasks. Outcome **tasks_appended**, Phase9, T024/T025: two HIGH partial evidence findings for the remaining stateful live regression and production/user-action matrix, respectively. No missing/contradicting/unrequested application-code gap was identified. Existing tasks.md bytes are an exact prefix of the appended file; spec/plan/application/checklists were not rewritten. [converge-continued.json](../../.artifacts/admin-workspace-20261101/converge-continued.json) records this result in local ignored verification evidence. Hooks were absent before and after.

Returned to managed implement/verify with official no-persist resolver still selecting007 and both checklist gates PASS unchanged. T024 depends on designated existing resources/operations and user password actions; T025 depends on user-performed role/status actions and suitable existing target cases. The already authorized28 name restoration is complete and must not be replayed. No further independent source change or safely authorized live mutation remains. Do not run another unchanged converge loop merely to append duplicate external-blocker tasks. Latest status is **tasks_appended, not converged; feature acceptance incomplete**.

The initial task-created embedded tabs/server were closed after E07. During the continuation, native Chrome replaced its empty New Tab with the fixture, then the normal live sign-in screens; its task-opened detached DevTools was closed and device dimensions restored to the initial1280×800 before closure. The synthetic fixture server is stopped; the current5178 verification server is intentionally available for user sign-in. The existing8081 Docker stack and deployed assets remain untouched. Fixture helpers/logs remain local ignored artifacts.

The intermediate root-scoped Vitest invocation created only a root node_modules/.vite/vitest results cache. After inspecting its contents and verifying both absolute workspace paths, the entire generated folder was preserved under the ignored evidence directory; no cache/data content was deleted and no root dependency directory remains in the change set.

No commit/push/PR/merge/deploy, private credential retrieval, database reset or data provisioning. The only authorized data changes were the two E14 name updates, restored and confirmed by the server.
