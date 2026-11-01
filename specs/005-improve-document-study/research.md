# Research — Document Study005

2026-11-01. Source inspection, not live observation. Managed plan Phase0 dispatched one read-only research agent to review request identities, drafts, history/source contracts and tests; findings independently cross-checked below. No product clarification remains.

## Inspection and baseline

- Official resolver initially selected004-improve-practice-quiz; official create-new-feature.ps1 allocated005. CLI/integration1.2.3, Codex skills/PowerShell/sequential numbering. No extensions.yml, so applicable pre/post hooks are absent.
- Baseline HEAD65341d991268b79540a6548cfc2d3cf5ec60aaad, clean tree,186 tracked files. SHA256 manifest and source copies: .artifacts/document-study-20261101/baseline.json and baseline/. Secret environment files were excluded before hashing; only tracked example files read.
- Constitution1.0.0 and AGENTS.md govern this feature; no managed files or prior features edited.
- Prior feature state read from spec/tasks/verification, independently recorded:001 T021/T022/T024/T025;002 T018/T019/T021/T022;003 T021/T022/T024/T025;004 T021/T022/T024/T025. These are prior desktop/HTTP acceptance and convergence continuations, not005 work. Feature002 verification contains an inconsistent reported total18/24 versus its four open markers; preserve it and use task lines as the recorded state.
- Runtime: Docker engine pipe unavailable, localhost8081 health connection refused; browser inventory has zero providers and reports browser access host unavailable. No live app observation or fresh screenshot/bounds. No identified safe account/course/lesson supplied. Earlier screenshots are historical evidence only.

## Production trace and documentary conflicts

App/router (frontend/src/app/App.jsx CourseRoute) → CourseWorkspacePage.jsx URL section/lessonId/panel and safelyNavigateFromQuiz → DocumentAssistantPanel.jsx or LessonSummaryPanel.jsx → services/api.js and lessonRequestGuard.js → backend/server.js → backend/src/app.js /api/courses → routes/courses.js authenticate → canAccessCourse owner/enrollment → Prisma lesson/chatMessage and utils/lessonText.js/studyAssistant.js. backend/app.js is a legacy auth harness.

- README.md:55–59 describes local extraction/summary; README.md:126 still lists extraction/OCR/summaries together as unsupported backlog. backend/src/services/documentProcessing.js and backend/src/routes/courses.js implement extraction/summary; OCR remains absent. Do not infer missing APIs from the backlog sentence.
- frontend/README.md still mentions prototype src/data; actual dashboard/workspace use services/api.js and no such data directory. Preserve unrelated documentation.
- docs/development-workflow.md environment section explicitly snapshots pre-init on2026-10-28; current .specify/integration.json and managed skills show initialized1.2.3. This is dated context, not a current missing-install claim.
- Prisma ChatMessage stores no source revision/citation; comments mentioning AI in schema do not establish external generation. Exact extractionStatus returned by summary422 is dropped by apiErrors.js; UI uses status/code/message only.
- Integration script creates users/course/lessons and performs Docker SQL DELETE cleanup, targeting lumina_lms by default and HTTP8080 unless configured. Current stack unavailable and provisioning/cleanup unapproved: do not run.

## Decisions

### R01 — Separate operation channels and context lifetime
Decision: keyed inner panels for lesson/source revision; preserve parent's course key and URL/quiz callbacks. Separate LessonRequestGuard instances for history and send, with unmount/close invalidation and immediate ref locks.
Rationale: one existing guard makes reload invalidate POST completion and can leave sending stuck. Keyed inner scope hides previous success immediately, also in isolated prop-rerender tests.
Alternatives: changing shared guard semantics affects other consumers; one shared cancellation channel is incorrect. Aborting POST cannot promise server rollback.

### R02 — Bounded reconciliation and draft edit identity
Decision: deduplicate by message ID and order by returned creation time/ID, merge server history with confirmed sends from this mounted scope, cap to latest50. Keep draft edit counter; clear only unchanged edit generation on success.
Rationale: late history must not erase confirmed sends; latest50 respects the current window. Equality alone loses edit-away-and-back drafts.
Alternatives: append everything indefinitely violates bounded history; automatic POST retries risk duplicate persisted messages.

### R03 — Stable reading region and explicit recovery
Decision: keep history DOM mounted during reload; preserve reading anchor/top when away from bottom, follow at≤56px, announce only concise operation status. Offer latest-reply control for new IDs, focus latest answer on explicit jump. Compact labeled two-row composer below history, editable while pending. Read-only reload after uncertain send, then explicit resend.
Rationale: prevents forced jumps and draft loss while remaining keyboard usable.
Alternatives: aria-live on full transcript repeats long history; overlay composer obscures reading.

### R04 — Summary truth and revision checks
Decision: independent loading/points/empty/unavailable/error/changed-source states, explicit retry pending lock; only returned source labels, truncation and page text. Compare returned revision only if selected revision is known. Generic text-availability explanation for422, no guessed extraction status.
Rationale: current effect invalidates callbacks but can retain old successful state; provenance differs between chat and summary.
Alternatives: attaching current provenance to historical chat is unsupported; adding page links or processing actions changes scope.

### R05 — Existing UI and verification boundaries
Decision: existing shared Button/Feedback and colors/Inter typography; dedicated panel stylesheet scoped to lookup-workspace/summary-workspace. No global layout or lesson/quiz logic changes. Fixture races/DOM focus supplement, never replace, current desktop/browser/server evidence.
Rationale: smallest reviewable frontend-only change; runtime unavailable.
Alternatives: dependency, API, durable drafts, mobile, pagination and external AI are outside scope.
